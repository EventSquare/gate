const bonjour = require('bonjour')();
const log = require('../lib/logger');

let service;

module.exports = {
    start(name,port) {
        service = bonjour.publish({
            name: name,
            type: 'EventSquare',
            port: port
        })
        service.on('error',function(error){
            log.error(error);
        });
    },
    stop() {
        bonjour.unpublishAll();
    } 
}