const io = require('socket.io');
const Crypto = require("crypto");

class Socket {
    constructor(server,config,handleEventListener){
        this.socket = io(server);
        this.config = config;
        this.handleEventListener = handleEventListener;
        this.onEvent = this.onEvent.bind(this);

        this.socket.on('connection', function(socket){
            console.log('Client connected to ' + this.config.name);
            socket.on('event', this.onEvent);    
        }.bind(this));
    }
    onEvent(payload){
        try {
            var data = this.decrypt(payload);
            console.log(this.config.name + ' received ' + data.event + ' from ' + data.source);
            this.handleEventListener(data.event,data);
        } catch (ex) {
            console.log(ex);
            console.log('Error decrypting data.');
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