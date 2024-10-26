import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import dayjs from 'dayjs';

Vue.prototype.dayjs = dayjs; // 全局使用dayjs
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app')