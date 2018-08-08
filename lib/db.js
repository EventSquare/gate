var Realm = require('realm');

// Define your models and their properties
const CountSchema = {
    name: 'Count',
    properties: {
        device:  {type: 'string'}, 
        type: {type: 'string', default: "in"},
        count: {type: 'int', default: 0},
        logged_at: {type: 'date'}
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
    primaryKey: 'id',
    properties: {
        id: { type: 'string', indexed: true },
        barcode: {type: 'string', optional: false},
        reference: {type: 'string', optional: true},
        firstname: {type: 'string', optional: true},
        lastname: {type: 'string', optional: true},
        attendees: {type: 'int', optional: true},
        price: {type: 'double', optional: true},
        place: {type: 'string', optional: true},
        type_id: {type: 'string', optional: false},
        show_id: {type: 'string', optional: true},
        pocket_id: {type: 'string', optional: true}
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
    schema: [CountSchema,TypeSchema,ShowSchema,TicketSchema,ScanSchema],
    path: './storage/database.realm',
    deleteRealmIfMigrationNeeded: true //Remove for production!
};

const DB = {
    open(success,error){
        Realm.open(RealmConfig).then(realm => {
            success(realm);
        })
        .catch(info => {
            console.warn('Database error');
            error(info);
        });
    }
};

module.exports = DB;