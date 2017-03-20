var bigInt = require('big-integer');
var sha1Hex = require('sha1-hex');

var _require = require('./Conditions'),
    test = _require.test;

function ruleMatches(rule, context) {
  return rule.defaultRule || rule.audience.conditions.filter(function (condition) {
    return [].concat(context.values[condition.target]).filter(function (value) {
      //Return if it matches
      return test(condition.operator, value, condition.values);
    }).length === 0; // If one condition matches in the array, don't count it
  }).length === 0; // The resulting array is populated by conditions that haven't matched
}

function getVariantSplitKey(variantSplits, variantValue) {
  var percent = 0;
  for (var i in variantSplits) {
    var variantSplit = variantSplits[i];
    percent += variantSplit.split;

    if (percent >= variantValue) {
      return variantSplit.variantKey;
    }
  }
}

function calculateHash(salt, feature, key) {
  var hashValues = [(salt || 1).toString(), feature || 'feature', key || 'anonymous'].join(':');
  return sha1Hex(hashValues).substr(0, 15);
}

function getVariantValue(hash) {
  return bigInt(hash, 16).mod(100).toJSNumber() + 1;
}

module.exports = {
  getVariantValue: getVariantValue,
  calculateHash: calculateHash,
  ruleMatches: ruleMatches,
  getVariantSplitKey: getVariantSplitKey
};