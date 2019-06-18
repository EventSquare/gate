import React from "react";
const axios = require('axios');
var moment = require('moment-timezone');

class Badges extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            badges: []
        }
    };
    componentDidMount() {
        this.loadBadges();
    }
    loadBadges(){
        // axios.get('/api/shows')
        // .then(function (response) {
        //     // handle success
        //     this.setState({
        //         shows: Object.values(response.data.shows),
        //     })
        // }.bind(this))
        // .catch(function (error) {
        //     // handle error
        //     console.log(error);
        // })
        // .then(function () {
        //     // always executed
        // });
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <div className="row">
                        <div className="col-sm mb-3">
                            <h1>Badges</h1>
                            <hr/>
                        </div>
                    </div>
                    <button className="btn btn-primary">Maak badge</button>
                    <button className="btn btn-secondary">Importeren</button>
                    <input type="text" placeholder="Zoeken" />
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Naam</th>
                                <th scope="col">Ticket</th>
                                <th scope="col">Barcode</th>
                                <th scope="col">Bedrijfsnaam</th>
                                <th scope="col">Logo</th>
                                <th scope="col">Tafel</th>
                                <th scope="col">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
};

module.exports = Badges;