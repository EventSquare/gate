const io = require('socket.io');
const DB = require('../lib/db');
const LabelPrinter = require('../lib/labelprinter');
const uuidv4 = require('uuid/v4');
const Printer = require('./print');
const moment = require('moment-timezone');

class Socket {
    constructor(server,config,handleEventListener){
        
        this.socket = io(server,{
            allowEIO3: true // Allow connection from socket.io v2 / v3
        });
        this.config = config;
        this.handleEventListener = handleEventListener;

        //Set database
        this.db = new DB(this.config.storage_path);
        //Set printer
        this.printer = new Printer(this.config);

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
        socket.on('event', (payload,callback) => this.onEvent(socket,payload,callback));
    }
    onHandShake(socket,payload){
        //Join channel of device name
        socket.join(payload.name);
        //Check if socket connection already in devices
        let device = this.getDeviceBySocketId(payload.socket_id);
        //Add to devices if not
        if(!device){
            this.devices.push({
                name: payload.name,
                device: payload.device,
                ip: payload.ip,
                socket_id: payload.socket_id
            });
            log(payload.name + ' is now connected. Total devices is now ' + this.devices.length);
        }
    }
    getDeviceBySocketId(socket_id){
        for(var i = 0; i < this.devices.length; i++){
            if(this.devices[i].socket_id == socket_id){
                return this.devices[i];
            }
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
    onEvent(socket,payload,callback){
        //Check if device exists
        let device = this.getDeviceBySocketId(socket.id);
        if(device){
            try {
                this.handleDefaultEvents(payload.event,payload.data,device);
                this.handleEventListener(payload.event,payload.data,device);
                if(typeof callback !== 'undefined') callback();
            } catch (err) {
                console.log(err);
                log("Error decrypting incoming event on server, please verify encryption key.");
                if(typeof callback !== 'undefined') callback(err);
            }
        } else {
            log("Unkown device is emitting:" + payload);
        }
    }
    handleDefaultEvents(event,payload,device){
        switch(event){
            case 'scan':
                // Ticket scan
                if(payload.status !== "blocked") {
                    this.printBadge(device,payload);
                }
                break;
            case 'print_badge':
                // Print badge
                this.printBadge(device,payload);
                break;
            case 'print_ticket':
                // Print ticket
                this.db.open(db => {
                    let user = db.objects('User').filtered("username = $0",device.name)[0];
                    if(user && user.ticket_printer){
                        this.printer.printTicket(user.ticket_printer,payload.barcode);
                    }
                }, error => {
                    console.log(error);
                });
                break;
        }
    }
    printBadge(device,payload) {
        //Check if badge needs to be printed on scan
        this.db.open(db => {
            let user = db.objects('User').filtered("username = $0",device.name)[0];
            if(user && user.badge_printer){
                const labelprinter = new LabelPrinter(this.config);
                const label = this.config.storage_path + '/badge.zpl';
                labelprinter.printLabel(user.badge_printer,label,payload);
            }
        }, error => {
            console.log(error);
        });
    }
    emit(targets,payload){
        for(var i = 0; i < targets.length; i++){
            this.socket.to(targets[i]).emit('event', {
                event: payload.event,
                data: payload.data
            });
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