import React from "react";

class Logout extends React.Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {
        this.props.logOut();
        this.props.history.push('login');
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