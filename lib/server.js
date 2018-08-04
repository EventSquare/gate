const express = require('express');
const http = require('http');

const Router = require('./router');
const Socket = require('./socket');
const Bonjour = require('./bonjour');
const Sync = require('./sync');

class Server {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            name: 'EventSquare Gate',
            encryption_key: null,
            host: 'http://localhost',
            port: 3000,
            enableBonjour: true,
        }
        //Update Configuration
        this.config = { ...this.config, ...newConfig};
        //Initialize Server
        this.app = express();
        this.server = http.Server(this.app);
        //Initialize Socket
        this.socket = new Socket(this.server,this.config);
        //Initialize Sync
        this.sync = new Sync(this.config);
        //Initialize Webmin
        this.router = new Router(this.app,this.config,this.sync);
    }
    start(){
        //Start Server
        this.server.listen(this.config.port);
        //Start sync
        this.sync.start();
        //Start Bonjour
        if(this.config.enableBonjour) Bonjour.start(this.config.name,this.config.port);
    }
    stop(){
        //Stop Server
        this.socket.stop();
        //Stop Bonjour
        if(this.config.enableBonjour) Bonjour.stop();
    }
}

module.exports = Server;