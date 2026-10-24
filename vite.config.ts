import { defineConfig } from 'vitest/config';

// Aggregated by `npm run harness` (scripts/acyx/harness.ts) — no plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
