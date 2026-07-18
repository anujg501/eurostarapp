import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Express server serves the built files from docs/admin-react at /admin/,
// same-origin with the API — so the app just calls "/admin/..." with no host.
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: '../docs/admin-react',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    // `npm run dev` here talks to the local backend on :4000.
    proxy: {
      '^/(auth|admin|catalog|users|inventory|announcements)': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
