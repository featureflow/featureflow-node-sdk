var bigInt = require('big-integer');
var sha1Hex = require('sha1-hex');

function calculateHash(salt, feature, key){
  var hashValues = [
    (salt || 1).toString(),
    feature || 'feature',
    key || 'anonymous'
  ].join(':');
  return sha1Hex(hashValues).substr(0, 15);
}

function getVariantValue(salt, feature, key){
  var hash = calculateHash(
    calculateHash(salt, feature, key)
  );
  return bigInt(hash, 16).mod(100).plus(1).toJSNumber();
}

module.exports = {
  getVariantValue: getVariantValue,
  _calculateHash: calculateHash
};