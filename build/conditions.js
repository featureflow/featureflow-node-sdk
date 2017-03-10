const operators = {
  equals: (a, b) => {
    return a === b;
  },
  contains: (a, b) => {
    return typeof a === 'string' && a.indexOf(b) > -1;
  },
  startsWith: (a, b) => {
    return typeof a === 'string' && a.startsWith(b);
  },
  endsWith: (a, b) => {
    return typeof a === 'string' && a.endsWith(b);
  },
  matches: (a, b) => {
    return typeof a === 'string' && typeof b === 'string' && new RegExp(b).test(a);
  },
  in: (a, b) => {
    return typeof a === 'string' && Array.isArray(b) && b.indexOf(a) > -1;
  },
  notIn: (a, b) => {
    return typeof a === 'string' && Array.isArray(b) && b.indexOf(a) < 0;
  },
  before: (a, b) => {
    return a < b;
  },
  after: (a, b) => {
    return a > b;
  },
  greaterThan: (a, b) => {
    return a > b;
  },
  greaterThanOrEqual: (a, b) => {
    return a >= b;
  },
  lessThan: (a, b) => {
    return a < b;
  },
  lessThanOrEqual: (a, b) => {
    return a <= b;
  }
};

const notFound = () => {
  return false;
};

const test = (op, a, b) => {
  return (operators[op] || notFound)(a, b);
};

module.exports = {
  test: test
};