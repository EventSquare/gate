import React from "react";

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            success: false
        }
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.simulateClick = this.simulateClick.bind(this);
    };
    componentDidMount() {
        this.setState({
            user: this.props.user
        });
    };
    onChange(event) {
        var property = event.target.name;
        var value = event.target.value;
        if(event.target.type == "checkbox"){
            value = event.target.checked;
        }
        const updatedUser = Object.assign({}, this.state.user, {
            [property]: value
        });
        this.setState({
            user: updatedUser
        });
    }
    onSubmit(e){
        e.preventDefault();
        this.setState({success: false})
        this.props.updateUser(this.state.user,function(success){
            if(success) this.setState({success: true})
        }.bind(this));
    }
    simulateClick(quantity,type) {
        this.props.emit('scan', {
            quantity: quantity,
            clicker_id: '311374546583',
            type: type
        });
    }
    render() {
        return (
            <div className="page-padding">
                <div className="container">
                    <h1 className="mb-4">Instellingen</h1>
                    <div className="row">
                        { this.state.user &&
                        <div className="col">
                            <div className="card mb-3">
                                <div className="card-body">
                                    { this.state.success &&
                                    <div className="alert alert-success" role="alert">De instellingen werden met succes opgeslagen.</div>
                                    }
                                    <form onSubmit={this.onSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="username">Gebruikersnaam</label>
                                            <input autoComplete="off" onChange={this.onChange} name="username" value={this.state.user.username} type="text" className="form-control" id="username" placeholder="Gebruikersnaam"/>
                                        </div>
                                        <div className="form-row">
                                            <div className="col">
                                                <div className="form-group">
                                                    <label htmlFor="ticket_printer">Ticketprinter</label>
                                                    <input autoComplete="off" onChange={this.onChange} name="ticket_printer" value={this.state.user.ticket_printer ? this.state.user.ticket_printer : ""} type="text" className="form-control" id="ticket_printer" placeholder="IP adres"/>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <div className="form-group">
                                                    <label htmlFor="badge_printer">Badge printer name</label>
                                                    <input autoComplete="off" onChange={this.onChange} name="badge_printer" value={this.state.user.badge_printer ? this.state.user.badge_printer : ""} type="text" className="form-control" id="badge_printer" placeholder="IP adres"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <div className="form-check">
                                                <input onChange={this.onChange} name="reports" className="form-check-input" checked={this.state.user.reports} type="checkbox" id="reports"/>
                                                <label className="form-check-label" htmlFor="reports">Rapporten</label>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <div className="form-check">
                                                <input onChange={this.onChange} name="badges" className="form-check-input" checked={this.state.user.badges} type="checkbox" id="badges"/>
                                                <label className="form-check-label" htmlFor="badges">Badges</label>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <div className="form-check">
                                                <input onChange={this.onChange} name="settings" className="form-check-input" checked={this.state.user.settings} type="checkbox" id="settings"/>
                                                <label className="form-check-label" htmlFor="settings">Instellingen</label>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Bewaren</button>
                                    </form>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Testfuncties</h5>
                                    <button className="btn btn-block btn-light" onClick={() => this.simulateClick(1,'IN')}>Counter x IN</button>
                                    <button className="btn btn-block btn-light" onClick={() => this.simulateClick(1,'OUT')}>Counter x OUT</button>
                                </div>
                            </div>
                        </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
};

module.exports = Settings;