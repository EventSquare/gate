const DB = require('./db')
const axios = require('axios');
var qs = require('qs');
require('dotenv').config()
var ip = require('ip');
var macaddress = require('macaddress');
var moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');

class Sync {
    constructor(config){
        this.config = config;
        this.scantoken = process.env.SCANTOKEN;
        this.api_endpoint = process.env.API_ENDPOINT;
        this.device_name = process.env.DEVICE_NAME;
        this.timezone = process.env.TIMEZONE;
        this.macAddress = null;
        this.device_id = null;

        this.authInterval = null;
        this.syncInterval = null;
        this.authenticating = false;
        this.syncing = false;

        this.last_sync = "2017-01-01 00:00:00";

        //Get network information
        this.ip = ip.address();
        this.getMacAddress();
        //this.reset(); // Reset on boot

    }
    getMacAddress(){
        this.networkInterfaces = macaddress.networkInterfaces();
        let networkInterface = this.networkInterfaces[Object.keys(this.networkInterfaces)[0]];
        if(networkInterface && typeof networkInterface.mac !== 'undefined'){
            this.macAddress = networkInterface.mac
        }
    }    
    start(){
        if(!this.scantoken){
            console.log('Unable to start sync: missing SCANTOKEN in .env file');
            return;
        }
        if(!this.macAddress){
            console.log('Macaddress is not available.');
            return;
        }
        //Start Authentication + interval
        this.auth();
        this.authInterval = setInterval(function(){
            this.auth();
        }.bind(this),60000);

        //Start Sync Interval
        this.syncInterval = setInterval(function(){
            this.sync();
        }.bind(this),60000);

    }
    stop() {
        clearInterval(this.authInterval);
        clearInterval(this.syncInterval);
    }
    auth() {
        if(this.authenticating) return;
        this.authenticating = true;
        axios.request(this.api_endpoint + '/scan/auth', {
            method: 'GET',
            timeout: 30000,
            headers: {
                scantoken: this.scantoken,
                timezone: this.timezone
            },
            params: {
                device: {
                    device_identifier: this.macAddress,
                    name: this.device_name,
                    alias: this.device_name,
                    ip: this.ip,
                    timezone: this.timezone
                }
            },
            paramsSerializer: function(params) {
                return qs.stringify(params);
            }
        })
        .then(function (response) {
            this.authenticating = false;
            this.device_id = response.data.device.device_id;
            this.processTypes(response.data.scantoken.types);
            this.processShows(response.data.scantoken.shows);
        }.bind(this))
        .catch(function (error) {
            this.authenticating = false;
            console.log(error);
            console.log('Unable to authenticate.')
        }.bind(this));
    }
    sync() {
        if(this.syncing) return;
        this.syncing = true;

        console.log('Syncing started');

        //Get last UTC sync data       
        let last_sync = moment.utc(this.last_sync).tz(this.timezone).format("YYYY-MM-DD HH:mm:ss");

        axios.request(this.api_endpoint + '/scan/sync', {
            method: 'POST',
            timeout: 30000,
            headers: {
                scantoken: this.scantoken,
                timezone: this.timezone
            },
            params: {
                device_id: this.device_id,
                last_sync: last_sync
            },
            paramsSerializer: function(params) {
                return qs.stringify(params);
            }
        })
        .then(function (response) {
            this.last_sync = response.data.utc;
            if(response.data.tickets.length){
                this.processTickets(response.data.tickets);
                this.processOrders(response.data.orders);
                this.processPockets(response.data.pockets);
                this.processCustomers(response.data.customers);
            }
            this.syncing = false;
        }.bind(this))
        .catch(function (error) {
            this.syncing = false;
            console.log(error);
            console.log('Unable to sync.')
        }.bind(this));

    }
    processTypes(types) {
        DB.open(db => {
            db.write(() => {

                //Delete all types
                let allTypes = db.objects('Type');
                db.delete(allTypes);

                //Insert types
                for(var i=0;i<types.length;i++){
                    db.create('Type', {
                        id: types[i].id.toString(),
                        name: types[i].name,
                        branding_color: types[i].branding.color
                    },true);
                };
            })
        }, error => {
            console.warn(error);
        });
    }
    processShows(shows) {
        DB.open(db => {
            db.write(() => {
                //Delete all shows
                let allShows = db.objects('Show');
                db.delete(allShows);

                //Insert shows
                for(var i=0;i<shows.length;i++){
                    db.create('Show', {
                        id: shows[i].id.toString(),
                        name: shows[i].name,
                        date_start: shows[i].date.start ? new Date(shows[i].date.start.replace(/-/g,"/")) : null,
                        date_end: shows[i].date.end ? new Date(shows[i].date.end.replace(/-/g,"/")) : null,
                        date_doors: shows[i].date.doors ? new Date(shows[i].date.doors.replace(/-/g,"/")) : null
                    },true);
                };
            })
        }, error => {
            console.warn(error);
        });
    }
    processTickets(tickets) {

        console.log('Processing tickets');

        DB.open(db => {

            let scans = [];

            db.write(() => {
                //Sync tickets
                for(var i=0;i<tickets.length;i++){
                    db.create('Ticket', {
                        id: tickets[i].id.toString(),
                        barcode: tickets[i].barcode,
                        reference: tickets[i].reference,
                        firstname: tickets[i].firstname,
                        lastname: tickets[i].lastname,
                        attendees: tickets[i].attendees ? parseInt(tickets[i].attendees) : null,
                        price: tickets[i].price ? parseFloat(tickets[i].price) : null,
                        place: tickets[i].place ? JSON.stringify(tickets[i].place) : null,
                        type_id: tickets[i].relations.type,
                        show_id: tickets[i].relations.show,
                        pocket_id: tickets[i].relations.pocket
                    }, true);
                    if(tickets[i].scans.length){
                        for(var s=0;s<tickets[i].scans.length;s++){
                            scans.push({
                                ticket_id: tickets[i].id.toString(),
                                id: tickets[i].scans[s].id.toString(),
                                type: tickets[i].scans[s].type,
                                scanned_at: tickets[i].scans[s].scanned_at
                            });
                        }
                    }
                }
                console.log(tickets.length + ' tickets updated');
                //Insert scans
                for(var i=0;i<scans.length;i++){
                    db.create('Scan', {
                        uuid: uuidv4(),
                        id: scans[i].id.toString(),
                        scanned_at: new Date(scans[i].scanned_at.replace(/-/g,"/")),
                        ticket_id: scans[i].ticket_id.toString(),
                        type: scans[i].type,
                    });
                }
                console.log(scans.length + ' scans inserted');
            })
        }, error => {
            console.warn(error);
        });
    }
    processOrders(orders) {
        console.log('Processing orders');
        DB.open(db => {
            db.write(() => {
                for(var i=0;i<orders.length;i++){
                    db.create('Order', {
                        id: orders[i].id.toString(),
                        reference: orders[i].reference,
                        firstname: orders[i].firstname,
                        lastname: orders[i].lastname,
                        email: orders[i].email,
                        testmode: !!orders[i].testmode
                    }, true);
                }
            });
        }, error => {
            console.warn(error);
        });
        console.log(orders.length + ' orders updated');
    }
    processPockets(pockets) {
        console.log('Processing pockets');
        DB.open(db => {
            db.write(() => {
                for(var i=0;i<pockets.length;i++){
                    db.create('Pocket', {
                        id: pockets[i].id.toString(),
                        customer_id: pockets[i].relations.customer ? pockets[i].relations.customer.toString() : null,
                        order_id: pockets[i].relations.order ? pockets[i].relations.order.toString() : null
                    }, true);
                }
            });
        }, error => {
            console.warn(error);
        });
        console.log(pockets.length + ' pockets updated');
    }
    processCustomers(customers) {
        console.log('Processing customers');
        DB.open(db => {
            db.write(() => {
                for(var i=0;i<customers.length;i++){
                    if(customers[i]){
                        db.create('Customer', {
                            id: customers[i].id.toString(),
                            firstname: customers[i].firstname,
                            lastname: customers[i].lastname,
                            email: customers[i].email
                        }, true);
                    }
                }
            });
        }, error => {
            console.warn(error);
        });
        console.log(customers.length + ' customers updated');
    }
    
    reset() {
        this.last_sync = "2017-01-01 00:00:00";
        DB.open(db => {
            db.write(() => {
                let allTickets = db.objects('Ticket');
                db.delete(allTickets);
                let allScans= db.objects('Scan');
                db.delete(allScans);
            })
        }, error => {
            console.warn(error);
        });
    }
}

module.exports = Sync;