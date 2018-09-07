import React from "react";
const axios = require('axios');

class Customer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customer: null,
            pockets: [],
            pocketData: []
        }
    };
    componentDidMount() {
        this.loadCustomer();
    }
    loadCustomer(){
        axios.get('/api/customers/' + this.props.match.params.id)
        .then(function (response) {
            // handle success
            this.setState({
                customer: response.data.customer,
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
    renderCustomer(){
        if(!this.state.customer) return;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-sm mb-3">
                        <h1>{ this.state.customer.firstname ? (this.state.customer.firstname + (this.state.customer.lastname ? ' ' + this.state.customer.lastname : '')) : ('Customer #' + this.state.customer.id) }</h1>
                        <hr/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-3">
                        <h3>Details</h3>
                        <table className="table table-bordered">
                            <tbody>
                                <tr>
                                    <td>{ this.state.customer.firstname + " " + this.state.customer.lastname }</td>
                                </tr>
                                <tr>
                                    <td>{ this.state.customer.email }</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-9">
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
                <h4 className="mb-3">Pocket {pocket.pocket.id} <span className="badge badge-primary">{pocket.tickets.length}</span></h4>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Show</th>
                            <th scope="col">Type</th>
                            <th scope="col">Place</th>
                            <th scope="col">Scans</th>
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
            <tr key={ticket.id} className={ticket.scans ? "table-success" : ""}>
                <td>{ (ticket.firstname ? ticket.firstname : '') + ' ' + (ticket.lastname ? ticket.lastname : '') }</td>
                <td>{ ticket.show ? ticket.show.name : '' }</td>
                <td>{ ticket.type ? ticket.type.name : '-' }</td>
                <td>{ ticket.place ? ('Section: ' + ticket.place.data.section + ' - ' + 'Row: ' + ticket.place.data.row + ' - ' + 'Place: ' + ticket.place.data.seat) : '' }</td>
                <td>{ ticket.scans }</td>
                <td>
                    { !ticket.scans &&
                    <button onClick={() => this.scanTicket(ticket.barcode)} className="btn btn-sm btn-primary">Scan</button>
                    }
                </td>
            </tr>
        );
    }
    scanTicket(barcode){
        axios.post('/api/tickets/' + barcode + '/scan')
        .then(function (response) {
            // handle success
            this.props.emit('scan_ticket',response.data);
            this.fetchPockets();
        }.bind(this))
        .catch(function (error) {
            // handle error
            alert('error!')
            console.log(error);
        })
        .then(function () {
            // always executed
        });
    }
    render() {
        return (
            <div className="page-padding">
                { this.renderCustomer() }
            </div>
        )
    }
};

module.exports = Customer;