const Label = require('../gate/label.js');
const path = require('path');

let label_path = path.join(__dirname + '/labels/bafd.zpl');

Label.print(label_path,{
    "NAME": "Willem Staels",
    "COMPANY": "Dassault Engineering Team",
    "TABLE": "Table 42"
},'Zebra');