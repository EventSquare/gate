const io = require('socket.io-client');
const Crypto = require("crypto");

class Client {
    constructor(newConfig){
        //Config validation
        if(typeof newConfig.name == 'undefined' || typeof newConfig.cypher_key == 'undefined'){
            console.log('Please check name and cypher_key.');
            return;
        }
        //Initialize Config
        this.config = {
            name: null,
            cypher_key: null,
            host: null,
            port: null
        }
        //Update Configuration
        this.config = Object.assign(this.config, newConfig);
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
    connect(){
        this.socket = io("http://"+this.config.host+":"+this.config.port);
        this.socket.on('connect', this.onConnect);
        this.socket.on('disconnect', this.onDisconnect);
    }
    on(event,callback){
        this.events[event] = callback;
    }
    emit(event,data){
        if(!this.connected) {
            return;
        }
        var hash = this.encrypt({
            source: this.config.name,
            event: event,
            data: data
        });
        this.socket.emit('event',hash);
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
        this.handleEventListener('connect');
    }
    onDisconnect(){
        console.log('disconnected');
        this.connected = false;
        console.log(this.name + ' disconnected from gate');
    }
    handleEventListener(event,payload){
        if(typeof this.events[event] !== 'undefined'){
            this.events[event](payload);
        }
    }
}

module.exports = Client;

