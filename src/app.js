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
const Reports = require('./views/reports');
const Settings = require('./views/settings');

const Order = require('./views/order');

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
                    <Route path="/reports" component={Reports} />
                    <Route path="/settings" component={Settings} />
                    <Route path="/orders/:id" component={Order} />
                </div>
            </Router>
        )
    }
};

ReactDOM.render(<App />, document.getElementById("app"));