import { defineConfig } from 'vitest/config';
import angular from '@angular/build/vitest';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [], // Add setup files if needed later (e.g., for zone-js testing)
    include: ['src/**/*.spec.ts'],
  },
});
