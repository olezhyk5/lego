import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // тести лежать поряд з кодом: src/js/**/<module>.test.js
    include: ['src/js/**/*.test.js'],
    environment: 'node',
  },
});
