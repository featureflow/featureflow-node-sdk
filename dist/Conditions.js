var operators = {
  equals: function equals(a, b) {
    return a === b;
  },
  contains: function contains(a, b) {
    return typeof a === 'string' && a.indexOf(b) > -1;
  },
  startsWith: function startsWith(a, b) {
    return typeof a === 'string' && a.startsWith(b);
  },
  endsWith: function endsWith(a, b) {
    return typeof a === 'string' && a.endsWith(b);
  },
  matches: function matches(a, b) {
    return typeof a === 'string' && typeof b === 'string' && new RegExp(b).test(a);
  },
  in: function _in(a, b) {
    return typeof a === 'string' && Array.isArray(b) && b.indexOf(a) > -1;
  },
  notIn: function notIn(a, b) {
    return typeof a === 'string' && Array.isArray(b) && b.indexOf(a) < 0;
  },
  before: function before(a, b) {
    return a < b;
  },
  after: function after(a, b) {
    return a > b;
  },
  greaterThan: function greaterThan(a, b) {
    return a > b;
  },
  greaterThanOrEqual: function greaterThanOrEqual(a, b) {
    return a >= b;
  },
  lessThan: function lessThan(a, b) {
    return a < b;
  },
  lessThanOrEqual: function lessThanOrEqual(a, b) {
    return a <= b;
  }
};

var notFound = function notFound() {
  return false;
};

var test = function test(op, a, b) {
  b = ['in', 'notIn'].indexOf(op) >= 0 ? b : b[0];
  return (operators[op] || notFound)(a, b);
};

module.exports = {
  test: test
};