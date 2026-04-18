require('babel-core/register');
const { defineSupportCode } = require('cucumber');

defineSupportCode(({ defineParameterType }) => {
  const stringInQuotesRegexp = /"([^"]*)"/;
  const stripQuotes = (s) => s;

  defineParameterType({
    name: 'stringInQuotes',
    regexp: stringInQuotesRegexp,
    transformer: stripQuotes
  });

  defineParameterType({
    name: 'stringInDoubleQuotes',
    regexp: stringInQuotesRegexp,
    transformer: stripQuotes
  });

  defineParameterType({
    name: 'commaDelimitedArray',
    regexp: /(.*,.*)/,
    transformer: (value) => value.split(',').map((val) => val.trim())
  });

  defineParameterType({
    name: 'trueOrFalse',
    regexp: /(true|false)/,
    transformer: (value) => JSON.parse(value)
  });

  defineParameterType({
    name: 'enabledOrDisabled',
    regexp: /(enabled|disabled)/,
    transformer: (value) => value === 'enabled'
  });
});