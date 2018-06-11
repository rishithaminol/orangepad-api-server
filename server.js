var express = require('express');
var app = express();
const routes = require('./router');

const https = require('https');
const fs = require('fs');

app.use(function(req, res, next){
  res.header('Content-Type', 'application/json');
  res.header('Server', 'Apache');
  res.header('X-Powered-By', 'PHP/5.1.2-1+b1'); // Hacker distraction
  next();
});

// app.use(express.static('static')); // Use this for ssl activation
app.use('/', routes);
app.disable('etag');

// determine all undefined calls as errors (catch 404s)
app.use(function(req, res, next){
  var err = new Error("undefined_url");

  err.status = 404;
  next(err);
});
app.use(function (err, req, res, next) {
  var client_ip_addr = req.connection.remoteAddress.split(':').pop();
  var client_http_headers = JSON.stringify(req.headers);

  var db_query = {ip_addr: client_ip_addr, http_headers: client_http_headers};
  console.log(db_query);

  res.status(err.status);
  res.json({error: err.message});
})

var server = app.listen(6565, function() {
  console.log('Express server listening on port ' + 6565);
});

https.createServer({
	cert: fs.readFileSync('./fullchain.pem'),
	key: fs.readFileSync('./privkey.pem')
}, app).listen(6566, function() {
  console.log('Https server listening ' + 6566);
});

