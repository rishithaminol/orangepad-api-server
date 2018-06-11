const fs = require('fs');

// Server error log file
error_log = fs.createWriteStream('./server_error.log', { flags: 'a' });
info_log = fs.createWriteStream('./server_error.log', { flags: 'a' });

module.exports = {
  error: function(err_msg) {
    error_log.write(err_msg + '\n');
    console.log(err_msg);
  },
  info: function(info_msg) {
    info_log.write(info_msg + '\n');
    console.log(info_msg);
  }
};
