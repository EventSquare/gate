require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

const config = {
    api_endpoint: process.env.API_ENDPOINT,
    port: process.env.PORT,
    bonjour: true,
    storage_path: path.join(__dirname + '/storage'),
    scantoken: process.env.SCANTOKEN
};

//Start Gate Server
const gate = new EventSquare.Gate(config);

// Printing
gate.on('print_order', (event) => {
    console.log("Printing order for ", event.name, " - order data ", event.data);
    
    return;
    // TODO REPLACE
    printer = {
        ip: '127.0.0.1',
        port: 9100
    };

    switch (event.name) {
        case 'Kassa-1':
        case 'Kassa-2':
        case 'Kassa-3':
        case 'Kassa-4':
            printer.ip = '192.168.1.80';
            break;
        case 'BOXOFFICE-1':
            break;
        case 'BOXOFFICE-2':
            break;
        case 'BOXOFFICE-3':
            break;
        case 'BOXOFFICE-4':
            break;
        case 'EID-XXX':
            printer.ip = '192.168.1.80';
            break;
        default:
            // TODO...
            break;
    }
    gate.printOrder(event.data, printer.ip, printer.port);
});

gate.start();