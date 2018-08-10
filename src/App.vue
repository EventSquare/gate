<template>
  
</template>

<script>


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

module.exports = App;

</script>