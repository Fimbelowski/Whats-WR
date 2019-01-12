Vue.component('video-embed', {
    props: ['video-url'],
    data: function() {
        return {
            ytRegEx: /(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,
            twitchRegEx: /(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i
        }
    },
    computed: {
        videoHost: function() {
            return (this.ytRegEx.test(this.videoUrl)) ? 'youtube' : 'twitch';
        },
        videoID: function() {
            return (this.videoHost === 'youtube') ? this.ytRegEx.exec(this.videoUrl)[1].replace(/&/, '?').replace(/t=/, 'start=') : this.twitchRegEx.exec(this.videoUrl)[1];
        },
        videoURL: function() {
            var url = '';
            if(this.videoHost === 'youtube') {
                url = 'https://www.youtube.com/embed/' + this.videoID;
                if(this.videoID.includes('?')) {
                    url += '&autoplay=1';
                } else {
                    url += '?autoplay=1';
                }
            } else {
                url = 'https://player.twitch.tv/?video=v' + this.videoID;
            }

            return url;
        }
    },
    template: ' <section class="video-embed-container">\
                    <iframe v-if="videoHost === \'youtube\'" :src="videoURL"\
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