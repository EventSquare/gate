require('dotenv').config()

const EventSquare = require('./gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    name: 'Gate van Willem',
    cypher_key: 'XXXXXX',
    port: process.env.PORT
});

gate.start();
let client;

EventSquare.discover(2500,(gates) => {
    client = new EventSquare.Client({
        name: 'EID1',
        cypher_key: 'XXXXXX',
        host: gates[0].host,
        port: gates[0].port
    });
    //Fake read interval
    setInterval(function(){
        client.emit('eid_read',{
            firstname: 'John',
            lastname: 'Doe'
        });
    },1000);
});