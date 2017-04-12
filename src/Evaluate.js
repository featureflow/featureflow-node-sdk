import debug from './debug';

import { ruleMatches, getVariantSplitKey, getVariantValue, calculateHash } from './EvaluateHelpers';

function calculateVariant(featureKey, feature, defaultFeatureVariant = 'off', context, salt = '1'){
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
      const variantValue = getVariantValue(calculateHash(salt, feature.key, context.key));
      return getVariantSplitKey(nextRule.variantSplits, variantValue);
    }
  }, undefined);

  debug('feature "%s" is enabled, variant set to "%s"', feature.key, variant);
  return variant;
}

export default class Evaluate{
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