import Config from './Config.svelte';
// import './index.css';

const app = new Config({
  target: document.getElementById('root')!
});

export default app;