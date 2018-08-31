const bonjour = require('bonjour')()

module.exports = {
    start(name,port) {
        bonjour.publish({
            name: name,
            type: 'EventSquare',
            port: port
        })
    },
    stop() {
        bonjour.unpublishAll();
    } 
}