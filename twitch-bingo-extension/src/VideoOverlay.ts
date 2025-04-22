import { mount } from 'svelte';
import VideoOverlay from './VideoOverlay.svelte';
// import './index.css';

const app = mount(VideoOverlay, {
  target: document.getElementById('root')!
})

export default app;