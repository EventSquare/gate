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
            kiosk: cookies.get('kiosk') || null
        }
        this.onSearch = this.onSearch.bind(this);
        this.onScan = this.onScan.bind(this);
        this.searchTimeout = null;
    };
    componentDidMount() {
        this.searchInput.focus();
    }
    onSearch(event) {
        this.setState({
            ticket: null,
            query: event.target.value
        },function(){
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(function(){
                this.fetchSearch();
            }.bind(this),300);
        }.bind(this));
    }
    onScan(event) {
        if (event.keyCode == 13) {
            let barcode = event.target.value;
            //let barcode = "XLNE-AVSD-0044-17DN";
            this.setState({
                query: '',
                results: null
            });
            axios.post('/api/tickets/' + barcode + '/scan')
            .then(function (response) {
                // handle success
                this.setState({
                    ticket: response.data
                });
                this.props.emit('scan_ticket',response.data);
            }.bind(this))
            .catch(function (error) {
                // handle error
                console.log(error);
            })
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
                <h2 className="mb-3">Orders</h2>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                        <th scope="col">Reference</th>
                        <th scope="col">Name</th>
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
                <td>{ (order.email ? order.email : '') }</td>
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
                <h2>Customers</h2>
                <table className="table table-striped table-hover table-sm">
                    <thead>
                        <tr>
                        <th scope="col">Name</th>
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
                        <th scope="col">Name</th>
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
            <tr key={ticket.ticket_id}>
                <td>{ (ticket.firstname ? ticket.firstname : '') + ' ' + (ticket.lastname ? ticket.lastname : '') }</td>
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
                                <td>Attendee</td>
                                <td>{ this.state.ticket.ticket.firstname + " " + this.state.ticket.ticket.lastname}</td>
                            </tr>
                            }
                            { this.state.ticket.customer &&
                            <tr>
                                <td>Customer</td>
                                <td><Link to={"/customers/" + this.state.ticket.customer.id }>{ this.state.ticket.customer.firstname + " " + this.state.ticket.customer.lastname }</Link></td>
                            </tr>
                            }
                            { this.state.ticket.order &&
                            <tr>
                                <td>Order reference</td>
                                <td><Link to={"/orders/" + this.state.ticket.order.id }>{ this.state.ticket.order.reference }</Link></td>
                            </tr>
                            }
                            { this.state.ticket.order &&
                                <tr>
                                    <td>Order placed by</td>
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
                <div className="alert alert-danger mb-4" role="alert">
                    <h4 className="alert-heading">This ticket was already scanned.</h4>
                    <p className="m-0">Please check: this ticket was already scanned on { moment(this.state.ticket.scans[0].scanned_at).format("YYYY-MM-DD HH:mm:ss") }</p>
                </div>
            )
        } else {
            return (
                <div>
                    { this.state.ticket.ticket.firstname &&
                    <h3 style={{fontSize: 48}} className="display-4 mb-3">Welcome <b>{ this.state.ticket.ticket.firstname + " " + this.state.ticket.ticket.lastname }</b></h3>
                    }
                    <h3 className="bg-success text-white p-3 text-center mb-5">{ this.state.ticket.type ? ("TICKET OK : " + this.state.ticket.type.name) : "OK" }</h3>
                </div>
            )
        }
    }
    render() {
        return (
            <div id="dashboard-wrapper">
                <div className="container">
                    <div className="input-group mb-4">
                        <input onKeyUp={this.onScan} onChange={this.onSearch} ref={(input) => { this.searchInput = input; }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" className="form-control form-control-lg" value={this.state.query} type="text" placeholder="Scan ticket, search orders, customers and tickets." />
                    </div>
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