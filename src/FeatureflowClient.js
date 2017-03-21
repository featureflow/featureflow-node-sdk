import Emitter from 'tiny-emitter';

import debug from './debug';

import Evaluate from './Evaluate';
import FeatureflowEvents from './FeatureflowEvents';

import { testFeatures } from './FeatureRegistrations';

import { connect } from './StreamingClient';

const DEFAULT_CONTROL_STREAM_PATH = '/api/sdk/v1/controls/stream';

const DEFAULT_CONTEXT = {
  key: 'anonymous',
  values: {}
};

const defaultConfig = {
  rtmUrl: 'https://rtm.featureflow.io',
  url: 'https://app.featureflow.io',
  withFeatures: undefined
};

export default class FeatureflowClient {
  constructor(apiKey, config){
    const emitter = new Emitter();

    const _emit = emitter.emit.bind(this);

    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = {
      ...defaultConfig,
      ...config
    };
    debug('set config to %o', this.config);
    this.features = {};
    this.defaultFeatures = {};
    this.connected = false;

    this.events = new FeatureflowEvents(this.apiKey, this.config.url);

    if (this.config.withFeatures){
      try{
        testFeatures(this.config.withFeatures);
        this.defaultFeatures = this.config.withFeatures.reduce((features, feature)=>{
          features[feature.key] = feature.failoverVariant;
          return features;
        },{});
        debug('set default feature variants %o', this.defaultFeatures);
        this.events.register(this.config.withFeatures);
        debug('registered features %o', this.config.withFeatures);
      }
      catch(err){
        debug('error registering features %s', err.message);
        return emitter.emit('error', err);
      }
    }

    this.on = emitter.on.bind(this);
    this.off = emitter.off.bind(this);

    const streamingClient = connect(
      this.config.rtmUrl + DEFAULT_CONTROL_STREAM_PATH,
      this.apiKey
    );

    streamingClient.emitter.on('features.updated', (features)=>{
      this.features = {
        ...this.features,
        ...features
      };
      const featureKeys = Object.keys(features);
      debug('updated features %o', featureKeys);
      _emit('updated', featureKeys);
    });

    streamingClient.emitter.on('init', ()=>{
      _emit('init');
    });
    streamingClient.emitter.on('connected', (connected)=>{
      this.connected = connected;
    });
    streamingClient.emitter.on('error', (err)=>{
      _emit('error', err);
    });

    this.close = () =>{
      streamingClient.close();
    };
  }

  getFeature(key){
    debug('get feature "%s"', key);
    return this.features[key];
  }

  isConnected(){
    return this.connected;
  }

  evaluate(key, _context = {values:{}}){
    let contextKey = _context.key || DEFAULT_CONTEXT.key;
    let context = {
      key: contextKey,
      values: {
        ...DEFAULT_CONTEXT.values,
        ..._context.values,
        ...{
          'featureflow.key': contextKey,
          'featureflow.date': new Date().toISOString()
        }
      }
    }

    debug('evaluate feature "%s", context=%o', key, context);
    return new Evaluate(
      key,
      this.getFeature(key),
      this.defaultFeatures[key],
      context,
      this.events
    );
  }
}