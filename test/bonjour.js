
const bonjour = require('bonjour')()
bonjour.find({ }, function (service) {
   console.log('Found a server:', service.name);
  })
