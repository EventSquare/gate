import React from "react";
const axios = require('axios');
var moment = require('moment-timezone');

class Shows extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            shows: []
        }
    };
    componentDidMount() {
        this.loadShows();
    }
    loadShows(){
        axios.get('/api/shows')
        .then(function (response) {
            // handle success
            this.setState({
                shows: Object.values(response.data.shows),
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
    openShow(show_id){
        this.props.history.push('/shows/'+show_id);
    }
    renderShow(show){
        return (
            <tr key={show.id} onClick={() => this.openShow(show.id)}>
                <td>{show.name}</td>
                <td>{show.date_start ? moment(show.date_start).format("YYYY-MM-DD HH:mm:ss") : ''}</td>
                <td>{show.date_end ? moment(show.date_end).format("YYYY-MM-DD HH:mm:ss") : ''}</td>
            </tr>
        );
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Start</th>
                                <th scope="col">End</th>
                            </tr>
                        </thead>
                        <tbody>
                            { this.state.shows.map((show) => this.renderShow(show)) }       
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
};

module.exports = Shows;