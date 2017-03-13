const { defineSupportCode } = require('cucumber');
const { getVariantSplitKey, ruleMatches } = require('../../src/rules');
const { expect } = require('chai');

const _ = require('lodash');

const baseRule = {
  "priority": 0,
  "defaultRule": false,
  "variantSplits": []
};

const baseContext = {
  key: 'anonymous',
  values: {}
};

defineSupportCode(({ Given, When, Then, Before }) => {
  Before(function(){
    this.rule = _.cloneDeep(baseRule);
    this.context = _.cloneDeep(baseContext);
  });

  Given('the rule is a default rule', function() {
    this.rule.defaultRule = true;
  });

  Given('the context values are', function (contextValues) {
    this.context.values = contextValues.hashes().reduce((values, next)=>{
      values[next.key] = JSON.parse(next.value);
      return values;
    }, this.context.values);
  });

  Given('the rule\'s audience conditions are', function (conditions) {
    this.rule.audience = {
      conditions: conditions.hashes().map((condition)=>{
        return {
          operator: condition.operator,
          target: condition.target,
          values: JSON.parse(condition.values)
        }
      })
    }
  });

  Given('the variant value of {variantValue:int}', function (variantValue) {
    this.variantValue = variantValue;
  });

  Given('the variant splits are', function (variantSplits) {
    this.rule.variantSplits = variantSplits.hashes().map(variantSplit=>{
      return {
        variantKey: variantSplit.variantKey,
        split: parseInt(variantSplit.split)
      }
    });
  });

  When('the rule is matched against the context', function () {
    this.result = ruleMatches(this.rule, this.context)
  });

  When('the variant split key is calculated', function () {
    this.result = getVariantSplitKey(this.rule, this.variantValue);
  });

  Then('the result from the match should be {result:trueOrFalse}', function (result) {
    expect(this.result).to.equal(result);
  });

  Then('the resulting variant should be {result:stringInDoubleQuotes}', function (result) {
    expect(this.result).to.equal(result);
  });
});