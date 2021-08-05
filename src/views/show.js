import React from "react";
const axios = require('axios');
var moment = require('moment-timezone');

class Show extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: null,
            types: []
        }
        this.loadInterval = null;
    };
    componentDidMount() {
        moment.locale('nl');
        this.loadShow();
        this.loadInterval = setInterval(function(){
            this.loadShow();
        }.bind(this),30000);
    }
    componentWillUnmount(){
        clearInterval(this.loadInterval);
    }
    loadShow(){
        axios.get('/api/shows/' + this.props.match.params.id)
        .then(function (response) {
            // handle success
            this.setState({
                show: response.data.show,
                types: response.data.types
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
    renderType(type){
        return (
            <tr key={type.id}>
                <td>{type.name}
                    <div className="progress" style={{height: "3px"}}>
                        <div className="progress-bar" role="progressbar" style={{width: type.percentage + '%'}}></div>
                    </div>
                </td>
                <td>{type.scans}</td>
                <td>{type.tickets - type.scans}</td>
                <td>{type.tickets}</td>
            </tr>
        );
    }
    renderTableFooter() {
        const totalTickets = this.state.types.reduce((a,b) => a+b.tickets,0);
        const totalScans = this.state.types.reduce((a,b) => a+b.scans,0);
        const percentageScanned = Math.round(totalScans / (totalTickets/100));
        return (
            <tfoot>
                <tr>
                    <th scope="col">
                        Totaal
                        <div className="progress" style={{height: "3px"}}>
                            <div className="progress-bar" role="progressbar" style={{width: percentageScanned + '%'}}></div>
                        </div>
                    </th>
                    <th scope="col">{totalScans}</th>
                    <th scope="col">{totalTickets - totalScans}</th>
                    <th scope="col">{totalTickets}</th>
                </tr>
            </tfoot>
        )
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    { this.state.show &&
                        <h4>{ this.state.show.name ? this.state.show.name : moment(this.state.show.date_start).format("dddd D MMMM YYYY - HH:mm")}</h4>
                    }
                    <hr/>
                    { this.state.show &&
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Type</th>
                                <th scope="col">Scans</th>
                                <th scope="col">Resterend</th>
                                <th scope="col">Totaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            { this.state.types.map((type) => this.renderType(type)) }       
                        </tbody>
                        { this.renderTableFooter()}
                    </table>
                    }
                </div>
            </div>
        )
    }
};

module.exports = Show;