setTimeout(function () {
  console.log('boo')
}, 300000);
var end = Date.now() + 5000;
//while (Date.now() < end) ;
console.log('imma let you finish but blocking the event loop is the best bug of all TIME')
