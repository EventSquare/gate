import React from "react";
import { Link } from "react-router-dom";

class NavBar extends React.Component {
    constructor(props) {
        super(props);
        //this.logOut = this.logOut.bind(this);
    };
    componentDidMount() {
        
    }
    isActive(to) {
        return true;
    }
    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
                <div className="container">
                    <Link className="navbar-brand" exact="true" to="/">EventSquare Gate</Link>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav mr-auto">
                            <li className={"nav-item " + this.isActive('/')}>
                                <Link className="nav-link" exact="true" to="/">Front Desk</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/shows">Shows</Link>
                            </li>
                            {/* <li className="nav-item">
                                <Link className="nav-link" to="/reports">Reports</Link>
                            </li> */}
                            <li className="nav-item">
                                <Link className="nav-link" to="/logout">Logout</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        )
    }
};

module.exports = NavBar;