var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var debug = require('./debug');

var _require = require('./EvaluateHelpers'),
    ruleMatches = _require.ruleMatches,
    getVariantSplitKey = _require.getVariantSplitKey,
    getVariantValue = _require.getVariantValue,
    calculateHash = _require.calculateHash;

function calculateVariant(featureKey, feature) {
  var defaultFeatureVariant = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'off';
  var context = arguments[3];

  if (!feature) {
    debug('feature "%s" was not found, variant set to "%s"', featureKey, defaultFeatureVariant);
    return defaultFeatureVariant;
  }

  if (!feature.enabled) {
    debug('feature "%s" was not enabled, variant set to "%s"', feature.key, feature.offVariantKey);
    return feature.offVariantKey;
  }

  var variant = feature.rules.reduce(function (variant, nextRule) {
    if (variant !== undefined) return variant;

    if (ruleMatches(nextRule, context)) {
      var variantValue = getVariantValue(calculateHash(feature.variationSalt, feature.key, context.key));
      return getVariantSplitKey(nextRule.variantSplits, variantValue);
    }
  }, undefined);

  debug('feature "%s" is enabled, variant set to "%s"', feature.key, variant);
  return variant;
}

module.exports = function () {
  function Evaluate(featureKey, feature, defaultFeatureVariant, context, events) {
    _classCallCheck(this, Evaluate);

    this.evaluatedVariant = calculateVariant(featureKey, feature, defaultFeatureVariant, context);
    this.context = context;
    this.events = events;
    this.key = featureKey;
  }

  _createClass(Evaluate, [{
    key: 'is',
    value: function is(value) {
      debug('evaluating "%s" is "%s"', this.key, value);
      this.events.send(this.key, value, this.evaluatedVariant, this.context);
      return value === this.evaluatedVariant;
    }
  }, {
    key: 'isOn',
    value: function isOn() {
      return this.is('on');
    }
  }, {
    key: 'ifOff',
    value: function ifOff() {
      return this.is('off');
    }
  }, {
    key: 'value',
    value: function value() {
      return this.evaluatedVariant;
    }
  }]);

  return Evaluate;
}();