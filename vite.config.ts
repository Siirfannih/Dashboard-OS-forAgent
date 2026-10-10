import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The app is served same-origin with the Hermes workspace API (/api/*).
// Production build for the side-by-side rollout: `npm run build:v2` (base /v2/).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { sourcemap: false, chunkSizeWarningLimit: 900 },
});
