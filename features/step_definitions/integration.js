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

  When('the FeatureflowClient is initialized with the apiKey {stringInDoubleQuotes}', function (apiKey, callback) {
    new Featureflow.Client({apiKey}, (error, featureflow)=>{
      this.featureflow = featureflow;
      this.error = error;
      callback();
    });
  });

  // Reads the key/URL from the environment rather than a literal in the .feature
  // file, so no real SDK key is checked into source. This step is only used by
  // @integration scenarios, which are excluded from `yarn test` and only run via
  // `yarn test:integration` once FEATUREFLOW_TEST_API_KEY is set.
  When('the FeatureflowClient is initialized with the configured apiKey', function (callback) {
    const config = {apiKey: process.env.FEATUREFLOW_TEST_API_KEY};
    if (process.env.FEATUREFLOW_TEST_BASE_URL) {
      config.baseUrl = process.env.FEATUREFLOW_TEST_BASE_URL;
    }
    new Featureflow.Client(config, (error, featureflow)=>{
      this.featureflow = featureflow;
      this.error = error;
      callback();
    });
  });

  When('the feature {stringInDoubleQuotes} with user id {stringInDoubleQuotes} is evaluated with the value {stringInDoubleQuotes}', function (key, userId, value) {
    this.evaluatedResult = this.featureflow.evaluate(key, userId).is(value);
  });

  Then('the result of the evaluation should equal {trueOrFalse}', function (result) {
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