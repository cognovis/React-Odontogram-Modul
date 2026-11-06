// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

import { defineConfig } from 'vitest/config';
import path from 'path';

const packages = path.resolve(__dirname, '../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@cognovis/react-odontogram/style.css': path.resolve(packages, 'odontogram/src/index.css'),
      '@cognovis/react-odontogram': path.resolve(packages, 'odontogram/src/index.ts'),
      '@cognovis/react-odontogram-fhir': path.resolve(packages, 'odontogram-fhir/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
