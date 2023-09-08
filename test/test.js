require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: true,
    encryption_key: process.env.ENCRYPTION_KEY,
    name: process.env.DEVICE_NAME,
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE
});

gate.start();

//Listen for incoming EID reads from EID-1 and forward to BOXOFFICE-1
gate.on('eid_read', (data, device) => {
    console.log('eid_read received from ' + device.name);
    let boxName;
    switch (device.name) {
      case "EID-Reader-1":
        boxName = "BOX-1";
        break;
      case "EID-Reader-2":
        boxName = "BOX-2";
        break;
      case "EID-Reader-3":
        boxName = "BOX-3";
        break;
      case "EID-Reader-4":
        boxName = "BOX-4";
        break;
      default:
        break;
    }

    if(boxName){
        gate.forward([boxName], {
            event: 'eid_read',
            data
         });
    }
});

//Listen for incoming EID reads from EID-1 and forward to BOXOFFICE-1
gate.on('eid_read', (data, device) => {
    console.log('eid_read received from ' + device.name);
    let boxName;
    switch (device.name) {
      case "EID-Reader-5":
        boxName = "BOX-5";
        break;
      case "EID-Reader-6":
        boxName = "BOX-6";
        break;
      default:
        break;
    }

    if(boxName){
        gate.forward([boxName], {
            event: 'eid_read',
            data
         });
    }
});


// Printing
gate.on('print_order', (event, device) => {
    console.log("Printing order for " + device.name);
    let printer;

    switch (device.name) {
        case 'BOX-1':
        case 'BOX-2':
            printer = "192.168.1.80";
            break;
        case 'BOX-3':
        case 'BOX-4':
        default:
            printer = "192.168.1.81";
            break;
    }
    gate.socket.printer.printOrder(event, printer, 9100);
});

//Discover gates
EventSquare.Discover(2500, (gates) => {
    console.log(gates);
});


// //Start EID client 
// let client = new EventSquare.Client({
//     name: 'EID-XXX',
//     device: 'eid_reader',
//     encryption_key: process.env.ENCRYPTION_KEY,
//     host: 'http://localhost',
//     port: process.env.PORT
// });

// //Simulate order print after interval
// let doTestPrint = false


// //true;
// if (doTestPrint) {
//     setTimeout(() => {
//         console.log("Client Sending out print order ...-~>");
//         client.emit('print_order',
//             {
//                 "uuid": "9253b080-b148-11e8-9a43-47a139335f4e",
//                 "reference": "RLXL58920",
//                 "total_price": "87.00",
//                 "created_at": "2018-09-05 22:16:28",
//                 "payment_method": "payconiq",
//                 "tickets": [
//                     {
//                         "uuid": "8bd65000-b148-11e8-9a43-47a139335f4e",
//                         "price": 29,
//                         "vat": 21,
//                         "type": {
//                             "id": "758994840588",
//                             "name": "VIP"
//                         },
//                         "show": null,
//                         "data": {
//                             "birthday": "01/06/1984",
//                             "birthplace": "Bonheiden",
//                             "firstname": "Glenn",
//                             "lastname": "Engelen",
//                             "nationality": "Belg"
//                         }
//                     },
//                     {
//                         "uuid": "8bef5640-b148-11e8-9a43-47a139335f4e",
//                         "price": 29,
//                         "vat": 21,
//                         "type": {
//                             "id": "758994840588",
//                             "name": "Vrijdag"
//                         },
//                         "show": null,
//                         "data": {
//                             "birthday": "01/06/1984",
//                             "birthplace": "Bonheiden",
//                             "firstname": "Glenn",
//                             "lastname": "Engelen",
//                             "nationality": "Belg"
//                         }
//                     },
//                     {
//                         "uuid": "8c0416c0-b148-11e8-9a43-47a139335f4e",
//                         "price": 29,
//                         "vat": 21,
//                         "type": {
//                             "id": "758994840588",
//                             "name": "Saturday"
//                         },
//                         "show": null,
//                         "data": {
//                             "birthday": "01/06/1984",
//                             "birthplace": "Bonheiden",
//                             "firstname": "Glenn",
//                             "lastname": "Engelen",
//                             "nationality": "Belg"
//                         }
//                     }
//                 ]

//             });
//     }, 2500);
// }

