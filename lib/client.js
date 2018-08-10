const io = require('socket.io-client');
const Crypto = require("crypto");

class Client {
    constructor(newConfig){
        this.config = {
            name: 'CLIENT',
            encryption_key: null
        }
        this.host = 'http://localhost:3000';
        this.socket = null;
        this.connected = false;
        this.events = {};
        this.config = Object.assign(this.config, newConfig);
        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.handleEventListener = this.handleEventListener.bind(this);
    }
    open(host = this.config.host){
        this.socket = io(host);
        this.socket.on('connect', this.onConnect);
        this.socket.on('disconnect', this.onDisconnect);
    }
    on(event,callback){
        this.events[event] = callback;
    }
    emit(event,data){
        var hash = this.encrypt({
            source: this.config.name,
            event: event,
            data: data
        });
        this.socket.emit('event',hash);
    }
    encrypt(data){
        var key = Crypto.createCipher('aes-128-cbc', this.config.encryption_key);
        var hash = key.update(JSON.stringify(data), 'utf8', 'hex')
        hash += key.final('hex');
        return hash;
    }
    onConnect(){
        this.connected = true;
        this.handleEventListener('connect');
    }
    onDisconnect(){
        this.connected = false;
        this.handleEventListener('disconnect');
    }
    handleEventListener(event,payload){
        if(typeof this.events[event] !== 'undefined'){
            this.events[event]();
        }
    }
    connect(){
        
    }
}

module.exports = Client;

