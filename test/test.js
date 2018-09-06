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
    timezone: process.env.TIMEZONE,
    // specific
    eventName: "Belgian Air Force Days",
    eventLocation: "Air Base Kleine-Brogel",
    eventDate: "7-8-9 September 2018",
    footerline: '~~ Powered by EventSquare ~~',
});

gate.start();

//Listen for incoming EID reads from EID-1 and forward to BOXOFFICE-1
gate.on('eid_read', (event) => {
    console.log("GOT EID !!", event.data);
    switch (event.name) {
        case 'EID-Reader-1':
        case 'EID-Reader-2':
        case 'EID-Reader-3':
        case 'EID-Reader-4':
        case 'EID-Reader-5':
        case 'EID-XXX':
            //gate.forward(['BOXOFFICE-1'], event);
            console.log("Forwarding...");
            gate.forward(['Kassa-1'], event);
            break;
        default:
            break;
    }
});

// Printing
gate.on('print_order', (event) => {
    console.log("Printing order for ", event.name, " - order data ", event.data);
    // TODO REPLACE
    printer = {
        ip: '127.0.0.1',
        port: 9100
    };

    switch (event.name) {
        case 'Kassa-1':
            printer.ip = '192.168.1.87';
            break;
        case 'BOXOFFICE-1':
            break;
        case 'BOXOFFICE-2':
            break;
        case 'BOXOFFICE-3':
            break;
        case 'BOXOFFICE-4':
            break;
        default:
            // TODO...
            
            break;
    }
    gate.printOrder(event.data, printer.ip, printer.port);
});

//Discover gates
EventSquare.Client.discover(2500, (gates) => {
    //console.log(gates);
});

//Start EID client 
let client = new EventSquare.Client({
    name: 'EID-XXX',
    device: 'eid_reader',
    encryption_key: process.env.ENCRYPTION_KEY,
    host: 'localhost',
    port: process.env.PORT
});

//Simulate order print after interval
let doTestPrint=false;//true;
if (doTestPrint) {
    setTimeout(() => {
        console.log("Client Sending out print order ...-~>");
        client.emit('print_order',
            {
                "uuid": "9253b080-b148-11e8-9a43-47a139335f4e",
                "reference": "RLXL58920",
                "total_price": "87.00",
                "created_at": "2018-09-05 22:16:28",
                "payment_method": "payconiq",
                "tickets": [
                    {
                        "uuid": "8bd65000-b148-11e8-9a43-47a139335f4e",
                        "price": 29,
                        "vat": 21,
                        "type": {
                            "id": "758994840588",
                            "name": "VIP"
                        },
                        "show": null,
                        "data": {
                            "birthday": "01/06/1984",
                            "birthplace": "Bonheiden",
                            "firstname": "Glenn",
                            "lastname": "Engelen",
                            "nationality": "Belg"
                        }
                    },
                    {
                        "uuid": "8bef5640-b148-11e8-9a43-47a139335f4e",
                        "price": 29,
                        "vat": 21,
                        "type": {
                            "id": "758994840588",
                            "name": "Vrijdag"
                        },
                        "show": null,
                        "data": {
                            "birthday": "01/06/1984",
                            "birthplace": "Bonheiden",
                            "firstname": "Glenn",
                            "lastname": "Engelen",
                            "nationality": "Belg"
                        }
                    },
                    {
                        "uuid": "8c0416c0-b148-11e8-9a43-47a139335f4e",
                        "price": 29,
                        "vat": 21,
                        "type": {
                            "id": "758994840588",
                            "name": "Saturday"
                        },
                        "show": null,
                        "data": {
                            "birthday": "01/06/1984",
                            "birthplace": "Bonheiden",
                            "firstname": "Glenn",
                            "lastname": "Engelen",
                            "nationality": "Belg"
                        }
                    }
                ]

            });
    }, 2500);
}