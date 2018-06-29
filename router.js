const express = require('express');
const router = express.Router();
const maxmind = require('maxmind');
const csvParser = require('csv-load-sync');
const db = require('./db.js');
const Nexmo = require('nexmo');
const pwgen = require('./password_gen')

const nexmo = new Nexmo({
  apiKey: "fb7f7501",
  apiSecret: "ff90d0bf"
});
var nexmo_options = {
   ttl: 60000,
   url: 'www.orangepad.com',
   title: 'Orangepad'
};

var country_iso = csvParser('country_iso_prefix.csv');

var CountryLookup = maxmind.openSync('./GeoLite2-Country.mmdb', {
  watchForUpdates: true,
  watchForUpdateNonPersistent: true,
  watchForUpdatesHook: () => {console.log('GeoipLocation database Updated!');}
});

// user id should be validated for sql injections
var validation_format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
var validation_format_email = /[!#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]+/;

// Suppress favicon.ico
router.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Get balance
router.get('/balance/:userId', function(req, res, next){
  if (validation_format.test(req.params.userId)) { // Untrusted username
    next({response: 403, message: "malicious_username"});
    return;
  }

  db.query_from_pool("SELECT account_state FROM voipswitch.clientsshared " +
                     "WHERE login = '" + req.params.userId + "';",
                     next, function (rows, fields) {
    if (rows.length == 0) {
      next({response: 403, message: "unknown_user"});
      return;
    }

    res.send_json({response: 200, result: 0, balance: rows[0]['account_state']});
  });
});

// Check for registerd Orangepad user
router.get('/is_registered/:userId', function(req, res, next){
  db.is_registered(req.params.userId, next, function(id_client){
    if (id_client != -1) { // User registerd if clients unique id returns
      res.send_json({response: 200, result: 0});
    } else {
      res.send_json({response: 200, result: 1});
    }
  });
});

// Check for registerd Orangepad mobile number
router.get('/is_registered_number/:mobile_number', function(req, res, next){
  db.is_registered_number(req.params.mobile_number, next, function(id_client){
    if (id_client != -1) { // User registerd if clients unique id returns
      res.send_json({response: 200, result: 0});
    } else {
      res.send_json({response: 200, result: 1});
    }
  });
});

// Get geolocation information
router.get('/ipcountry', async function(req, res, next){
  var client_ip_addr = req.connection.remoteAddress.split(':').pop();
  var country = await CountryLookup.get(client_ip_addr);
  var iso_code = country['country']['iso_code'];
  var name = country['country']['names']['en'];

  var i;
  for (i = 0; i < country_iso.length; i++) {
    if (country_iso[i]['iso'] === iso_code) {
      var phone_code = country_iso[i]['phonecode'];
      var response_body = {response: 200, prefix: phone_code, iso_code: iso_code, name: name};

      res.send_json(response_body);
      break;
    }
  }
});

// Register new user
// http://rest.shatalk.com/registernew/?login=94710600010&phone=94710600085&email=helloworld23@gmail.com&fname=Rishitha&lname=Minol&password=ajlejkqlasdf
router.get('/registernew', function(req, res, next){
  // check for compulsary fields
  if (req.query.login == undefined || req.query.email == undefined ||
      req.query.password == undefined || req.query.phone == undefined) {
    next({response: 403, message: "wrong_parameters"});
    return;
  }

  db.is_registered_email(req.query.email, next, function(id_client){
    if (id_client != -1) { // email exists
      res.send_json({response: 200, result: 1, message: "email_exists"});
    } else { // email does not exist (-1)
      db.is_retail_user(req.query.login, next, function(id_client){
        if (id_client != -1) { // existing retail user. Delete it
          var query = "DELETE FROM voipswitch.clientsshared WHERE id_client = " +
                      id_client;

          insert_from_pool(query, next, function(result){
            if (!result) {
              // May be server side error
              console.log("Error deleting retail user! id_client = " + id_client);
            } else {
              console.log("Deleted existing retail user id_client = " + id_client);
              db.register_orangepad_user(req.query, next, function(reuslt){
                res.send_json({response: 200, result: 0, message: "new_user_created"});
              });
            }
          });

          return;
        }

        //// is not an existing retail user -> create new one
        // req.query = {
        //   login: "94710600085",
        //   phone: "94710600085",
        //   email: "rishithaminol@gmail.com",
        //   fname: "Rishitha",
        //   lname: "Minol",
        //   password: "aklsfioe",
        // };
        db.register_orangepad_user(req.query, next, function(reuslt){
          res.send_json({response: 200, result: 0, message: "new_user_created"});
        });
      }); // END - is_retail_user
    }
  }); // db call
});

// TODO: 'phone' should be numeric
// Send verification code and save it inside the database
// /send-verification/?phone=94710600085
router.get('/send-verification', function(req, res, next){
  // compulsary fields
  if (req.query.phone == undefined) { // check required fields
    next({response: 403, message: "wrong_parameters"});
    return;
  }

  if (validation_format.test(req.query.phone)) { // Untrusted username
    next({response: 403, message: "malicious_user_credentials"});
    return;
  }

  db.is_registered_number(req.query.phone, next, function(id_client){
    if (id_client != -1) { // registered user
      console.log("existing Orangepad Number!");

      var sender_id = 'Orangepad';
      var ver_number = Math.random().toString().slice(-5);
      var text = "Your Orangepad verification code is: " + ver_number;

      nexmo.message.sendSms(sender_id, req.query.phone /* to */, text, nexmo_options, function(error, nexmo_response){
        var messages = nexmo_response.messages[0];
        if (nexmo_response.messages[0]['status'] == 0) { // Ok
          var sql_ = "INSERT INTO orangepad_api.sms_verification SET message_id='"+
                      messages['message-id'] +"', sender_id='"+ sender_id +
                      "', sms_receiver_number='"+ messages['to'] +
                      "', status_code=0, verification_code='"+ ver_number +
                      "', message_price="+ messages['message-price'] +
                      ", remaining_balance="+ messages['remaining-balance'] +
                      ", id_client=" + id_client + ", expire='no';";
          setTimeout(function(){ // Expire function
            var msg_id = messages['message-id'];
            var expire_sql = "UPDATE orangepad_api.sms_verification " +
                             "SET expire='yes' " +
                             "WHERE message_id='"+ msg_id +"';";
            db.insert_from_pool(expire_sql, next, function(result){
              if (!result) {
                console.log("Error recording expiration status message_id = " + msg_id);
              } else {
                console.log("message_id: " + msg_id + " expired!");
              }
            });
          }, nexmo_options.ttl);

          db.insert_from_pool(sql_, next, function(result){
            if (!result) {
              console.log("Error recording verification status id_client = " + id_client);
            } else {
              console.log("verification sent id_client = " + id_client);
              res.send_json({response: 200, result: 0, message: "verification_sent"});
            }
          });
        } else {
          res.send_json({response: 200, result: 1, message: "verification_sending_error"});
          console.log(nexmo_response);
        }
      });
    } else { // is not an existing Orangepad user
      res.send_json({response: 403, result: 1, message: "wrong_mobile_number"});
    }
  }); // END - is_retail_user
});

// TODO: 'phone' should be numeric
// /verify-number/?phone=94710600085&code=27060
router.get('/verify-number', function(req, res, next){
  // compulsary fields
  if (req.query.phone == undefined || req.query.code == undefined) { // check required fields
    next({response: 403, message: "wrong_parameters"});
    return;
  }

  if (validation_format.test(req.query.phone) || validation_format.test(req.query.code)) { // Untrusted username
    next({response: 403, message: "malicious_user_credentials"});
    return;
  }

  db.is_registered_number(req.query.phone, next, function(id_client){
    if (id_client != -1) { // registered user
      var sql_ = "SELECT verification_code FROM orangepad_api.sms_verification " +
                 "WHERE sms_receiver_number = '"+ req.query.phone +"' && expire = 'no';";
      db.query_from_pool(sql_, next, function(rows, fields){
        if (rows.length > 0 && rows[rows.length - 1]['verification_code'] == req.query.code) {
          var random_pass = pwgen(32);
          var sql_ = "UPDATE voipswitch.clientsshared " +
                     "SET password = '"+ random_pass +"', " +
                     "    web_password = SHA1('"+ random_pass +"') " +
                     "WHERE id_client = '"+ id_client +"';";

          db.insert_from_pool(sql_, next, function(result){
            res.send_json({response: 200, result: 0, key: random_pass, message: "user_verified"});
          });
          return;
        }

        // hacker distraction for bruit forcing
        next({response: 403, result: 1, message: "wrong_mobile_number"});
      });
    } else {
      next({response: 403, result: 1, message: "wrong_mobile_number"});
    }
  });
});

module.exports = router;
