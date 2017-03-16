const _ = require('lodash');
const debug = require('./debug');

const { ruleMatches, getVariantSplitKey, getVariantValue, calculateHash } = require('./EvaluateHelpers');

function calculateVariant(featureKey, feature, defaultFeatureVariant = 'off', context){
  if (!feature){
    debug('feature "%s" was not found, variant set to "%s"', featureKey, defaultFeatureVariant);
    return defaultFeatureVariant;
  }

  if (!feature.enabled){
    debug('feature "%s" was not enabled, variant set to "%s"', feature.key, feature.offVariantKey);
    return feature.offVariantKey;
  }

  const variant = feature.rules.reduce((variant, nextRule) => {
    if (variant !== undefined) return variant;

    if (ruleMatches(nextRule, context)){
      const variantValue = getVariantValue(calculateHash(feature.variationSalt, feature.key, context.key));
      return getVariantSplitKey(nextRule.variantSplits, variantValue);
    }
  }, undefined);

  debug('feature "%s" is enabled, variant set to "%s"', feature.key, variant);
  return variant;
}

module.exports = class Evaluate{
  constructor(featureKey, feature, defaultFeatureVariant, context,  events){
    this.evaluatedVariant = calculateVariant(featureKey, feature, defaultFeatureVariant, context);
    this.context = context;
    this.events = events;
    this.key = featureKey;
  }

  is(value){
    debug('evaluating "%s" is "%s"', this.key, value);
    this.events.send(this.key, value, this.evaluatedVariant, this.context);
    return value === this.evaluatedVariant;
  }

  isOn(){
    return this.is('on');
  }

  ifOff(){
    return this.is('off');
  }

  value(){
    return this.evaluatedVariant;
  }
}