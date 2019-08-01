require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/../storage'),
    scantoken: process.env.SCANTOKEN
});

// let label_path = path.join(__dirname + '/labels/bafd.zpl');

gate.on('scan',function(event){
    
});

// gate.on('scan_ticket',function(event){
//     //Check if printing is enabled
//     let printer = "Zebra";
//     switch(event.name){
//         case "KIOSK-1":
//         case "KIOSK-2":
//             printer = "Zebra";
//             break;
//         case "KIOSK-3":
//         case "KIOSK-4":
//             printer = "Zebra";
//             break;
//     }
//     //Find table number by barcode
//     console.log(event.event + ' from ' + event.name + ' - ' + event.data.ticket.barcode);
//     //And finally print the label
//     EventSquare.Label.print(label_path,{
//         "NAME": event.data.ticket.firstname ? (event.data.ticket.firstname + " " + event.data.ticket.lastname) : '',
//         "COMPANY": "Dassault Engineering Team",
//         "TABLE": "Table 42"
//     },printer);
// });

gate.start();