const express = require('express')
const path = require("path")
const moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');
const fileUpload = require('express-fileupload');
const csv = require("csvtojson");

const DB = require('../lib/db')

class Router {
    constructor(app,config,sync){
        
        this.app = app;
        this.config = config;
        this.sync = sync;

        //Set database
        this.db = new DB(this.config.storage_path);
        
        //Static folders
        this.app.use('/dist', express.static(path.join(__dirname, '../dist')));
        this.app.use(express.json())
        this.app.use(fileUpload());

        //Fetch stats data
        this.app.get('/api/shows', function(req, res){
            this.db.open(db => {
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

        //Get scan reports
        this.app.get('/api/reports', function(req, res){
            
            const start = req.query.start;
            const end = req.query.end;

            //Get last UTC sync data       
            let startDate = moment.tz(start,this.config.timezone);
            let endDate = moment.tz(end,this.config.timezone);
            
            //Get scans
            this.db.open(db => {

                //Get all ticket types
                let allTypes = db.objects('Type').sorted('name');
                let types = [];

                for(let i = 0; i < allTypes.length; i++){
                    let allTickets = db.objects('Ticket').filtered('type_id = $0',allTypes[i].id);
                    let allScans = db.objects('Scan').filtered('type_id = $0 DISTINCT(uuid) AND scanned_at >= $1 AND scanned_at < $2',allTypes[i].id,startDate.toDate(),endDate.toDate());
                    types.push({
                        id: allTypes[i].id,
                        name: allTypes[i].name,
                        scans: allScans.length,
                        tickets: allTickets.length
                    });
                }

                //Get all clickers
                let allClickers = db.objects('Clicker').sorted('name');
                let clickers = [];

                for(let i = 0; i < allClickers.length; i++){
                    let scansIn = db.objects('Scan').filtered('clicker_id = $0 AND type = "IN" AND scanned_at >= $1 AND scanned_at < $2',allClickers[i].id,startDate.toDate(),endDate.toDate());
                    let scansOut = db.objects('Scan').filtered('clicker_id = $0 AND type = "OUT" AND scanned_at >= $1 AND scanned_at < $2',allClickers[i].id,startDate.toDate(),endDate.toDate());
                    clickers.push({
                        id: allClickers[i].id,
                        name: allClickers[i].name,
                        scans: {
                            in: scansIn.length,
                            out: scansOut.length
                        }
                    });
                }

                res.send({
                    types: types,
                    clickers: clickers
                });
                return;
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch badges
        this.app.get('/api/badges', function(req, res){
            this.db.open(db => {
                let allBadges = db.objects('Badge').filtered('barcode = $0',null).sorted('created_at',{ascending: true});
                res.send({
                    badges: allBadges
                });
                return;
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Import badges
        this.app.post('/api/badges/import', function(req, res){
            if(!req.files || req.files.length == 0 || typeof req.files['badges'] == 'undefined'){
                return res.status(400).send('No badge file was uploaded.');
            }
            let badgesFile = req.files.badges;

            csv({
                //headers: ["barcode","host"],
                delimiter: "auto"
            })
            .fromString(badgesFile.data.toString())
            .then((badges)=>{ 
                if(badges.length == 0){
                    return res.status(400).send('No badges imported.');
                }
                this.db.open(db => {
                    let created = 0;
                    let updated = 0;
                    for(let i = 0; i < badges.length; i++){
                        //Check if badge already exists
                        if(typeof badges[i].barcode == 'undefined' || typeof badges[0].host == 'undefined') break;
                        let badge = db.objects('Badge').filtered("barcode = $0",badges[i].barcode)[0];
                        
                        if(!badge){
                            created++;
                            db.write(() => {
                                db.create('Badge', {
                                    badge_id: uuidv4(),
                                    barcode: badges[i].barcode,
                                    host: badges[i].host,
                                    created_at: moment().toDate()
                                });
                            });
                        } else {
                            updated++;
                            db.write(() => {
                                badge.host = badges[i].host;
                            });
                        }
                    };
                    res.status(200).send({
                        created: created,
                        updated: updated
                    });
                }, error => {
                    return res.status(500).send(error);
                });
            })
            .catch(function (error) {
                return res.status(500).send(error);
            });

        }.bind(this));

        //Fetch scans
        this.app.get('/api/scans', function(req, res){
            this.db.open(db => {
                let allClicks = db.objects('Scan').sorted('scanned_at',{descending: true});
                res.send({
                    clicks: allClicks
                });
                return;
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Post badges
        this.app.post('/api/badges', function(req, res){
            this.db.open(db => {
                //Save scan
                db.write(() => {
                    db.create('Badge', {
                        badge_id: uuidv4(),
                        name: req.body.name,
                        host: req.body.host,
                        created_at: moment().toDate()
                    });
                });
                //Add scan
                res.sendStatus(200);
            }, error => {
                console.warn(error);
                res.send(500);
            });
        }.bind(this));

        //Login
        this.app.post('/api/login', function(req, res){
            this.db.open(db => {
                //Return user
                let user = db.objects('User').filtered("username = $0",req.body.username)[0];
                if(!user){
                    res.sendStatus(404);
                    return;
                }
                res.send({
                    user: user
                });
            }, error => {
                res.sendStatus(500);
            });
        }.bind(this));

        //Auth
        this.app.post('/api/auth', function(req, res){
            this.db.open(db => {
                //Return user
                let user = db.objects('User').filtered("uuid = $0",req.body.user_id)[0];
                if(!user){
                    res.sendStatus(404);
                    return;
                }
                res.send({
                    user: user
                });
            }, error => {
                res.sendStatus(500);
            });
        }.bind(this));

        //Update user
        this.app.post('/api/users/:id', function(req, res){
            this.db.open(db => {
                //Check if user exists
                let user = db.objects('User').filtered("uuid = $0",req.params.id)[0];
                if(!user){
                    res.status(404);
                    return;
                }
                db.write(() => {
                    if(req.body.username){
                        user.username = req.body.username;
                    }
                    if(typeof req.body.badges !== 'undefined'){
                        user.badges = req.body.badges
                    }
                    if(typeof req.body.reports !== 'undefined'){
                        user.reports = req.body.reports
                    }
                    if(typeof req.body.settings !== 'undefined'){
                        user.settings = req.body.settings
                    }
                    if(typeof req.body.ticket_printer !== 'undefined'){
                        if(req.body.ticket_printer){
                            user.ticket_printer = req.body.ticket_printer
                        } else {
                            user.ticket_printer = null
                        }
                    }
                    if(typeof req.body.badge_printer !== 'undefined'){
                        if(req.body.badge_printer){
                            user.badge_printer = req.body.badge_printer
                        } else {
                            user.badge_printer = null
                        }
                    }
                    res.send({
                        user: user
                    });
                });
            }, error => {
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Get users
        this.app.get('/api/users', function(req, res){
            this.db.open(db => {
                //Return user
                let users = db.objects('User');
                res.send({
                    users: Array.from(users)
                });
            }, error => {
                res.sendStatus(500);
            });
        }.bind(this));

        //Create a user
        this.app.post('/api/users', function(req, res){
            this.db.open(db => {
                //Check if user already exists
                let user = db.objects('User').filtered("username = $0",req.body.username)[0];
                if(user){
                    res.status(403).send('user_exists');
                    return;
                }
                const user_id = uuidv4();
                db.write(() => {
                    let user = db.create('User', {
                        uuid: user_id,
                        username: req.body.username
                    });
                    res.send({
                        user: user
                    });
                });
            }, error => {
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Get clickers
        this.app.get('/api/clickers', function(req, res){
            this.db.open(db => {
                //Return user
                let clickers = db.objects('Clicker');
                res.send({
                    clickers: Array.from(clickers)
                });
            }, error => {
                res.sendStatus(500);
            });
        }.bind(this));

        //Create a clicker
        this.app.post('/api/clickers', function(req, res){
            this.db.open(db => {
                //Check if user already exists
                let clicker = db.objects('Clicker').filtered("id = $0",req.body.id)[0];
                if(clicker){
                    res.status(403).send('clicker_exists');
                    return;
                }
                db.write(() => {
                    let clicker = db.create('Clicker', {
                        id: req.body.id,
                        name: req.body.name,
                        code: req.body.code
                    });
                    res.send({
                        clicker: clicker
                    });
                });
            }, error => {
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));
        

        //Fetch show
        this.app.get('/api/shows/:id', function(req, res){
            this.db.open(db => {
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
                res.sendStatus(500);
            });
            
        }.bind(this));

        //Fetch search
        this.app.get('/api/search', function(req, res){
            this.db.open(db => {
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
                    allOrders = allOrders.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || email CONTAINS[c] $0 || company CONTAINS[c] $0 || reference CONTAINS[c] $0 || invitation_reference CONTAINS[c] $0',queryWords[0]);
                    allCustomers = allCustomers.filtered('firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0 || email CONTAINS[c] $0',queryWords[0]);
                    allTickets = allTickets.filtered('barcode CONTAINS[c] $0 || firstname CONTAINS[c] $0 || lastname CONTAINS[c] $0',queryWords[0]);
                }
                //Process tickets
                var processedTickets = [];
                for(var i = 0; i < allTickets.length; i++){
                    var ticket = {
                        id: allTickets[i].id,
                        barcode: allTickets[i].barcode,
                        firstname: allTickets[i].firstname,
                        lastname: allTickets[i].lastname,
                        type: null,
                        order_id: null
                    }
                    let type = db.objectForPrimaryKey('Type', allTickets[i].type_id);
                    if(type){
                        ticket.type = type.name
                    }
                    if(allTickets[i].pocket_id){
                        let pocket = db.objectForPrimaryKey('Pocket', allTickets[i].pocket_id);
                        if(pocket){
                            let order = db.objectForPrimaryKey('Order', pocket.order_id);
                            if(order){
                                ticket.order_id = order.id; 
                            }
                        }
                    }
                    processedTickets.push(ticket);
                }
                //Response
                res.send({
                    query: req.query.query,
                    orders: allOrders.sorted('firstname').slice(0,100),
                    customers: allCustomers.sorted('firstname').slice(0,100),
                    tickets: processedTickets.slice(0,100)
                });
            },function(error){
                console.log(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch order
        this.app.get('/api/orders/:id', function(req, res){
            this.db.open(db => {
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
            this.db.open(db => {

                let customer = db.objectForPrimaryKey('Customer', req.params.id);
                if(!customer){
                    res.sendStatus(404);
                    return;
                }

                let pockets = [];
                pockets = db.objects('Pocket').filtered("customer_id = '" + customer.id + "'");

                res.send({
                    customer: customer,
                    pockets: Array.from(pockets)
                });
            }, error => {
                console.warn(error);
                res.sendStatus(500);
            });
            
        }.bind(this));

        //Scan ticket
        this.app.post('/api/tickets/:barcode/scan', function(req, res){
            let barcode = req.params.barcode;
            this.db.open(db => {
                let ticket = db.objects('Ticket').filtered("barcode = $0",barcode)[0];
                
                if(!ticket){
                    res.sendStatus(404);
                    return;
                }

                let ticketData = {
                    ticket: ticket,
                    type: null,
                    scans: [],
                    pocket: null,
                    order: null,
                    customer: null,
                    status: 'already_scanned'
                }

                // Find type
                let type = db.objectForPrimaryKey('Type', ticket.type_id);
                if(type){
                    ticketData.type = type;
                }

                //Find scans
                let scans = db.objects('Scan').filtered('ticket_id = "' + ticket.ticket_id + '"');

                if(scans.length > 0){
                    ticketData.scans = Array.from(scans);
                }

                // Find pocket
                if(ticket.pocket_id){
                    let pocket = db.objectForPrimaryKey('Pocket', ticket.pocket_id);
                    if(pocket){
                        ticketData.pocket = pocket;

                        if(pocket.customer_id){
                            let customer = db.objectForPrimaryKey('Customer', pocket.customer_id);
                            if(customer){
                                ticketData.customer = customer;
                            }
                        }
                        if(pocket.order_id){
                            let order = db.objectForPrimaryKey('Order', pocket.order_id);
                            if(order){
                                ticketData.order = order;
                            }
                        }
                    }
                }

                //Scan and update status
                if(scans.length == 0){
                    ticketData.status = "allowed";
                    //Save scan
                    db.write(() => {
                        db.create('Scan', {
                            uuid: uuidv4(),
                            scanned_at: moment().toDate(),
                            ticket_id: ticket.ticket_id,
                            type: 'IN',
                            type_id: ticket.type_id
                        });
                    });
                }
                res.send(ticketData);

                
            }, error => {
                console.warn(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //Fetch pocket
        this.app.get('/api/pockets/:id', function(req, res){
            this.db.open(db => {
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
                            scans: Array.from(allScans)
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
                res.sendStatus(500);
            });
            
        }.bind(this));

        //Reset all tickets and scan information
        this.app.get('/api/reset', function(req, res){
            //console.log('Resetting tickets, scans and last sync time');
            this.sync.reset();
            res.sendStatus(200);
        }.bind(this));

        //Update system setting
        this.app.post('/api/settings', function(req, res){
            this.db.open(db => {
                //Check if setting exists
                let setting = db.objects('Setting').filtered('parameter == $0',req.body.parameter);
                if(!setting.length){
                    res.sendStatus(404);
                    return;
                }
                console.log('Updating setting with name ' + req.body.parameter+': ' + req.body.value);
                db.write(() => {
                    db.create('Setting', {
                        parameter: req.body.parameter,
                        value: req.body.value
                    },true);
                });
                res.sendStatus(200);
            }, error => {
                console.warn(error);
                res.sendStatus(500);
            });
        }.bind(this));

        //React router
        this.app.get('*', function(req, res){
            res.sendFile(path.join(__dirname, '../webmin/app.html'));
        });

    }

}

module.exports = Router;