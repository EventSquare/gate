const bonjour = require('bonjour')()
require('dotenv').config()

module.exports = {
    start(name,port) {
        bonjour.publish({ name: name, type: process.env.BONJOUR_SERVICE, port: port })
    },
    stop() {
        bonjour.unpublishAll();
    } 
}