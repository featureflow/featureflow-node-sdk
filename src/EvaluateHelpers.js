import bigInt from 'big-integer';
import sha1Hex from 'sha1-hex';
import { test } from './Conditions';

export function ruleMatches(rule, context){
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

export function getVariantSplitKey(variantSplits, variantValue){
  let percent = 0;
  for (let i in variantSplits){
    const variantSplit = variantSplits[i];
    percent += variantSplit.split;

    if (percent >= variantValue) {
      return variantSplit.variantKey;
    }
  }
}

export function calculateHash(salt, feature, key){
  const hashValues = [
    salt || '1',
    feature || 'feature',
    key || 'anonymous'
  ].join(':');
  return sha1Hex(hashValues).substr(0, 15);
}

export function getVariantValue(hash){
  return bigInt(hash, 16).mod(100).toJSNumber() + 1;
}