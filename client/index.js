const io = require('socket.io-client');
const bonjour = require('bonjour');
const ip = require('ip');

class Client {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            encryption_key: null,
            host: null,
            name: null,
            device: 'unknown',
            port: null
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
        if(!this.config.name){
            console.error("The config property 'name' is required when starting a Client.");
            valid = false;
        }
        if(!valid) process.exit(1);
    }
    connect(){
        this.socket = io();
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

        let ackTimeout = null;

        this.socket.emit('event',{
            event: event,
            data: data
        },function(err){
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
            this.handleEventListener(payload.event,payload.data);
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
    static discover(timeout = 2500,callback){
        //Initialize Bonjour listener
        let bonjourBrowser = bonjour();
        let gates = [];
        let browser = bonjourBrowser.find({
            type: 'EventSquare'
        },function(service){
            let gate = formatService(service);
            if(gate) gates.push(gate);
        });
        let time = setTimeout(function(){
            callback(gates);
            browser.stop();
        }.bind(this),timeout)
    }
}

function formatService(service){
    //Validate IPV4
    var ip = findIpv4(service.addresses);
    if(!ip) return;
    return {
        name: service.name,
        host: ip,
        port: service.port
    };
}

function findIpv4(addresses){
    let ip = null;
    for(var i = 0; i < addresses.length; i++){
        if(addresses[i].length <= 15){
            ip = addresses[i];
            break;
        }
    }
    return ip;
}


module.exports = Client;

