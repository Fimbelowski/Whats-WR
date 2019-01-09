Vue.component('video-embed', {
    props: ['video-info'],
    computed:{
        isYtEmbed: function() {
            return this.videoInfo.host === 'youtube';
        },
        videoURL: function() {
            return (this.videoInfo.host === 'youtube') ? 'https://www.youtube.com/embed/' + this.videoInfo.id : 'https://player.twitch.tv/?video=v' + this.videoInfo.id;
        }
    },
    template:   '<section class="video-embed">\
                    <iframe v-if="isYtEmbed" :src="videoURL"\
                    frameborder="0"\
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"\
                    allowfullscreen="true"></iframe>\
                    \
                    <iframe v-else :src="videoURL"\
                    frameborder="0"\
                    scrolling="no"\
                    allowfullscreen="true">\
                    </iframe>\
                </section>'
});