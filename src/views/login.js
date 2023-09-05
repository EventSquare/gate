import React from "react";

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: ''
        }
        this.logIn = this.logIn.bind(this);
        this.onChange = this.onChange.bind(this);
    };
    componentDidMount(){
        this.kioskInput.focus();
    }
    onChange(event) {
        this.setState({
            username: event.target.value
        });
    }
    logIn(e){
        e.preventDefault();
        if(!this.state.username) return;
        this.props.logIn(this.state.username,function(success){
            if(success){
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
                    <form onSubmit={this.logIn}>
                        <div className="input-group mb-4">
                            <input onChange={this.onChange} ref={(input) => { this.kioskInput = input; }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" className="form-control form-control-lg" value={this.state.username} type="text" placeholder="Vul je gebruikersnaam in" />
                        </div>
                        <button type="submit" className="btn btn-primary" type="button" id="button-addon" onClick={this.logIn}>Aanmelden</button>
                    </form>
                </div>
            </div>
        )
    }
};

export default Login;