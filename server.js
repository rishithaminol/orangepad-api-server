var express = require('express');
var app = express();
const routes = require('./router')

app.use(function(req, res, next){
  res.header('Content-Type', 'application/json');
  next();
});

app.use('/', routes);

// determine all undefined calls as errors (catch 404s)
app.use(function(req, res, next){
  var err = new Error("Orangepad Systems pvt Ltd. Undefined error");

  err.status = 404;
  next(err);
});
app.use(function (err, req, res, next) {
  var client_ip_addr = req.connection.remoteAddress.split(':').pop();
  var client_http_headers = JSON.stringify(req.headers);

  var db_query = {ip_addr: client_ip_addr, http_headers: client_http_headers};
  console.log(db_query);

  res.status(err.status);
  res.json(err.message);
})

var port = process.env.PORT || 6565;
var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});
