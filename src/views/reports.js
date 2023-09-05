import React from "react";
import Cookies from 'universal-cookie';

const axios = require('axios');
const moment = require('moment-timezone');
const cookies = new Cookies();

class Reports extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: null,
            selected: cookies.get('reports_selected') || [],
            start: cookies.get('reports_start') || moment().startOf('day').hours(6).format('YYYY-MM-DD HH:mm:ss'),
            end: cookies.get('reports_end') || moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
        }
        this.onChange = this.onChange.bind(this);
        this.toggleType = this.toggleType.bind(this);
    };
    componentDidMount() {
        this.startStats();
    }
    componentWillUnmount() {
        this.stopStats();
    }
    onChange(event) {
        var property = event.target.name;
        var value = event.target.value;
        this.setState({[property]: value});
        if(property == 'start') cookies.set('reports_start', value, { path: '/' });
        if(property == 'end') cookies.set('reports_end', value, { path: '/' });
    }
    toggleType(event){
        var type_id = event.target.name;
        if(event.target.checked){
            //Add
            if(this.state.selected.indexOf(type_id) == -1){
                var selected = [...this.state.selected];
                selected.push(type_id);
                this.setState({selected: selected},function(){
                    cookies.set('reports_selected', this.state.selected, { path: '/' });
                });
            }
        } else {
            //Remove
            var index = this.state.selected.indexOf(type_id);
            if(index !== -1){
                var selected = [...this.state.selected];
                selected.splice(index,1);
                this.setState({selected: selected},function(){
                    cookies.set('reports_selected', this.state.selected, { path: '/' });
                });
            }
        }
        
    }
    startStats() {
        this.statsInterval = setInterval(function(){
            this.fetchStats();
        }.bind(this),8000);
        this.fetchStats();
    }
    stopStats() {
        clearInterval(this.statsInterval);
    }
    fetchStats(){
        axios.get('/api/reports',{
            params: {
                start: this.state.start,
                end: this.state.end
            }
        })
        .then(function (response) {
            // handle success
            this.setState({
                reports: response.data
            })
        }.bind(this))
        .catch(function (error) {
            // handle error
            console.log(error);
        });
    }
    renderReports()
    {
        if(!this.state.reports) return;
        return (
            <table className="table table-bordered table-striped table-sm">
                <thead className="thead-dark">
                    <tr>
                        <th></th>
                        <th>Ticket</th>
                        <th>IN</th>
                        <th>OUT</th>
                        <th>Tickets</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.reports.types.map((type) =>
                        <tr key={type.id}>
                            <td><input type="checkbox" checked={this.state.selected.indexOf(type.id) !== -1} onChange={this.toggleType} name={type.id} /></td>
                            <td>{type.name}</td>
                            <td>{type.scans}</td>
                            <td></td>
                            <td>{type.tickets}</td>
                        </tr>
                    )}
                    {this.state.reports.clickers.map((clicker) =>
                        <tr key={clicker.id}  className="table-info">
                            <td></td>
                            <td>{clicker.name}</td>
                            <td>{clicker.scans.in}</td>
                            <td>{clicker.scans.out}</td>
                            <td></td>
                        </tr>
                    )}
                </tbody>
                { this.renderTotals() }
            </table>
        )
    }
    renderTotals()
    {
        var totalTickets = 0;
        var totalScanned = 0;
        for(var i = 0; i < this.state.reports.types.length; i++){
            if(!this.state.selected.length || (this.state.selected && this.state.selected.indexOf(this.state.reports.types[i].id) !== -1)){
                totalTickets += this.state.reports.types[i].tickets;
                totalScanned += this.state.reports.types[i].scans;
            }
        }
        for(var i = 0; i < this.state.reports.clickers.length; i++){
            totalScanned += this.state.reports.clickers[i].scans.in;
            totalScanned -= this.state.reports.clickers[i].scans.out;
        }
        return (
            <tfoot className="thead-light">
                <tr>
                    <th></th>
                    <th></th>
                    <th>{totalScanned}</th>
                    <th></th>
                    <th>{totalTickets}</th>
                </tr>
            </tfoot>
        )
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <div className="row">
                        <div className="col">
                        <form className="form mb-4">
                            <div className="form-row">
                                <div className="col">
                                    <input className="form-control" name="start" onChange={this.onChange} type="text" value={this.state.start}/>
                                </div>
                                <div className="col">
                                    <input className="form-control" name="end" onChange={this.onChange} type="text" value={this.state.end}/>
                                </div>
                            </div>
                        </form>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            { this.renderReports() }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};

export default Reports;