import React from "react";
const axios = require('axios');
var moment = require('moment-timezone');

class Badges extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            badges: [],
            createBadge: false,
            errorName: false,
            name: "",
            host: ""
        }
        this.closeBadgeForm = this.closeBadgeForm.bind(this);
        this.openBadgeForm = this.openBadgeForm.bind(this);
        this.onChange = this.onChange.bind(this);
        this.saveBadge = this.saveBadge.bind(this);
    };
    componentDidMount() {
        this.loadBadges();
    }
    loadBadges(){
        axios.get('/api/badges')
        .then(function (response) {
            // handle success
            this.setState({
                badges: Object.values(response.data.badges),
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
    openBadgeForm(){
        this.setState({createBadge: true},function(){
            this.nameInput.focus(); 
        });
    }
    closeBadgeForm(){
        this.setState({
            createBadge: false,
            errorName: false
        });
    }
    onChange(event) {
        var property = event.target.name;
        var value = event.target.value;
        this.setState({[property]: value});
    }
    saveBadge(e){
        e.preventDefault();
        if(!this.state.name) {
            this.setState({
                errorName: true
            })
            return;
        }
        axios.post('/api/badges',{
            name: this.state.name,
            host: this.state.host
        })
        .then(function (response) {
            // handle success
            this.loadBadges();
            this.printBadge({
                ticket: {
                    firstname: this.state.name,
                    lastname: ""
                },
                order: {
                    company: this.state.host
                }
            });
        }.bind(this))
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
            this.closeBadgeForm();
        }.bind(this));
    }
    renderBadges() {
        if(!this.state.badges.length) return;
        const badgesList = this.state.badges.map((badge) =>
            <tr key={badge.badge_id}>
                <td><b>{ badge.name }</b></td>
                <td>{ badge.host }</td>
                <td>{ moment(badge.created_at).format("YYYY-MM-DD HH:mm:ss") }</td>
                <td><button onClick={() => this.printBadge({ticket: {firstname: badge.name, lastname: ""}, order: { company: badge.host}})} className="btn btn-sm btn-primary">Print</button></td>
            </tr>
        );
        return badgesList;
    }
    printBadge(ticketData){
        this.props.emit('print_badge', ticketData);
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <div className="row">
                        <div className="col-sm mb-3">
                            <div className="clearfix">
                                <h1 className="float-left">Badges</h1>
                                <div className="float-right">
                                    <button onClick={this.openBadgeForm} className="btn btn-primary">Maak badge</button>
                                </div>
                            </div>
                            <hr/>
                            
                        </div>
                    </div>
                    {/* <button className="btn btn-primary">Maak badge</button> */}
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">Naam</th>
                                <th scope="col">Bedrijfsnaam</th>
                                <th scope="col">Aangemaakt</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            { this.renderBadges() }
                        </tbody>
                    </table>
                </div>
                { this.renderBadgeForm() }
            </div>
        )
    }
    renderBadgeForm() {
        if(!this.state.createBadge) return;
        return (
            <div className="modal-container" >
                <div className="modal-container-content">
                    <h3>Nieuwe badge maken</h3>
                    <hr />
                    { this.state.errorName &&
                    <div className="alert alert-warning" role="alert">Je dient een naam in te vullen.</div>
                    }
                    <form onSubmit={this.saveBadge}>
                        <div className="form-group">
                            <label>Naam</label>
                            <input name="name" ref={(input) => { this.nameInput = input; }} onChange={this.onChange} value={this.state.name} type="text" className="form-control" placeholder="Naam" />
                        </div>
                        <div className="form-group">
                            <label>Bedrijf</label>
                            <input name="host" onChange={this.onChange} value={this.state.host} type="text" className="form-control" placeholder="Bedrijfsnaam" />
                        </div>
                        <button onClick={this.saveBadge} type="submit" className="btn btn-block btn-primary">Bewaren en afdrukken</button>
                        <button onClick={this.closeBadgeForm} type="button" className="btn btn-block btn-link">Annuleren</button>
                    </form>
                </div>
            </div>
        )
    }
};

module.exports = Badges;