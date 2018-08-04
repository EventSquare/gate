# EventSquare Gate

Server and client for real-time communication at events between devices.

## Installation

```js
npm i -s @eventsquare/gate
```

## Starting a server

```js
const EventSquareGate = require('@eventsquare/gate');

var Server = new Gate.Server({
    encryption_key: 'XXXXXX',
    port: 3000
});

Server.start();

```

## Creating a client

### Node.js

```js
const EventSquareGate = require('@eventsquare/gate');

var Client = new Gate.Client({
	name: 'Macebook Pro of Jane',
	encryption_key: 'XXXXXX'
});

Client.open('http://localhost:3000');

Client.on('connect',function(){
    console.log('Connected');
})

Client.on('disconnect',function(){
    console.log('Disconnected');
})
```

### Webpack or Browserify

```js
var EventSquareClient = require('@eventsquare/gate/lib/client')

var esq = new EventSquareClient({
    name: 'iPhone from Joe',
    encryption_key: 'XXXXXX'
}); 

esq.open('http://localhost:3000');

esq.on('connect',function(){
    console.log('Connected');
})

esq.on('disconnect',function(){
    console.log('Disconnected');
})
```










