const tmp = require('tmp');
const fs  = require("fs");
const { exec } = require('child_process');
const path = require('path');
const DB = require('./db')
const accents = require('remove-accents');

tmp.setGracefulCleanup();

class LabelPrinter {
    constructor(config) {
        this.config = config;
        this.db = new DB(this.config.storage_path);
    }
    print(printer, label, data) {
        tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {

            if (err) throw err;

            //Load file
            let labelData = fs.readFileSync(label, 'utf8');

            //Process label data
            for (var property in data) {
                if (data.hasOwnProperty(property)) {
                    let value = data[property];
                    if(!data[property]) value = "";
                    labelData = labelData.replace("["+property+"]",value);
                }
            }
            //Save print data

            fs.appendFileSync(path, labelData);

            //Run print job
            exec('lpr -P ' + printer + ' -o raw ' + path, (err, stdout, stderr) => {
                if(stderr){                    
                    console.log("Print error:",stderr);
                    return;
                }
            });

          }.bind(this));
    }
    printLabel(printer,label,data) {
        let name = data.ticket.firstname + " " + data.ticket.lastname;
        let host = "";
        let table = "";

        if((!data.ticket.firstname || !data.ticket.lastname) && typeof data.order !== 'undefined' && data.order.firstname ){
            //Check if order available to get first and last name from order
            name = data.order.firstname + " " + data.order.lastname;
        }
        if(!name) return;

        //Check if order has company for host name
        if(typeof data.order !== 'undefined' && data.order.company){
            host = data.order.company;
        }

        this.db.open(db => {
            if(typeof data.ignoreBadges === 'undefined' && data.ticket.barcode){
                // Check if badge data available for this barcode, and overwrite host name
                let badge = db.objects('Badge').filtered("barcode = $0",data.ticket.barcode)[0];
                if(badge){
                    if(badge.host) host = badge.host;
                    if(badge.table) table = badge.table;
                }
            }
            if(typeof data.table !== 'undefined') table = data.table;

            this.print(printer,label,{
                "NAME": accents.remove(name),
                "HOST": accents.remove(host),
                "TABLE": accents.remove(table),
            });
        }, error => {
            console.log(error);
        });
    }
};

module.exports = LabelPrinter;