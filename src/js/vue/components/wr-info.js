Vue.component('wr-info', {
    props: ['wr-info'],
    computed: {
        formattedRuntime: function() {
            var runtime = this.wrInfo.runtime;

            // Take a runtime (in seconds) and return it in HH:MM:SS or HH:MM:SS.SSS format.
            var hours = Math.floor(runtime / 3600);
            var minutes = Math.floor((runtime - (hours * 3600)) / 60);
            var seconds = runtime - (hours * 3600) - (minutes * 60);

            if(hours < 10) { hours = '0' + hours; }
            if(minutes < 10) { minutes = '0' + minutes; }
            if(seconds % 1 !== 0) { seconds = seconds.toFixed(3); }
            if(seconds < 10) { seconds = '0' + seconds; }

            return hours + ':' + minutes + ':' + seconds;
        }
    },
    template:   '<section class="wr-info">\
                    <h2><a :href="wrInfo.src">{{ wrInfo.gameTitle }} - {{ wrInfo.categoryName }}</a> in {{  formattedRuntime }} ({{ wrInfo.timingMethod }})</h2>\
                </section>'
});