const bigInt = require('big-integer');
const sha1Hex = require('sha1-hex');

function calculateHash(salt, feature, key) {
  const hashValues = [(salt || 1).toString(), feature || 'feature', key || 'anonymous'].join(':');
  return sha1Hex(hashValues).substr(0, 15);
}

function getVariantValue(hash) {
  return bigInt(hash, 16).mod(100).toJSNumber() + 1;
}

module.exports = {
  getVariantValue: getVariantValue,
  calculateHash: calculateHash
};