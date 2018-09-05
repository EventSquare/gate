const io = require('socket.io-client');
const Crypto = require("crypto");
const bonjour = require('bonjour');
const ip = require('ip');

class Client {
    constructor(newConfig){
        //Initialize Config
        this.config = {
            cypher_key: null,
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
        this.onDisconnect = this.onDisconnect.bind(this);
        this.handleEventListener = this.handleEventListener.bind(this);
        //Connect
        this.connect();
    }
    validateConfigOrDie(){
        let valid = true;
        if(!this.config.cypher_key){
            console.error("The config property 'cypher_key' is required when starting a Client.");
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
        
        var hash = this.encrypt({
            source: this.config.name,
            event: event,
            data: data
        });

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
    encrypt(data){
        var key = Crypto.createCipher('aes-128-cbc', this.config.cypher_key);
        var hash = key.update(JSON.stringify(data), 'utf8', 'hex')
        hash += key.final('hex');
        return hash;
    }
    onConnect(){
        this.connected = true;
        console.log(this.config.name + ' connected to gate');
        this.emit('handshake',{
            name: this.config.name,
            device: this.config.device,
            ip: ip.address(),
            socket_id: this.socket.id
        });
        this.handleEventListener('connect');
    }
    onDisconnect(){
        this.connected = false;
        console.log(this.config.name + ' disconnected from gate');
        this.handleEventListener('disconnect');
    }
    handleEventListener(event,payload){
        if(typeof this.events[event] !== 'undefined'){
            this.events[event](payload);
        }
    }
    static discover(timeout = 2000,callback){
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

