const bonjour = require('bonjour')()

let service;

module.exports = {
    start(name,port) {
        service = bonjour.publish({
            name: name,
            type: 'EventSquare',
            port: port
        })
        service.on('error',function(error){
            console.log(error);
        });
    },
    stop() {
        bonjour.unpublishAll();
    } 
}