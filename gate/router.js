const express = require('express')
const path = require("path")
const moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');

const DB = require('../lib/db')

class Router {
    constructor(app,config,sync){
        
        this.app = app;
        this.config = config;
        this.sync = sync;
        
        //Static folders
        this.app.use('/dist', express.static(path.join(__dirname, '../dist')));
        this.app.use(express.json())

        //Body parser
        
        //Log Counts
        this.app.get('/count/:type', function(req, res){
            DB.open(this.config.storage_path, db => {
                try {
                    db.write(() => {
                        db.create('Count', {
                            device:  req.query.cid,
                            type: req.params.type,
                            count: parseInt(req.query.count),
                            logged_at: new Date()
                        });
                    });
                    //console.log('Received ' + req.query.count + ' ' + req.params.type + ' from ' + req.query.cid);
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
            DB.open(this.config.storage_path, db => {
                let total_in = db.objects('Count').filtered('type = "in"').sum('count');
                let total_out = db.objects('Count').filtered('type = "out"').sum('count');
                let total_delta = total_in - total_out;
                res.send({
                    total_in: total_in,
                    total_out: total_out,
                    total_delta: total_delta
                });
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch stats data
        this.app.get('/api/shows', function(req, res){
            DB.open(this.config.storage_path, db => {
                let allShows = db.objects('Show').sorted('date_start');
                res.send({
                    shows: allShows
                });
                return;
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch show
        this.app.get('/api/shows/:id', function(req, res){
            DB.open(this.config.storage_path, db => {
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
            DB.open(this.config.storage_path, db => {
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
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch order
        this.app.get('/api/orders/:id', function(req, res){
            DB.open(this.config.storage_path, db => {
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
            DB.open(this.config.storage_path, db => {

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
        this.app.post('/api/tickets/:barcode/scan', function(req, res){
            let barcode = req.params.barcode;
            DB.open(this.config.storage_path, db => {
                let ticket = db.objects('Ticket').filtered("barcode = $0",barcode)[0];
                if(!ticket){
                    res.sendStatus(404);
                    return;
                }
                //Fetch ticket information
                let ticketData = {
                    status: 'allowed',
                    ticket: ticket,
                    type: null,
                    show: null,
                    pocket: null,
                    order: null,
                    customer: null,
                    scans: []
                }
                //Find Type
                if(ticket.type_id){
                    let type = db.objectForPrimaryKey('Type', ticket.type_id);
                    if(type) ticketData.type = type;
                }
                //Find Show
                if(ticket.show_id){
                    let show = db.objectForPrimaryKey('Show', ticket.show_id);
                    if(show) ticketData.show = show;
                }
                //Find Pocket
                if(ticket.pocket_id){
                    let pocket = db.objectForPrimaryKey('Pocket', ticket.pocket_id);
                    if(pocket) ticketData.pocket = pocket;
                }
                //Find customer
                if(ticketData.pocket && ticketData.pocket.customer_id){
                    let customer = db.objectForPrimaryKey('Customer', ticketData.pocket.customer_id);
                    if(customer) ticketData.customer = customer;
                }
                //Find order
                if(ticketData.pocket && ticketData.pocket.order_id){
                    let order = db.objectForPrimaryKey('Order', ticketData.pocket.order_id);
                    if(order) ticketData.order = order;
                }
                //Find scans
                let scans = db.objects('Scan').filtered('ticket_id = "' + ticketData.ticket.ticket_id + '"');
                if(scans.length) ticketData.scans = scans;

                //Check if already scanned
                if(ticketData.scans.length > 0){
                    ticketData.status = 'already_scanned';
                } else {
                    //Save scan
                    db.write(() => {
                        db.create('Scan', {
                            uuid: uuidv4(),
                            scanned_at: moment().toDate(),
                            ticket_id: ticketData.ticket.ticket_id,
                            type: 'IN'
                        });
                    });
                }
                //Add scan
                res.send(ticketData);
            }, error => {
                console.warn(error);
                res.send(500);
            });
        }.bind(this));

        //Fetch pocket
        this.app.get('/api/pockets/:id', function(req, res){
            DB.open(this.config.storage_path, db => {
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
                        let allScans = db.objects('Scan').filtered("ticket_id = '" + allTickets[i].ticket_id + "'");
                        tickets.push({
                            id: allTickets[i].id,
                            barcode: allTickets[i].barcode,
                            firstname: allTickets[i].firstname,
                            lastname: allTickets[i].lastname,
                            place: allTickets[i].place ? JSON.parse(allTickets[i].place) : null,
                            price: allTickets[i].price,
                            attendees: allTickets[i].attendees,
                            type: allTickets[i].type_id ? db.objectForPrimaryKey('Type', allTickets[i].type_id) : null,
                            show: allTickets[i].show_id ? db.objectForPrimaryKey('Show', allTickets[i].show_id) : null,
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
        this.app.get('/api/reset', function(req, res){
            //console.log('Resetting tickets, scans and last sync time');
            this.sync.reset();
            res.sendStatus(200);
        }.bind(this));

        //React router
        this.app.get('*', function(req, res){
            res.sendFile(path.join(__dirname, '../webmin/app.html'));
        });

    }

}

module.exports = Router;