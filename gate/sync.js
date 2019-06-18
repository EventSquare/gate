const axios = require('axios');
const qs = require('qs');
const ip = require('ip');
const macaddress = require('macaddress');
const moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');
const DB = require('../lib/db');

class Sync {
    constructor(config){
        this.config = config;

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
        if(!this.config.scantoken){
            console.warn('No scantoken provided, not starting sync service.')
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
        //Check macAddress
        if(!this.macAddress){
            console.warn('Macaddress is not available.');
        }
        this.authenticating = true;
        axios.request(this.config.api_endpoint + '/scan/auth', {
            method: 'GET',
            timeout: 30000,
            headers: {
                scantoken: this.config.scantoken,
                timezone: this.config.timezone
            },
            params: {
                device: {
                    alias: this.config.name,
                    device_identifier: this.macAddress,
                    ip: this.ip,
                    name: this.config.name,
                    timezone: this.config.timezone
                }
            },
            paramsSerializer: function(params) {
                return qs.stringify(params);
            }
        })
        .then(function (response) {
            this.authenticating = false;
            this.device_id = response.data.device.device_id;
            this.sync();
            this.processTypes(response.data.scantoken.types);
            this.processShows(response.data.scantoken.shows);
        }.bind(this))
        .catch(function (error) {
            this.authenticating = false;
            console.log('Unable to authenticate.')
        }.bind(this));
    }
    sync() {
        if(this.syncing) return;

        let newScans = [];
        let scans = [];

        DB.open(this.config.storage_path, db => {

            this.syncing = true;

            console.log('Syncing started')

            //Find new scans to sync
            newScans = db.objects('Scan').filtered('id == null AND scanned_at < $0',moment().toDate());
            if(newScans.length){
                for(var i=0;i<newScans.length;i++){
                    let ticket = db.objectForPrimaryKey('Ticket', newScans[i].ticket_id);
                    if(ticket && ticket.barcode){
                        scans.push({
                            barcode: ticket.barcode,
                            scanned_at: moment(newScans[i].scanned_at).format("YYYY-MM-DD HH:mm:ss"),
                            type: newScans[i].type
                        })
                    }
                }
            }

            console.log('Pushing ' + scans.length + ' scans');

            //Get last UTC sync data       
            let last_sync = moment.utc(this.last_sync).tz(this.config.timezone).format("YYYY-MM-DD HH:mm:ss");

            axios.request(this.config.api_endpoint + '/scan/sync', {
                method: 'POST',
                timeout: 60000,
                headers: {
                    scantoken: this.config.scantoken,
                    timezone: this.config.timezone
                },
                data: {
                    device_id: this.device_id,
                    scans: scans,
                    last_sync: last_sync
                },
                paramsSerializer: function(params) {
                    return qs.stringify(params);
                }
            })
            .then(function (response) {
                this.last_sync = response.data.utc;
                if(response.data.tickets.length){
                    console.log('Processing tickets')
                    this.processTickets(response.data.tickets);
                    console.log('Processing orders')
                    this.processOrders(response.data.orders);
                    console.log('Processing pockets')
                    this.processPockets(response.data.pockets);
                    console.log('Processing customers')
                    this.processCustomers(response.data.customers);
                    console.log('Syncing done!');
                }

                //Remove activity before last
                if(newScans.length){
                    db.write(() => {
                        db.delete(newScans);
                    });
                };

                this.syncing = false;

            }.bind(this))
            .catch(function (error) {
                this.syncing = false;
                console.log(error);
            }.bind(this));

        }, error => {
            console.warn(error);
        });

    }
    processTypes(types) {
        DB.open(this.config.storage_path, db => {
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
        DB.open(this.config.storage_path, db => {
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

        DB.open(this.config.storage_path, db => {

            let scans = [];

            db.write(() => {
                //Sync tickets
                for(var i=0;i<tickets.length;i++){
                    db.create('Ticket', {
                        ticket_id: tickets[i].ticket_id ? tickets[i].ticket_id : uuidv4(),
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
                        pocket_id: tickets[i].relations.pocket,
                        reserved: tickets[i].ticket_id ? false : true
                    }, true);
                    if(tickets[i].scans.length){
                        for(var s=0;s<tickets[i].scans.length;s++){
                            scans.push({
                                ticket_id: tickets[i].ticket_id,
                                id: tickets[i].scans[s].id.toString(),
                                type: tickets[i].scans[s].type,
                                scanned_at: tickets[i].scans[s].scanned_at
                            });
                        }
                    }
                }
                //Insert scans
                for(var i=0;i<scans.length;i++){
                    db.create('Scan', {
                        uuid: uuidv4(),
                        id: scans[i].id.toString(),
                        scanned_at: new Date(scans[i].scanned_at.replace(/-/g,"/")),
                        ticket_id: scans[i].ticket_id,
                        type: scans[i].type,
                    });
                }
            })
        }, error => {
            console.warn(error);
        });
    }
    processOrders(orders) {
        DB.open(this.config.storage_path, db => {
            db.write(() => {
                for(var i=0;i<orders.length;i++){
                    db.create('Order', {
                        id: orders[i].id.toString(),
                        reference: orders[i].reference,
                        firstname: orders[i].firstname,
                        lastname: orders[i].lastname,
                        company: orders[i].company ? orders[i].company.company : null,
                        invitation_reference: orders[i].invitation ? orders[i].invitation.reference : null,
                        email: orders[i].email,
                        testmode: !!orders[i].testmode
                    }, true);
                }
            });
        }, error => {
            console.warn(error);
        });
    }
    processPockets(pockets) {
        DB.open(this.config.storage_path, db => {
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
    }
    processCustomers(customers) {
        DB.open(this.config.storage_path, db => {
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
    }
    
    reset() {
        this.last_sync = "2017-01-01 00:00:00";
        DB.open(this.config.storage_path, db => {
            db.write(() => {
                let allOrders = db.objects('Order');
                db.delete(allOrders);
                let allCustomers = db.objects('Customer');
                db.delete(allCustomers);
                let allPockets = db.objects('Pocket');
                db.delete(allPockets);
                let allTypes = db.objects('Type');
                db.delete(allTypes);
                let allShows = db.objects('Show');
                db.delete(allShows);
                let allTickets = db.objects('Ticket');
                db.delete(allTickets);
                let allScans= db.objects('Scan');
                db.delete(allScans);
            })
            console.log('Reset all data');
        }, error => {
            console.warn(error);
        });
    }
}

module.exports = Sync;