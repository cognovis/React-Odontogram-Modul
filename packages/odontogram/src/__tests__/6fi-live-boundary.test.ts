// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-cpx / odontogram-6fi AC4: the live mode is an APP beside the
// library, never a part of it. The published artifact must stay free of the
// FHIR client SDK, and the transport must stay out of everything the library
// entry point can reach.
//
// Bead odontogram-0w9 made that containment structural rather than textual:
// the app is `apps/standalone` and the transport is `@cognovis/odontogram-fhir`,
// so neither is reachable from this package at all. What remains here is the
// SDK's own half — the session SPI stays, the client factory is absent, and
// nothing under `src/` can reach either the app or the transport. The env-file
// and Vite-key assertions moved to the app, which is where those files live.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const testFileUrl = import.meta.url;
/** The SDK package root, two levels up from `src/__tests__`. */
const PACKAGE_ROOT = fileURLToPath(new URL("../../", testFileUrl));
/** The Bun workspace root. */
const WORKSPACE_ROOT = fileURLToPath(new URL("../../../../", testFileUrl));
const SRC = `${PACKAGE_ROOT}src`;
const FHIR_SDK_CLIENT = "@cognovis/fhir-sdk/client";

function read(relative: string): string {
  return readFileSync(`${PACKAGE_ROOT}${relative}`, "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const packageJson = JSON.parse(read("package.json")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  files: string[];
};

describe("odontogram-cpx AC1: live mode uses the provider-neutral FHIR client", () => {
  it("uses the host's FHIR SDK through a tested peer range and an exact development pin", () => {
    expect(packageJson.dependencies["@cognovis/fhir-sdk"]).toBeUndefined();
    expect(packageJson.peerDependencies["@cognovis/fhir-sdk"]).toBe("^0.22.0 || ^0.23.0");
    expect(packageJson.devDependencies["@cognovis/fhir-sdk"]).toBe("0.23.0");
  });

  it("imports the client surface from the transport package, and only from there", () => {
    const transport = readFileSync(`${WORKSPACE_ROOT}packages/odontogram-fhir/src/aidbox.ts`, "utf8");
    expect(transport).toMatch(new RegExp(`from\\s+["']${FHIR_SDK_CLIENT}["']`));
  });
});

describe("odontogram-6fi AC4: the published library carries no SDK", () => {
  it("ships only dist/, so neither the live app nor its entry page is published", () => {
    expect(packageJson.files).toEqual(["dist"]);
  });

  it("keeps the declaration build out of the app entry, and needs no client-factory exclusion", () => {
    // A tsconfig is JSONC, and this one now carries the note explaining what
    // odontogram-0w9 removed from its exclude list and why. Strip comments and
    // trailing commas rather than forbidding the file from documenting itself.
    const buildConfig = JSON.parse(
      read("tsconfig.build.json")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/,(\s*[}\]])/g, "$1"),
    ) as { exclude: string[] };
    // The app entry and the client factory left this package with
    // odontogram-0w9, so there is nothing here left to exclude by name.
    for (const gone of ["src/live/aidbox.ts", "src/live/LiveApp.tsx", "src/live/config.ts", "src/live/main.tsx", "src/main.tsx"]) {
      expect(existsSync(`${PACKAGE_ROOT}${gone}`), gone).toBe(false);
    }
    expect(buildConfig.exclude).not.toContain("src/live");
    expect(read("vite.lib.config.ts")).not.toMatch(/exclude:\s*\[[^\]]*src\/live\/\*\*/);
  });
});

describe("odontogram-6fi AC4: the SDK client stays out of this package", () => {
  it("imports @cognovis/fhir-sdk/client from no source file at all", () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => !path.includes("/__tests__/"))
      .filter((path) => readFileSync(path, "utf8").includes(FHIR_SDK_CLIENT));
    expect(offenders).toEqual([]);
  });

  it("is not reachable from the library entry except the published Aidbox SPI", () => {
    for (const relative of ["src/index.ts", "src/App.tsx"]) {
      expect(read(relative), `${relative} must not import the live app`).not.toMatch(/from\s+["'][^"']*\/live\//);
      expect(read(relative), `${relative} must not import a FHIR client SDK`).not.toMatch(/@cognovis\/fhir-sdk\/client/);
    }
    for (const relative of ["src/session.ts", "src/odontogram.ts"]) {
      expect(read(relative), `${relative} must not import the live app or client factory`).not.toMatch(/from\s+["'][^"']*\/live\/(?:aidbox|LiveApp|config|main)/);
      expect(read(relative), `${relative} must not import a FHIR client SDK`).not.toMatch(/@cognovis\/fhir-sdk\/client/);
    }
    expect(read("src/odontogram.ts")).toMatch(/from\s+["']\.\/live\/load["']/);
    expect(read("src/odontogram.ts")).toMatch(/from\s+["']\.\/live\/save["']/);
    expect(read("src/odontogram.ts")).toMatch(/from\s+["']\.\/live\/writePlan["']/);
    expect(read("src/odontogram.ts")).toMatch(/from\s+["']\.\/live\/gateway["']/);
    expect(read("src/fhir/index.ts")).not.toMatch(/@cognovis\/fhir-sdk\/client/);
  });

  it("performs no HTTP anywhere under src/live: what is left is the pure session SPI", () => {
    const fetchers = sourceFiles(`${SRC}/live`).filter((path) => {
      const text = readFileSync(path, "utf8");
      return /\bfetch\s*\(|@cognovis\/fhir-sdk\/client/.test(text);
    });
    expect(fetchers).toEqual([]);
    expect(readdirSync(`${SRC}/live`).sort()).toEqual(["gateway.ts", "load.ts", "save.ts", "writePlan.ts"]);
  });
});

/**
 * Every name `src/App.tsx` puts on the public surface.
 *
 * `src/index.ts` is `export * from "./App"`, so this list IS the package's
 * export surface and the bundled `dist/index.d.ts` is built from it. Reading
 * the source rather than the artifact keeps the check honest with no build in
 * front of it; `tools/verify-library-artifacts.mjs` holds the same rule against
 * the built declaration, where a bundler could still widen it.
 */
function publicExportNames(): string[] {
  const source = read("src/App.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  const names: string[] = [];
  for (const [, clause] of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const entry of clause.split(",")) {
      const named = entry.trim().split(/\s+as\s+/).pop()?.trim();
      if (named) names.push(named);
    }
  }
  for (const [, named] of source.matchAll(
    /export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.push(named);
  }
  return names;
}

/**
 * Bead odontogram-0w9, AC2. These five are the session SPI's INTERNALS. Each
 * was briefly published while the standalone app was being split out, on the
 * argument that its type was already public — but AC2 freezes the public
 * surface, and "the app across the workspace needs it" is a reason to move the
 * call site, not to widen what every consumer must henceforth be supported on.
 *
 * They stay exported from their own modules (`live/load`, `live/save`,
 * `live/writePlan`, `document`) so the SDK's own code and its tools reach them
 * by relative path. What must not happen is a consumer reaching them.
 */
const INTERNAL_ONLY = [
  "isSaveAllowed",
  "assembleLoadResult",
  "SEARCHED_RESOURCE_TYPES",
  "buildWritePlan",
  "PAYLOAD_VERSION",
] as const;

describe("odontogram-0w9 AC2: the session SPI's helpers stay internal", () => {
  it("publishes none of them from the library entry", () => {
    const published = publicExportNames();
    expect(published.filter((name) => (INTERNAL_ONLY as readonly string[]).includes(name))).toEqual([]);
  });

  it("still publishes the session SPI they sit behind, so nothing was over-removed", () => {
    const published = publicExportNames();
    for (const kept of ["createOdontogramSession", "LoadResult", "LoadReport", "WritePlan", "WriteOp", "LoadOutcome"]) {
      expect(published, kept).toContain(kept);
    }
  });

  it("keeps each one exported from its own module, for the package's own callers", () => {
    expect(read("src/live/save.ts")).toMatch(/export function isSaveAllowed\b/);
    expect(read("src/live/load.ts")).toMatch(/export (?:function assembleLoadResult|const SEARCHED_RESOURCE_TYPES)\b/);
    expect(read("src/live/writePlan.ts")).toMatch(/export function buildWritePlan\b/);
    expect(read("src/document.ts")).toMatch(/export const PAYLOAD_VERSION\b/);
  });
});

const ADMIN_CREDENTIAL_KEY = /\bAIDBOX_ADMIN\b|\bBOX_ADMIN\b|\bVITE_AIDBOX_ADMIN\b/i;

describe("odontogram-6fi AC5: no credential key reaches the library build", () => {
  it("keeps Vite and Vitest config free of operator and admin credential keys", () => {
    for (const relative of ["vite.lib.config.ts", "vitest.config.ts"]) {
      expect(read(relative), relative).not.toMatch(ADMIN_CREDENTIAL_KEY);
    }
  });

  it("keeps the real .env out of version control, workspace-wide", () => {
    const rules = readFileSync(`${WORKSPACE_ROOT}.gitignore`, "utf8").split("\n").map((line) => line.trim());
    expect(rules).toContain(".env");
  });
});
