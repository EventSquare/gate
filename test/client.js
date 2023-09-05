const EventSquare = require('../gate.js');
let client;

EventSquare.Discover(2500,(gates) => {
    if(gates.length){
        client = new EventSquare.Client({
            name: 'EID READER DEMO',
            device: 'eid_reader',
            host: gates[0].host,
            port: gates[0].port
        });

        //Simulate EID reads at interval
        setInterval(() => {
            console.log('Emitting eid_read event...');
            client.emit('eid_read',{
                zip: '1000',
                birthday: '12/06/1993',
                firstname: 'Jane',
                nationalnumber: '6409849840',
                address: 'Mainstreet 20',
                nationality: 'Belgian',
                birthplace: 'Antwerp',
                city: 'Brussels',
                sex: 'M',
                idcartnr: 'XXXX',
                chipnr: 'XXXXXX',
                lastname: 'Doe'
            });
        },2500);
    }
});

