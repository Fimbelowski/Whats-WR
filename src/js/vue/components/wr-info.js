Vue.component('wr-info', {
    props: ['wr-info'],
    data: function() {
        return {
            urlToCopy: false,
            showTooltip: false,
            tooltipClicked: false
        }
    },
    computed: {
        gameTitle: function() {
            return (this.wrInfo.game.names.japanese) ? this.wrInfo.game.names.japanese : this.wrInfo.game.names.international;
        },
        primaryTimingMethod: function() {
            if(this.wrInfo.times.primary_t === this.wrInfo.times.ingame_t) {
                return 'IGT';
            } else if(this.wrInfo.times.primary_t === this.wrInfo.times.realtime_t) {
                return 'RTA';
            } else {
                return 'RTA (No Loads)';
            }
        },
        formattedRuntime: function() {
            var runtime = this.wrInfo.times.primary_t;

            // Take a runtime (in seconds) and return it in HH:MM:SS or HH:MM:SS.SSS format.
            var hours = Math.floor(runtime / 3600);
            var minutes = Math.floor((runtime - (hours * 3600)) / 60);
            var seconds = runtime - (hours * 3600) - (minutes * 60);

            if(hours < 10) { hours = '0' + hours; }
            if(minutes < 10) { minutes = '0' + minutes; }
            if(seconds % 1 !== 0) { seconds = seconds.toFixed(3); }
            if(seconds < 10) { seconds = '0' + seconds; }

            return hours + ':' + minutes + ':' + seconds;
        },
        windowLocationHref: function() {
            return window.location.hostname + ':' + window.location.port + '/#' + this.wrInfo.runID;
        },
        tooltipMessage: function() {
            return (this.tooltipClicked) ? 'URL Copied!' : 'Click here to copy the current run to your clipboard!';
        },
        tooltipContainerStyleObj: function() {
            return {
                width: (this.tooltipClicked) ? '80px' : '320px',
                marginLeft: (this.tooltipClicked) ? '-40px' : '-160px'
            };
        }
    },
    methods: {
        copyURLToClipboard: function() {
            // Change urlToCopy to true so that the textarea element will render.
            this.urlToCopy = true;

            // Select the text within the urlTextArea element.
            this.$refs.urlTextArea.select();

            // Copy the string onto the clipboard.
            document.execCommand('copy');

            // Change urlToCopy to false to de-render the textarea element.
            this.urlToCopy = false;
        }
    },
    created: function() {

    },
    template:   '<section class="wr-info-container">\
                    <h2 class="wr-info-text"><a :href="wrInfo.src">{{ gameTitle }} - {{ wrInfo.category.name }}</a> in {{ formattedRuntime }} ({{ primaryTimingMethod }})</h2>\
                    <div class="tooltip" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false; tooltipClicked = false" @click="tooltipClicked = true">\
                        <img class="copy-url-button" src="dist/images/link.png" @click="copyURLToClipboard">\
                        <div class="tooltip-container" :style="tooltipContainerStyleObj" v-if="showTooltip">\
                            <p>{{ tooltipMessage }}</p>\
                        </div>\
                    </div>\
                    <textarea ref="urlTextArea" class="url-text-area">{{ windowLocationHref }}</textarea>\
                </section>'
});