const bonjour = require('bonjour')();

module.exports = function(timeout = 2000,callback){
    //Initialize Bonjour listener
    let gates = [];
    let browser = bonjour.find({
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