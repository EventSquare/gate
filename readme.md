# EventSquare Gate

Server and client for real-time communication at events between devices.

## Installation

```js
npm i eventsquare-gate
```

## Example server

```js
//Configuration

require('dotenv').config()
const path = require('path');
const EventSquare = require('eventsquare-gate');

const config = {
    api_endpoint: process.env.API_ENDPOINT,
    //scantoken: process.env.SCANTOKEN,
    name: process.env.DEVICE_NAME,
    port: process.env.PORT,
    bonjour: true,
    storage_path: path.join(__dirname + '/storage'),
    timezone: process.env.TIMEZONE,
    eventName: process.env.EVENT_NAME,
    eventDate: process.env.EVENT_DATE,
    eventLocation: process.env.EVENT_LOCATION,
    footerline: process.env.TICKET_FOOTER
};

//Start Gate Server
const gate = new EventSquare.Gate(config);

gate.start();

gate.on('print_order', (event, device) => {
    gate.socket.printer.printOrder(event, process.env.PRINTER_IP, 9100);
});

//Listen for incoming EID reads
gate.on('eid_read',event => {
    //event object contains source, event and data.
});

```

## Creating a client

### Node.js

Use the static discover() method to find running EventSquare gates on the network. The example connects with the first one found.

```js
const EventSquare = require('eventsquare-gate');

let client;

EventSquare.discover(2500,(gates) => {

	//Connect with first gate found with Bonjour
    client = new EventSquare.Client({
        name: 'EID1',
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