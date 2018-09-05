const io = require('socket.io-client');
const Crypto = require("crypto");
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
        
        var hash = this.encrypt({
            name: this.config.name,
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
        var key = Crypto.createCipher('aes-128-cbc', this.config.encryption_key);
        var hash = key.update(JSON.stringify(data), 'utf8', 'hex')
        hash += key.final('hex');
        return hash;
    }
    decrypt(data){
        var key = Crypto.createDecipher('aes-128-cbc', this.config.encryption_key);
        var data = key.update(data, 'hex', 'utf8')
        data += key.final('utf8');
        data = JSON.parse(data);
        return data;
    }
    onConnect(socket){
        this.connected = true;
        this.handShake();
        //socket.join(this.config.name);
        console.log('Connected to gate');
        this.handleEventListener('connect');
    }
    onEvent(payload){
        try {
            var data = this.decrypt(payload);
            this.handleEventListener(data.event,data);
        } catch (err) {
            console.log("Error decrypting incoming event, please verify encryption key.");
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

