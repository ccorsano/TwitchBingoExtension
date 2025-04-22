import { mount } from 'svelte';
import Config from './Config.svelte';
// import './index.css';

const app = mount(Config,{
  target: document.getElementById('root')!
});

export default app;