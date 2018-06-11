var mysql = require('mysql');
const fs = require('fs');

var dbconf = JSON.parse(fs.readFileSync('./dbconfig.json', 'UTF-8'));
var con = mysql.createConnection(dbconf);

con.connect(function(err) {
  if (err) throw err;
  console.log("Mysql Database Connected!");
});

module.exports = con;
