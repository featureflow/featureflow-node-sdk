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
  defaultFeatures: {},
  rtmUrl: 'https://rtm.featureflow.io',
  url: 'https://app.featureflow.io',
  withFeatures: undefined
};

class FeatureflowClient {
  constructor(apiKey, config, callback){
    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = _.merge(defaultConfig, config || {});
    debug('set config to %o', this.config);
    this.features = {};

    this.events = new Events(this.apiKey, this.config.url);

    if (this.config.withFeatures){
      try{
        testFeatures(this.config.withFeatures);
        debug('registered features %o', this.config.withFeatures);
        this.events.register(this.config.withFeatures);
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

    streamClient.on('init', callback);
    streamClient.on('error', callback);
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
      _.get(this.config,'defaultFeatures.'+key),
      this.config.hashSalt,
      this.events
    );
  }
}

module.exports = FeatureflowClient;