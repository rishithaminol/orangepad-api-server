const fs = require('fs');

// Server error log file
error_log = fs.createWriteStream('./server_error.log', { flags: 'a' });
info_log = fs.createWriteStream('./server_error.log', { flags: 'a' });

module.exports = {
  error: function(err_msg) {
    error_log.write(JSON.stringify(err_msg) + '\n');
    console.log(JSON.stringify(err_msg, null, 4));
  },
  info: function(info_msg) {
    info_log.write(JSON.stringify(info_msg) + '\n');
    console.log(JSON.stringify(info_msg, null, 4));
  }
};
