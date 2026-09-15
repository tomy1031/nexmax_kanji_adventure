import { defineConfig } from 'vitest/config';

// Kept out of vite.config.ts so the app build does not need vitest's types.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
