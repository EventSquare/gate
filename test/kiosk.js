require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

const config = {
    api_endpoint: process.env.API_ENDPOINT,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/storage'),
    scantoken: process.env.SCANTOKEN
};

//Start Gate Server
const gate = new EventSquare.Gate(config);

gate.start();

gate.on('scan', (event,device) => {

    if(!event.ticket) return;
    //if(event.status !== "allowed") return;

    // Find pocket
    gate.db.open(db => {
        if(event.order) {
            let order = db.objectForPrimaryKey('Order', event.order.id);
            if(order && (order.company || order.invitation_reference)){
                if(order.invitation_reference){
                    event.order.company = order.invitation_reference;
                }
                if(order.company){
                    event.order.company = order.company;
                }
            }
        }
        processLabel(device,event)
    }, error => {
        console.warn(error);
    });
});

function processLabel(device,payload) {
    switch (device.name) {
        case 'S1':
        case 'S2':
            printLabel('zebra1',payload);
            break;
        case 'S3':
        case 'S4':
            printLabel('zebra2',payload);
            break;
        default:
            break;
    }
}

function printLabel(printer,payload) {
    const labelprinter = new EventSquare.LabelPrinter(config);
    const label = config.storage_path + '/label.zpl';
    labelprinter.printLabel(printer,label,payload);
}