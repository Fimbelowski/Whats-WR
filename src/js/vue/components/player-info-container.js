Vue.component('player-info-container', {
    props: ['players'],
    computed: {
        playersHeader: function() {
            return (this.players.data.length === 1) ? 'Runner' : 'Runners';
        }
    },
    template: ' <section class="player-info-container">\
                    <div class="player-info-container-header">\
                        <h3 class="player-text">{{ playersHeader }}</h3>\
                    </div>\
                    <player-info v-for="player in players.data" :player="player" :key="player.id"></player-info>\
                </section>'
});