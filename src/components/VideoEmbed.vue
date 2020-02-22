<template>
  <div 
    :style="`height: ${height}px; width: ${width}px;`"
    id="video-embed"
    ref="videoEmbed"
  />
</template>

<script>
export default {
  name: 'VideoEmbed',

  props: {
    url: {
      default: '',
      type: String,
    },
  },

  data() {
    return {
      height: 0,
      width: 0,
    };
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

<style lang="scss">
#video-embed {
  width: 100%;
  background-color: yellow;
}
</style>