const child_process = require('child_process');

const express = require('express')
const path = require("path")
const DB = require('./db')
var moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');

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

        //Fetch stats data
        this.app.get('/api/shows', function(req, res){
            DB.open(function(db){
                let allShows = db.objects('Show').sorted('date_start');
                res.send({
                    shows: allShows
                });
                return;
            }.bind(this),function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch show
        this.app.get('/api/shows/:id', function(req, res){
            DB.open(db => {
                let show = db.objectForPrimaryKey('Show', req.params.id);
                if(!show){
                    res.sendStatus(404);
                    return;
                }
                //Get all tickets from show
                let allTickets = db.objects('Ticket').filtered('show_id = $0',show.id);
                
                let scans = {};
                let types = [];

                if(allTickets.length){
                    //Count scans
                    for(var t = 0; t < allTickets.length; t++){
                        let ticketScans = db.objects('Scan').filtered('ticket_id = "' + allTickets[t].id + '" DISTINCT(ticket_id)');
                        //scans += ticketScans.length;

                        //Push type
                        if(!scans.hasOwnProperty(allTickets[t].type_id)){
                            scans[allTickets[t].type_id] = {
                                id: null,
                                name: null,
                                branding_color: null,
                                tickets: 0,
                                scans: 0,
                                percentage: 0
                            };
                        }
                        scans[allTickets[t].type_id].tickets += 1;
                        scans[allTickets[t].type_id].scans += ticketScans.length;
                    }
                }
                
                if(Object.keys(scans).length){
                    let allTypes = Object.keys(scans);
                    for(var t = 0; t < allTypes.length; t++){
                        //Find type
                        let type = db.objectForPrimaryKey('Type', allTypes[t]);
                        if(type){
                            scans[allTypes[t]].id = type.id;
                            scans[allTypes[t]].name = type.name;
                            scans[allTypes[t]].branding_color = type.branding_color;
                            scans[allTypes[t]].percentage = Math.round(scans[allTypes[t]].scans / (scans[allTypes[t]].tickets/100));
                            types.push(scans[allTypes[t]])
                        }
                    }
                }

                res.send({
                    show: show,
                    types: types
                });
            }, error => {
                console.warn(error);
                res.send(500);
            });
            
        }.bind(this));

        //Fetch search
        this.app.get('/api/search', function(req, res){
            DB.open(function(db){
                let allOrders = db.objects('Order');
                let allCustomers = db.objects('Customer');
                let allTickets = db.objects('Ticket');

                let queryWords = req.query.query.split(" ");

                //Remove exceptions
                let exceptions = ['van','de','den'];
                for(var i = 0; i < exceptions.length; i++){
                    let index = queryWords.indexOf(exceptions[i]);
                    if (index !== -1) {
                        queryWords.splice(index, 1);
                    }
                }

                //Filter orders
                
                for(var i = 0; i < queryWords.length; i++){
                    //allOrders = allOrders.filtered('((firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0) && (email == null || email == "")) || reference CONTAINS[c] $0',queryWords[0]);
                    allOrders = allOrders.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || email CONTAINS[c] $0 || reference CONTAINS[c] $0',queryWords[0]);
                    allCustomers = allCustomers.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || email CONTAINS[c] $0',queryWords[0]);
                    allTickets = allTickets.filtered('barcode CONTAINS[c] $0',queryWords[0]);
                }
                //Response
                res.send({
                    query: req.query.query,
                    orders: allOrders.sorted('firstname').slice(0,100),
                    customers: allCustomers.sorted('firstname').slice(0,100),
                    tickets: allTickets.sorted('barcode').slice(0,100)
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

        //Fetch customer
        this.app.get('/api/customers/:id', function(req, res){
            DB.open(db => {

                let customer = db.objectForPrimaryKey('Customer', req.params.id);
                if(!customer){
                    res.sendStatus(404);
                    return;
                }

                let pockets = [];
                pockets = db.objects('Pocket').filtered("customer_id = '" + customer.id + "'");

                res.send({
                    customer: customer,
                    pockets: pockets
                });
            }, error => {
                console.warn(error);
                res.send(500);
            });
            
        }.bind(this));

        //Scan ticket
        this.app.post('/api/tickets/:id/scan', function(req, res){
            DB.open(db => {
                db.write(() => {
                    db.create('Scan', {
                        uuid: uuidv4(),
                        scanned_at: moment().toDate(),
                        ticket_id: req.params.id,
                        type: 'IN', //needs option in scanner later
                    });
                });
                res.sendStatus(200);
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

                let customer = null;
                if(pocket.customer_id){
                    customer = db.objectForPrimaryKey('Customer', pocket.customer_id);
                }

                let allTickets = db.objects('Ticket').filtered("pocket_id = '" + pocket.id + "'");
                let tickets = [];

                //Parse tickets
                if(allTickets.length > 0){
                    for(var i = 0; i < allTickets.length; i++){
                        //Get scans
                        let allScans = db.objects('Scan').filtered("ticket_id = '" + allTickets[i].id + "'");
                        tickets.push({
                            id: allTickets[i].id,
                            barcode: allTickets[i].barcode,
                            firstname: allTickets[i].firstname,
                            lastname: allTickets[i].lastname,
                            place: allTickets[i].place ? JSON.parse(allTickets[i].place) : null,
                            price: allTickets[i].price,
                            attendees: allTickets[i].attendees,
                            type: db.objectForPrimaryKey('Type', allTickets[i].type_id),
                            show: db.objectForPrimaryKey('Show', allTickets[i].show_id),
                            scans: allScans.length
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

        const cleanExit = function() {
            console.log('clean exit');
            process.exit();
        }

        process.on('SIGINT', cleanExit); // catch ctrl-c
        process.on('SIGTERM', cleanExit);

    }

}

module.exports = Router;