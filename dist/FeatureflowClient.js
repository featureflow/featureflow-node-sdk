var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var Emitter = require('tiny-emitter');

var debug = require('./debug');

var Evaluate = require('./Evaluate');
var FeatureflowEvents = require('./FeatureflowEvents');

var _require = require('./FeatureRegistrations'),
    testFeatures = _require.testFeatures;

var StreamingClient = require('./StreamingClient');

var DEFAULT_CONTROL_STREAM_PATH = '/api/sdk/v1/controls/stream';

var DEFAULT_CONTEXT = {
  key: 'anonymous',
  values: {}
};

var defaultConfig = {
  rtmUrl: 'https://rtm.featureflow.io',
  url: 'https://app.featureflow.io',
  withFeatures: undefined
};

var FeatureflowClient = function () {
  function FeatureflowClient(apiKey, config) {
    var _this = this;

    _classCallCheck(this, FeatureflowClient);

    var emitter = new Emitter();

    var _emit = emitter.emit.bind(this);

    this.apiKey = apiKey;
    debug('set apiKey to %s', apiKey);
    this.config = _.merge(defaultConfig, config || {});
    debug('set config to %o', this.config);
    this.features = {};
    this.defaultFeatures = {};

    this.events = new FeatureflowEvents(this.apiKey, this.config.url);

    if (this.config.withFeatures) {
      try {
        testFeatures(this.config.withFeatures);
        this.defaultFeatures = this.config.withFeatures.reduce(function (features, feature) {
          features[feature.key] = feature.failoverVariant;
          return features;
        }, {});
        debug('set default feature variants %o', this.defaultFeatures);
        this.events.register(this.config.withFeatures);
        debug('registered features %o', this.config.withFeatures);
      } catch (err) {
        debug('error registering features %s', err.message);
        return emitter.emit('error', err);
      }
    }

    this.on = emitter.on.bind(this);
    this.off = emitter.off.bind(this);

    var streamingClient = StreamingClient.connect(this.config.rtmUrl + DEFAULT_CONTROL_STREAM_PATH, this.apiKey);

    streamingClient.on('features.updated', function (features) {
      _this.features = _.merge(_this.features, features);
      var featureKeys = Object.keys(features);
      debug('updated features %o', featureKeys);
      _emit('updated', featureKeys);
    });

    streamingClient.on('init', function () {
      _emit('init');
    });
    streamingClient.on('error', function (err) {
      _emit('error', err);
    });
  }

  _createClass(FeatureflowClient, [{
    key: 'getFeature',
    value: function getFeature(key) {
      debug('get feature "%s"', key);
      return this.features[key];
    }
  }, {
    key: 'evaluate',
    value: function evaluate(key, _context) {
      var context = _.pick(_.merge({}, DEFAULT_CONTEXT, _context), ['key', 'values']);

      context = _.merge(context, {
        values: {
          'featureflow.key': context.key,
          'featureflow.date': new Date().toISOString()
        }
      });

      debug('evaluate feature "%s", context=%o', key, context);
      return new Evaluate(key, this.getFeature(key), this.defaultFeatures[key], context, this.events);
    }
  }]);

  return FeatureflowClient;
}();

module.exports = FeatureflowClient;