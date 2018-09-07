import React from "react";

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kiosk: ''
        }
        this.logIn = this.logIn.bind(this);
        this.onChange = this.onChange.bind(this);
    };
    componentDidMount(){
        this.kioskInput.focus();
    }
    onChange(event) {
        this.setState({
            kiosk: event.target.value
        });
    }
    logIn(){
        if(!this.state.kiosk) return;
        this.props.logIn(this.state.kiosk,function(allowed){
            if(allowed){
                this.props.history.push('/');
                window.location.reload();
            }
        }.bind(this));
    }
    render() {
        return (
            <div id="dashboard-wrapper">
                <div className="container">
                    <h1>Aanmelden</h1>
                        <div className="input-group mb-4">
                            <input onChange={this.onChange} ref={(input) => { this.kioskInput = input; }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" className="form-control form-control-lg" value={this.state.kiosk} type="text" placeholder="Please enter Kiosk ID" />
                        </div>
                        <button type="submit" className="btn btn-primary" type="button" id="button-addon" onClick={this.logIn}>Aanmelden</button>
                </div>
            </div>
        )
    }
};

module.exports = Login;