var cucumber = require('cucumber');

cucumber.defineSupportCode(function(args){
  args.addTransform({
    captureGroupRegexps: ['"[^"]*"'],
    transformer: function(value){
      return value.substr(1, value.length-2);
    },
    typeName: 'stringInQuotes'
  });

  args.addTransform({
    captureGroupRegexps: ['"[^"]*"'],
    transformer: function(value){
      return value.split(',').map(function(val){return val.trim()});
    },
    typeName: 'commaDelimitedArray'
  })
})