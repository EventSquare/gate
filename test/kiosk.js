require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    encryption_key: process.env.ENCRYPTION_KEY,
    bonjour: true,
    name: process.env.DEVICE_NAME,
    port: process.env.PORT,
    scantoken: process.env.SCANTOKEN,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE,
    eventName: "Belgian Air Force Days",
    eventLocation: "Air Base Kleine-Brogel",
    eventDate: "7-8-9 September 2018",
    footerline: '~~ Powered by EventSquare ~~',
});

gate.start();