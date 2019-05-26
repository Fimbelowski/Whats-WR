import Vue from 'vue';
import Axios from 'axios';
import App from './App.vue';

Vue.config.productionTip = false;

Axios.defaults.baseUrl = 'https://www.speedrun.com/api/v1';

new Vue({
  render: h => h(App),
}).$mount('#app');
