// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// The transport ships as a thin ES module. Both the FHIR client SDK and the
// chart SDK are externalized: this package adds the Aidbox wiring, it does not
// re-bundle either of the things it wires together.

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    dts({
      bundleTypes: true,
      entryRoot: './src',
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.ts'],
    }),
  ],
  // Bead odontogram-0w9: NO source alias here, deliberately. The chart SDK is
  // externalized below, so the bundle never needs one — and the declaration
  // build must see the SDK the way a consumer does, through the workspace link
  // to its published `dist/index.d.ts`. Aliased to source, the declaration
  // bundler pulled the entire chart SDK in and failed on a `.tsx` outside this
  // package's rootDir. Build the SDK first; `bun run build:lib` at the
  // workspace root does that in order.
  build: {
    lib: {
      entry: { index: path.resolve(__dirname, 'src/index.ts') },
      formats: ['es'],
      fileName: (_format, entryName) => entryName === 'index' ? 'odontogram-fhir.js' : `${entryName}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@cognovis/react-odontogram',
        '@cognovis/fhir-sdk',
        '@cognovis/fhir-sdk/client',
      ],
    },
  },
})
