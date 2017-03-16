const { defineSupportCode } = require('cucumber');
const hash = require('../../src/EvaluateHelpers');
const { expect } = require('chai');

defineSupportCode(({ Given, When, Then }) => {

  Given('the salt is {salt:stringInDoubleQuotes}, the feature is {feature:stringInDoubleQuotes} and the key is {key:stringInDoubleQuotes}', function (salt, feature, key) {
    this.salt = salt;
    this.feature = feature;
    this.key = key;
  });

  When('the variant value is calculated', function () {
    this.hash = hash.calculateHash(this.salt, this.feature, this.key);
    this.result = hash.getVariantValue(this.hash);
  });

  Then('the hash value calculated should equal {hash:stringInDoubleQuotes}', function (hash) {
    expect(this.hash).to.equal(hash);
  });

  Then('the result from the variant calculation should be {result:int}', function (result) {
    expect(this.result).to.equal(result);
  });

})