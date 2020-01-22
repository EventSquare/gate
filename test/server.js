require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: true,
    scantoken: process.env.SCANTOKEN,
    encryption_key: process.env.ENCRYPTION_KEY,
    name: process.env.DEVICE_NAME,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE
});

gate.start();

//Load logo data from csv file
const csv = require('csvtojson')
let logos = {};

csv({
    trim: true,
})
.fromFile(path.join(__dirname ,'../storage/brand_logos.csv'))
.then((logoData)=>{
    for(var i = 0; i < logoData.length; i++){
        logos[logoData[i].order_reference] = logoData[i].logo;
    }
})

gate.on('scan', (event) => {
    
    if(!event.data.ticketData.ticket) return;

    //Default label data
    let labelData = {
        id: event.data.ticketData.ticket.id,
        name: event.data.ticketData.ticket.firstname + " " + event.data.ticketData.ticket.lastname,
        company: null,
        logo: null
    }
    // Find pocket
    EventSquare.DB.open(gate.config.storage_path, db => {
        let pocket = db.objectForPrimaryKey('Pocket', event.data.ticketData.ticket.pocket_id);
        if(!pocket) {
            processLabel(event,labelData);
            return;
        }
        // Find order
        let order = db.objectForPrimaryKey('Order', pocket.order_id);
        if(!order || (!order.company && !order.invitation_reference)){
            processLabel(event,labelData);
            return;
        }
        if(order.invitation_reference){
            labelData.company = order.invitation_reference;
        }
        if(order.company){
            labelData.company = order.company;
        }
        // Check if company logo needed
        if(typeof(logos[order.reference]) !== 'undefined'){
            labelData.logo = logos[order.reference];
        }
        processLabel(event,labelData);
    }, error => {
        console.warn(error);
    });
});

function processLabel(event,labelData) {
    switch (event.name) {
        case 'S1':
        case 'S2':
            printLabel('zebra1',labelData);
            break;
        case 'S3':
        case 'S4':
            printLabel('zebra2',labelData);
            break;
        default:
            break;
    }
}

// Listen for incoming badge printing
gate.on('print_badge', (event) => {
    let labelData = {
        name: event.data.name,
        company: event.data.company
    }
    switch (event.name) {
        case 'KIOSK-1':
            printLabel('zebra1',labelData);
            break;
        case 'KIOSK-2':
            printLabel('zebra2',labelData);
            break;
        default:
            break;
    }
});

// Label printing
let label_path = path.join(__dirname + '/labels/voka.zpl');

function printLabel(printer,labelData) {
    EventSquare.Label.print(label_path,{
        "NAME": labelData.name,
        "COMPANY": labelData.company,
        "LOGO": labelData.logo
    }, printer);
}