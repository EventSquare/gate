require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/storage'),
    //scantoken: process.env.SCANTOKEN
});

gate.start();