Vue.component('wr-info', {
    props: ['wr-info'],
    computed: {
        infoString: function() {
            return this.wrInfo.gameTitle + ' - ' + this.wrInfo.categoryName + ' in ' + this.wrInfo.formattedRuntime + '(' + this.wrInfo.timingMethod + ')';
        }
    },
    template:   '<section class="wr-info">\
                    <h2>{{ infoString }}</h2>\
                </section>'
});