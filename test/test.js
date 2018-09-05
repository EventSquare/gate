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
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE,
});

gate.start();

//Listen for incoming EID reads
gate.on('eid_read',event => {
    //event object contains source, event and data.
    console.log(event);
});

gate.on('handshake',event => {
    //event object contains source, event and data.
    console.log(event);
});

//Client sample code

// let client;

EventSquare.Client.discover(2500,(gates) => {

    //Connect to local gate, should connect to one of the gates returned obviously
    client = new EventSquare.Client({
        name: 'EID-1',
        device: 'eid_reader',
        cypher_key: 'XXXXXX',
        host: 'localhost',
        port: process.env.PORT
    });

    // //Simulate EID reads at interval
    setInterval(() => {
        client.emit('eid_read',{
            firstname: 'John',
            lastname: 'Doe'
        },function(err){
            //Callback function
            if(err){
                console.log('Play the error sound');
                return;
            }
        });
    },2500);

});

// setTimeout(function(){
//     console.log('Stopping gate');
//     gate.stop();
// },30000)