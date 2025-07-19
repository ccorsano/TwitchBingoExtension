import Config from './Config.svelte';

const app = new Config({
  target: document.getElementById('root')!
});

export default app;