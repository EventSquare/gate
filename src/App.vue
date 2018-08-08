<template>
  <div>
    <h1>Hello World!</h1>
    
    <navbar></navbar>
    <!-- <router-view></router-view> -->
    <div class="container">
      <div class="row" v-if="totalCrowd">
          <div class="col-sm">
              <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 45px; border-radius: 5px; padding: 20px;">Total on site <b>{{ totalCrowd }}</b></div>
          </div>
      </div>
      <div class="row" v-if="counts">
          <div class="col-sm">
              <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 30px; border-radius: 5px; padding: 20px;">{{ counts.total_delta > 0 ? 'Re-entry' : 'Outside' }} <b>{{ Math.abs(counts.total_delta) }}</b></div>
          </div>
          <div class="col-sm" v-if="counts">
              <div class="text-center bg-primary mb-3" style="color: #FFFFFF; font-size: 30px; border-radius: 5px; padding: 20px;">Not scanned <b>{{ totalTickets.remaining }}</b></div>
          </div>
      </div>
      <div class="row">
        <div class="col-sm">
            <table class="table table-bordered" v-if="stats">
                <thead class="thead-dark">
                  <tr>
                    <th scope="col">Ticket</th>
                    <th scope="col">Scans</th>
                    <th scope="col">Total</th>
                    <th scope="col">Remaining</th>
                    <th scope="col">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="type in stats.types" style="cursor: pointer;" v-on:click.prevent.stop="toggleType(type.id)" v-bind:class="{active : isTypeActive(type.id)}">
                    <td><b>{{ type.name }}</b></td>
                    <td>{{ type.tickets_scanned }}</td>
                    <td>{{ type.tickets_total }}</td>
                    <td>{{ type.tickets_total - type.tickets_scanned }}</td>
                    <td>{{ type.tickets_percentage ? type.tickets_percentage + " %" : ''  }}</td>
                  </tr>
                  <tr style="background-color: #EEEEEE">
                      <td><b>Total</b></td>
                      <td>{{ totalTickets.scans }}</td>
                      <td>{{ totalTickets.tickets }}</td>
                      <td>{{ totalTickets.remaining }}</td>
                      <td></td>
                  </tr>
                </tbody>
            </table>
            <h3 class="mb-3">Visitor flow</h3>
            <table class="table" v-if="counts">
                <thead class="thead-dark">
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>IN</b></td>
                    <td>{{ counts.total_in }}</td>
                  </tr>
                  <tr>
                      <td><b>OUT</b></td>
                      <td>{{ counts.total_out }}</td>
                  </tr>
                  <!-- <tr>
                      <td><b>DELTA</b></td>
                      <td>{{ counts.total_delta }}</td>
                  </tr> -->
                </tbody>
            </table>

        </div>
      </div>
    </div>
  </div>
</template>

<script>

var Client = require('./../lib/client.js')
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

var App = {
    //router: router,
    data: {
        stats: null,
        counts: null,
        activeTypes: []
    },
    components: {
        'navbar': require('./components/navbar.vue'),
    },
    computed: {
        totalTickets: function(){
            var total = {
                scans: 0,
                tickets: 0,
                remaining: 0
            };
            if(!this.stats) return total;
            
            var filter = false;
            if(this.activeTypes.length > 0) filter = true;
            for(var i=0;i<this.stats.types.length;i++){
                if(filter && !this.isTypeActive(this.stats.types[i].id)){
                    
                } else {
                    total.scans +=  this.stats.types[i].tickets_scanned;
                    total.tickets +=  this.stats.types[i].tickets_total;
                    total.remaining +=  (this.stats.types[i].tickets_total - this.stats.types[i].tickets_scanned);
                }
            }
            return total;
        },
        totalCrowd: function(){
            if(!this.stats) return 0;
            if(!this.counts) return 0;
            return this.stats.total_scans + this.counts.total_delta;
        }
    },
    methods: {
        toggleType: function(type_id) {
            var index = this.activeTypes.indexOf(type_id);
            if(index == -1){
                this.activeTypes.push(type_id);
            } else {
                var activeTypes = this.activeTypes;
                activeTypes.splice(index, 1);
                this.activeTypes = activeTypes;
            }
        },
        isTypeActive(type_id){
            return this.activeTypes.indexOf(type_id) !== -1;
        },
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
}

// var statsInterval = setInterval(function(){
//     App.fetchStats();
//     App.fetchCounts();
// },10000);

// App.fetchStats();
// App.fetchCounts();

module.exports = App;

</script>