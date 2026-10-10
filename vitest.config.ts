import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Contract tests render every screen against fixtures shaped like the live API (src/test/).
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'], css: false, testTimeout: 15_000 },
});
