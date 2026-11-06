// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-wt5: the FHIR layer is a Dental Core mapping over
// `@cognovis/fhir-sdk` only. No local codegen, no public JSON-bundle API.
//
// Bead odontogram-0w9: the same invariants, now read from the SDK package
// inside the Bun workspace. The HTTP client factory no longer lives beside the
// session SPI — it is its own package, `@cognovis/react-odontogram-fhir`, which the
// SDK must not depend on in either direction of the manifest.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** The SDK package root — vitest runs with the package as its working directory. */
const root = process.cwd();
/** The Bun workspace root, two levels up from `packages/odontogram`. */
const workspaceRoot = resolve(root, "../..");
const FHIR_SDK_CLIENT = "@cognovis/fhir-sdk/client";
const TRANSPORT_PACKAGE = "@cognovis/react-odontogram-fhir";

function read(relative: string): string {
  return readFileSync(resolve(root, relative), "utf8");
}

function readWorkspace(relative: string): string {
  return readFileSync(resolve(workspaceRoot, relative), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function trackedFiles(): string[] {
  return execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

/**
 * Bun's text lockfile is JSONC: it carries trailing commas that `JSON.parse`
 * refuses. Stripping them is enough — the format uses no comments.
 */
function parseBunLock(text: string): {
  workspaces?: Record<string, { name?: string; version?: string }>;
  packages?: Record<string, unknown[]>;
} {
  return JSON.parse(text.replace(/,(\s*[}\]])/g, "$1"));
}

const packageJson = JSON.parse(read("package.json")) as {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
};

describe("odontogram-wt5: FHIR layer is SDK-only", () => {
  it("tracks no generated Dental Core sources and no generator", () => {
    const tracked = trackedFiles();
    expect(tracked.filter((path) => path.startsWith("src/fhir/generated/"))).toEqual([]);
    expect(tracked).not.toContain("tools/generate-dental-core-types.mjs");
    expect(tracked).not.toContain("src/fhir/toFhir.ts");
    expect(tracked).not.toContain("src/fhir/fromFhir.ts");
    expect(existsSync(resolve(root, "src/fhir/generated"))).toBe(false);
    expect(existsSync(resolve(root, "tools/generate-dental-core-types.mjs"))).toBe(false);
  });

  it("uses the tested registry FHIR SDK peer and drops codegen packages", () => {
    expect(packageJson.name).toBe("@cognovis/react-odontogram");
    expect(packageJson.dependencies?.["@cognovis/fhir-sdk"]).toBeUndefined();
    expect(packageJson.peerDependencies?.["@cognovis/fhir-sdk"]).toBe("^0.22.0 || ^0.23.0");
    expect(packageJson.devDependencies?.["@cognovis/fhir-sdk"]).toBe("0.23.0");
    expect(packageJson.dependencies?.["@cognovis/codegen"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@cognovis/codegen"]).toBeUndefined();
    expect(packageJson.dependencies?.["@cognovis/fhir-release"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@cognovis/fhir-release"]).toBeUndefined();
    expect(packageJson.scripts?.["fhir:generate"]).toBeUndefined();

    // One lockfile for the whole workspace, and it is Bun's.
    expect(existsSync(resolve(workspaceRoot, "package-lock.json"))).toBe(false);
    expect(existsSync(resolve(root, "package-lock.json"))).toBe(false);
    const lock = parseBunLock(readWorkspace("bun.lock"));
    expect(lock.workspaces?.["packages/odontogram"]?.name).toBe("@cognovis/react-odontogram");
    expect(lock.workspaces?.["packages/odontogram"]?.version).toBe(packageJson.version);
    const sdk = lock.packages?.["@cognovis/fhir-sdk"] as [string, string, ...unknown[]] | undefined;
    expect(sdk?.[0]).toBe("@cognovis/fhir-sdk@0.23.0");
    expect(sdk?.[1]).toMatch(/^https:\/\/npm\.cognovis\.de\//);
    expect(existsSync(resolve(workspaceRoot, "vendor/cognovis-fhir-sdk-0.22.0.tgz"))).toBe(false);
  });

  it("does not publish a ./fhir JSON-bundle entry", () => {
    expect(packageJson.exports).not.toHaveProperty("./fhir");
    expect(read("vite.lib.config.ts")).not.toMatch(/fhir:\s*path\.resolve/);
    expect(read("src/fhir/index.ts")).not.toMatch(/buildFhirBundle|parseFhirBundle/);
  });

  it("imports Dental Core classes and canonicals from the SDK, never from a local generated tree", () => {
    const fhirAndLive = [
      ...sourceFiles(resolve(root, "src/fhir")),
      ...sourceFiles(resolve(root, "src/live")),
    ];
    const offenders = fhirAndLive.filter((path) =>
      /from\s+["'][^"']*generated[/\\]/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);

    const mapping = read("src/fhir/toFhirDentalCore.ts") + "\n" + read("src/fhir/fromFhirDentalCore.ts");
    expect(mapping).toMatch(/from\s+["']@cognovis\/fhir-sdk\/dental-core["']/);
    expect(read("src/fhir/dentalCoreContract.ts")).toMatch(/from\s+["']@cognovis\/fhir-sdk\/(?:dental-core|canonicals)["']/);
  });

  it("keeps @cognovis/fhir-sdk/client out of the SDK entirely and forbids a second FHIR client package", () => {
    const src = resolve(root, "src");
    const clientOffenders = sourceFiles(src)
      .filter((path) => !path.includes("/__tests__/"))
      .filter((path) => readFileSync(path, "utf8").includes(FHIR_SDK_CLIENT));
    expect(clientOffenders).toEqual([]);
    // The transport module moved out of the SDK with the bead; a file left
    // behind here would be a second, silently diverging copy.
    expect(existsSync(resolve(root, "src/live/aidbox.ts"))).toBe(false);

    // It lives in the transport package, which is where the factory belongs.
    expect(readWorkspace("packages/odontogram-fhir/src/aidbox.ts"))
      .toMatch(new RegExp(`from\\s+["']${FHIR_SDK_CLIENT}["']`));
  });

  it("never depends on the transport package — the arrow points one way only", () => {
    for (const block of [packageJson.dependencies, packageJson.devDependencies, (packageJson as { peerDependencies?: Record<string, string> }).peerDependencies]) {
      expect(Object.keys(block ?? {})).not.toContain(TRANSPORT_PACKAGE);
    }
    const importers = sourceFiles(resolve(root, "src"))
      .filter((path) => !path.includes("/__tests__/"))
      .filter((path) => readFileSync(path, "utf8").includes(TRANSPORT_PACKAGE));
    expect(importers).toEqual([]);
  });

  it("keeps the published session SPI in the SDK, HTTP-free", () => {
    for (const module of ["load.ts", "save.ts", "writePlan.ts", "gateway.ts"]) {
      expect(existsSync(resolve(root, `src/live/${module}`)), module).toBe(true);
    }
    const session = read("src/odontogram.ts");
    for (const module of ["load", "save", "writePlan", "gateway"]) {
      expect(session).toMatch(new RegExp(`from\\s+["']\\./live/${module}["']`));
    }
  });
});
