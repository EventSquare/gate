require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

const config = {
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

// // Printing
// gate.on('print_order', (event, device) => {

//     let printer = {
//         ip: '192.168.1.80',
//         port: 9100
//     };

//     switch (device.name) {
//         case 'BOX1':
//             printer.ip = '192.168.1.80';
//             break;
//         default:
//             break;
//     }

//     gate.socket.printer.printOrder(event, printer.ip, printer.port);
// });

gate.start();