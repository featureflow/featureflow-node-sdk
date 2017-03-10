const { defineSupportCode } = require('cucumber');
const conditions = require('../../src/conditions');
const { expect } = require('chai');

defineSupportCode(({ Given, When, Then }) => {
  Given('the target is a {type:stringInQuotes} with the value of {target:stringInQuotes}', function (type, target) {
    this.result = undefined;
    this.target = target;
    if (type === 'number'){
      this.target = parseFloat(target);
    }
  });

  Given('the value is a {type:stringInQuotes} with the value of {value:stringInQuotes}', function (type, value) {
    this.result = undefined;
    this.value = value;

    if (type === 'number'){
      this.value = parseFloat(value);
    }
  });

  Given('the value is an array of values {array:commaDelimitedArray}', function (array) {
    this.result = undefined;
    this.value = array;
  });

  When('the operator test {op:stringInQuotes} is run', function (op) {
    this.result = conditions.test(op, this.target, [].concat(this.value));
  });

  Then('the output should equal {bool:stringInQuotes}', function (bool) {
    expect(this.result).to.equal(bool === 'true');
  });

})