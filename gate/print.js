const DB = require('../lib/db')
const escpos = require('escpos');

class Printer {
    constructor(config) {
        this.config = config;
        //Set database
        this.db = new DB(this.config.storage_path);
    }
    printTicket(ip,barcode) {

        this.db.open(db => {
            
            let ticket = db.objects('Ticket').filtered("barcode = $0",barcode)[0];
            
            if(!ticket){
                return;
            }

            let ticketData = {
                ticket: ticket,
                type: null,
                pocket: null,
                order: null,
                customer: null,
                status: 'already_scanned'
            }

            // Find type
            let type = db.objectForPrimaryKey('Type', ticket.type_id);
            if(type){
                ticketData.type = type;
            }

            // Find pocket
            let pocket = db.objectForPrimaryKey('Pocket', ticket.pocket_id);

            if(pocket){
                ticketData.pocket = pocket;

                if(pocket.customer_id){
                    let customer = db.objectForPrimaryKey('Customer', pocket.customer_id);
                    if(customer){
                        ticketData.customer = customer;
                    }
                }
                if(pocket.order_id){
                    let order = db.objectForPrimaryKey('Order', pocket.order_id);
                    if(order){
                        ticketData.order = order;
                    }
                }
            }

            //Print

            const device  = new escpos.Network(ip);
            const printer = new escpos.Printer(device);

            device.open(function(){

                if(ticketData.ticket.firstname){
                    printer.font('a').align('ct').style('B').size(2, 2);
                    printer.text(ticketData.ticket.firstname+" "+ticketData.ticket.lastname);
                    printer.feed(1);
                }
                if(ticketData.type){
                    printer.font('a').align('ct').style('B').size(1,2);
                    printer.text(ticketData.type.name);
                }
                
                printer.qrimage(ticketData.ticket.barcode, function(err){
                    this.feed(2);
                    this.font('a').align('ct').style('B').size(1,1);
                    this.text('*** Powered by EventSquare ***')
                    this.style('NORMAL')
                    this.text('Ticketing technology')
                    this.feed(3);
                    this.cut();
                    this.close();
                });
            });

        });
        //Get ticket
    }
    /** Print order on POS printer */
    printOrder(order, print_ip, print_port){
        try{
            let printData = {
                eventName: this.config.eventName,
                eventDate: this.config.eventDate,
                eventLocation: this.config.eventLocation,
                footerline: this.config.footerline,
                reference: order.reference,
                created: order.created_at,
                payment: order.payment_method,
                tickets: []
            };

            order.tickets.forEach(ticket => {

                let qrData = {
                    u: ticket.uuid,
                    t: ticket.type.id
                };

                // encrypted...
                // let encrypted_qr = Utils.encrypt(qrData,this.config.encryption_key);
                // base64 encoded

                let encrypted_qr = Buffer.from(JSON.stringify(qrData)).toString('base64');

                let ticketData = {
                    uuid: ticket.uuid,
                    data: Object.assign({},ticket.data),
                    type: Object.assign({},ticket.type),
                    qrdata: encrypted_qr
                }

                printData.tickets.push(ticketData);
            });
            
            // print on specific printer...
            Printer.print(print_ip, print_port, printData);
        } catch(err){
            console.log("Printing Error:")
            console.trace(err);
        }
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

        // concrete split of work to do...
        const sequencePromises = function (promise, element) {
            return new Promise((resolve) => {
                resolve(promise.then(_ => Printer.myPromise(printer,element)));
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

    static printQRCode(printer, element) {
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

    static printHeader(printer, element) {
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

    static printFooter(printer, element) {
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

    static endPrint(printer,element){
        return new Promise(resolve => {
            try{
                printer.feed(2);
                printer.cut();
                printer.close();
                
                console.log("Finished printing ("+printer.adapter.address+":"+printer.adapter.port+")!")
            }catch(Exception){
                console.trace("Exception while finish printing ("+printer.adapter.address+":"+printer.adapter.port+"): ",Exception);
            }
            resolve();
        });
    }


    static myPromise(printer,element) {
        if (element && printer) {
            switch (element.type) {
                case 'HEADER':
                    return Printer.printHeader(printer,element);
                case 'TICKET':
                    return Printer.printQRCode(printer,element.ticket);
                case 'FOOTER':
                    return Printer.printFooter(printer,element);
                case 'END':
                    return Printer.endPrint(printer,element);
            }
        } else {
            console.log("Warn: EUHHH... Empty element ????");
            return Promise.resolve();
        }
    }


};

module.exports = Printer;