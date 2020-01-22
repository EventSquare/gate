const EventSquare = require('../gate.js');
let theClient = null;

EventSquare.Discover(2500,(gates) => {
    if(gates.length){
        theClient = new EventSquare.Client({
            name: 'BOXOFFICE WILLEM',
            device: 'boxoffice',
            host: gates[0].host,
            port: gates[0].port
        });
    }
});

