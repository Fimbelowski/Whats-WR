<template>
  <template
    v-if="videoType === 'twitchVod'"
  >
    <iframe
      :src="iframeSrc"
      allowfullscreen="true"
      height="720"
      width="1280"
    />
    <div>
      {{ uri }}
    </div>
  </template>
  <template
    v-else-if="videoType === 'twitchClip'"
  >
    Twitch Clip ({{ uri }})
  </template>
  <template
    v-else
  >
    YouTube Video ({{ uri }})
  </template>
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

  computed: {
    /** @type {string} */
    iframeSrc() {
      if (this.videoType === 'twitchVod') {
        let src = 'https://player.twitch.tv/?video=v{videoId}&time={time}&parent={parent}&autoplay=true';

        const twitchVodRegex = /videos\/(?<videoId>\d+)(?:.*t=(?<time>[0-9hms]+)|)/i;
        const matches = this.uri.match(twitchVodRegex);

        const { time, videoId } = matches.groups;

        const parent = import.meta.env.DEV
          ? 'localhost'
          : 'whatswr';

        src = src.replace('{videoId}', videoId);
        src = src.replace('{time}', time || '0h0m0s');
        src = src.replace('{parent}', parent);

        return src;
      }

      return '';
    },

    /** @type {string} */
    videoType() {
      if (this.uri.includes('twitch.tv')) {
        return this.uri.includes('/c/')
          ? 'twitchClip'
          : 'twitchVod';
      }

      return 'youtube';
    },
  },
};
</script>
