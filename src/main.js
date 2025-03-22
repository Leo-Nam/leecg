import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import store from './store';
import router from './router';
import * as common from '@/modules/common';

// import { BootstrapVueNext, BModal } from 'bootstrap-vue-next';
// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap-vue/dist/bootstrap-vue.css';

import './assets/styles/default.css';
import './registerServiceWorker';

// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

// Use plugin with optional defaults

// EventBus 생성
import eventBus from '@/eventBus';

const app = createApp(App);

app.use(vuetify);
app.use(router);
app.use(store);
// app.use(BootstrapVueNext);
// app.use(BModal);
app.use(VCalendar, {})

app.config.globalProperties.$showModal = function ({ title, message }) {
  this.$dialog.info({
    title: title || '알림',
    text: message || '내용이 없습니다.',
    persistent: true,
  });
};

const allModules = { ...common };
Object.keys(allModules).forEach((key) => {
  app.config.globalProperties['$' + key] = allModules[key];
});

app.mount('#app');

// Service Worker 등록 및 메시지 처리
if ('serviceWorker' in navigator) {
  console.log('serviceWorker in navigation started...')
  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    console.log('Service Worker registered:', registration);

    // 새 Service Worker가 발견되었을 때 처리
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('New Service Worker found:', newWorker);

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New version available!');
          eventBus.emit('new-version-available');
        }
      });
    });
  });

  // Service Worker 메시지 처리
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
      console.log('New version available from Service Worker!');
      eventBus.emit('new-version-available');
    }
  });
}
