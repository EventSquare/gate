const Crypto = require("crypto");

class Utils {

    static encrypt(data, encryption_key) {
        console.log("ENCRYPT: ",encryption_key);
        var key = Crypto.createCipher('aes-128-cbc', encryption_key);
        var hash = key.update(JSON.stringify(data), 'utf8', 'hex')
        hash += key.final('hex');
        return hash;
    }

    static decrypt(hash, encryption_key) {
        console.log("DECRYPT: ",encryption_key);
        var key = Crypto.createDecipher('aes-128-cbc', encryption_key);
        var data = key.update(hash, 'hex', 'utf8')
        data += key.final('utf8');
        data = JSON.parse(data);
        return data;
    }
}

module.exports = Utils;