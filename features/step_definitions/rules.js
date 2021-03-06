import { defineSupportCode } from 'cucumber';
import { getVariantSplitKey, ruleMatches } from '../../src/EvaluateHelpers';
import { UserBuilder } from '../../src/User';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then, Before }) => {
  Before(function(){
    this.rule = {
      "priority": 0,
      "defaultRule": false,
      "variantSplits": []
    };
    this.builder = new UserBuilder('anonymous');
    console.log("Creating builder")
    //this.userBuilder = "cock"; //new UserBuilder('anonymous');
  });

  Given('the rule is a default rule', function() {
    this.rule.defaultRule = true;
  });

  Given('the user attributes are', function (userAttributes) {
    userAttributes.hashes().forEach((userAttribute)=>{
      this.builder = this.builder.withAttribute(userAttribute.key, JSON.parse(userAttribute.value));
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

  Given('the variant value of {int}', function (variantValue) {
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

  When('the rule is matched against the user', function () {
    console.log(this.builder);
    this.result = ruleMatches(this.rule, this.builder.build())
  });

  When('the variant split key is calculated', function () {
    this.result = getVariantSplitKey(this.rule.variantSplits, this.variantValue);
  });

  Then('the result from the match should be {trueOrFalse}', function (result) {
    expect(this.result).to.equal(result);
  });

  Then('the resulting variant should be {stringInDoubleQuotes}', function (result) {
    expect(this.result).to.equal(result);
  });
});