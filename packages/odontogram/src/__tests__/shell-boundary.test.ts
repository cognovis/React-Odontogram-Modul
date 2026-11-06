// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-3l1 / odontogram-wt5 AC4: the integration boundary is
// ENFORCED. React state stays the UI-domain document; FHIR conversion stays a
// pure adapter. Aidbox type/method names are the published session SPI; HTTP
// clients and the live app/client factory never enter the shell.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function readSource(relative: string): string {
  return readFileSync(resolve(root, relative), "utf8");
}

/** Executable code only: comments and string literals are stripped, so prose
 *  such as "the UI-domain document." is never mistaken for a DOM access. */
function executableCode(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function fhirSources(): { file: string; text: string }[] {
  const dir = resolve(root, "src/fhir");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .map((f) => ({ file: `src/fhir/${f}`, text: readFileSync(resolve(dir, f), "utf8") }));
}

/** Transport, persistence and deployment-target coupling. None of these may
 *  appear anywhere in the component or its FHIR adapter. */
const TRANSPORT_TOKENS = [
  "aidbox",
  "Aidbox",
  "axios",
  "XMLHttpRequest",
  "EventSource",
  "WebSocket",
  "node-fetch",
  "localStorage",
  "sessionStorage",
  "indexedDB",
];

describe("odontogram-3l1 AC4: FHIR conversion is a pure, optional adapter", () => {
  it("performs no I/O, DOM access or transport from src/fhir", () => {
    for (const { file, text } of fhirSources()) {
      const code = executableCode(text);
      expect(code, `${file} must not call fetch()`).not.toMatch(/\bfetch\s*\(/);
      expect(code, `${file} must not touch the DOM`).not.toMatch(/\bdocument\s*\./);
      expect(code, `${file} must not touch window`).not.toMatch(/\bwindow\s*\./);
      for (const token of TRANSPORT_TOKENS) {
        expect(code, `${file} must not reference ${token}`).not.toContain(token);
      }
    }
  });

  it("keeps the FHIR adapter deterministic (no wall-clock or randomness)", () => {
    for (const { file, text } of fhirSources()) {
      const code = executableCode(text);
      expect(code, `${file} must not read the wall clock`).not.toMatch(/new\s+Date\s*\(/);
      expect(code, `${file} must not read the wall clock`).not.toMatch(/Date\.now\s*\(/);
      expect(code, `${file} must not use randomness`).not.toMatch(/Math\.random\s*\(/);
      expect(code, `${file} must not mint UUIDs`).not.toMatch(/randomUUID/);
    }
  });

  it("never imports the UI or engine modules into the FHIR adapter", () => {
    for (const { file, text } of fhirSources()) {
      expect(text, `${file} must not import the engine`).not.toMatch(
        /from\s+"\.\.\/odontogram"/,
      );
      expect(text, `${file} must not import React`).not.toMatch(/from\s+"react/);
      expect(text, `${file} must not import a component`).not.toMatch(
        /from\s+"\.\.\/(App|PerioChart|PerioSidebar|SettingsModal)"/,
      );
    }
  });
});

describe("odontogram-3l1 AC4: the component carries no transport coupling", () => {
  it("keeps HTTP clients out of the shell; Aidbox names are the published SPI", () => {
    const indexCode = executableCode(readSource("src/index.ts"));
    expect(indexCode, "src/index.ts only re-exports App and must not mention Aidbox").not.toContain("Aidbox");
    expect(indexCode, "src/index.ts only re-exports App and must not mention aidbox").not.toContain("aidbox");

    const surface = ["src/App.tsx", "src/index.ts", "src/session.ts", "src/odontogram.ts"];
    for (const relative of surface) {
      const text = readSource(relative);
      const code = executableCode(text);
      for (const token of ["axios", "XMLHttpRequest", "node-fetch"]) {
        expect(code, `${relative} must not reference ${token}`).not.toContain(token);
      }
      expect(code, `${relative} must not perform network I/O`).not.toMatch(/\bfetch\s*\(/);
      expect(text, `${relative} must not import the FHIR client factory`).not.toMatch(/@cognovis\/fhir-sdk\/client/);
      expect(text, `${relative} must not import the live app or client factory`).not.toMatch(
        /from\s+["'][^"']*\/live\/(?:aidbox|LiveApp|config)/,
      );
    }
  });

  it("documents the integration boundary in the README", () => {
    const readme = readSource("README.md");
    expect(readme).toMatch(/UI-domain document/i);
    expect(readme).toMatch(/Dental Core/i);
    expect(readme).toMatch(/createOdontogramSession/);
    expect(readme).toMatch(/Aidbox/);
  });
});
