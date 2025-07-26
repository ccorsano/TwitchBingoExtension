// vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve } from "path";
var vite_config_default = defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        video_overlay: resolve("C:\\Users\\christiancorsano\\Source\\Repos\\TwitchBingo\\twitch-bingo-extension", "video_overlay.html"),
        config: resolve("C:\\Users\\christiancorsano\\Source\\Repos\\TwitchBingo\\twitch-bingo-extension", "config.html"),
        live_config: resolve("C:\\Users\\christiancorsano\\Source\\Repos\\TwitchBingo\\twitch-bingo-extension", "live_config.html"),
        mobile: resolve("C:\\Users\\christiancorsano\\Source\\Repos\\TwitchBingo\\twitch-bingo-extension", "mobile.html")
      }
    },
    assetsDir: "."
  },
  server: {
    https: true,
    port: 8180
  },
  plugins: [
    svelte(),
    basicSsl()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgeyBzdmVsdGUgfSBmcm9tICdAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlJztcclxuaW1wb3J0IGJhc2ljU3NsIGZyb20gJ0B2aXRlanMvcGx1Z2luLWJhc2ljLXNzbCdcclxuaW1wb3J0IHN2ZWx0ZVByZXByb2Nlc3MgZnJvbSAnc3ZlbHRlLXByZXByb2Nlc3MnO1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIGJhc2U6IFwiLi9cIixcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICBpbnB1dDoge1xyXG4gICAgICAgICAgICAgICAgdmlkZW9fb3ZlcmxheTogcmVzb2x2ZShcIkM6XFxcXFVzZXJzXFxcXGNocmlzdGlhbmNvcnNhbm9cXFxcU291cmNlXFxcXFJlcG9zXFxcXFR3aXRjaEJpbmdvXFxcXHR3aXRjaC1iaW5nby1leHRlbnNpb25cIiwgJ3ZpZGVvX292ZXJsYXkuaHRtbCcpLFxyXG4gICAgICAgICAgICAgICAgY29uZmlnOiByZXNvbHZlKFwiQzpcXFxcVXNlcnNcXFxcY2hyaXN0aWFuY29yc2Fub1xcXFxTb3VyY2VcXFxcUmVwb3NcXFxcVHdpdGNoQmluZ29cXFxcdHdpdGNoLWJpbmdvLWV4dGVuc2lvblwiLCAnY29uZmlnLmh0bWwnKSxcclxuICAgICAgICAgICAgICAgIGxpdmVfY29uZmlnOiByZXNvbHZlKFwiQzpcXFxcVXNlcnNcXFxcY2hyaXN0aWFuY29yc2Fub1xcXFxTb3VyY2VcXFxcUmVwb3NcXFxcVHdpdGNoQmluZ29cXFxcdHdpdGNoLWJpbmdvLWV4dGVuc2lvblwiLCAnbGl2ZV9jb25maWcuaHRtbCcpLFxyXG4gICAgICAgICAgICAgICAgbW9iaWxlOiByZXNvbHZlKFwiQzpcXFxcVXNlcnNcXFxcY2hyaXN0aWFuY29yc2Fub1xcXFxTb3VyY2VcXFxcUmVwb3NcXFxcVHdpdGNoQmluZ29cXFxcdHdpdGNoLWJpbmdvLWV4dGVuc2lvblwiLCAnbW9iaWxlLmh0bWwnKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhc3NldHNEaXI6IFwiLlwiXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgICAgaHR0cHM6IHRydWUsXHJcbiAgICAgICAgcG9ydDogODE4MCxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgc3ZlbHRlKCksXHJcbiAgICAgICAgYmFzaWNTc2woKVxyXG4gICAgXVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBR0EsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ0gsZUFBZTtBQUFBLE1BQ1gsT0FBTztBQUFBLFFBQ0gsZUFBZSxRQUFRLG1GQUFtRixvQkFBb0I7QUFBQSxRQUM5SCxRQUFRLFFBQVEsbUZBQW1GLGFBQWE7QUFBQSxRQUNoSCxhQUFhLFFBQVEsbUZBQW1GLGtCQUFrQjtBQUFBLFFBQzFILFFBQVEsUUFBUSxtRkFBbUYsYUFBYTtBQUFBLE1BQ3BIO0FBQUEsSUFDSjtBQUFBLElBQ0EsV0FBVztBQUFBLEVBQ2Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLE9BQU87QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsSUFDUCxTQUFTO0FBQUEsRUFDYjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
