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
    return typeof a === 'string' && typeof b === 'string'
      && (new RegExp(b)).test(a);
  },
  in: (a, b) => {
    return typeof a === 'string' && Array.isArray(b)
      && b.indexOf(a) > -1
  },
  notIn: (a, b) => {
    return typeof a === 'string' && Array.isArray(b)
      && b.indexOf(a) < 0
  },
  before: (a, b) => {
    a = dateParse(a);
    b = dateParse(b);
    if (typeof a === 'number' && typeof b === 'number') {
      return a < b;
    }
    return false;
  },
  after: (a, b) => {
    a = dateParse(a);
    b = dateParse(b);
    if (typeof a === 'number' && typeof b === 'number') {
      return a > b;
    }
    return false;
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

function dateParse(date){
  if( typeof date === 'string'){
    return Date.parse(date);
  }
  if(date instanceof Date){
    return date.getTime();
  }
  return date;
}

const notFound = () => {
  return false;
};

export function test(op, a, b){
  b = ['in','notIn'].indexOf(op) >= 0 ? b : b[0];
  return (operators[op] || notFound)(a, b);
}