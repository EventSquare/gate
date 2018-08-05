const child_process = require('child_process');

const express = require('express')
const path = require("path")
const DB = require('./db')
var moment = require('moment-timezone');

require('dotenv').config()

class Router {
    constructor(app,config,sync){
        
        this.app = app;
        this.config = config;
        this.sync = sync;
        this.counter = 0;
        this.stats = null;

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
                    console.log(error)
                }
            },function(error){
                console.log(error)
            });
        });   
        
        //Fetch count data
        this.app.get('/api/counts', function(req, res){
            
            DB.open(function(db){

                let total_in = db.objects('Count').filtered('type = "in" AND logged_at > $0 AND logged_at < $1',moment(this.stats_from).toDate(),moment(this.stats_to).toDate()).sum('count');
                let total_out = db.objects('Count').filtered('type = "out" AND logged_at > $0 AND logged_at < $1',moment(this.stats_from).toDate(),moment(this.stats_to).toDate()).sum('count');
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
            res.send(this.stats);
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
            
        }.bind(this));

        //Reset all tickets and scan information
        this.app.get('/api/reset', function(req, res){
            console.log('Resetting tickets, scans and last sync time');
            this.sync.reset();
            res.sendStatus(200);
        }.bind(this));

        //Start stats interval
        const child = child_process.fork('lib/stats.js');
        child.on('message', (stats) => {
            this.stats = stats;
        });

    }

}

module.exports = Router;