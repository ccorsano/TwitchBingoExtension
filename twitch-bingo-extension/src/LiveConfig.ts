import { mount } from 'svelte';
import LiveConfig from './LiveConfig.svelte'

const app = mount(LiveConfig, {
  target: document.getElementById('root')!
});

export default app;