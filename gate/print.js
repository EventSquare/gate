const escpos = require('escpos');

class Printer {
    constructor() {
    }

    static print(ip, port, printdata) {
        const networkDevice = new escpos.Network(ip, port);
        const options = {};
        const printer = new escpos.Printer(networkDevice, options);

        // define what has to be printed each iteration...
        const printContent = [];

        // header content
        printContent.push({
            type: 'HEADER',
            eventName: printdata.eventName,
            eventDate: printdata.eventDate,
            eventLocation: printdata.eventLocation
        });

        // ticket content
        printdata.tickets.forEach(element => {
            printContent.push({
                type: 'TICKET',
                ticket: Object.assign({}, element)
            });
        });

        // footer
        printContent.push({
            type: 'FOOTER',
            orderref: printdata.reference,
            subtext: printdata.footerline,
            payment: printdata.payment,
            created: printdata.created
        });

        // end of ticket
        printContent.push({
            type: 'END'
        });


        const printQRCode = function (element) {
            return new Promise((resolve) => {
                if (element) {
                    printer.align('ct')
                        .size(1, 1)
                        .style('N')
                        .println("__________________________________________")
                        .control('LF')
                        .align('lt')
                        .size(2, 2)
                        .font('B')
                        .style('B')
                        .text("  " + element.type.name)
                        .size(1, 1)
                        .style('N')
                        .control('LF')
                        .text("    Full Name: " + element.data.lastname + ", " + element.data.firstname)
                        .text("     Birthday: " + element.data.birthday + " - " + element.data.birthplace)
                        .text("  Nationality: " + element.data.nationality)
                        .control('LF')
                        .align('ct')

                    printer.qrimage(element.qrdata, {
                        ec_level: 'M',
                        type: 'png',
                        size: 5,
                        margin: 6
                    }, function (err) {
                        if (err)
                            console.log("Error QR print: ", err);
                    }).then(() => {
                        resolve();
                    });
                } else {
                    console.log("QR: Empty element...");
                    resolve();
                }
            });
        };

        const printHeader = function (element) {
            return new Promise(resolve => {
                printer.align('ct')
                    .size(2, 3)
                    .style('B')
                    .text(element.eventName);
                if(element.eventDate && element.eventDate.trim().length>0){
                    printer.size(1, 1)
                        .control('LF')
                        .size(1, 2)
                        .text(element.eventDate);
                }                    
                if(element.eventLocation && element.eventLocation.trim().length>0){
                    printer.style('N')
                        .size(1, 1)
                        .control('LF')
                        .size(1, 2)
                        .text(element.eventLocation);
                }
                printer.size(1, 1)
                       .control('LF');
                resolve();
            });
        };

        const printFooter = function (element) {
            return new Promise(resolve => {
                printer.align('ct')
                    .control('LF')
                    .control('LF')
                    .size(1, 1)
                    .println("__________________________________________")
                    .style('N')
                    .align('lt')
                    .text("    Order: " + element.orderref)
                    .text("    Payment: " + element.payment)
                    .text("    Issued: " + element.created)
                    .align('ct')
                    .control('LF')
                    .style("I")
                    .text(element.subtext)
                    .control('LF')
                    ;
                resolve();
            });
        };

        const endPrint = function(element){
            return new Promise(resolve => {
                try{
                    printer.feed(2);
                    printer.cut();
                    printer.close();
                    console.log("Finished printing ("+ip+":"+port+")!")
                }catch(Exception){
                    console.trace("Exception while finish printing ("+ip+":"+port+"): ",Exception);
                }
                resolve();
            });
        }


        const myPromise = function (element) {
            if (element) {
                switch (element.type) {
                    case 'HEADER':
                        return printHeader(element);
                    case 'TICKET':
                        return printQRCode(element.ticket);
                    case 'FOOTER':
                        return printFooter(element);
                    case 'END':
                        return endPrint(element);
                }
            } else {
                console.log("Warn: EUHHH... Empty element ????");
                return Promise.resolve();
            }
        }

        // concrete split of work to do...
        const sequencePromises = function (promise, element) {
            return new Promise((resolve) => {
                resolve(promise.then(_ => myPromise(element)));
            });
        }

        try{
            // DO THE PRINTING NOW...
            networkDevice.open(function (err) {
                console.log("Printing ticket now on '"+ip+":"+port+"'");
                // compress all input into print jobs
                printContent.reduce(sequencePromises, Promise.resolve());
            });
        }catch(Exception){
            console.trace("Failed to print : ",Exception);
        }

    }
};

module.exports = Printer;