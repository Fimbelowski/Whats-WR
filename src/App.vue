<template>
  <v-app id="app">
    <v-content>
      <MainView/>
    </v-content>
  </v-app>
</template>

<script>
import MainView from './views/MainView'

export default {
  name: 'app',

  components: {
    MainView,
  },
}
</script>
