const io = require('socket.io-client');
const ip = require('ip');
const Utils = require('../lib/utils');

class Client {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            encryption_key: null,
            host: 'localhost',
            name: null,
            device: 'unknown',
            port: '3000'
        }
        //Update Configuration
        this.config = Object.assign(this.config, newConfig);
        //Validate Configuration
        this.validateConfigOrDie();
        //Initialize constants
        this.socket = null;
        this.connected = false;
        this.events = {};
        //Bind callbacks
        this.onConnect = this.onConnect.bind(this);
        this.onEvent = this.onEvent.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.handleEventListener = this.handleEventListener.bind(this);
        //Connect
        this.connect();
    }
    validateConfigOrDie(){
        let valid = true;
        if(!this.config.encryption_key){
            console.error("The config property 'encryption_key' is required when starting a Client.");
            valid = false;
        }
        if(!this.config.host){
            console.error("The config property 'host' is required when starting a Client.");
            valid = false;
        }
        if(!this.config.name){
            console.error("The config property 'name' is required when starting a Client.");
            valid = false;
        }
        if(!this.config.port){
            console.error("The config property 'port' is required when starting a Client.");
            valid = false;
        }
        if(!valid) process.exit(1);
    }
    connect(){
        this.socket = io("http://"+this.config.host+":"+this.config.port);
        this.socket.on('connect', this.onConnect);
        this.socket.on('event', this.onEvent);
        this.socket.on('disconnect', this.onDisconnect);
    }
    disconnect(){
        this.socket.disconnect();
    }
    on(event,callback){
        this.events[event] = callback;
    }
    emit(event,data,callback){

        if(!this.connected){
            console.log('No connection available when emitting');
            if(typeof callback !== 'undefined'){
                callback('no_connection');
            }
            return;
        }
        
        var hash = Utils.encrypt({
            name: this.config.name,
            event: event,
            data: data
        },this.config.encryption_key);

        let ackTimeout = null;

        this.socket.emit('event',hash,function(err){
            clearTimeout(ackTimeout);
            if(typeof callback !== 'undefined'){
                callback(err);
            }
            if(err){
                console.log('There was a problem emitting the ' + event);
            }
        }.bind(this));

        ackTimeout = setTimeout(function(){
            if(typeof callback !== 'undefined'){
                callback('emit_timeout');
            }
            console.log('There was a problem emitting the ' + event);
        }.bind(this),2500);
    }
    onConnect(socket){
        this.connected = true;
        this.handShake();
        console.log('Connected to gate');
        this.handleEventListener('connect');
    }
    onEvent(payload){
        try {
            var data = Utils.decrypt(payload,this.config.encryption_key);
            this.handleEventListener(data.event,data);
        } catch (err) {
            console.log("Error decrypting incoming event on client, please verify encryption key.");
        }
    }
    onDisconnect(socket){
        this.connected = false;
        console.log('Disconnected from gate');
        this.handleEventListener('disconnect');
    }
    handShake() {
        this.socket.emit('handshake',{
            name: this.config.name,
            device: this.config.device,
            ip: ip.address(),
            socket_id: this.socket.id
        });
    }
    handleEventListener(event,payload){
        if(typeof this.events[event] !== 'undefined'){
            this.events[event](payload);
        }
    }
}

module.exports = Client;

