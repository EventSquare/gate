import React from "react";

class Logout extends React.Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {
        this.props.logOut(function(){
            this.props.history.push('login');
        }.bind(this));
    }
    render() {
        return (
            <div id="dashboard-wrapper">
                <div className="container">
                    <h1>Bezig met afmelden...</h1>
                </div>
            </div>
        )
    }
};

module.exports = Logout;