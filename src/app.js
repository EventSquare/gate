import Vue from 'vue'
import App from './App.vue'

// const routes = [
//     { path: '/', component: require('./pages/dashboard.vue')},
//     { path: '/reports', component: require('./pages/reports.vue') }
// ]

// const router = new VueRouter({
//     routes: routes,
//     mode: 'history'
// })

//router: router,

var app = new Vue({
    el: '#app',
    render: h => h(App)
})