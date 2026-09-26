import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Read VITE_* variables from the repo-root .env (non-VITE_ variables are never exposed).
  envDir: '..',
  server: {
    host: true,
    port: 5173,
    // Bind-mounted volumes on macOS/Windows Docker need polling for hot reload.
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
  },
});
