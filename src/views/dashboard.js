import React from "react";
const axios = require('axios');

class DashBoard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            results: null
        }
        this.onSearch = this.onSearch.bind(this);
        this.searchTimeout = null;
    };
    componentDidMount() {
        this.searchInput.focus();
    }
    onSearch(event) {
        this.setState({
            query: event.target.value
        },function(){
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(function(){
                this.fetchSearch();
            }.bind(this),300);
        }.bind(this));
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
            <tr key={ticket.id}>
                <td>{ (ticket.firstname ? ticket.firstname : '') + ' ' + (ticket.lastname ? ticket.lastname : '') }</td>
                <td>{ ticket.barcode }</td>
            </tr>
        );
        return listItems;
    }
    render() {
        return (
            <div id="dashboard-wrapper">
                <div className="container">
                    <div className="input-group mb-4">
                        <input onChange={this.onSearch} ref={(input) => { this.searchInput = input; }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" className="form-control form-control-lg" value={this.state.query} type="text" placeholder="Search orders, customers and tickets." />
                        <div className="input-group-append">
                            <button className="btn btn-primary" type="button" id="button-addon2">Search</button>
                        </div>
                    </div>
                    { this.renderOrders() }
                    { this.renderCustomers() }
                    { this.renderTickets() }
                </div>
            </div>
        )
    }
};

module.exports = DashBoard;