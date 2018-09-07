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

let label_path = path.join(__dirname + '/labels/bafd.zpl');

gate.on('scan_ticket',function(event){
    //Check if printing is enabled
    if(process.env.PRINT_ON_SCAN=="TRUE"){
        let printer = "Zebra";
        switch(event.name){
            case "KIOSK-1":
            case "KIOSK-2":
                printer = "Zebra";
                break;
            case "KIOSK-3":
            case "KIOSK-4":
                printer = "Zebra";
                break;
        }
        //Find table number by barcode
        console.log(event.event + ' from ' + event.name + ' - ' + event.data.ticket.barcode);
        //And finally print the label
        EventSquare.Label.print(label_path,{
            "NAME": event.data.ticket.firstname + " " + event.data.ticket.lastname,
            "COMPANY": "Dassault Engineering Team",
            "TABLE": "Table 42"
        },printer);
    }
});

gate.start();