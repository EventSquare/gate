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
        //Listen for disconnection
        socket.on('disconnect', this.onDisconnect);
        socket.on('event', this.onEvent);
    }
    onDisconnect(socket){
        
    }
    onEvent(payload,callback){
        try {
            var data = this.decrypt(payload);
            this.handleEventListener(data.event,data);
            if(typeof callback !== 'undefined'){
                callback();
            }
        } catch (err) {
            console.log(err);
            if(typeof callback !== 'undefined'){
                callback(err);
            }
        }
    }
    decrypt(data){
        var key = Crypto.createDecipher('aes-128-cbc', this.config.encryption_key);
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