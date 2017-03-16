const _ = require('lodash');
const Emitter = require('tiny-emitter');

const debug = require('./debug');

const Evaluate = require('./Evaluate');
const FeatureflowEvents = require('./FeatureflowEvents');

const { testFeatures } = require('./FeatureRegistrations');

const StreamingClient = require('./StreamingClient');

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

class FeatureflowClient {
  constructor(apiKey, config){
    const emitter = new Emitter();

    const _emit = emitter.emit.bind(this);

    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = _.merge(defaultConfig, config || {});
    debug('set config to %o', this.config);
    this.features = {};
    this.defaultFeatures = {};

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

    const streamingClient = StreamingClient.connect(
      this.config.rtmUrl + DEFAULT_CONTROL_STREAM_PATH,
      this.apiKey
    );

    streamingClient.on('features.updated', (features)=>{
      this.features = _.merge(this.features, features);
      const featureKeys = Object.keys(features);
      debug('updated features %o', featureKeys);
      _emit('updated', featureKeys);
    });

    streamingClient.on('init', ()=>{
      _emit('init');
    });
    streamingClient.on('error', (err)=>{
      _emit('error', err);
    });
  }

  getFeature(key){
    debug('get feature "%s"', key);
    return this.features[key];
  }

  evaluate(key, _context){
    let context = _.pick(_.merge({}, DEFAULT_CONTEXT, _context), ['key','values']);

    context = _.merge(context, {
      values: {
        'featureflow.key': context.key,
        'featureflow.date': new Date().toISOString()
      }
    })

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

module.exports = FeatureflowClient;