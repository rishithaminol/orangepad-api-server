var express = require('express');
var app = express();
const routes = require('./router');
const fs = require('fs');

const https = require('https');

// Server error log file
error_log = fs.createWriteStream('./server_error.log', { flags: 'a' });

// Default response headers
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
  var client_http_headers = req.headers;

  var err_obj = {
    time: new Date() / 1000,
    error_type: err.message,
    ip_addr: client_ip_addr,
    req_url: req.originalUrl,
    http_headers: client_http_headers
  };
  error_log.write(JSON.stringify(err_obj) + '\n');
  console.log(JSON.stringify(err_obj));

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
