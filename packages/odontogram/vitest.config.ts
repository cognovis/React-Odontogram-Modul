// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // The full-app grid tests rebuild #toothGrid (async occlusal-template loads
    // via import.meta.glob + DOMParser over ~46 SVGs) on every render. That is
    // several seconds per render in jsdom and slower still on the shared CI
    // runner, where the 5s/10s defaults deterministically expire. Give tests and
    // setup/teardown hooks CI headroom; genuinely slow single tests still carry
    // their own larger per-test timeout.
    testTimeout: 15000,
    hookTimeout: 20000,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
