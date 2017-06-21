import Emitter from 'tiny-emitter';

import debug from './debug';

import Evaluate from './Evaluate';
import FeatureflowEvents from './FeatureflowEvents';

import FeatureStore from './FeatureStore';
import RedisAdaptor from './RedisAdaptor';

import { testFeatures } from './FeatureRegistrations';

import StreamingClient from './StreamingClient';

const DEFAULT_CONTROL_STREAM_PATH = '/api/sdk/v1/controls/stream';

const DEFAULT_CONTEXT = {
  key: 'anonymous',
  values: {}
};

const defaultConfig = {
  rtmUrl: 'https://rtm.featureflow.io',
  url: 'https://featureflow.featureflow.io',
  withFeatures: undefined
};

export default class FeatureflowClient {
  apiKey = undefined;
  defaultFeatures = {};
  config = { ...defaultConfig };

  constructor(apiKey, config){
    const emitter = new Emitter();

    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = {
      ...this.config,
      ...config
    };
    debug('set config to %o', this.config);

    this.events = new FeatureflowEvents(this.apiKey, this.config.url);
    let adaptor;
    if (config.cacheAdaptor){
      switch(config.cacheAdaptor.type){
        case 'redis':
          adaptor = new RedisAdaptor({
            url: config.cacheAdaptor.url,
            host: config.cacheAdaptor.host,
            port: config.cacheAdaptor.port,
            path: config.cacheAdaptor.path,
            prefix: config.cacheAdaptor.prefix
          });
        break;
      }
    }
    this.featureStore = new FeatureStore(adaptor);

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

    let streamingClient = new StreamingClient(
      this.config.rtmUrl + DEFAULT_CONTROL_STREAM_PATH,
      this.apiKey,
      this.featureStore,
      emitter.emit.bind(this)
    );

    this.close = () =>{
      streamingClient.close();
    };
  }

  getFeature(key){
    debug('get feature "%s"', key);
    return this.featureStore.get(key);
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