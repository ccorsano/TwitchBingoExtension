import LiveConfig from './LiveConfig.svelte'
import { mount } from "svelte";

const app = mount(LiveConfig, {
  target: document.getElementById('root')!
});

export default app;