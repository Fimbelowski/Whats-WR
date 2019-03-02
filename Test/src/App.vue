<template>
  <div class='app-container'>
    <app-state></app-state>
    <app-footer></app-footer>
  </div>
</template>

<script>
import AppState from './components/AppState.vue';
import AppFooter from './components/AppFooter.vue';

export default {
  name: "app",
  components: {
    AppState,
    AppFooter
  }
};
</script>

<style lang="scss">
  @import 'scss/1-base/_global.scss';
  @import 'scss/2-layout/_layout.scss';
</style>
