require('babel-core/register');
const { defineSupportCode } = require('cucumber');

defineSupportCode(({ addTransform })=>{
  addTransform({
    captureGroupRegexps: ['"[^"]*"'],
    transformer: value => value.substr(1, value.length-2),
    typeName: 'stringInQuotes'
  });

  addTransform({
    captureGroupRegexps: ['"[^"]*"'],
    transformer: value => value.split(',').map(function(val){return val.trim()}),
    typeName: 'commaDelimitedArray'
  });

  addTransform({
    captureGroupRegexps: ['true', 'false'],
    transformer: value => JSON.parse(value),
    typeName: 'trueOrFalse'
  });
});