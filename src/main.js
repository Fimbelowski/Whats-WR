import Vue from 'vue';
import axios from 'axios';
import App from './App.vue';

axios.defaults.baseURL = 'https://www.speedrun.com/api/v1';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
