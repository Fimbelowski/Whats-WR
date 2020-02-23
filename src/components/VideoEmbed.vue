<template>
  <v-container
    :style="`height: ${height}px; width: ${width}px;`"
    class="pa-0 video-embed"
    fluid
  >
    <v-row
      align="center"
      justify="center"
      style="height: 100%;"
    >
      <iframe
        v-if="!isLoading"
        style="height: 100%; width: 100%;"
      >

      </iframe>
      <v-progress-circular
        indeterminate
        v-else
      />
    </v-row>
  </v-container>
</template>

<script>
import parseUrl from 'parse-url';

export default {
  name: 'VideoEmbed',

  props: {
    videoUrl: {
      default: '',
      type: String,
    },
  },

  data() {
    return {
      height: 0,
      isLoading: false,
      width: 0,
    };
  },

  computed: {
    computedSrc() {
      const parsedUrl = parseUrl(this.videoUrl);

      console.log(parsedUrl);

      return parsedUrl;
    },
  },

  created() {
    this.width = this.$vuetify.breakpoint.width;
    this.height = Math.ceil((this.width * 9) / 16);

    if (this.height > this.$vuetify.breakpoint.height) {
      this.height = this.$vuetify.breakpoint.height;
      this.width = Math.ceil((this.height * 16) / 9);
    }
  },
};
</script>
