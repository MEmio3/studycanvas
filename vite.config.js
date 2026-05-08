import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    },
    cors: {
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      exposedHeaders: '*'
    }
  }
});
