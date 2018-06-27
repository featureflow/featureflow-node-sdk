import { defineSupportCode } from 'cucumber';
import { calculateHash, getVariantValue } from '../../src/EvaluateHelpers';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then }) => {

  Given('the salt is {stringInDoubleQuotes}, the feature is {stringInDoubleQuotes} and the id is {stringInDoubleQuotes}', function (salt, feature, id) {
  //Given('{commaDelimitedArray}', function (commaDelimitedArray, callback) {
    //[this.salt, this.feature, this.id] = commaDelimitedArray;
    this.salt = salt;
    this.feature = feature;
    this.id = id;
  });

  When('the variant value is calculated', function () {
    this.hash = calculateHash(this.salt, this.feature, this.id);
    this.result = getVariantValue(this.hash);
  });

  Then('the hash value calculated should equal {stringInDoubleQuotes}', function (hash) {
    expect(this.hash).to.equal(hash);
  });

  Then('the result from the variant calculation should be {int}', function (result) {
    expect(this.result).to.equal(result);
  });

})