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
  console.log(req.headers);
  console.log("[warning] undefined url: {ip_addr: " + req.get('referer') + "}");
  res.status(err.status);
  res.json(err.message);
})

var port = process.env.PORT || 8080;
var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});
