import React from "react";
const axios = require('axios');
import Cookies from 'universal-cookie';
import { Link } from "react-router-dom";

var moment = require('moment-timezone');

const cookies = new Cookies();

class DashBoard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            results: null,
            ticket: null,
            not_found: false,
            kiosk: cookies.get('kiosk') || null
        }
        this.onSearch = this.onSearch.bind(this);
        this.onScan = this.onScan.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.searchTimeout = null;
    };
    componentDidMount() {
        this.searchInput.focus();
    }
    onSearch(event) {
        this.setState({
            ticket: null,
            query: event.target.value,
            not_found: false
        },function(){
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(function(){
                this.fetchSearch();
            }.bind(this),300);
        }.bind(this));
    }
    resetSearch() {
        this.setState({
            query: '',
            results: null,
            ticket: null,
            not_found: false
        });
        this.searchInput.focus();
    }
    onScan(event) {
        //Reset search
        if(event.keyCode == 27) {
            this.resetSearch();
            return;
        }
        //Scan ticket
        if (event.keyCode == 13) {
            let barcode = event.target.value;
            this.setState({
                query: '',
                not_found: false,
                results: null
            });
            axios.post('/api/tickets/' + barcode + '/scan')
            .then(function (response) {
                // handle success
                this.setState({
                    ticket: response.data
                });
            }.bind(this))
            .catch(function (error) {
                // handle error
                console.log(error);
                if(error.response && error.response.status == 404){
                    this.setState({
                        not_found: true
                    });
                }  
            }.bind(this))
            .then(function () {
                // always executed
            });
        }
    }
    fetchSearch(){
        if(!this.state.query) {
            this.setState({
                results: null
            })
            return;
        };
        axios.get('/api/search',{
            params: {
                query: this.state.query
            }
        })
        .then(function (response) {
            // handle success
            this.setState({
                results: response.data
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
    renderOrders(){
        if(!this.state.results) return;
        let orders = Object.values(this.state.results.orders).slice(0, 50);
        if(!orders.length) return;
        return (
            <div className="mb-5">
                <h2 className="mb-3">Bestellingen</h2>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                        <th scope="col">Referentie</th>
                        <th scope="col">Naam</th>
                        <th scope="col">Bedrijf</th>
                        <th scope="col">Uitnodiging</th>
                        <th scope="col">E-mail</th>
                        </tr>
                    </thead>
                    <tbody>
                        { this.ordersList(orders) }
                    </tbody>
                </table>
            </div>
        );
    }
    openOrder(order_id){
        if(!order_id) return;
        this.props.history.push('/orders/'+order_id);
    }
    openCustomer(customer_id){
        this.props.history.push('/customers/'+customer_id);
    }
    ordersList(orders){
        const listItems = orders.map((order) =>
            <tr key={order.id} onClick={() => this.openOrder(order.id)}>
                <th scope="row">{ order.reference }</th>
                <td>{ (order.firstname ? order.firstname : '') + ' ' + (order.lastname ? order.lastname : '') }</td>
                <td>{ order.company ? order.company : '' }</td>
                <td>{ order.invitation_reference ? order.invitation_reference : '' }</td>
                <td>{ order.email ? order.email : '' }</td>
            </tr>
        );
        return listItems;
    }
    renderCustomers(){
        if(!this.state.results) return;
        let customers = Object.values(this.state.results.customers).slice(0, 50);
        if(!customers.length) return;
        return (
            <div className="mb-5">
                <h2>Klanten</h2>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                        <th scope="col">Naam</th>
                        <th scope="col">E-mail</th>
                        </tr>
                    </thead>
                    <tbody>
                        { this.customersList(customers) }
                    </tbody>
                </table>
            </div>
        );
    }
    customersList(customers){
        const listItems = customers.map((customer) =>
            <tr key={customer.id} onClick={() => this.openCustomer(customer.id)}>
                <td>{ (customer.firstname ? customer.firstname : '') + ' ' + (customer.lastname ? customer.lastname : '') }</td>
                <td>{ (customer.email ? customer.email : '') }</td>
            </tr>
        );
        return listItems;
    }
    renderTickets(){
        if(!this.state.results) return;
        let tickets = Object.values(this.state.results.tickets).slice(0, 50);
        if(!tickets.length) return;
        return (
            <div className="mb-5">
                <h2>Tickets</h2>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                        <th scope="col">Naam</th>
                        <th scope="col">Type</th>
                        <th scope="col">Barcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        { this.ticketsList(tickets) }
                    </tbody>
                </table>
            </div>
        );
    }
    ticketsList(tickets){
        const listItems = tickets.map((ticket) =>
            <tr key={ticket.id} onClick={() => this.openOrder(ticket.order_id)}>
                <td>{ (ticket.firstname ? ticket.firstname : '') + ' ' + (ticket.lastname ? ticket.lastname : '') }</td>
                <td>{ ticket.type }</td>
                <td>{ ticket.barcode }</td>
            </tr>
        );
        return listItems;
    }
    renderTicket(){
        if(this.state.ticket){
            return (
                <div>
                    { this.renderStatus(this.state.ticket.status) }
                    <table className="table">
                        <tbody>
                            { this.state.ticket.ticket.firstname &&
                            <tr>
                                <td>Bezoeker</td>
                                <td>{ this.state.ticket.ticket.firstname + " " + this.state.ticket.ticket.lastname}</td>
                            </tr>
                            }
                            { this.state.ticket.customer &&
                            <tr>
                                <td>Klant</td>
                                <td><Link to={"/customers/" + this.state.ticket.customer.id }>{ this.state.ticket.customer.firstname + " " + this.state.ticket.customer.lastname }</Link></td>
                            </tr>
                            }
                            { this.state.ticket.order &&
                            <tr>
                                <td>Bestelling</td>
                                <td><Link to={"/orders/" + this.state.ticket.order.id }>{ this.state.ticket.order.reference }</Link></td>
                            </tr>
                            }
                            { this.state.ticket.order &&
                                <tr>
                                    <td>Besteld door</td>
                                    <td>{ this.state.ticket.order.firstname + " " + this.state.ticket.order.lastname }</td>
                                </tr>
                            }
                            <tr>
                                <td>Barcode</td>
                                <td>{ this.state.ticket.ticket.barcode}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )
        }
    }
    renderStatus(status){
        if(status == "already_scanned"){
            return (
                <div>
                    <div className="mb-4 text-center">
                        { this.state.ticket.ticket.firstname &&
                        <h3 style={{fontSize: 48}} className="display-4 mb-1"><b>{ this.state.ticket.ticket.firstname + " " + this.state.ticket.ticket.lastname }</b></h3>
                        }
                        <h4><b>{ this.state.ticket.type.name }</b></h4>
                    </div>
                    <div className="p-3 mb-5 bg-danger text-white text-center">
                        <h1>REEDS GESCAND</h1>
                        <p className="lead mb-0">Dit ticket werd reeds gescand op { moment(this.state.ticket.scans[0].scanned_at).format("YYYY-MM-DD HH:mm:ss") }</p>
                    </div>
                </div>
            )
        } else {
            return (
                <div>
                    <div className="mb-4 text-center">
                        { this.state.ticket.ticket.firstname &&
                        <h3 style={{fontSize: 48}} className="display-4 mb-1"><b>{ this.state.ticket.ticket.firstname + " " + this.state.ticket.ticket.lastname }</b></h3>
                        }
                        <h4><b>{ this.state.ticket.type.name }</b></h4>
                    </div>
                    <div className="p-3 mb-5 bg-success text-white text-center">
                        <h1 className="mb-0">OK</h1>
                    </div>
                </div>
            )
        }
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    { !this.state.query &&
                    <div className="row">
                        <div class="col">
                            <h1 className="display-4 mb-4">Onthaal</h1>
                        </div>
                    </div>
                    }
                    <div className="row">
                        <div className="col">
                            <div className="form mb-4">
                                <div className="form-row">
                                    <div className="col">
                                        <div className="input-group">
                                            <input onKeyUp={this.onScan} onChange={this.onSearch} ref={(input) => { this.searchInput = input; }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" className="form-control form-control-lg" value={this.state.query} type="text" placeholder="Scan of zoek tickets, bestellingen en klanten" />
                                        </div>
                                    </div>
                                    <div className="col col-3 col-md-2">
                                        <button onClick={this.resetSearch} className="btn btn-block btn-primary btn-lg">Wis</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    { this.state.not_found &&
                    <div>
                        <div className="p-3 mb-5 bg-danger text-white text-center">
                            <h1>NIET GEVONDEN</h1>
                            <p className="lead mb-0">We kunnen geen ticket vinden met deze barcode.</p>
                        </div>
                    </div>
                    }
                    { this.renderTicket() }
                    { this.renderOrders() }
                    { this.renderCustomers() }
                    { this.renderTickets() }
                </div>
            </div>
        )
    }
};

module.exports = DashBoard;