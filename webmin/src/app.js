
var Client = require('../..//lib/client.js')
const axios = require('axios');

var esq = new Client({
    name: 'Macbook Pro van Willem',
    encryption_key: 'XXXXXX'
});

esq.open('http://localhost:3000');

esq.on('connect', function () {
    console.log('Connected');
})

esq.on('disconnect', function () {
    console.log('Disconnected');
})

var app = new Vue({
    el: '#app',
    data: {
        stats: null,
        counts: null
    },
    computed: {
        totalCrowd: function(){
            if(!this.stats) return 0;
            if(!this.counts) return 0;
            return this.stats.total_scans + this.counts.total_delta;
        }
    },
    methods: {
        fetchStats: function () {
            axios.get('/api/stats')
            .then(function (response) {
                // handle success
                app.stats = response.data;
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        },
        fetchCounts: function () {
            axios.get('/api/counts')
            .then(function (response) {
                // handle success
                app.counts = response.data;
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        }
    }
})

var statsInterval = setInterval(function(){
    app.fetchStats();
    app.fetchCounts();
},10000);

app.fetchStats();
app.fetchCounts();



