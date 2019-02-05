Vue.component('player-info', {
    props: ['player'],
    computed: {
        name: function() {
            if(this.player.rel) {
                return this.player.name;
            } else {
                if(this.player.names.japanese && this.player.names.international) {
                    return this.player.names.japanese + ' (' + this.player.names.international + ')';
                } else if(this.player.names.japanese) {
                    return this.player.names.japanese;
                } else {
                    return this.player.names.international;
                }
            }
        },
        hasSocial: function() {
            return !!(this.player.twitch || this.player.youtube || this.player.twitter);
        }
    },
    template: ' <div class="player-info">\
                    <a v-if="player.weblink" :href="player.weblink"><h3 class="player-text">{{ name }}</h3></a>\
                    <h3 v-else class="player-text">{{ name }}</h3>\
                    <div v-if="hasSocial" class="player-social-container">\
                        <a v-if="player.twitch" :href="player.twitch.uri"><img src="/dist/images/Glitch_White_RGB.png" class="player-social-icon"></a>\
                        \
                        <a v-if="player.youtube" :href="player.youtube.uri"><img src="/dist/images/yt_icon_mono_dark.png" class="player-social-icon"></a>\
                        \
                        <a v-if="player.twitter" :href="player.twitter.uri"><img src="/dist/images/Twitter_Logo_White.png" class="player-social-icon"></a>\
                    </div>\
                </div>'
});