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

gate.on('print_order', (event, device) => {
    console.log('Print Order event received', event);
    gate.socket.printer.printOrder(event, process.env.PRINTER_IP, 9100);
});

//Listen for incoming EID reads
gate.on('eid_read',event => {
    //event object contains source, event and data.
    console.log(event);
});

gate.start();