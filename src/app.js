import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import Cookies from 'universal-cookie';

import './sass/app.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

const Client = require('./../client')
const cookies = new Cookies();

//Components
const NavBar = require('./components/navbar')

//Pages
const Login = require('./views/login');
const Logout = require('./views/logout');
const Dashboard = require('./views/dashboard');
const Order = require('./views/order');
const Customer = require('./views/customer');
const Badges = require('./views/badges');

const Shows = require('./views/shows');
const Show = require('./views/show');

const Reports = require('./views/reports');
const Settings = require('./views/settings');

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kiosk: cookies.get('kiosk') || null
        };
        this.emit = this.emit.bind(this);
        this.logIn = this.logIn.bind(this);
        this.logOut = this.logOut.bind(this);
        this.esq = null;
    }
    componentDidMount() {
        if(this.state.kiosk){
            this.initSocket();
        }
    }
    initSocket(){
        this.esq = new Client({
            name: this.state.kiosk,
            encryption_key: 'd4ce302a-5bc0-4414-a06f-8471e7a0d1ad'
        });
        this.esq.on('connect', function () {
            console.log('Connected');
        })
        this.esq.on('disconnect', function () {
            console.log('Disconnected');
        })
    }
    emit(event,data){
        this.esq.emit(event,data);
    }
    logIn(kiosk,callback){
        cookies.set('kiosk', kiosk, { path: '/' });
        this.setState({
            kiosk: kiosk
        },function(){
            callback(true);
        });
    }
    logOut(){
        cookies.remove('kiosk');
        this.setState({
            kiosk: null
        });
    }
    renderApp(){
        if(this.state.kiosk){
            return (
                <div>
                    <NavBar/>
                    <Route exact path="/" render={(props) => <Dashboard {...props} emit={this.emit} />}></Route>
                    <Route path="/orders/:id" render={(props) => <Order {...props} emit={this.emit} />}></Route>
                    <Route path="/customers/:id" render={(props) => <Customer {...props} emit={this.emit} />}></Route>
                    <Route exact path="/shows" component={Shows} />
                    <Route exact path="/badges" component={Badges} />
                    <Route path="/shows/:id" component={Show} />
                    <Route exact path="/reports" component={Reports} />
                    <Route exact path="/settings" component={Settings} />
                </div>
            )
        } else {
            return (
                <div>
                    <Route exact path="/login" render={(props) => <Login {...props} logIn={this.logIn} />}></Route>
                    <Redirect to="/login"/>
                </div>
            )
        }
    }
    render() {
        return (
            <Router>
                <div style={{height: '100%'}}>
                    { this.renderApp() }
                    <Route exact path="/logout" render={(props) => <Logout {...props} logOut={this.logOut} />}></Route>
                </div>
            </Router>
        )
    }
};

ReactDOM.render(<App />, document.getElementById("app"));