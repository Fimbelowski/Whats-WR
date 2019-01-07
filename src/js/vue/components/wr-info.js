Vue.component('wr-info', {
    props: ['wr-info'],
    template:   '<section class="wr-info">\
                    <h2><a :href="wrInfo.src">{{ wrInfo.gameTitle }} - {{ wrInfo.categoryName }}</a> in {{ wrInfo.formattedRuntime }} ({{ wrInfo.timingMethod }})</h2>\
                </section>'
});