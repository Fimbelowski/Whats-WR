import Vue from 'vue';
import axios from 'axios';
import App from './App.vue';

Vue.config.productionTip = false;

axios.defaults.baseURL = 'https://www.speedrun.com/api/v1';

new Vue({
  render: h => h(App),
}).$mount('#app');
