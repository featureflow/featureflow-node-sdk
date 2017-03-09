var operators = {
  equals: function(a, b){
    return a === b;
  },
  contains: function(a, b){
    return typeof a === 'string' && a.indexOf(b) > -1;
  },
  startsWith: function(a, b){
    return typeof a === 'string' && a.startsWith(b);
  },
  endsWith: function(a, b){
    return typeof a === 'string' && a.endsWith(b);
  },
  matches: function(a, b){
    return typeof a === 'string' && typeof b === 'string'
      && (new RegExp(b)).test(a);
  },
  in: function(a, b){
    return typeof a === 'string' && Array.isArray(b)
      && b.indexOf(a) > -1
  },
  notIn: function(a, b){
    return typeof a === 'string' && Array.isArray(b)
      && b.indexOf(a) < 0
  },
  before: function(a, b){
    return a < b;
  },
  after: function(a, b){
    return a > b;
  },
  greaterThan: function(a, b){
    return a > b;
  },
  greaterThanOrEqual: function(a, b){
    return a >= b;
  },
  lessThan: function(a, b){
    return a < b;
  },
  lessThanOrEqual: function(a, b){
    return a <= b;
  }
}

var notFound = function() {
  return false;
}

function test(op, a, b) {
  return (operators[op] || notFound)(a, b);
}

module.exports = {
  test: test
}