const { test } = require('./conditions');

function ruleMatches(rule, context){
  return rule.defaultRule ||
    rule.audience.conditions
      .filter(condition=>{
        return [].concat(context.values[condition.target]).filter(value=>{
          //Return if it matches
          return test(
            condition.operator,
            value,
            condition.values)
          }).length === 0; // If one condition matches in the array, don't count it
        }
      ).length === 0; // The resulting array is populated by conditions that haven't matched
}

function getVariantSplitKey(rule, variantValue){
  let percent = 0;
  for (let i in rule.variantSplits){
    const variantSplit = rule.variantSplits[i];
    percent += variantSplit.split;

    if (percent >= variantValue) {
      return variantSplit.variantKey;
    }
  }
}

module.exports = {
  ruleMatches,
  getVariantSplitKey
};