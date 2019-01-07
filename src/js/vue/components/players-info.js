Vue.component('players-info', {
    props: ['players'],
    template: ' <section class="l-players-info">\
                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>\
                </section>'
});