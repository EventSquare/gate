require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: true,
    encryption_key: process.env.ENCRYPTION_KEY,
    name: 'Main Gate',
    port: process.env.PORT,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE,
});

gate.start();

//Listen for incoming EID reads from EID-1 and forward to BOXOFFICE-1
gate.on('eid_read',(event) => {
    switch(event.name){
        case 'EID-1':
            gate.forward(['BOXOFFICE-1'],event);
            break;
        default:
            break;
    }
});

//Discover gates
EventSquare.Client.discover(2500,(gates) => {
    //console.log(gates);
});

//Start EID client 
let client = new EventSquare.Client({
    name: 'EID-1',
    device: 'eid_reader',
    encryption_key: process.env.ENCRYPTION_KEY,
    host: 'localhost',
    port: process.env.PORT
});

//Simulate EID reads at interval
setInterval(() => {
    client.emit('eid_read',{
        firstname: 'John',
        lastname: 'Doe'
    });
},2500);

//Start Box Office client
client2 = new EventSquare.Client({
    name: 'BOXOFFICE-1',
    device: 'box_office',
    encryption_key: process.env.ENCRYPTION_KEY,
    host: 'localhost',
    port: process.env.PORT
});

//Wait for incoming EID reads
client2.on('eid_read',event => {
    console.log(event);
})

