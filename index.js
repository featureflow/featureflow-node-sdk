var keys = [
   "alice",
   "bob",
   "charlie",
   "daniel",
   "emma",
   "frank",
   "george"
];

var sha1Hex = require('sha1-hex');

function getVariantValue(hash) {
    return Math.abs(hash % 100) + 1;
}
function getHash(user, key, seed) {
    var hex = sha1Hex(seed+'.'+user+"."+key).substr(0, 8);
    return hex;
}


for (var i in keys){
  var x = getHash(keys[i], 'feature',  'seed');
  console.log(keys[i]+' equals ' + x);
  console.log(parseInt(x, 16) % 100);
}
