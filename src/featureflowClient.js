const _ = require('lodash');
const Emitter = require('tiny-emitter');

const debug = require('./debug');

const Evaluate = require('./evaluate');
const Events = require('./events');

const { testFeatures } = require('./featureRegistrations');

const FeatureStreamClient = require('./featureStreamClient');

const DEFAULT_CONTROL_STREAM_PATH = '/api/sdk/v1/controls/stream';

const DEFAULT_CONTEXT = {
  key: 'anonymous',
  values: {}
};

const defaultConfig = {
  hashSalt: 1,
  rtmUrl: 'https://rtm.featureflow.io',
  url: 'https://app.featureflow.io',
  withFeatures: undefined
};

class FeatureflowClient {
  constructor(apiKey, config){
    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = _.merge(defaultConfig, config || {});
    debug('set config to %o', this.config);
    this.features = {};
    this.defaultFeatures = {};

    this.events = new Events(this.apiKey, this.config.url);

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
        return callback(err);
      }
    }

    const emitter = new Emitter();

    this.on = emitter.on.bind(this);
    this.off = emitter.off.bind(this);

    const streamClient = FeatureStreamClient.connect(
      this.config.rtmUrl + DEFAULT_CONTROL_STREAM_PATH,
      this.apiKey
    );

    streamClient.on('features.updated', (features)=>{
      this.features = _.merge(this.features, features);
      const featureKeys = Object.keys(features);
      debug('updated features %o', featureKeys);
      emitter.emit('updated', featureKeys);
    });

    streamClient.on('init', emitter.emit.bind('init'));
    streamClient.on('error', emitter.emit.bind('error'));
  }

  getFeature(key){
    debug('get feature "%s"', key);
    return this.features[key];
  }

  evaluate(key, _context){
    let context = _.pick(_.merge({}, DEFAULT_CONTEXT, _context), ['key','values']);
    debug('evaluate feature "%s", context=%o', key, context);
    return new Evaluate(
      key,
      context,
      this.getFeature.bind(this),
      this.defaultFeatures[key],
      this.config.hashSalt,
      this.events
    );
  }
}

module.exports = FeatureflowClient;