import { defineSupportCode } from 'cucumber';
import { ContextBuilder } from '../../src/Context';
import { expect } from 'chai';
import moment from 'moment';

defineSupportCode(({ Given, When, Then, Before }) => {

  Before(function(){
    this.contextBuilder = null;
    this.context = null;
    this.error = null;
  });

  Given('there is access to the Context Builder module', function (callback) {
    expect(ContextBuilder).to.exist;
    callback();
  });

  When('the builder is initialised with the key {key:stringInDoubleQuotes}', function (key, callback) {
    try{
      this.contextBuilder = new ContextBuilder(key);
    }
    catch(err){
      this.error = err;
    }
    callback();
  });

  When('the builder is given the following values', function (contextValues, callback) {
    contextValues.hashes().forEach(contextValue=>{
      this.contextBuilder = this.contextBuilder.withValue(contextValue.key, contextValue.value)
    });
    callback();
  });

  When('the context is built using the builder', function (callback) {
    this.context = this.contextBuilder.build();
    callback();
  });

  Then('the result context should have a key {contextKey:stringInDoubleQuotes}', function (contextKey, callback) {
    expect(this.context.getKey()).to.equal(contextKey);
    callback();
  });

  Then('the result context should have a value with key {key:stringInDoubleQuotes} and value {value:stringInDoubleQuotes}', function (key, value, callback) {
    expect(this.context.getValuesForKey(key)).to.include(value);
    expect(this.context.getValuesForKey(key)).to.have.lengthOf(1);
    callback();
  });

  Then('the result context should have a value with key {key:stringInDoubleQuotes} and current datetime in iso8601', function (key, callback) {
    const date = this.context.getValuesForKey(key)[0];
    expect(date).to.exist;
    expect(moment(date).diff(moment(),'minutes')).to.equal(0);
    callback();
  });

  Then('the result context should have no values', function (callback) {
    let valueKeys = Object.keys(this.context.values).filter(key=>key.indexOf('featureflow.') !== 0);
    expect(valueKeys).to.have.lengthOf(0)
    callback();
  });

  Then('the builder should throw an error', function (callback) {
    expect(this.error).to.exist;
    callback();
  });
});