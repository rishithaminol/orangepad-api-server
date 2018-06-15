var mysql = require('mysql');
const fs = require('fs');

var dbconf = JSON.parse(fs.readFileSync('./dbconfig.json', 'UTF-8'));
var conn_pool = mysql.createPool(dbconf);

conn_pool.on('connection', function(connection) {
    console.log('Mysql database connection initiated!');
});

var query_from_pool = function (query, callback) {
  conn_pool.query(query, callback);
};

module.exports = {
  query_from_pool: query_from_pool
};
