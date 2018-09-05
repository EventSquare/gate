require('dotenv').config()
const path = require('path');
const EventSquare = require('../gate.js');

//Start Gate Server
const gate = new EventSquare.Gate({
    api_endpoint: process.env.API_ENDPOINT,
    bonjour: true,
    encryption_key: 'XXXXXX',
    name: 'Gate van Willem',
    port: process.env.PORT,
    scantoken: process.env.SCANTOKEN,
    storage_path: path.join(__dirname + '/../storage'),
    timezone: process.env.TIMEZONE,
});

gate.start();

// let actions = [
//     {
//         type: 'eid_read',
//         sources: ['EID-1'],
//         targets: ['BOXOFFICE-1']
//     },
//     {
//         type: 'print_order',
//         sources: ['BOXOFFICE-1'],
//         targets: ['BOXOFFICE-1']
//     }
// ];

// let Ticket = {

// }

// let Order = {
//     uuid: '1ee66960-b0eb-11e8-a5f3-a17d5c8f9e16',
//     reference: 'ABC12345',
//     total_price: 25,
//     created_at: '2018-09-01 00:00:00',
//     payment_method: 'cash',
//     tickets: [
//         {  
//             uuid: "1ee66960-b0eb-11e8-a5f3-a17d5c8f9e16",
//             price: 29,
//             vat: 21,
//             id: "758994840588",
//             type: {
//                 id: "758994840588",
//                 name: "Regular"
//             },
//             product: null,
//             show: null,
//             place: null,
//             data: {
//                 firstname: "Glenn",
//                 lastname: "Engelen",
//                 birthday: "01/06/1984",
//                 birthplace: "Bonheiden",
//                 nationality: "Belg"
//             }
//          }
//     ]
// };

// let Ticket = {  
//     uuid: "1ee66960-b0eb-11e8-a5f3-a17d5c8f9e16",
//     price: 29,
//     vat: 21,
//     id: "758994840588",
//     show: null,
//     inquiries: {
//         firstname: "Glenn",
//         lastname: "Engelen",
//         birthday: "01/06/1984",
//         birthplace: "Bonheiden",
//         nationality: "Belg"
//  }



// //Listen for incoming EID reads
// gate.on('eid_read',event => {
//     //event object contains source, event and data.
//     console.log(event);
// });

// gate.on('handshake',event => {
//     //event object contains source, event and data.
//     console.log(event);
// });

// //Client sample code

// let client;

EventSquare.Client.discover(2500,(gates) => {

    //Connect to local gate, should connect to one of the gates returned obviously
    client = new EventSquare.Client({
        name: 'EID-1',
        device: 'eid_reader',
        encryption_key: 'XXXXXX',
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

});

// // setTimeout(function(){
// //     console.log('Stopping gate');
// //     gate.stop();
// // },30000)