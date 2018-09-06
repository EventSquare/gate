const escpos = require('escpos');

class Printer {
    constructor(){
    }


    static print(ip,port,printdata){
        console.log("printing on ip",ip,"port",port,"printdata",printdata);

        const networkDevice = new escpos.Network(ip,port);
        const options = {};
        const printer = new escpos.Printer(networkDevice, options );
        

        printdata.tickets.push(undefined);

        const printJob = function(element){
            return new Promise((resolve) => {
                if(element){
                    console.log("Printing ",element.type.name,element.uuid);
                    printer.text("Type:"+element.type.name);
                    console.log("QR data = ",element.qrdata);
                    //printer.qrcode(element.qrdata,1,'L',3);
                    printer.model('qsprinter')
                           .qrimage(element.qrdata,{
                                ec_level: 'M',
                                type: 'png',
                                size: 5,
                                margin: 10
                           },function(err){
                               setTimeout(()=>{
                                   resolve();
                               },1);
                           }).then(()=>{

                                console.log("RESOLVED");
                               resolve();
                           });
                    /*
                    printer.qrimage(element.qrdata, function(err){
                        console.log("qr image done");
                        if(err)
                            console.log("FAILED:",err);
                        printer.feed(5)
                        resolve();
                    });
                    */
                }else{
                }
            });
        };
        
        const myPromise = function(element){
            if(element){
                printJob(element).then(() => {
                    console.log('printed: ' + element.type.name,element.uuid);
                });
            }else{
                return new Promise(resolve=>{resolve
                    setTimeout(()=>{
                        console.log("FINISHINresolve !");
                        printer.feed(5);
                        printer.cut();
                        printer.close();
                        resolve();
                    },1);
                })
            }
        }

        const sequencePromises = function(promise, element) {
            return new Promise((resolve) => {
              resolve(promise.then(_ => myPromise(element)));
            });
          } 

        networkDevice.open(function(){
            console.log("Printing ticket now...")
            printer
                .font('a')
                .align('ct')
                .style('bu')
                .size(1, 1)
                .text(printdata.eventName)
                .text(printdata.eventDate)
                .text("Created: "+printdata.created)
                .text("Payment: "+ printdata.payment);


            console.log("reduce...");
            (printdata.tickets).reduce(sequencePromises, Promise.resolve());
                        
          });
    }
};




module.exports = Printer;