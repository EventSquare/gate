const io = require('socket.io');
const Crypto = require("crypto");

class Socket {
    constructor(server,config,handleEventListener){
        this.socket = io(server);
        this.config = config;
        this.handleEventListener = handleEventListener;

        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onEvent = this.onEvent.bind(this);

        //Listen for connection
        this.socket.on('connection', this.onConnect);
    }
    onConnect(socket){
        console.log('Client connected to ' + this.config.name);
        //Listen for disconnection
        socket.on('disconnect', this.onDisconnect);
        socket.on('event', this.onEvent);    
    }
    onDisconnect(socket){
        console.log('Client disconnected from ' + this.config.name);
    }
    onEvent(payload,callback){
        try {
            var data = this.decrypt(payload);
            console.log(this.config.name + ' received ' + data.event + ' from ' + data.source);
            this.handleEventListener(data.event,data);
            callback();
        } catch (err) {
            console.log(err);
            callback(err);
            console.log('Error processing event');
        }
    }
    decrypt(data){
        var key = Crypto.createDecipher('aes-128-cbc', this.config.cypher_key);
        var data = key.update(data, 'hex', 'utf8')
        data += key.final('utf8');
        data = JSON.parse(data);
        return data;
    }
    stop(){
        this.socket.close();
    }
}

module.exports = Socket;