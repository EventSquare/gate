const io = require('socket.io');
const Crypto = require("crypto");

class Socket {
    constructor(server,config){
        this.socket = io(server);
        this.config = config;
        this.onEvent = this.onEvent.bind(this);

        this.socket.on('connection', function(socket){
            socket.on('event', this.onEvent);    
        }.bind(this));
    }
    onEvent(payload){
        try {
            var data = this.decrypt(payload);
            console.log(this.config.name + ' received ' + data.event + ' from ' + data.source);
            //socket.broadcast.emit('scan_received',scan);
        } catch (ex) {
            console.log('Error decrypting data.');
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