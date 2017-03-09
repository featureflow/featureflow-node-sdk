var cucumber = require('cucumber');
var hash = require('../../src/hash');
var chai = require('chai');

cucumber.defineSupportCode(function(args){
  var Given = args.Given;
  var When = args.When;
  var Then = args.Then;

  Given('the salt is {salt:stringInDoubleQuotes}, the feature is {feature:stringInDoubleQuotes} and the key is {key:stringInDoubleQuotes}', function (salt, feature, key) {
    this.salt = salt;
    this.feature = feature;
    this.key = key;
  });

  When('the variant value is calculated', function () {
    this.result = hash.getVariantValue(this.salt, this.feature, this.key);
    this.hash = hash._calculateHash(this.salt, this.feature, this.key);
  });

  Then('the hash value calculated should equal {hash:stringInDoubleQuotes}', function (hash) {
    chai.expect(this.hash).to.equal(hash);
  });

  Then('the result from the variant calculation should be {result:int}', function (result) {
    chai.expect(this.result).to.equal(result);
  });

})