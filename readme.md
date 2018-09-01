# EventSquare Gate

Server and client for real-time communication at events between devices.

## Installation

```js
npm i eventsquare-gate
```

## Starting a server

```js
const EventSquare = require(eventsquare-gate');
const path = require('path');
const EventSquare = require('./gate.js');

//Configuration
const gate = new EventSquare.Gate({
    cypher_key: 'XXXXXX',
    name: 'Main Entrance Gate',
    port: 3000,
    scantoken: 'ABC12345',
    storage_path: path.join(__dirname + '/storage')
});

//Starting the gate
gate.start();

//Listen for incoming EID reads
gate.on('eid_read',event => {
    //event object contains sourc, event and data.
});

```

## Creating a client

### Node.js

Use the static discover() method to find running EventSquare gates on the network. The example connects with the first one found.

```js
const EventSquare = require(eventsquare-gate');

let client;

EventSquare.discover(2500,(gates) => {

	//Connect with first gate found with Bonjour
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
```