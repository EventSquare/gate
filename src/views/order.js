import React from "react";
const axios = require('axios');
const Badge = require('../components/badge')
var moment = require('moment-timezone');

class Order extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            order: null,
            pockets: [],
            pocketData: [],
            badge: false,
            name: "",
            company: "",
        }
        this.openBadge = this.openBadge.bind(this);
        this.closeBadge = this.closeBadge.bind(this);
        this.printTicket = this.printTicket.bind(this);
    };
    componentDidMount() {
        this.loadOrder();
    }
    loadOrder(){
        axios.get('/api/orders/' + this.props.match.params.id)
        .then(function (response) {
            // handle success
            this.setState({
                order: response.data.order,
                pockets: Object.values(response.data.pockets),
                pocketData: []
            },function(){
                if(this.state.pockets.length){
                    this.fetchPockets();
                }
            })
        }.bind(this))
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
    }
    fetchPockets(){
        if(!this.state.pockets.length) return;
        this.setState({
            pocketData: []
        });
        for(var i = 0; i < this.state.pockets.length; i++){
            this.fetchPocket(this.state.pockets[i].id);
        }
    }
    fetchPocket(pocket_id){
        axios.get('/api/pockets/' + pocket_id)
        .then(function (response) {
            // handle success
            var pocketData = this.state.pocketData.slice(0);
            pocketData.push(response.data);
            this.setState({
                pocketData: pocketData
            })
        }.bind(this))
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
    }
    openBadge(ticket){ 
        var company = null;
        if(this.state.order.invitation_reference) company = this.state.order.invitation_reference;
        if(this.state.order.company) company = this.state.order.company;
        this.setState({
            badge: true,
            name: ticket.firstname.trim() + " " + ticket.lastname.trim(),
            company: company
        });
    }
    closeBadge(){ 
        this.setState({badge: false});
    }
    onChange(name,value){
        this.setState({
            [name]: value
        });
    }
    renderOrder(){
        if(!this.state.order) return;
        return (
            <div className="container">
                <div className="row">
                    <div className="col mb-3">
                        <h1>Bestelling #{ this.state.order.reference }</h1>
                        <hr/>
                    </div>
                </div>
                <div className="row">
                    <div className="col col-md-4">
                        { this.state.order.firstname &&
                        <div>
                            <h5 className="mb-3">Details</h5>
                            <table className="table table-bordered">
                                <tbody>
                                    <tr>
                                        <td>{ this.state.order.firstname + " " + (this.state.order.lastname ? ' ' + this.state.order.lastname : '' )}</td>
                                    </tr>
                                    { this.state.order.company &&
                                    <tr>
                                        <td>{ this.state.order.company }</td>
                                    </tr>
                                    }
                                    { this.state.order.invitation_reference &&
                                    <tr>
                                        <td>{ this.state.order.invitation_reference }</td>
                                    </tr>
                                    }
                                    { this.state.order.email &&
                                    <tr>
                                        <td>{ this.state.order.email }</td>
                                    </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                        }
                    </div>
                    <div className="col">
                        { this.renderPockets() }
                    </div>
                </div>
                
            </div>
        )
    }
    renderPockets() {
        if(!this.state.pocketData || !this.state.pocketData.length) return;
        return (
            <div className="mb-5">
                { this.state.pocketData.map((pocket) => this.renderPocket(pocket)) }
            </div>
        );
    }
    renderPocket(pocket){
        return (
            <div key={pocket.pocket.id} >
                <h5 className="mb-3">Pocket <span className="badge badge-primary">{pocket.tickets.length}</span></h5>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                            <th scope="col">Naam</th>
                            <th scope="col">Voorstelling</th>
                            <th scope="col">Scan</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        { pocket.tickets.map((ticket) => this.renderTicket(ticket)) }       
                    </tbody>
                </table>
            </div>
        )
    }
    renderTicket(ticket){
        return (
            <tr key={ticket.id} className={ticket.scans.length ? "table-success" : ""}>
                <td>
                    <h6 className="mb-0"><b>{ (ticket.firstname ? ticket.firstname : '') + ' ' + (ticket.lastname ? ticket.lastname : '') }</b></h6>
                    <p className="mb-0">{ ticket.type ? ticket.type.name : '-' }</p>
                    <p className="mb-0 small">{ ticket.barcode }</p>
                </td>
                <td>
                    <h6 className="mb-0">{ ticket.show ? ticket.show.name : '' }</h6>
                    <p className="mb-0 small">{ ticket.place ? ('Section: ' + ticket.place.data.section + ' - ' + 'Row: ' + ticket.place.data.row + ' - ' + 'Place: ' + ticket.place.data.seat) : '' }</p>
                </td>
                <td>{ ticket.scans.length ? moment(ticket.scans[0].scanned_at).format("DD-MM-YYYY HH:mm:ss") : '' }</td>
                <td>
                    <div className="dropdown show">
                        <a className="btn btn-sm btn-secondary dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Acties</a>
                        <div className="dropdown-menu" aria-labelledby="dropdownMenuLink">
                            <button onClick={() => this.scanTicket(ticket.barcode)} className="dropdown-item" href="#">Scan</button>
                            <button onClick={() => this.openBadge(ticket)} className="dropdown-item" href="#">Maak badge</button>
                            {/* <button onClick={() => this.printTicket(ticket)} className="dropdown-item" href="#">Afdrukken</button> */}
                        </div>
                    </div>
                </td>
            </tr>
        );
    }
    scanTicket(barcode){
        axios.post('/api/tickets/' + barcode + '/scan')
        .then(function (response) {
            // handle error
            this.props.emit('scan',response.data);
            if(response.data && response.data.status == 'already_scanned'){
                alert('Dit ticket is reeds gescanned');
            } else {
                this.fetchPockets();
            }
        }.bind(this))
        .catch(function (error) {
            
        });
    }
    printBadge(ticket) {

    }
    printTicket(ticket){
        this.props.emit('print_ticket',{
            name: ticket.firstname + " " + ticket.lastname,
            type: ticket.type.name,
            barcode: ticket.barcode
        })
    }
    render() {
        return (
            <div className="page-padding">
                { this.renderOrder() }
                <Badge onEmit={this.props.emit} onChange={(name,value) => this.onChange(name,value)} onClose={() =>this.closeBadge() } visible={this.state.badge} name={this.state.name} company={this.state.company} />
            </div>
        )
    }
};

module.exports = Order;