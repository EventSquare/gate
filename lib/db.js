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
        reserved: {type: 'bool', optional: true, default: false}
    }
};

const ScanSchema = {
    name: 'Scan',
    primaryKey: 'uuid',
    properties: {
        uuid: { type: 'string', indexed: true },
        id: { type: 'string', optional: true},
        scanned_at: {type: 'date', optional: false},
        ticket_id: {type: 'string', optional: false},
        type: {type: 'string', optional: false}
    }
};

const RealmConfig = {
    schema: [TypeSchema,ShowSchema,TicketSchema,ScanSchema,OrderSchema,PocketSchema,CustomerSchema],
    deleteRealmIfMigrationNeeded: true
};

const DB = {
    open(path,success,error){
        let config = Object.assign(RealmConfig, {
            path: path + '/db.realm'
        });
        Realm.open(config).then(realm => {
            success(realm);
        })
        .catch(info => {
            console.warn('Database error');
            error(info);
        });
    }
};

module.exports = DB;