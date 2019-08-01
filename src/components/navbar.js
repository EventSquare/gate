import React from "react";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

class NavBar extends React.Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {
        
    }
    isActive(to) {
        if(this.props.history.location.pathname == to) return "active";
        return false;
    }
    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
                <div className="container">
                    <Link className="navbar-brand" exact="true" to="/">EventSquare Gate</Link>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav mr-auto">
                            <li className={"nav-item " + this.isActive('/')}>
                                <Link className="nav-link" exact="true" to="/">Onthaal</Link>
                            </li>
                            { this.props.user.badges &&
                            <li className={"nav-item " + this.isActive('/badges')}>
                                <Link className="nav-link" to="/badges">Badges</Link>
                            </li>
                            }
                            { this.props.user.reports &&
                            <li className={"nav-item " + this.isActive('/reports')}>
                                <Link className="nav-link" to="/reports">Rapporten</Link>
                            </li>
                            }
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                { this.props.user.username }
                                </a>
                                <div className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                    { this.props.user.settings &&
                                        <Link className="dropdown-item" to="/settings">Instellingen</Link>
                                    }
                                    <Link className="dropdown-item" to="/logout"> Afmelden</Link>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        )
    }
};

module.exports = withRouter(NavBar);