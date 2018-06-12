var mysql = require('mysql');
const fs = require('fs');

var dbconf = JSON.parse(fs.readFileSync('./dbconfig.json', 'UTF-8'));
var connection;

function handle_disconnect() {
  connection = mysql.createConnection(dbconf);

  connection.connect(function(err){
    if (err) {
      console.log('Error when connecting to the database:', err);
      setTimeout(handle_disconnect, 2000);
    } else {
      console.log('Database connected!');
    }
  });

  connection.on('error', function(err){
    console.log('database error:', err);
    if (err.code == 'PROTOCOL_CONNECTION_LOST') {
      handle_disconnect();
    } else {
      throw err;
    }
  });
}

handle_disconnect();

module.exports = connection;
