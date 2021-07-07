<template>
  <img
    alt="Vue logo"
    src="./assets/logo.png"
  >
  <HelloWorld
    msg="Hello Vue 3 + Vite"
  />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
import Game from './models/Game';

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  async created() {
    const games = await Game.search();
    console.log(games);
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
