const START_OF_ERROR = 'in Featureflow.init().';
const CONFIG_OBJECT_NAME = 'config.withFeatures';
const NOT_OBJECT = `${START_OF_ERROR} ${CONFIG_OBJECT_NAME} must be an array of feature objects.`;

const REGEX = /^[a-z0-9\-].+$/;

export function testFeatures(features){
  let error;
  try{
    error = parseFeatures(features);
  }
  catch(err){
    throw new Error(NOT_OBJECT);
  }
  if (error){
    throw new Error(error)
  }
}

function parseFeatures(payload){
  if (payload === null || typeof payload !== 'object'){
    throw "";
  }
  for (let key in payload){
    let feature = payload[key];
    if (!feature.key){
      return `${START_OF_ERROR} ${CONFIG_OBJECT_NAME}[${key}] must contain the following properties: key`;
    }

    if (!REGEX.test(feature.key) || (feature.failoverVariant && !REGEX.test(feature.failoverVariant))){
      return `${START_OF_ERROR} ${CONFIG_OBJECT_NAME}[${key}].key and ${CONFIG_OBJECT_NAME}[${key}].failoverVariant must only contain lowercase, numerical or '-'`;
    }

    if (feature.variants){
      if (!Array.isArray(feature.variants) || feature.variants.length < 2){
        return `${START_OF_ERROR} ${CONFIG_OBJECT_NAME}[${key}].variants must be an array of at least 2 variants variants`;
      }
      for (let i in feature.variants){
        let variant = feature.variants[i];
        if (!variant.key || !variant.name){
          return `${START_OF_ERROR} ${CONFIG_OBJECT_NAME}[${key}].variants[${i}] must contain the following properties: key, name`;
        }
        if (!REGEX.test(variant.key)){
          return `${START_OF_ERROR} ${CONFIG_OBJECT_NAME}[${key}].variants[${i}].key must only contain lowercase, numerical or '-'`;
        }
      }
    }
  }
}