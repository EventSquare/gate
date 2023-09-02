require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

const config = {
    name: process.env.DEVICE_NAME,
    api_endpoint: process.env.API_ENDPOINT,
    port: process.env.PORT,
    bonjour: true,
    storage_path: path.join(__dirname + '/../storage'),
    scantoken: process.env.SCANTOKEN,
    eventName: process.env.EVENT_NAME,
    eventDate: process.env.EVENT_DATE,
    eventLocation: process.env.EVENT_LOCATION,
    footerline: process.env.TICKET_FOOTER
};

//Start Gate Server
const gate = new EventSquare.Gate(config);

gate.start();