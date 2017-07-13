import { defineSupportCode } from 'cucumber';
import { featureEvaluation } from '../../src/EvaluateHelpers';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then }) => {
  Given('the feature {key:stringInDoubleQuotes} with an offVariantKey {offVariantKey:stringInDoubleQuotes}, a default key of {defaultKey:stringInDoubleQuotes} is {enabled:enabledOrDisabled}',
    function (key, offVariantKey, defaultKey, enabled) {
      this.feature = {
        key,
        offVariantKey,
        enabled,
        rules: [{
          defaultRule: true,
          audience: null,
          variantSplits: [{variantKey: defaultKey, split: 100}]
        }]
      };
  });

  When('the feature is evaluated with a context {context:stringInDoubleQuotes}', function (context) {
    this.result = featureEvaluation(this.feature, context);
  });

  Then('the evaluated variant should be {variant:stringInDoubleQuotes}', function (variant) {
    expect(this.result).to.equal(variant);
  });
});