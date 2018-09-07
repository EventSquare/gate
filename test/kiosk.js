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
    eventName: process.env.EVENT_NAME,
    eventLocation: process.env.EVENT_VENUE,
    eventDate: process.env.EVENT_DATE,
    footerline: process.env.TICKET_FOOTER
});

gate.on('scan_ticket',function(event){
    //Find table number by barcode
    console.log(event.event + ' from ' + event.name + ' - ' + event.data.ticket.barcode);
    //Switch printer
});

gate.start();