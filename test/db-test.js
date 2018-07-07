const db = require('./db.js');

// db.add_new_retail_user('94710600080', null, function(new_id_client){
//   console.log('New retail user created with id:' + new_id_client);
// });
// db.register_orangepad_user(6233, '94510600095', '94510600095', 'jaklsdjfk', 'kasjdfklj', 'akjdsklf@gmail.com', 'and', null, function(result){
//   console.log(result);
// });

var x = {
  hello: "world",
  rishitha: "minol",
  nug: "hub"
};

// for (const [key, value] of myMap.entries()) {
//   console.log(key, value);
// }

for (var key in x) {
  console.log(key+ ":" +x[key]);
}
