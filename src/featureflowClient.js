const features = require('./featureControls.json');
const _ = require('lodash');
const { ruleMatches, getVariantSplitKey } = require('./rules');
const { getVariantValue, calculateHash } = require('./hashAlgorithm');

const Evaluate = require('./evaluate');

const defaultConfig = {
  hashSalt: 1,
  defaultFeatures: {}
};

class FeatureflowClient {
  apiKey = "";
  config = {};

  features = features;

  constructor(apiKey, config){
    this.apiKey = apiKey;
    this.config = _.merge(defaultConfig, config);
  }

  evaluate(key, context){
    const feature = this.features[key];
    if (!feature){
      const defaultFeature = _.get(this.config, 'defaultFeatures.'+key);
      return new Evaluate(defaultFeature || 'off');
    }

    if (!feature.enabled){
      return new Evaluate(feature.offVariantKey);
    }

    const variant = feature.rules.reduce((variant, nextRule) => {
      if (variant !== undefined) return variant;

      if (ruleMatches(nextRule, context)){
        const variantValue = getVariantValue(calculateHash(config.hashSalt, key, context.key));
        return getVariantSplitKey(nextRule, variantValue);
      }
    }, undefined);

    return new Evaluate(variant);
  }
}

module.exports = FeatureflowClient;