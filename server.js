const Gate = require('./gate.js');

//Start Gate Server

var Server = new Gate.Server({
    encryption_key: 'XXXXXX',
    port: 3000
});

Server.start();