import { defineSupportCode } from 'cucumber';
import Featureflow from '../../src';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then, setDefaultTimeout, Before }) => {

  setDefaultTimeout(60 * 1000);

  Before(function(){
    this.featureflow = undefined;
    this.error = undefined;
    this.evaluatedResult = undefined;

  })

  Given('there is access to the Featureflow library', function () {
    expect(Featureflow).to.exist;
  });

  When('the FeatureflowClient is initialized with the apiKey {apiKey:stringInDoubleQuotes}', function (apiKey, callback) {
    new Featureflow.Client({apiKey}, (error, featureflow)=>{
      this.featureflow = featureflow;
      this.error = error;
      callback();
    });
  });

  When('the feature {key:stringInDoubleQuotes} with context key {contextKey:stringInDoubleQuotes} is evaluated with the value {value:stringInDoubleQuotes}', function (key, contextKey, value) {
    this.evaluatedResult = this.featureflow.evaluate(key, contextKey).is(value);
  });

  Then('the result of the evaluation should equal {arg1:trueOrFalse}', function (result) {
    // Write code here that turns the phrase above into concrete actions
    expect(this.evaluatedResult).to.equal(result);
  });

  When('the FeatureflowClient is initialized with no apiKey', function (callback) {
    new Featureflow.Client({}, (error, featureflow)=>{
      this.featureflow = featureflow;
      this.error = error;
      callback();
    });
  });

  Then('the featureflow client should throw an error', function () {
    expect(this.error).to.exist;
  });

});