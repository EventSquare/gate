const io = require('socket.io');
const Crypto = require("crypto");

class Socket {
    constructor(server,config,handleEventListener){
        
        this.socket = io(server);
        this.config = config;
        this.handleEventListener = handleEventListener;

        this.devices = [];

        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onHandShake = this.onHandShake.bind(this);
        this.onEvent = this.onEvent.bind(this);
        this.emit = this.emit.bind(this);

        //Listen for connection
        this.socket.on('connection', this.onConnect);
    }
    onConnect(socket){
        //Listen for disconnection
        socket.on('disconnect', () => this.onDisconnect(socket));
        socket.on('handshake', (payload) => this.onHandShake(socket,payload));
        socket.on('event', this.onEvent);
    }
    onHandShake(socket,payload){
        //Join channel of device name
        socket.join(payload.name);
        //Check if socket connection already in devices
        let exists = false;
        for(var i = 0; i < this.devices.length; i++){
            if(this.devices[i].socket_id == payload.socket_id){
                exists = true;
                break;
            }
        }
        //Add to devices if not
        if(!exists){
            this.devices.push({
                name: payload.name,
                device: payload.device,
                ip: payload.ip,
                socket_id: payload.socket_id
            });
            console.log(payload.name + ' is now connected. Total devices is now ' + this.devices.length);
        }
    }
    onDisconnect(socket){
        //Check if socket connection exists in devices
        for(var i = 0; i < this.devices.length; i++){
            if(this.devices[i].socket_id == socket.id){
                console.log(this.devices[i].name + ' is disconnected. Total devices is now ' + this.devices.length);
                this.devices.splice(i,1);
                break;
            }
        }
    }
    onEvent(payload,callback){
        try {
            var data = this.decrypt(payload);
            this.handleEventListener(data.event,data);
            if(typeof callback !== 'undefined'){
                callback();
            }
        } catch (err) {
            console.log("Error decrypting incoming event, please verify encryption key.");
            if(typeof callback !== 'undefined'){
                callback(err);
            }
        }
    }
    emit(targets,event){
        let hash = this.encrypt(event);
        for(var i = 0; i < targets.length; i++){
            this.socket.to(targets[i]).emit('event', hash);
        }
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
    stop(){
        this.socket.close();
    }
}

module.exports = Socket;