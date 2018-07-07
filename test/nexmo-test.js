const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: "fb7f7501",
  apiSecret: "ff90d0bf"
});

var ver_number = Math.random().toString().slice(-5);

const from = 'Orangepad'
const to = 'hghjfhkf'
const text = `Your Orangepad verification code is: ${ver_number}`

var options = {
   ttl: 900000,
   url: 'www.orangepad.com',
   title: 'Orangepad'
};

nexmo.message.sendSms(from, to, text, options, function(error, response){
  //console.log(response.messages[0].to);
  console.log(response);
});
