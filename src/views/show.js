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
        this.loadShow();
        this.loadInterval = setInterval(function(){
            this.loadShow();
        }.bind(this),30000);
    }
    componentWillUnmount(){
        clearInterval(this.loadInterval);
    }
    loadShow(){
        console.log('loading show');
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
                    <div class="progress" style={{height: "3px"}}>
                        <div class="progress-bar" role="progressbar" style={{width: type.percentage + '%'}}></div>
                    </div>
                </td>
                <td>{type.scans}</td>
                <td>{type.tickets}</td>
                <td>{type.tickets - type.scans}</td>
            </tr>
        );
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <h1>{ this.state.show && this.state.show.name ? this.state.show.name : 'Loading...'}</h1>
                    { this.state.show && this.state.show.date_start &&
                    <h5>{ moment(this.state.show.date_start).format("YYYY-MM-DD HH:mm:ss")}</h5>
                    }
                    <hr/>
                    { this.state.show &&
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Type</th>
                                <th scope="col">Scans</th>
                                <th scope="col">Remaining</th>
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            { this.state.types.map((type) => this.renderType(type)) }       
                        </tbody>
                    </table>
                    }
                </div>
            </div>
        )
    }
};

module.exports = Show;