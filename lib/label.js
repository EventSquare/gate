var tmp = require('tmp');
var fs  = require("fs");
const { exec } = require('child_process');

tmp.setGracefulCleanup();

class Label {
    constructor() {

    }
    static print(label, data, printer) {

        tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
            if (err) throw err;

            //Load file
            let labelData = fs.readFileSync(label, 'utf8');

            //Process data
            for (var property in data) {
                if (data.hasOwnProperty(property)) {
                    labelData = labelData.replace("["+property+"]",data[property]);
                }
            }

            //Save print data
            fs.appendFileSync(path, labelData);

            //Run print job
            exec('lpr -P ' + printer + ' -o raw ' + path, (err, stdout, stderr) => {
                if(stderr){
                    console.log(stderr);
                    return;
                }
            });
            
            //cleanupCallback();
          });
    }
};

module.exports = Label;