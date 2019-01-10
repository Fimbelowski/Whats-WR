Vue.component('player-info-container', {
    props: ['players'],
    template: ' <section class="player-info-container">\
                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>\
                </section>'
});