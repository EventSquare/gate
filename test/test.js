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
});

gate.start();

//Listen for incoming EID reads from EID-1 and forward to BOXOFFICE-1
gate.on('eid_read',(event) => {
    switch(event.name){
        case 'EID-XXX':
            gate.forward(['BOXOFFICE-1'],event);
            break;
        default:
            break;
    }
});

// Printing
gate.on('print_order',(event) => {
    console.log("INCOMING print order ! (",event,")");
    gate.printOrder(event.data);

});

//Discover gates
EventSquare.Client.discover(2500,(gates) => {
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
              }
            ]
          
    });
},2500);


