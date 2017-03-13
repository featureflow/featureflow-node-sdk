const _ = require('lodash');
const debug = require('./debug');

const { ruleMatches, getVariantSplitKey } = require('./rules');
const { getVariantValue, calculateHash } = require('./hashAlgorithm');

module.exports = class Evaluate{
  constructor(key, context, getFeature, defaultFeatureVariant, salt, events){
    this.key = key;
    this.getFeature = getFeature;
    this.defaultFeatureVariant = defaultFeatureVariant;
    this.context = context;
    this.salt = salt;
    this.events = events;
  }

  is(value){
    debug('evaluating "%s" is "%s"', this.key, value);
    const evaluated = this.value();
    this.events.send(this.key, value, evaluated, this.context);
    return value === evaluated;
  }

  isOn(){
    return this.is('on');
  }

  ifOff(){
    return this.is('off');
  }

  value(){
    const feature = this.getFeature(this.key);
    if (!feature){
      const defaultFeatureVariant = this.defaultFeatureVariant || 'off';
      debug('feature "%s" was not found, variant set to "%s"', this.key, defaultFeatureVariant);
      return defaultFeatureVariant;
    }

    if (!feature.enabled){
      debug('feature "%s" was not enabled, variant set to "%s"', this.key, feature.offVariantKey);
      return feature.offVariantKey;
    }

    const variant = feature.rules.reduce((variant, nextRule) => {
      if (variant !== undefined) return variant;

      if (ruleMatches(nextRule, this.context)){
        const variantValue = getVariantValue(calculateHash(this.salt, this.key, _.get(this.context, 'key')));
        return getVariantSplitKey(nextRule, variantValue);
      }
    }, undefined);

    debug('feature "%s" is enabled, variant set to "%s"', this.key, variant);
    return variant;
  }
}