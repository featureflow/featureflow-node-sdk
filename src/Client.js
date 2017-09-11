import PollingClient from './PollingClient';
import EventsClient from './EventsClient';
const EventEmitter = require('events');
import { InMemoryFeatureStore } from './FeatureStore';
import { UserBuilder } from './User';
import Evaluate from './Evaluate';
import debug from './debug';

import {ruleMatches, getVariantValue, getVariantSplitKey, calculateHash, featureEvaluation} from './EvaluateHelpers';

export default class Featureflow extends EventEmitter{
  failoverVariants = {};
  isReady = false;

  constructor(config, callback = ()=>{}){
    super();
    debug("initializing client");
    if (!callback && typeof config === "function"){
      callback = config;
      config = undefined;
    }
    this.config = {
      baseURL: 'https://app.featureflow.io',
      ...config
    };

    this.config.apiKey = this.config.apiKey || process.env.FEATUREFLOW_SERVER_KEY || "";
    if (!this.config.apiKey.length){
      callback(new Error("Api Key must be provided"));
    }

    this.config.featureStore = new InMemoryFeatureStore();
    this.config.disableEvents = this.config.disableEvents || false;

    this.eventsClient = new EventsClient(this.config.apiKey, this.config.baseURL, this.config.disableEvents)

    if (this.config.withFeatures){
      this.config.withFeatures.forEach(feature=>{
        debug(`Registering feature with key ${feature.key}`);
        this.failoverVariants[feature.key] = feature.failoverVariant;
      });
      this.eventsClient.registerFeaturesEvent(this.config.withFeatures);
    }

    this.close = new PollingClient(this.config.baseURL + '/api/sdk/v1/features', this.config, ()=>{
      debug("client initialized");
      this.isReady = true;
      this.emit('ready');
      callback(null, this);
    });
  }

  ready(callback=()=>{}){
    if (this.isReady){
      callback(null, this);
    }
    else{
      return this.once('ready', ()=>{
        callback(null, this);
      })
    }
  }

  evaluate(key, user){
    let evaluatedVariant;
    let feature = this.config.featureStore.get(key);

    if (!feature){
      let failover = this.failoverVariants[key];
      if (!failover){
        evaluatedVariant = "off";
      }
      else{
        evaluatedVariant = failover
      }
      debug(`Evaluating undefined feature '${key}' using the ${failover ? 'provided' : 'default'} failover '${evaluatedVariant}'`);
    }
    else {
      evaluatedVariant = featureEvaluation(feature, user);
    }

    return new Evaluate(
      key,
      evaluatedVariant,
      user,
      this.eventsClient
    );
  }
}