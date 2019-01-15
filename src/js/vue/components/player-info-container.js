Vue.component('player-info-container', {
    props: ['players'],
    computed: {
        playersHeader: function() {
            return (this.players.length === 1) ? 'Runner' : 'Runners';
        }
    },
    template: ' <section class="player-info-container">\
                    <div class="player-info-container-header">\
                        <h3>{{ playersHeader }}</h3>\
                    </div>\
                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>\
                </section>'
});