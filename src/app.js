import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import './sass/app.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

var Client = require('./../lib/client.js')

//Components
const NavBar = require('./components/navbar')

//Pages
const Dashboard = require('./views/dashboard');
const Order = require('./views/order');

const Shows = require('./views/shows');
const Show = require('./views/show');

const Reports = require('./views/reports');
const Settings = require('./views/settings');

//Socket client
var esq = new Client({
    name: 'Macbook Pro van Willem',
    encryption_key: 'XXXXXX'
});

class App extends React.Component {
    componentDidMount() {
        this.initSocket()
    }
    initSocket(){
        esq.open('http://localhost:3000');
        esq.on('connect', function () {
            console.log('Connected');
        })
        esq.on('disconnect', function () {
            console.log('Disconnected');
        })
    }
    render() {
        return (
            <Router>
                <div style={{height: '100%'}}>
                    <NavBar />
                    <Route exact path="/" component={Dashboard} />
                    <Route path="/orders/:id" component={Order} />
                    <Route exact path="/shows" component={Shows} />
                    <Route path="/shows/:id" component={Show} />
                    <Route exact path="/reports" component={Reports} />
                    <Route exact path="/settings" component={Settings} />
                </div>
            </Router>
        )
    }
};

ReactDOM.render(<App />, document.getElementById("app"));