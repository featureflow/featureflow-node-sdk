var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var START_OF_ERROR = 'in Featureflow.init().';
var CONFIG_OBJECT_NAME = 'config.withFeatures';
var NOT_OBJECT = START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + ' must be an array of feature objects.';

var REGEX = /^[a-z0-9\-].+$/;

function testFeatures(features) {
  var error = void 0;
  try {
    error = parseFeatures(features);
  } catch (err) {
    throw new Error(NOT_OBJECT);
  }
  if (error) {
    throw new Error(error);
  }
}

function parseFeatures(payload) {
  if (payload === null || (typeof payload === 'undefined' ? 'undefined' : _typeof(payload)) !== 'object') {
    throw "";
  }
  for (var key in payload) {
    var feature = payload[key];
    if (!feature.key) {
      return START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + '[' + key + '] must contain the following properties: key';
    }

    if (!REGEX.test(feature.key) || feature.failoverVariant && !REGEX.test(feature.failoverVariant)) {
      return START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + '[' + key + '].key and ' + CONFIG_OBJECT_NAME + '[' + key + '].failoverVariant must only contain lowercase, numerical or \'-\'';
    }

    if (feature.variants) {
      if (!Array.isArray(feature.variants) || feature.variants.length < 2) {
        return START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + '[' + key + '].variants must be an array of at least 2 variants variants';
      }
      for (var i in feature.variants) {
        var variant = feature.variants[i];
        if (!variant.key || !variant.name) {
          return START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + '[' + key + '].variants[' + i + '] must contain the following properties: key, name';
        }
        if (!REGEX.test(variant.key)) {
          return START_OF_ERROR + ' ' + CONFIG_OBJECT_NAME + '[' + key + '].variants[' + i + '].key must only contain lowercase, numerical or \'-\'';
        }
      }
    }
  }
}

module.exports = {
  testFeatures: testFeatures
};