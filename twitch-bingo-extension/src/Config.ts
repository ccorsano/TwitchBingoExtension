import Config from './Config.svelte';
import { mount } from "svelte";

const app = mount(Config, {
  target: document.getElementById('root')!
});

export default app;