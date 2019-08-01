const io = require('socket.io');
const Utils = require('../lib/utils');
const DB = require('../lib/db')
const uuidv4 = require('uuid/v4');

class Socket {
    constructor(server,config,handleEventListener){
        
        this.socket = io(server);
        this.config = config;
        this.handleEventListener = handleEventListener;

        //Set database
        this.db = new DB(this.config.storage_path);

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
            log(payload.name + ' is now connected. Total devices is now ' + this.devices.length);
        }
    }
    onDisconnect(socket){
        //Check if socket connection exists in devices
        for(var i = 0; i < this.devices.length; i++){
            if(this.devices[i].socket_id == socket.id){
                log(this.devices[i].name + ' is disconnected. Total devices is now ' + (this.devices.length-1));
                this.devices.splice(i,1);
                break;
            }
        }
    }
    onEvent(payload,callback){
        try {
            var data = Utils.decrypt(payload,this.config.encryption_key);
            this.handleDefaultEvents(data.event,data);
            this.handleEventListener(data.event,data);
            if(typeof callback !== 'undefined'){
                callback();
            }
        } catch (err) {
            log("Error decrypting incoming event on server, please verify encryption key.");
            if(typeof callback !== 'undefined'){
                callback(err);
            }
        }
    }
    handleDefaultEvents(event,data){
        switch(event){
            case 'scan':
                // Clicker scan
                if(data.data.clicker_id){
                    this.db.open(db => {
                        //Check if user already exists
                        let clicker = db.objects('Clicker').filtered("id = $0",data.data.clicker_id)[0];
                        if(clicker){
                            let quantity = 1;
                            if(typeof data.data.quantity !== 'undefined') quantity = parseInt(data.data.quantity);
                            db.write(() => {
                            for(var i = 0; i < quantity; i++){
                                db.create('Scan', {
                                    uuid: uuidv4(),
                                    scanned_at: new Date(),
                                    type: data.data.type,
                                    clicker_id: clicker.id
                                });
                            }
                            });
                        }
                    }, error => {
                        console.log(error);
                        res.sendStatus(500);
                    });
                    return;
                }
                // Ticket scan
                break;
        }
    }
    emit(targets,event){
        let hash = Utils.encrypt(event,this.config.encryption_key);
        for(var i = 0; i < targets.length; i++){
            this.socket.to(targets[i]).emit('event', hash);
        }
    }
    stop(){
        this.socket.close();
    }
}
/** centralizes local output... */
log = function(...message){
    let timing = new Date().toLocaleString();
    console.log("["+timing+"]",...message);
}

module.exports = Socket;