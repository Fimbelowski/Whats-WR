Vue.component('player-info', {
    props: ['player'],
    computed: {
        isUser: function() {
            return this.player.rel !== 'guest';
        }
    },
    template: ' <div>\
                    <a v-if="isUser" :href="player.src"><h3>{{ player.name }}</h3></a>\
                    <h3 v-else>{{ player.name }}</h3>\
                    \
                    <a v-if="player.twitch" :href="player.twitch"><p>Twitch</p></a>\
                    <p v-else>No Twitch</p>\
                    \
                    <a v-if="player.youtube" :href="player.youtube"><p>YouTube</p></a>\
                    <p v-else>No YouTube</p>\
                    \
                    <a v-if="player.twitter" :href="player.twitter"><p>Twitter</p></a>\
                    <p v-else>No Twitter</p>\
                </div>'
});