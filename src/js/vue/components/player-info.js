Vue.component('player-info', {
    props: ['player'],
    template: ' <div class="player-info">\
                    <a v-if="player.src" :href="player.src"><h3>{{ player.name }}</h3></a>\
                    <h3 v-else>{{ player.name }}</h3>\
                    <div class="player-social-container">\
                        <a v-if="player.twitch" :href="player.twitch"><img src="/dist/images/Glitch_White_RGB.png" class="player-social-icon"></a>\
                        \
                        <a v-if="player.youtube" :href="player.youtube"><img src="/dist/images/yt_icon_mono_dark.png" class="player-social-icon"></a>\
                        \
                        <a v-if="player.twitter" :href="player.twitter"><img src="/dist/images/Twitter_Logo_White.png" class="player-social-icon"></a>\
                    </div>\
                </div>'
});