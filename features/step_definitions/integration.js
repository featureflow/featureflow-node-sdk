const { defineSupportCode } = require('cucumber');
const Featureflow = require('../../index');
const { expect } = require('chai');

const _ = require('lodash');

defineSupportCode(({ Given, When, Then, setDefaultTimeout }) => {

  setDefaultTimeout(60 * 1000);

  this.featureflow;
  this.error;

  Given('there is access to the Featureflow library', function () {
    expect(Featureflow).to.exist;
  });

  When('the FeatureflowClient is initialized with the apiKey {apiKey:stringInDoubleQuotes}', function (apiKey, callback) {
    Featureflow.init(apiKey, undefined, (error, featureflow)=>{
      this.featureflow = featureflow;
      this.error = error;
      callback();
    });
  });

  Then('it should return a featureflow client', function () {
    expect(this.featureflow).to.exist;
  });

  Then('it should not return a featureflow client', function () {
    // Write code here that turns the phrase above into concrete actions
    expect(this.featureflow).to.not.exist;
  });

  Then('it should be able to evaluate a rule', function () {
    expect(this.featureflow.evaluate('test').is('on')).to.be.a('boolean');
  });

  Then('there should be an error', function () {
    expect(this.error).to.exist;
  });

  Then('there should not be an error', function () {
    expect(this.error).to.not.exist;
  });
});