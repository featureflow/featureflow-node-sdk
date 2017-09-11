import { defineSupportCode } from 'cucumber';
import { test } from '../../src/Conditions';
import { expect } from 'chai';

defineSupportCode(({ Given, When, Then }) => {
  Given('the target is a {type:stringInQuotes} with the value of {target:stringInQuotes}', function (type, target) {
    this.result = undefined;
    this.target = target;
    if (type === 'number'){
      this.target = parseFloat(target);
    }
  });

  Given('the attribute is a {type:stringInQuotes} with the value of {value:stringInQuotes}', function (type, value) {
    this.result = undefined;
    this.attribute = attribute;

    if (type === 'number'){
      this.attribute = parseFloat(attribute);
    }
  });

  Given('the attribute is an array of values {array:commaDelimitedArray}', function (array) {
    this.result = undefined;
    this.attribute = array;
  });

  When('the operator test {op:stringInQuotes} is run', function (op) {
    this.result = test(op, this.target, [].concat(this.attribute));
  });

  Then('the output should equal {bool:stringInQuotes}', function (bool) {
    expect(this.result).to.equal(bool === 'true');
  });

})