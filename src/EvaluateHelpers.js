import bigInt from 'big-integer';
import sha1Hex from 'sha1-hex';
import { test } from './Conditions';
import { ContextBuilder } from './Context';

export function featureEvaluation(feature, context){
  if (typeof context === "string"){
    context = new ContextBuilder(context).build();
  }

  if (feature.enabled){
    for (let i in feature.rules){
      let rule = feature.rules[i];
      if (ruleMatches(feature.rules[i], context)){
        let variantValue = getVariantValue(calculateHash("1", feature.key, context.getKey()));
        return getVariantSplitKey(rule.variantSplits, variantValue);
      }
    }
  }

  return feature.offVariantKey;
}

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