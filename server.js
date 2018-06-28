const express = require('express');
const app = express();
const routes = require('./router');
const https = require('https');
const server_log = require('./server_log.js');
const fs = require('fs');

var allowed_http_methods = ['GET'];

// Default response headers
app.use(function(req, res, next){
  res.header('Content-Type', 'application/json');
  res.header('Server', 'Apache');
  res.header('X-Powered-By', 'PHP/5.1.2-1+b1'); // Hacker distraction
  next();
});

// Add logging mechanism
// Every function should set response code before send data.
app.use(function(req, res, next){
  res.send_json = function(response_body){
    var log_obj = {
      ip_addr: req.connection.remoteAddress.split(':').pop(),
      orig_url: req.originalUrl,
      req_url: req.url,
      response_body: response_body,
      response_headers: res._headers,
      request_method: req.method,
      request_headers: req.headers
    };

    if (response_body.response == 200) {
      server_log.info(log_obj);
    } else {
      server_log.error(log_obj);
    }

    res.status(response_body.response);
    res.json(response_body);
    res.end();
  };

  next();
});

// app.use(express.static('static')); // Use this for ssl activation
app.use('/', routes);
app.disable('etag');

// determine all undefined calls as errors (catch 404s)
// every error detection priour to every route should be written here
app.use(function(req, res, next){
  var err = {};
  if (!allowed_http_methods.includes(req.method)) {
    err.response = 405;
    err.message = "undefined_method";
  } else {
    err.response = 404;
    err.message = "undefined_url";
  }
  next(err);
});
app.use(function(err, req, res, next){
  res.send_json({response: err.response, result: 1, error: err.message});
});

var server = app.listen(6565, function(){
  console.log('Express server listening on port ' + 6565);
});

https.createServer({
	cert: fs.readFileSync('./fullchain.pem'),
	key: fs.readFileSync('./privkey.pem')
}, app).listen(6566, function() {
  console.log('Https server listening ' + 6566);
});

