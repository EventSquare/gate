const DB = require('./db')
require('dotenv').config()
var moment = require('moment-timezone');

const statsInterval = setInterval(function(){
    calculateStats();
},15000)

function calculateStats(){

    DB.open(function(db){

        let types = db.objects('Type');
        let stats = {
            types: [],
            total_scans: 0,
            total_tickets: 0,
            total_percentage: 0
        };

        let totalTickets = db.objects('Ticket')
        stats.total_tickets = totalTickets.length;

        console.time("dbsave");

        for(var i=0;i<types.length;i++){

            //Get tickets
            let allTickets = totalTickets.filtered('type_id = "' + types[i].id + '"');

            //Find scans
            let scans = 0;
            for(var t = 0; t < allTickets.length; t++){
                let ticketScans = db.objects('Scan').filtered('ticket_id = "' + allTickets[t].id + '" DISTINCT(ticket_id)');
                scans += ticketScans.length;
            }
            stats.types.push({
                id: types[i].id,
                name: types[i].name,
                tickets_total: allTickets.length,
                tickets_scanned: scans,
                tickets_percentage: Math.round(scans/(allTickets.length/100))
            })
        }

        for(var s = 0; s < stats.types.length; s++){
            stats.total_scans += stats.types[s].tickets_scanned;
        }

        stats.total_percentage = Math.round(stats.total_scans/(stats.total_tickets/100))

        console.timeEnd("dbsave");
        process.send(stats);

    }.bind(this),function(error){
        console.log(error);
    });
}