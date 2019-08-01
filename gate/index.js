const express = require('express');
const http = require('http');

const Bonjour = require('./bonjour');
const Router = require('./router');
const Socket = require('./socket');
const Sync = require('./sync');
const Utils = require('../lib/utils');
const Printer = require('./print');
const DB = require('../lib/db');

class Gate {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            api_endpoint: "https://api.eventsquare.io/1.0",
            bonjour: true,
            encryption_key: null,
            name: "EventSquare Gate",
            port: 3000,
            scantoken: null,
            storage_path: null,
            timezone: "Europe/Brussels",
            eventName: "The Amazing Event",
            eventDate: "a/nice/day",
            eventLocation: "Heaven Cloud 5",
            footerline: 'Powered by EventSquare',
        }
        //Clear events
        this.events = {};
        //Update Configuration
        this.config = Object.assign(this.config, newConfig);
        //Set database
        this.db = new DB(this.config.storage_path);
        //Validate Configuration
        this.validateConfigOrDie();
        //Bind callbacks
        this.handleEventListener = this.handleEventListener.bind(this);
        //Initialize Server & Express
        this.app = express();
        this.server = http.Server(this.app);
        //Initialize Socket
        this.socket = new Socket(this.server,this.config,this.handleEventListener);
        //Initialize Sync
        this.sync = new Sync(this.config);
        //Initialize Webmin
        this.router = new Router(this.app,this.config,this.sync);
    }
    validateConfigOrDie(){
        let valid = true;
        if(!this.config.storage_path){
            console.error("The config property 'storage_path' is required when starting a Gate.");
            valid = false;
        }
        //Default settings
        this.db.initSetting('name','EventSquare Gate');
        this.db.initSetting('sync',false);
        this.db.initSetting('last_sync',"2017-01-01 00:00:00");
    
        if(!valid) process.exit(1);
    }
    start(){
        //Start Server
        this.server.listen(this.config.port);
        //Start sync
        this.sync.start();
        //Start Bonjour
        if(this.config.bonjour) Bonjour.start(this.config.name,this.config.port);
    }
    on(event,callback){
        this.events[event] = callback;
    }
    forward(targets,event){
        if(!targets || targets.constructor !== Array){
            console.log('Targets arguments is not an Array');
            return;
        }
        if(!event){
            console.log('No event specified in emit');
            return;
        }
        //Find socket ids
        if(targets.length){
            this.socket.emit(targets,event);
        }
    }
    handleEventListener(event,payload){
        //Catch other events and call listener(s)
        if(typeof this.events[event] !== 'undefined'){
            this.events[event](payload);
        }
    }
    stop(){
        //Stop Server
        this.socket.stop();
        //Stop Bonjour
        Bonjour.stop();
    }

    /** Print order on POS printer */
    printOrder(order, print_ip, print_port){
        try{
            let printData = {
                eventName: this.config.eventName,
                eventDate: this.config.eventDate,
                eventLocation: this.config.eventLocation,
                footerline: this.config.footerline,
                reference: order.reference,
                created: order.created_at,
                payment: order.payment_method,
                tickets: []
            };

            order.tickets.forEach(ticket => {
                let qrData = {
                    u: ticket.uuid,
                    t: ticket.type.id
                };

                // encrypted...
                // let encrypted_qr = Utils.encrypt(qrData,this.config.encryption_key);
                // base64 encoded
                let encrypted_qr = Buffer.from(JSON.stringify(qrData)).toString('base64');

                let ticketData = {
                    uuid: ticket.uuid,
                    data: Object.assign({},ticket.data),
                    type: Object.assign({},ticket.type),
                    qrdata: encrypted_qr
                }

                printData.tickets.push(ticketData);
            });
            
            // print on specific printer...
            Printer.print(print_ip, print_port, printData);
        } catch(err){
            console.log("Printing Error:")
            console.trace(err);
        }
    }

}

module.exports = Gate;