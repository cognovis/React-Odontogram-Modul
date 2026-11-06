// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
//
// Library build config — produces the distributable npm package artifacts.
//
// Kept SEPARATE from `vite.config.ts` (the demo/GitHub-Pages app build) so
// `npm run build` keeps emitting the demo site unchanged, while
// `npm run build:lib` emits the consumable library. React and every runtime
// dependency are externalized so the bundle ships only this component's own
// code + inlined SVG/CSS — no second copy of React.
// vite-plugin-dts emits bundled declarations for the root library entry.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Bundled dist/index.d.ts declarations (via
      // @microsoft/api-extractor) instead of a tree of per-file .d.ts — hides internal __*ForTest declarations and
      // resolves cleanly under any moduleResolution (no extensionless relative
      // imports in the output). NOTE: vite-plugin-dts v5 calls this option
      // `bundleTypes` (v4 called it `rollupTypes`).
      bundleTypes: true,
      entryRoot: './src',
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
      // Bead odontogram-0w9: the app and the FHIR client factory used to be
      // kept out of the published types by NAMING them here. They are now in
      // their own packages (apps/standalone, packages/odontogram-fhir), so the
      // exclusion is structural rather than a list somebody has to maintain —
      // and a list of files that no longer exist would go on passing in
      // silence. What is left under `src/live` is the HTTP-free session SPI:
      // gateway, load, save, writePlan. Those ARE published.
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => entryName === 'index' ? 'odontogram.js' : `${entryName}.js`,
      // Guarantee a stable, single stylesheet name (dist/style.css).
      cssFileName: 'style',
    },
    // One combined stylesheet instead of per-chunk CSS.
    cssCodeSplit: false,
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Do NOT bundle React or runtime deps — the consumer provides
      // React (peer).
      // `@cognovis/fhir-sdk` is a runtime dependency for mapping + session
      // Aidbox load/save. The published root entry must not pull `/client`.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@cognovis/fhir-sdk',
        '@cognovis/fhir-sdk/client',
        '@cognovis/fhir-sdk/dental-core',
        '@cognovis/fhir-sdk/canonicals',
      ],
    },
  },
})
