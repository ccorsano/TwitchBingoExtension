import LiveConfig from './LiveConfig.svelte'

const app = new LiveConfig({
  target: document.getElementById('root')!
});

export default app;