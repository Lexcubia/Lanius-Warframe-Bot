import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@lanius/server` route and mapper unit tests.
 *
 * @returns Vitest configuration object for this package.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
