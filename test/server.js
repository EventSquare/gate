require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: false,
    encryption_key: process.env.ENCRYPTION_KEY,
    name: process.env.DEVICE_NAME,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE
});

gate.start();

gate.on('scan', (event) => {
    console.log("Received:", event);
});