const express = require('express')
const path = require("path")
const DB = require('./db')
require('dotenv').config()

class Router {
    constructor(app,config,sync){
        
        this.app = app;
        this.config = config;
        this.sync = sync;
        this.counter = 0;

        this.stats_from = new Date(process.env.STATS_FROM);
        this.stats_to = new Date(process.env.STATS_TO);
        
        //Static folders
        this.app.use('/dist', express.static(path.join(__dirname, '../dist')));

        //Home
        this.app.get('/', function(req, res){
            res.sendFile(path.join(__dirname, '../webmin/app.html'));
        });

        //Log Counts
        this.app.get('/count/:type', function(req, res){
            DB.open(function(db){
                try {
                    db.write(() => {
                        db.create('Count', {
                            device:  req.query.cid,
                            type: req.params.type,
                            count: parseInt(req.query.count),
                            logged_at: new Date()
                        });
                    });
                    console.log('Received ' + req.query.count + ' ' + req.params.type + ' from ' + req.query.cid);
                    res.sendStatus(200);
                } catch (e) {
                    res.send(500);
                }
            },function(error){
                console.log(error)
                res.send(500);
            });
        });   
        
        //Fetch count data
        this.app.get('/api/counts', function(req, res){
            
            DB.open(function(db){

                let total_in = db.objects('Count').filtered('type = "in"').sum('count');
                let total_out = db.objects('Count').filtered('type = "out"').sum('count');
                let total_delta = total_in - total_out;

                res.send({
                    total_in: total_in,
                    total_out: total_out,
                    total_delta: total_delta,
                    stats_from: this.stats_from,
                    stats_to: this.stats_to
                });
            }.bind(this),function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch stats data
        this.app.get('/api/stats', function(req, res){
            
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
                res.send(stats);

            }.bind(this),function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Reset all tickets and scan information
        this.app.get('/api/resetcounts', function(req, res){
            console.log('Resetting counters');
            DB.open(db => {
                db.write(() => {
                    let allCounts = db.objects('Count');
                    db.delete(allCounts);
                })
            }, error => {
                console.warn(error);
            });
            res.sendStatus(200);
        }.bind(this));

        //Reset all tickets and scan information
        this.app.get('/api/reset', function(req, res){
            console.log('Resetting tickets, scans and last sync time');
            this.sync.reset();
            res.sendStatus(200);
        }.bind(this));

    }
}

module.exports = Router;