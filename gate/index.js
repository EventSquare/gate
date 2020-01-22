const express = require('express');
const http = require('http');

const Bonjour = require('./bonjour');
const Router = require('./router');
const Socket = require('./socket');
const Sync = require('./sync');
const DB = require('../lib/db');

class Gate {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            api_endpoint: "https://api.eventsquare.io/1.0",
            bonjour: false,
            encryption_key: null,
            name: "EventSquare Gate",
            port: 3000,
            scantoken: null,
            storage_path: null,
            timezone: "Europe/Brussels",
            eventName: "The Amazing Event",
            eventDate: "The 4th of July",
            eventLocation: "Cloud 9",
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
        this.db.initSetting('event','The Greatest Event');
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
    handleEventListener(event,payload,device){
        //Catch other events and call listener(s)
        if(typeof this.events[event] !== 'undefined'){
            this.events[event](payload,device);
        }
    }
    stop(){
        //Stop Server
        this.socket.stop();
        //Stop Bonjour
        Bonjour.stop();
    }

}

module.exports = Gate;