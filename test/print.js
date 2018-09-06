const Printer = require("../gate/print");
const Utils = require("../lib/utils");

// key:
let key = "d4ce302a-5bc0-4414-a06f-8471e7a0d1ad";

let testorder = {
    "uuid": "9253b080-b148-11e8-9a43-47a139335f4e",
    "reference": "RLXL58920",
    "total_price": "87.00",
    "created_at": "2018-09-05 22:16:28",
    "payment_method": "payconiq",
    "tickets": [
        {
            "uuid": "8bd65000-b148-11e8-9a43-47a139335f4e",
            "price": 29,
            "vat": 21,
            "type": {
                "id": "758994840588",
                "name": "Vrijdag"
            },
            "show": null,
            "data": {
                "birthday": "01/06/1984",
                "birthplace": "Bonheiden",
                "firstname": "Glenn",
                "lastname": "Engelen",
                "nationality": "Belg"
            }
        },
        {
            "uuid": "8bef5640-b148-11e8-9a43-47a139335f4e",
            "price": 29,
            "vat": 21,
            "type": {
                "id": "758994840588",
                "name": "Vrijdag"
            },
            "show": null,
            "data": {
                "birthday": "01/06/1984",
                "birthplace": "Bonheiden",
                "firstname": "Glenn",
                "lastname": "Engelen",
                "nationality": "Belg"
            }
        },
        {
            "uuid": "8c0416c0-b148-11e8-9a43-47a139335f4e",
            "price": 29,
            "vat": 21,
            "type": {
                "id": "758994840588",
                "name": "Vrijdag"
            },
            "show": null,
            "data": {
                "birthday": "01/06/1984",
                "birthplace": "Bonheiden",
                "firstname": "Glenn",
                "lastname": "Engelen",
                "nationality": "Belg"
            }
        }
    ]
};


let doTest = function () {

    printOrder(testorder);

};




const printOrder = function (order) {
    
    try {
        let printData = {
            eventName: "Belgian Air Force Days",
            eventDate: "7-8-9 September 2018",
            footerline: 'Powered by EventSquare',
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

            //let encrypted_qr = Utils.encrypt(qrData, key);
            let encrypted_qr =Buffer.from(JSON.stringify(qrData)).toString('base64');

            let ticketData = {
                uuid: ticket.uuid,
                data: Object.assign({}, ticket.data),
                type: Object.assign({}, ticket.type),
                qrdata: encrypted_qr
            }

            printData.tickets.push(ticketData);

        });

        console.log("Printing...");
        // TODO REMOVE !!
        this.config = {
            printer : {
                ip: '192.168.1.87',
                port: 9100
            }
        }
        Printer.print(this.config.printer.ip, this.config.printer.port, printData);


    } catch (err) {
        console.trace(err);
    }

}


doTest();