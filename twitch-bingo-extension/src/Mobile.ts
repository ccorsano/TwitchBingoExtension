import { mount } from 'svelte';
import Mobile from './Mobile.svelte';
// import './index.css';

const app = mount(Mobile,{
  target: document.getElementById('root')!
})

export default app;