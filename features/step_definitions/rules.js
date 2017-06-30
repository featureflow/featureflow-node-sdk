import { defineSupportCode } from 'cucumber';
import { getVariantSplitKey, ruleMatches } from '../../src/EvaluateHelpers';
import { ContextBuilder } from '../../src/Context';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then, Before }) => {
  Before(function(){
    this.rule = {
      "priority": 0,
      "defaultRule": false,
      "variantSplits": []
    };
    this.contextBuilder = new ContextBuilder('anonymous');
  });

  Given('the rule is a default rule', function() {
    this.rule.defaultRule = true;
  });

  Given('the context values are', function (contextValues) {
    contextValues.hashes().forEach((contextValue)=>{
      this.contextBuilder = this.contextBuilder.withValue(contextValue.key, JSON.parse(contextValue.value));
    });
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
    this.result = ruleMatches(this.rule, this.contextBuilder.build())
  });

  When('the variant split key is calculated', function () {
    this.result = getVariantSplitKey(this.rule.variantSplits, this.variantValue);
  });

  Then('the result from the match should be {result:trueOrFalse}', function (result) {
    expect(this.result).to.equal(result);
  });

  Then('the resulting variant should be {result:stringInDoubleQuotes}', function (result) {
    expect(this.result).to.equal(result);
  });
});