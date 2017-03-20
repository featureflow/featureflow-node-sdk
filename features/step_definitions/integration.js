import { defineSupportCode } from 'cucumber';
import Featureflow from '../../src/Featureflow';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then, setDefaultTimeout }) => {

  setDefaultTimeout(60 * 1000);

  Given('there is access to the Featureflow library', function () {
    expect(Featureflow).to.exist;
  });

  When('the FeatureflowClient is initialized with the apiKey {apiKey:stringInDoubleQuotes}', function (apiKey, callback) {
    try{
      Featureflow.init({apiKey}, (error, featureflow)=>{
        console.log(error);
        this.featureflow = featureflow;
        this.error = error;
        callback();
      });
    }
    catch(err){
      console.log(err);
    }

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