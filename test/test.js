require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: true,
    cypher_key: 'XXXXXX',
    name: 'Gate van Willem',
    port: process.env.PORT,
    scantoken: process.env.SCANTOKEN,
    storage_path: path.join(__dirname + '/storage'),
    timezone: process.env.TIMEZONE,
});

gate.start();

//Listen for incoming EID reads
gate.on('eid_read',event => {
    //event object contains sourc, event and data.
});

//Client sample code

let client;

EventSquare.discover(2500,(gates) => {
    client = new EventSquare.Client({
        name: 'EID1',
        cypher_key: 'XXXXXX',
        host: gates[0].host,
        port: gates[0].port
    });
    //Simulate EID reads at interval
    setInterval(() => {
        client.emit('eid_read',{
            firstname: 'John',
            lastname: 'Doe'
        });
    },2500);
});