Vue.component('player-info-container', {
    props: ['players'],
    template: ' <section class="player-info-container">\
                    <div class="player-info-container-header">\
                        <h3>Runners</h3>\
                    </div>\
                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>\
                </section>'
});