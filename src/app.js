import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Link, Switch, Redirect } from "react-router-dom";
import Cookies from 'universal-cookie';

import './sass/app.scss';
import 'bootstrap';

const Client = require('./../client')
const cookies = new Cookies();
const axios = require('axios');

//Components
const NavBar = require('./components/navbar')

//Pages
import Login from './views/login';
import Logout from './views/logout';
import Dashboard from './views/dashboard';
import Order from './views/order';
import Customer from './views/customer';
import Badges from './views/badges';
import Shows from './views/shows';
import Show from './views/show';
import Reports from './views/reports';
import Settings from './views/settings';
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authenticating: true,
            user: null
        };
        this.emit = this.emit.bind(this);
        this.logIn = this.logIn.bind(this);
        this.logOut = this.logOut.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.esq = null;
    }
    componentDidMount() {
        this.authenticate();
    }
    initSocket(){
        this.esq = new Client({
            name: this.state.user.username,
            local: true
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
    authenticate() {
        const user_id = cookies.get('user_id') || null;
        if(user_id){
            axios.post('/api/auth',{
                user_id: user_id
            })
            .then(function (response) {
                this.initUser(response.data.user);
            }.bind(this))
            .catch(function (error) {
                if(error.response && error.response.status == 404){
                    cookies.remove('user_id');
                }
                this.toLogin();
            });
        } else {
            console.log('No uuid for user found');
            this.toLogin();
        }
    }
    initUser(user){
        if(this.esq) this.esq.disconnect();
        this.setState({
            user: user,
            authenticating: false
        },function(){
            this.initSocket();
        });
    }
    toLogin(){
        if(window.location.pathname !== '/login'){
            window.location = "/login";
            return;
        }
        this.setState({
            authenticating: false
        });
    }
    logIn(username,callback){
        axios.post('/api/login',{
            username: username
        })
        .then(function (response) {
            cookies.set('user_id', response.data.user.uuid, { path: '/' });
            callback(true);
        }.bind(this))
        .catch(function (error) {
            callback(false);
            console.log(error);
        });
    }
    logOut(callback){
        cookies.remove('user_id');
        this.esq.disconnect();
        this.setState({
            user: null
        });
        callback();
    }
    updateUser(user,callback){
        axios.post('/api/users/' + user.uuid,user)
        .then(function (response) {
            callback(true);
            this.initUser(response.data.user)
        }.bind(this))
        .catch(function (error) {
            callback(false);
            console.log(error);
        });
    }
    render() {
        if(this.state.authenticating){
            return (
                <div>Bezig met aanmelden...</div>
            )
        }
        return (
            <Router>
                <div style={{height: '100%'}}>
                    { this.state.user &&
                    <NavBar user={this.state.user}/>
                    }
                    <Switch>    
                        <Route path="/login" render={(props) => <Login {...props} logIn={this.logIn} />}></Route>
                        <Route path="/logout" render={(props) => <Logout {...props} logOut={this.logOut} />}></Route>
                        <Route path="/orders/:id" render={(props) => <Order {...props} emit={this.emit} />}></Route>
                        <Route path="/customers/:id" render={(props) => <Customer {...props} emit={this.emit} />}></Route>
                        <Route exact path="/shows" component={Shows} />
                        <Route exact path="/badges" render={(props) => <Badges {...props} emit={this.emit} />}/>
                        <Route path="/shows/:id" component={Show} />
                        <Route exact path="/reports" component={Reports} />
                        <Route exact path="/settings" render={(props) => <Settings {...props} emit={this.emit} user={this.state.user} updateUser={this.updateUser} />} />
                        <Route path="/" render={(props) => <Dashboard {...props} emit={this.emit} />}></Route>
                    </Switch>
                </div>
            </Router>
        )
    }
};

ReactDOM.render(<App />, document.getElementById("app"));