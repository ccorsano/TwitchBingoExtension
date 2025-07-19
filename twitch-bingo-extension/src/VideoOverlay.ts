import VideoOverlay from './VideoOverlay.svelte';
import { mount } from "svelte";

const app = mount(VideoOverlay, {
  target: document.getElementById('root')!
})

export default app;