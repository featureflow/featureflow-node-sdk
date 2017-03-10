const { test } = require('./conditions');

function ruleMatches(rule, context){
  return rule.defaultRule ||
    rule.audience.conditions
      .filter(condition=>{
          return !test(
            condition.operator,
            context.values[condition.target],
            condition.values)
        }
      ).length === 0;
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