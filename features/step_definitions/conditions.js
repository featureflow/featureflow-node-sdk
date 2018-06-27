import { defineSupportCode } from 'cucumber';
import { test } from '../../src/Conditions';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then }) => {
  Given('the target is a {stringInQuotes} with the value of {stringInQuotes}', function (type, target) {
    this.result = undefined;
    this.target = target;
    if (type === 'number'){
      this.target = parseFloat(target);
    }
  });

  Given('the attribute is a {stringInQuotes} with the value of {stringInQuotes}', function (type, attribute) {
    this.result = undefined;
    this.attribute = attribute;

    if (type === 'number'){
      this.attribute = parseFloat(attribute);
    }
  });

  Given('the attribute is an array of values {commaDelimitedArray}', function (array) {
    this.result = undefined;
    this.attribute = array;
  });

  When('the operator test {stringInQuotes} is run', function (op) {
    this.result = test(op, this.target, [].concat(this.attribute));
  });

  Then('the output should equal {stringInQuotes}', function (bool) {
    expect(this.result).to.equal(bool === 'true');
  });

})