import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path';
// Note: this can go after moving to svelte >5.30.1
import { svelteSVG } from 'rollup-plugin-svelte-svg';


export default defineConfig({
    base: "./",
    build: {
        rollupOptions: {
            input: {
                video_overlay: resolve(__dirname, 'video_overlay.html'),
                config: resolve(__dirname, 'config.html'),
                live_config: resolve(__dirname, 'live_config.html'),
                mobile: resolve(__dirname, 'mobile.html')
            }
        },
        sourcemap: true,
        assetsDir: "."
    },
    server: {
        https: true,
        port: 8180,
    },
    preview: {
        https: true,
        port: 8180,
    },
    plugins: [
        svelte(),
        basicSsl(),
        svelteSVG({
            svgo:{}
        }),
    ]
});
