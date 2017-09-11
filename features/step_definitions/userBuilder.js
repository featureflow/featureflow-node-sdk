import { defineSupportCode } from 'cucumber';
import { UserBuilder } from '../../src/User';
import { expect } from 'chai';
import moment from 'moment';

defineSupportCode(({ Given, When, Then, Before }) => {

  Before(function(){
    this.userBuilder = null;
    this.user = null;
    this.error = null;
  });

  Given('there is access to the User Builder module', function (callback) {
    expect(UserBuilder).to.exist;
    callback();
  });

  When('the builder is initialised with the id {id:stringInDoubleQuotes}', function (id, callback) {
    try{
      this.userBuilder = new UserBuilder(id);
    }
    catch(err){
      this.error = err;
    }
    callback();
  });

  When('the builder is given the following attributes', function (userAttributes, callback) {
    userAttributes.hashes().forEach(userAttribute=>{
      this.userBuilder = this.userBuilder.withAttribute(userAttribute.key, userAttribute.value)
    });
    callback();
  });

  When('the user is built using the builder', function (callback) {
    this.user = this.userBuilder.build();
    callback();
  });

  Then('the result user should have a id {userId:stringInDoubleQuotes}', function (userId, callback) {
    expect(this.user.getId()).to.equal(userId);
    callback();
  });

  Then('the result user should have a attribute with key {key:stringInDoubleQuotes} and attribute {attribute:stringInDoubleQuotes}', function (key, attribute, callback) {
    expect(this.user.getAttributesForKey(key)).to.include(attribute);
    expect(this.user.getAttributesForKey(key)).to.have.lengthOf(1);
    callback();
  });

  Then('the result user should have a attribute with key {key:stringInDoubleQuotes} and current datetime in iso8601', function (key, callback) {
    const date = this.user.getAttributesForKey(key)[0];
    expect(date).to.exist;
    expect(moment(date).diff(moment(),'minutes')).to.equal(0);
    callback();
  });

  Then('the result user should have no attributes', function (callback) {
    let attributeKeys = Object.keys(this.user.attributes).filter(key=>key.indexOf('featureflow.') !== 0);
    expect(attributeKeys).to.have.lengthOf(0)
    callback();
  });

  Then('the builder should throw an error', function (callback) {
    expect(this.error).to.exist;
    callback();
  });
});