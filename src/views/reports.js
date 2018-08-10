import React from "react";
const axios = require('axios');

class Reports extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: null,
            counts: null,
            statsInterval: null
        }
    };
    componentDidMount() {
        this.startStats();
    }
    startStats() {
        this.statsInterval = setInterval(function(){
            this.fetchStats();
            this.fetchCounts();
        }.bind(this),10000);
        this.fetchStats();
        this.fetchCounts();
    }
    fetchStats(){
        axios.get('/api/stats')
        .then(function (response) {
            // handle success
            this.setState({
                stats: response.data
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
    fetchCounts(){
        axios.get('/api/counts')
            .then(function (response) {
                // handle success
                this.setState({
                    counts: response.data
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
    render() {
        return (
                <div className="container">

                    <h1 className="mt-5">Reports</h1>

                    <div>{ JSON.stringify(this.state.stats) }</div>

                    {/* <div class="row" v-if="totalCrowd">
                        <div class="col-sm">
                            <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 45px; border-radius: 5px; padding: 20px;">Total on site <b>{{ totalCrowd }}</b></div>
                        </div>
                    </div>
                    <div class="row" v-if="counts">
                        <div class="col-sm">
                            <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 30px; border-radius: 5px; padding: 20px;">{{ counts.total_delta > 0 ? 'Re-entry' : 'Outside' }} <b>{{ Math.abs(counts.total_delta) }}</b></div>
                        </div>
                        <div class="col-sm" v-if="counts">
                            <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 30px; border-radius: 5px; padding: 20px;">Not scanned <b>{{ totalTickets.remaining }}</b></div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm">
                            <table class="table table-bordered" v-if="stats">
                                <thead class="thead-dark">
                                    <tr>
                                        <th scope="col">Ticket</th>
                                        <th scope="col">Scans</th>
                                        <th scope="col">Total</th>
                                        <th scope="col">Remaining</th>
                                        <th scope="col">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-bind:key="type.id" v-for="type in stats.types" style="cursor: pointer;" v-on:click.prevent.stop="toggleType(type.id)" v-bind:class="{active : isTypeActive(type.id)}">
                                        <td><b>{{ type.name }}</b></td>
                                        <td>{{ type.tickets_scanned }}</td>
                                        <td>{{ type.tickets_total }}</td>
                                        <td>{{ type.tickets_total - type.tickets_scanned }}</td>
                                        <td>{{ type.tickets_percentage ? type.tickets_percentage + " %" : '' }}</td>
                                    </tr>
                                    <tr style="background-color: #EEEEEE">
                                        <td><b>Total</b></td>
                                        <td>{{ totalTickets.scans }}</td>
                                        <td>{{ totalTickets.tickets }}</td>
                                        <td>{{ totalTickets.remaining }}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                            <h3 class="mb-3">Visitor flow</h3>
                            <table class="table" v-if="counts">
                                <thead class="thead-dark">
                                    <tr>
                                        <th scope="col">Direction</th>
                                        <th scope="col">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><b>IN</b></td>
                                        <td>{{ counts.total_in }}</td>
                                    </tr>
                                    <tr>
                                        <td><b>OUT</b></td>
                                        <td>{{ counts.total_out }}</td>
                                    </tr>
                                    <tr>
                                        <td><b>DELTA</b></td>
                                        <td>{{ counts.total_delta }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div> */}
                </div>
        )
    }
};

module.exports = Reports;