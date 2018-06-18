const express = require('express');
const router = express.Router();
const maxmind = require('maxmind');
const csvParser = require('csv-load-sync');
const db = require('./db.js');

var country_iso = csvParser('country_iso_prefix.csv');

var CountryLookup = maxmind.openSync('./GeoLite2-Country.mmdb', {
  watchForUpdates: true,
  watchForUpdateNonPersistent: true,
  watchForUpdatesHook: () => {console.log('GeoipLocation database Updated!');}
});

// Get balance
router.get('/balance/:userId', function(req, res, next){
  // user id should be validated for sql injections
  var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  if (format.test(req.params.userId)) { // Untrusted username
    var http_err = new Error("malicious_username");
    http_err.status = 403; // Forbidden (4xx Client error)
    next(http_err);
  } else {
    db.query_from_pool("SELECT account_state FROM voipswitch.clientsshared where login = '" + req.params.userId + "';", function (err, rows, fields) {
      if (err || rows.length == 0) {
        var http_err;
        if (err) {
          http_err = new Error("server_error");
          http_err.status = 500; // Internal Server Error
      	  console.log(http_err.stack);
          console.log("database server error code:" + err.code);
        } else {
          http_err = new Error("unknown_user");
          http_err.status = 403; // Forbidden (4xx Client error)
        }
        next(http_err);
      } else {
        var response_body = {response: 200, balance: rows[0]['account_state']};

        res.status(200);
        res.send_json(response_body);
      }
    });
  }
});

// Check for registerd user
router.get('/isregistered/:userId', function(req, res, next){
  // user id should be validated for sql injections
  var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  if (format.test(req.params.userId)) { // Untrusted username
    var http_err = new Error("malicious_username");
    http_err.status = 403; // Forbidden (4xx Client error)
    next(http_err);
  } else {
    db.query_from_pool("SELECT login FROM voipswitch.clientsshared where login = '" + req.params.userId + "';", function (err, rows, fields) {
      if (err) {
        var http_err = new Error("server_error");
        http_err.status = 500; // Internal Server Error
        next(http_err);
        console.log(http_err.stack);
        console.log("database server error code:" + err.code);
      } else {
        var response_body;
        if (rows.length == 0) {
          response_body = {response: 200, result: 1};
        } else {
          response_body = {response: 200, result: 0};
        }

        res.status(200);
        res.send_json(response_body); // not registered user
      }
    });
  }
});

// Get geolocation information
router.get('/ipcountry', async function(req, res, next){
  var client_ip_addr = req.connection.remoteAddress.split(':').pop();
  var country = CountryLookup.get(client_ip_addr);
  var iso_code = country['country']['iso_code'];
  var name = country['country']['names']['en'];

  var i;
  for (i = 0; i < country_iso.length; i++) {
    if (country_iso[i]['iso'] === iso_code) {
      var phone_code = country_iso[i]['phonecode'];
      var response_body = {response: 200, prefix: phone_code, iso_code: iso_code, name: name};

      res.status(200);
      res.send_json(response_body);
    }
  }
});

module.exports = router;
