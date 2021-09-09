var Realm = require('realm');

// Define your models and their properties
const OrderSchema = {
    name: 'Order',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        reference: {type: 'string', optional: false},
        firstname: {type: 'string', optional: true},
        lastname: {type: 'string', optional: true},
        email: {type: 'string', optional: true},
        company: {type: 'string', optional: true},
        invitation_reference: {type: 'string', optional: true},
        testmode: {type: 'bool', optional: false}
    }
};

const CustomerSchema = {
    name: 'Customer',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        firstname: {type: 'string', optional: false},
        lastname: {type: 'string', optional: false},
        email: {type: 'string', optional: false}
    }
};

const PocketSchema = {
    name: 'Pocket',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        customer_id: {type: 'string', optional: true},
        order_id: {type: 'string', optional: true}
    }
};

const TypeSchema = {
    name: 'Type',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        name: 'string',
        branding_color: {type: 'string', optional: true, default: '#53B1FF'}
    }
};

const ShowSchema = {
    name: 'Show',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        name: {type: 'string', optional: true},
        date_start: {type: 'date', optional: true},
        date_end: {type: 'date', optional: true},
        date_doors: {type: 'date', optional: true}
    }
};

const TicketSchema = {
    name: 'Ticket',
    primaryKey: 'ticket_id',
    properties: {
        ticket_id: { type: 'string', indexed: true},
        id: {type: 'string', indexed: true, optional: true },
        barcode: {type: 'string', indexed: true, optional: true},
        reference: {type: 'string', optional: true},
        firstname: {type: 'string', optional: true},
        lastname: {type: 'string', optional: true},
        attendees: {type: 'int', optional: true},
        price: {type: 'double', optional: true},
        place: {type: 'string', optional: true},
        type_id: {type: 'string', optional: false},
        show_id: {type: 'string', optional: true},
        pocket_id: {type: 'string', optional: true},
        reserved: {type: 'bool', optional: true, default: false},
        blocked_at: {type: 'date', optional: true},
    }
};

const ClickerSchema = {
    name: 'Clicker',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        name: {type: 'string', optional: false},
        code: {type: 'string', optional: false},
    }
};

const ScanSchema = {
    name: 'Scan',
    primaryKey: 'uuid',
    properties: {
        uuid: { type: 'string', indexed: true },
        id: { type: 'string', optional: true},
        scanned_at: {type: 'date', optional: false},
        clicker_id: {type: 'string', optional: true},
        type_id: {type: 'string', optional: true},
        ticket_id: {type: 'string', optional: true},
        type: {type: 'string', optional: false},
    }
};

const BadgeSchema = {
    name: 'Badge',
    primaryKey: 'badge_id',
    properties: {
        badge_id: { type: 'string', indexed: true},
        barcode: {type: 'string', optional: true},
        name: {type: 'string', optional: true},
        host: {type: 'string', optional: true},
        table: {type: 'string', optional: true},
        created_at: {type: 'date', optional: false},
    }
};

const SettingSchema = {
    name: 'Setting',
    primaryKey: 'parameter',
    properties: {
        parameter: { type: 'string', indexed: true },
        value: {type: 'string', optional: false},
    }
};

const UserSchema = {
    name: 'User',
    primaryKey: 'uuid',
    properties: {
        uuid: { type: 'string', indexed: true },
        username: {type: 'string', optional: false},
        badges: {type: 'bool', default: false},
        reports: {type: 'bool', default: true},
        settings: {type: 'bool', default: true},
        ticket_printer: {type: 'string', optional: true},
        badge_printer: {type: 'string', optional: true}
    }
};

const RealmConfig = {
    schema: [SettingSchema,TypeSchema,ShowSchema,TicketSchema,ScanSchema,BadgeSchema,OrderSchema,PocketSchema,CustomerSchema,UserSchema,ClickerSchema],
    deleteRealmIfMigrationNeeded: true
};

class DB {
    constructor(path){
        this.path = path;
    }
    open(success,error){
        let config = Object.assign(RealmConfig, {
            path: this.path + '/db.realm'
        });
        Realm.open(config).then(realm => {
            success(realm);
        })
        .catch(info => {
            console.warn('Database error');
            console.warn(info);
        });
    }
    getSetting(parameter,callback) {
        this.open(db => {
            let setting = db.objectForPrimaryKey('Setting', parameter);
            if(!setting){
                callback(false);
                return;
            }
            console.log("Loaded setting " + parameter + " with value: " + setting.value);
            callback(setting.value);
        }, error => {
            callback(false);
        });
    }
    setSetting(parameter,value) {
        this.open(db => {
            db.write(() => {
                db.create('Setting', {
                    parameter: parameter.toString(),
                    value: value.toString()
                },true);
            })
        }, error => {
            console.warn(error);
        });
    }
    initSetting(parameter,defaultValue) {
        this.getSetting(parameter,function(value){
            if(!value){
                console.log('Init setting ' + parameter + ' with value:' + defaultValue);
                this.setSetting(parameter,defaultValue);
            }
        }.bind(this))
    }

};



module.exports = DB;