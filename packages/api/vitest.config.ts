import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@lanius/api` unit tests.
 *
 * @returns Vitest configuration object for this package.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
