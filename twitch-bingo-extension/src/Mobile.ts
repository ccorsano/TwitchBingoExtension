import Mobile from './Mobile.svelte';
import { mount } from "svelte";

const app = mount(Mobile, {
  target: document.getElementById('root')!
})

export default app;