require('dotenv').config()

const Gate = require('./gate.js');

//Start Gate Server

var Server = new Gate.Server({
    encryption_key: 'XXXXXX',
    port: process.env.PORT
});

Server.start();