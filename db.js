var mysql = require('mysql');
const fs = require('fs');

// user id should be validated for sql injections
var validation_format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
var validation_format_email = /[!#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]+/;

var dbconf = JSON.parse(fs.readFileSync('./dbconfig.json', 'UTF-8'));
var conn_pool = mysql.createPool(dbconf);

conn_pool.on('connection', function(connection) {
    console.log('Mysql database connection initiated!');
});

// callback format -> function(rows, fields)
var query_from_pool = function(query, next_err_igniter, callback) {
  conn_pool.query(query, function(err, rows, fields){
    if (err) {
      if (next_err_igniter == null) {
        console.log('error occured:' + err.code);
        return;
      }

      next_err_igniter({response: 500, message: "server_error"});
      console.log("database server error code:" + err.code);
      return;
    }

    callback(rows, fields);
  });
};

// callback format -> function(result)
var insert_from_pool = function(query, next_err_igniter, callback) {
  conn_pool.query(query, function(err, result){
    if (err) {
      if (next_err_igniter == null) {
        console.log('error occured:' + err.code);
        return;
      }
      next_err_igniter({response: 500, message: "server_error"});
      console.log("database server error code:" + err.code);
      return;
    }

    callback(result);
  });
};

// callback function format -> function(id_user)
//        returns the user id. -1 if not found
// express framework 'next' error kickstarter -> next_err_igniter
// username -> user
var is_registered = function(user, next_err_igniter, callback) {
  if (validation_format.test(user)) {
    next_err_igniter({response: 403, message: "malicious_user_credentials"});
    return; // return from 'is_registered' function
  }

  var query = "SELECT id_client FROM orangepad_api.clients where login = '" + user + "';";
  query_from_pool(query, next_err_igniter, function(rows, fields){
    if (rows.length == 0) {
      callback(-1);
    } else {
      callback(rows[0]['id_client']);
    }
  });
};

// callback function format -> function(id_user)
//        returns the user id. -1 if not found
// express framework 'next' error kickstarter -> next_err_igniter
// username -> user
var is_registered_number = function(phone, next_err_igniter, callback) {
  if (validation_format.test(phone)) {
    next_err_igniter({response: 403, message: "malicious_user_credentials"});
    return; // return from 'is_registered' function
  }

  var query = "SELECT id_client FROM orangepad_api.clients where phone = '" + phone + "';";
  query_from_pool(query, next_err_igniter, function(rows, fields){
    if (rows.length == 0) {
      callback(-1);
    } else {
      callback(rows[0]['id_client']);
    }
  });
};

// check whether the given user is a retail user and return the id number
// if found.
var is_retail_user = function(user, next_err_igniter, callback) {
  if (validation_format.test(user)) {
    next_err_igniter({response: 403, message: "malicious_user_credentials"});
    return; // return from 'is_retail_user' function
  }

  var query = "SELECT id_client FROM voipswitch.clientsshared WHERE login = '" + user + "'";
  query_from_pool(query, next_err_igniter, function(rows, fields){
    if (rows.length == 0) {
      callback(-1);
    } else {
      callback(rows[0]['id_client']);
    }
  });
};

// Create new retail user and return qunique Id of created user
// callback -> callback(new_id_client)
var add_new_retail_user = function(user, next_err_igniter, callback) {
  if (validation_format.test(user)) {
    next_err_igniter({response: 403, message: "malicious_user_credentials"});
    return; // return from 'add_new_retail_user' function
  }

  var random_pass = Math.random().toString(36).slice(-11) +
                    Math.random().toString(36).slice(-11);
  var query = "INSERT INTO voipswitch.clientsshared " +
          "(login, password, web_password, type, id_tariff," +
          "account_state, tech_prefix, codecs, primary_codec) " +
          "VALUES ('" + user + "', '" + random_pass +
          "', SHA1('" + random_pass + "'), 131585, 1, 0.1," +
          "'DP:int->;TP:int->', 9, 4);";
  insert_from_pool(query, next_err_igniter, function(result){
    if (!result) {
      callback(-1);
    } else {
      callback(result.insertId); // new user created with row ID
    }
  });
};

// Create new Orangepad user
// callback -> callback(result)
//var register_orangepad_user = function(retail_id, user, passwd, fname, lname, email, os, next_err_igniter, callback) {
var register_orangepad_user = function(url_query, next_err_igniter, callback) {
  var query_values = "";
  var validated = false; // If validation format fails all goes down.
  for (var key in url_query) {
    switch (key) {
      case 'password':
            break;

      case 'email':
            validated = validation_format_email.test(url_query[key]);
            break;

      default:
            validated = validation_format.test(url_query[key]);
    }

    if (validated) { // if not validated
      next_err_igniter({response: 403, message: "malicious_user_credentials"});
      console.log('Orangepad registration malfunction');
      return; // return from 'register_orangepad_user' function
    }

    switch (key) {
      case 'login':
            query_values = query_values.concat("login='"+ url_query[key] +"',");
            break;

      case 'phone':
            query_values = query_values.concat("phone='"+ url_query[key] +"',");
            break;

      case 'email':
            query_values = query_values.concat("email='"+ url_query[key] +"', ");
            break;

      case 'fname':
            query_values = query_values.concat("first_name='"+ url_query[key] +"', ");
            break;

      case 'lname':
            query_values = query_values.concat("last_name='"+ url_query[key] +"', ");
            break;

      case 'password':
            query_values = query_values.concat("user_pass=SHA1('"+ url_query[key] +"'), ");
            break;

      case 'country_code':
            query_values = query_values.concat("cc='"+ url_query[key] +"', ");
            break;
    }
  }

  add_new_retail_user(url_query['login'], next_err_igniter, function(new_id_client){
    console.log("New retail user created with id_client = " + new_id_client);
    query_values = query_values.concat("id_client="+ new_id_client);

    var query = "INSERT IGNORE INTO orangepad_api.clients SET "+ query_values +";";
    console.log(query);
    insert_from_pool(query, next_err_igniter, function(result){
      if (!result) {
        callback(-1);
      } else {
        callback(result); // new user created and output is reuslt
        console.log("New orangepad user created login = " + url_query.login);
      }
    });
  });
};

// check whether the given email registered with Orangepad system
var is_registered_email = function(email, next_err_igniter, callback) {
  if (validation_format_email.test(email)) {
    next_err_igniter({response: 403, message: "malicious_user_credentials"});
    return; // return from 'is_registered_email' function
  }

  var query = "SELECT id_client FROM orangepad_api.clients WHERE email = '" + email + "'";
  query_from_pool(query, next_err_igniter, function(rows, fields){
    if (rows.length == 0) {
      callback(-1);
    } else {
      callback(rows[0]['id_client']);
    }
  });
};

module.exports = {
  query_from_pool: query_from_pool,
  insert_from_pool: insert_from_pool,
  is_registered: is_registered, // validates a Orangepad registered client
  is_registered_number: is_registered_number, // Check whether the given mobile number is in the database
  is_retail_user: is_retail_user,
  is_registered_email: is_registered_email,
  register_orangepad_user: register_orangepad_user
};
