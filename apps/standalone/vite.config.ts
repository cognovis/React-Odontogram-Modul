// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Cognovis fork - https://github.com/cognovis/odontogram

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { secretGuard } from './secretGuard'

// Bead odontogram-e8h: Content-Security-Policy fuer den ausgelieferten Demo-Build
// (uebernommen aus Zoltans upstream 7f86651). Spec-Politik plus drei additive
// Haertungen: `blob:` in img-src (der PNG/JPG-Export rastert das SVG ueber
// eine Blob-URL <img>), object-src 'none', base-uri 'self'. Geprueft an unserem
// Baum: keine externen Fonts, kein eval/Worker, kein data:-Font - `font-src
// 'self'` und `script-src 'self'` reichen; `style-src 'unsafe-inline'` bleibt
// noetig, weil die Anzeige inline-styles setzt und Vite das CSS inline einspeist.
// NUR im Build (`apply: "build"`): der Dev-Server braucht Vites Inline-Preamble.
//
// `connect-src 'self'` bleibt auch nach odontogram-0w9 richtig, obwohl der
// Live-Modus jetzt in derselben App steckt: der ausgelieferte Demo-Build traegt
// keine Zugangsdaten. Das ist seit cognovis/odontogram#62 keine Annahme mehr,
// sondern geprueft: `secretGuard` bricht den Build ab, sobald ein Geheimnis im
// Bundle landen wuerde (siehe `secretGuard.ts`). Der Basic-Zugang des
// Live-Modus gilt damit nur fuer den Dev-Server.
const CSP_CONTENT =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; " +
  "object-src 'none'; base-uri 'self'";

function injectCsp() {
  return {
    name: "inject-csp",
    apply: "build" as const,
    transformIndexHtml() {
      return [{
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSP_CONTENT },
        injectTo: "head-prepend" as const,
      }];
    },
  };
}

const packages = path.resolve(__dirname, '../../packages');

export default defineConfig(() => ({
  // The guard gets the process environment here and the exposed variables Vite
  // loads from `.env` files through the resolved config. Nothing here loads
  // the env files itself: that would read, and under `DEBUG=vite:env` print,
  // an `.env` the build was told to ignore.
  plugins: [react(), injectCsp(), secretGuard({ ...process.env })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Both workspace packages resolve to their SOURCE, not their `dist/`.
      // This is what lets `bun run dev` start without a prior `build:lib` and
      // lets an edit in either package hot-reload. It is an ALIAS, never a
      // copy: no library or transport source lives under `apps/`, and the
      // packages' published `exports` maps stay untouched.
      '@cognovis/react-odontogram/style.css': path.resolve(packages, 'odontogram/src/index.css'),
      '@cognovis/react-odontogram': path.resolve(packages, 'odontogram/src/index.ts'),
      '@cognovis/react-odontogram-fhir': path.resolve(packages, 'odontogram-fhir/src/index.ts'),
      // `@cognovis/fhir-sdk/client` pulls in server-only SQL and
      // de-identification helpers that import `node:crypto`. The app never
      // calls them; see `src/shims/node-crypto.ts`.
      'node:crypto': path.resolve(__dirname, './src/shims/node-crypto.ts'),
    },
  },
}))
