const express = require('express');
const router = express.Router();

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

module.exports = router;
