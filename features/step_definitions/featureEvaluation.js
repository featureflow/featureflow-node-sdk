import { defineSupportCode } from 'cucumber';
import { featureEvaluation } from '../../src/EvaluateHelpers';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then }) => {
  Given('the feature {stringInDoubleQuotes} with an offVariantKey {stringInDoubleQuotes}, a default key of {stringInDoubleQuotes} is {enabledOrDisabled}',
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

  When('the feature is evaluated with a user {stringInDoubleQuotes}', function (user) {
    this.result = featureEvaluation(this.feature, user);
  });

  Then('the evaluated variant should be {stringInDoubleQuotes}', function (variant) {
    expect(this.result).to.equal(variant);
  });
});