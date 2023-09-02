const EventSquare = require('../gate.js');
let client;

EventSquare.Discover(2500,(gates) => {
    if(gates.length){
        client = new EventSquare.Client({
            name: 'EID READER DEMO',
            //device: 'boxoffice',
            device: 'eid_reader',
            host: gates[0].host,
            port: gates[0].port
        });

        //Simulate EID reads at interval
        setInterval(() => {
            console.log('Emitting eid_read event...');
            client.emit('eid_read',{
                firstname: 'John',
                lastname: 'Doe'
            });
        },2500);
    }
});

