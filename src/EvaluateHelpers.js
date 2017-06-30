import bigInt from 'big-integer';
import sha1Hex from 'sha1-hex';
import { test } from './Conditions';

export function ruleMatches(rule, context){
  if (rule.defaultRule){
    return true;
  }
  else{
    for (let cKey in rule.audience.conditions){
      let condition = rule.audience.conditions[cKey];
      let pass = false;
      let values = context.getValuesForKey(condition.target);
      for (let vKey in values){
        let value = values[vKey];
        // console.log(condition.operator, value, condition.values);
        // console.log(test(condition.operator, value, condition.values));
        if (test(condition.operator, value, condition.values)){
          pass = true;
          break;
        }
      }
      if (!pass){
        return false;
      }
    }
    return true;
  }
}

export function getVariantSplitKey(variantSplits, variantValue){
  let percent = 0.0;
  for (let i in variantSplits){
    const variantSplit = variantSplits[i];
    percent += variantSplit.split;

    if (percent >= variantValue) {
      return variantSplit.variantKey;
    }
  }
  return "off";
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