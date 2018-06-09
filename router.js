const express = require('express');
const router = express.Router();
const maxmind = require('maxmind');
const csvParser = require('csv-load-sync');

const csv_file = 'country_iso_prefix.csv'
var csv_table = csvParser(csv_file);

var maxmind_options = {
  watchForUpdates: true,
  watchForUpdateNonPersistent: true,
  watchForUpdatesHook: () => {console.log('GeoipLocation database Updated!');}
};
var CountryLookup = maxmind.openSync('./GeoLite2-Country.mmdb', maxmind_options);

// Get balance
router.get('/balance/:userId', function(req, res, next){
  if (req.params.userId === "baduser") {
    var err = new Error("Bad user error");
    err.status = 500;
    next(err);
  } else {
    res.status(200);
    res.send(req.params);
  }
});

// Get geolocation information
router.get('/ipcountry', async function(req, res, next){
  var client_ip_addr = req.connection.remoteAddress.split(':').pop();
  var country = CountryLookup.get(client_ip_addr);
  var iso_code = country['country']['iso_code'];
  var name = country['country']['names']['en'];

  var i;
  for (i = 0; i < csv_table.length; i++) {
    if (csv_table[i]['iso'] === iso_code) {
      var phone_code = csv_table[i]['phonecode'];
      console.log({prefix: phone_code, iso_code: iso_code, name: name});

      res.status(200);
      res.json({prefix: phone_code, iso_code: iso_code, name: name});
    }
  }
});

module.exports = router;
