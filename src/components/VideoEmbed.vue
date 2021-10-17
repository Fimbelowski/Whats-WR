<template>
  <div
    class="iframe-container"
  />
  <div>
    {{ uri }}
  </div>
</template>

<script>
export default {
  name: 'VideoEmbed',

  props: {
    uri: {
      required: true,
      type: String,
    },
  },

  data() {
    return {
      iframe: null,
      iframeContainer: null,
    };
  },

  computed: {
    /** @type {string} */
    iframeSrc() {
      if (this.videoType === 'twitch') {
        let src = 'https://player.twitch.tv/?video=v{videoId}&time={time}&parent={parent}&autoplay=true';

        const twitchRegex = /(?:videos\/|[a-zA-Z0-9-_]+\/v\/)(?<videoId>\d+)(?:.*t=(?<time>[0-9hms]+)|)/i;
        const matches = this.uri.match(twitchRegex);

        const { time = '0h0m0s', videoId } = matches.groups;

        const parent = import.meta.env.DEV
          ? 'localhost'
          : 'whatswr';

        src = src.replace('{videoId}', videoId);
        src = src.replace('{time}', time);
        src = src.replace('{parent}', parent);

        return src;
      }

      let src = 'https://www.youtube.com/embed/{videoId}?start={start}&autoplay=1';

      const youTubeRegex = /(?:youtube.com|youtu.be)\/(?:watch\?v=|)(?<videoId>[a-zA-Z0-9_-]+)(?:.*t=(?<start>\d+)|)/;
      const matches = this.uri.match(youTubeRegex);

      const { start = 0, videoId } = matches.groups;

      src = src.replace('{videoId}', videoId);
      src = src.replace('{start}', start);

      return src;
    },

    /** @type {string} */
    videoType() {
      return this.uri.includes('twitch.tv')
        ? 'twitch'
        : 'youtube';
    },
  },

  watch: {
    uri() {
      this.iframe.remove();
      this.iframe.setAttribute('src', this.iframeSrc);
      this.iframeContainer.insertAdjacentElement('afterbegin', this.iframe);
    },
  },

  mounted() {
    this.iframe = document.createElement('iframe');

    this.iframe.setAttribute('allowfullscreen', 'true');
    this.iframe.setAttribute('height', 720);
    this.iframe.setAttribute('src', this.iframeSrc);
    this.iframe.setAttribute('width', 1280);

    this.iframeContainer = document.querySelector('.iframe-container');

    this.iframeContainer.insertAdjacentElement('afterbegin', this.iframe);
  },
};
</script>
