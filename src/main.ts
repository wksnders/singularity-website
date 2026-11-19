import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { startPageScale } from './site/pageScale';
import './styles/index.css';

startPageScale();
createApp(App).use(router).mount('#app');
