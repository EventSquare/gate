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
        
        //Static folders
        this.app.use('/dist', express.static(path.join(__dirname, '../dist')));

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
                let total_in = db.objects('Count').filtered('type = "in"').sum('count');
                let total_out = db.objects('Count').filtered('type = "out"').sum('count');
                let total_delta = total_in - total_out;
                res.send({
                    total_in: total_in,
                    total_out: total_out,
                    total_delta: total_delta
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

        //Fetch search
        this.app.get('/api/search', function(req, res){
            DB.open(function(db){
                let allOrders = db.objects('Order');
                let allCustomers = db.objects('Customer');
                let allTickets = db.objects('Ticket');

                //Filter orders
                let queryWords = req.query.query.split(" ");
                for(var i = 0; i < queryWords.length; i++){
                    allOrders = allOrders.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || reference CONTAINS[c] $0 || email CONTAINS[c] $0',queryWords[0])
                    allCustomers = allCustomers.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || email CONTAINS[c] $0',queryWords[0])
                    allTickets = allTickets.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || barcode CONTAINS[c] $0',queryWords[0])
                }
                //Response
                res.send({
                    query: req.query.query,
                    orders: allOrders.sorted('firstname'),
                    customers: allCustomers.sorted('firstname'),
                    tickets: allTickets.sorted('firstname')
                });
            }.bind(this),function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch order
        this.app.get('/api/orders/:id', function(req, res){
            DB.open(db => {
                let order = db.objectForPrimaryKey('Order', req.params.id);
                if(!order){
                    res.sendStatus(404);
                    return;
                }

                let pockets = [];
                pockets = db.objects('Pocket').filtered("order_id = '" + order.id + "'");

                res.send({
                    order: order,
                    pockets: pockets
                });
            }, error => {
                console.warn(error);
                res.send(500);
            });
            
        }.bind(this));

        //Fetch pocket
        this.app.get('/api/pockets/:id', function(req, res){
            DB.open(db => {
                let pocket = db.objectForPrimaryKey('Pocket', req.params.id);
                if(!pocket){
                    res.sendStatus(404);
                    return;
                }
                let customer = db.objectForPrimaryKey('Customer', pocket.customer_id);
                let allTickets = db.objects('Ticket').filtered("pocket_id = '" + pocket.id + "'");
                let tickets = [];

                //Parse tickets
                if(allTickets.length > 0){
                    for(var i = 0; i < allTickets.length; i++){
                        tickets.push({
                            id: allTickets[i].id,
                            barcode: allTickets[i].barcode,
                            firstname: allTickets[i].firstname,
                            lastname: allTickets[i].lastname,
                            place: allTickets[i].place ? JSON.parse(allTickets[i].place) : null,
                            price: allTickets[i].price,
                            attendees: allTickets[i].attendees,
                            type: db.objectForPrimaryKey('Type', allTickets[i].type_id),
                            show: db.objectForPrimaryKey('Show', allTickets[i].show_id)
                        });
                    }
                }

                res.send({
                    pocket: pocket,
                    customer: customer,
                    tickets: tickets
                });
            }, error => {
                console.warn(error);
                res.send(500);
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
                res.sendStatus(200);
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

        //React router
        this.app.get('*', function(req, res){
            res.sendFile(path.join(__dirname, '../webmin/app.html'));
        });


        //Start stats interval
        const child = child_process.fork('lib/stats.js');
        child.on('message', (stats) => {
            this.stats = stats;
        });

    }

}

module.exports = Router;