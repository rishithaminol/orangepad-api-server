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
    db.query("SELECT account_state FROM voipswitch.clientsshared where login = '" + req.params.userId + "';", function (err, result, fields) {
      if (err || result.length == 0) {
        var http_err;
        if (err) {
          http_err = new Error("server_error");
          http_err.status = 500; // Internal Server Error
        } else {
          http_err = new Error("unknown_user");
          http_err.status = 403; // Forbidden (4xx Client error)
        }
        next(http_err);
      } else {
        res.status(200);
        res.json({response: 200, balance: result[0]['account_state']});
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
    db.query("SELECT login FROM voipswitch.clientsshared where login = '" + req.params.userId + "';", function (err, result, fields) {
      if (err) {
        var http_err = new Error("server_error");
        http_err.status = 500; // Internal Server Error
        next(http_err);
      } else {
        if (result.length == 0) {
          res.status(404);
          res.json({response: 404, result: 1}); // not registered user
        } else {
          res.status(200);
          res.json({response: 200, result: 0}); // registered user
        }
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
      console.log({prefix: phone_code, iso_code: iso_code, name: name});

      res.status(200);
      res.json({response: 200, prefix: phone_code, iso_code: iso_code, name: name});
    }
  }
});

module.exports = router;
