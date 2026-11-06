// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

// Bead odontogram-0w9: the repository became a bun workspace, so "the tree" is
// two levels up from this package. The residue scan below is a statement about
// the WHOLE workspace — a removed dialect that survives in the app or in the
// transport package is just as much residue — while the package's own README,
// CHANGELOG and language guides are read relative to the package that owns
// them. The paths stay ENUMERATED rather than walked from the workspace root:
// `iso/` holds downloaded FHIR package tarballs whose own names carry the
// removed dialect, and a walk would report those as our residue.
const workspaceRoot = resolve(root, "../..");

function source(relative: string): string {
  return readFileSync(resolve(root, relative), "utf8");
}

function workspaceSource(relative: string): string {
  return readFileSync(resolve(workspaceRoot, relative), "utf8");
}

const removedDialectPattern = new RegExp(["dental", "de"].join("-"), "i");

function filesUnder(base: string, relative: string): string[] {
  return readdirSync(resolve(base, relative), { withFileTypes: true }).flatMap((entry) => {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") return [];
      return filesUnder(base, child);
    }
    return /\.(?:md|mjs|py|ts|tsx|json|ya?ml)$/i.test(entry.name) ? [child] : [];
  });
}

function distributableFiles(relative: string): string[] {
  return filesUnder(root, relative);
}

function executableCode(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

describe("optional FHIR package boundary", () => {
  it("keeps the document contract independent from the FHIR adapter", () => {
    const documentSource = source("src/document.ts");
    const documentCode = executableCode(documentSource);

    expect(documentCode).not.toMatch(/from\s+["'][^"']*fhir/);
    expect(documentCode).not.toMatch(/https?:\/\//);
    expect(documentSource).toContain("export type OdontogramDocument");
    expect(documentSource).toContain("Per-tooth record as produced by the engine's serializeState().");
    expect(documentSource).toContain("The serialized odontogram export payload");
    expect(documentSource).toContain("Serialized examination identity/context");
    expect(documentSource).toContain("The payload/document version this engine writes");
  });

  it("does not publish a JSON-bundle FHIR entry", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      exports: Record<string, unknown>;
    };

    expect(packageJson.exports).toHaveProperty(".");
    expect(packageJson.exports).not.toHaveProperty("./fhir");
    expect(source("src/fhir/index.ts")).not.toContain("buildFhirBundle");
    expect(source("src/fhir/index.ts")).toContain("buildDentalCoreBundle");
    expect(source("vite.lib.config.ts")).not.toContain("fhir: path.resolve");
    expect(source("src/fhir/index.ts")).not.toMatch(new RegExp(`${["Dental", "De"].join("")}|${removedDialectPattern.source}`));
  });

  it("maps each package type entry to a declared library entry", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      types: string;
      exports: Record<string, { types?: string }>;
    };
    const viteLibraryConfig = source("vite.lib.config.ts");

    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports["."]?.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports["./fhir"]).toBeUndefined();
    expect(viteLibraryConfig).toMatch(/index:\s*path\.resolve\(__dirname, ['"]src\/index\.ts['"]\)/);
    expect(viteLibraryConfig).not.toMatch(/fhir:\s*path\.resolve\(__dirname, ['"]src\/fhir\/index\.ts['"]\)/);
  });

  it("keeps document types and payload version in one source module", () => {
    const adapterTypes = source("src/fhir/types.ts");

    expect(adapterTypes).toContain('from "../document"');
    expect(adapterTypes).not.toContain("export interface ToothRecord");
    expect(adapterTypes).not.toContain("export const PAYLOAD_VERSION");
  });

  // Bead odontogram-6fi narrowed this invariant, deliberately and in one
  // direction only. What must stay out is the SHIPPED graph: `dependencies` is
  // what a consumer installs, and nothing commercial may appear there. The
  // Aidbox live mode was a dev-server app beside the library that needed a
  // vendor SDK to talk to a server at all — a devDependency, reachable from no
  // library entry point and not in `files`. Bead odontogram-0w9 made that
  // containment structural: the app is `apps/standalone` and the transport is
  // `@cognovis/react-odontogram-fhir`, neither of them this package.
  // `6fi-live-boundary.test.ts` holds that; here only the shipped graph is
  // asserted.
  it("keeps commercial integration modules out of the shipped package graph", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    for (const prohibited of ["aidbox"]) {
      expect(Object.keys(packageJson.dependencies ?? {}).some((name) => name.toLowerCase().includes(prohibited))).toBe(false);
    }
    // A development dependency may be the SDK, but never a host application.
    for (const prohibited of ["aidbox"]) {
      expect(Object.keys(packageJson.devDependencies ?? {}).some((name) => name.toLowerCase().includes(prohibited))).toBe(false);
    }
  });

  it("maps Dental Core through the SDK without a local generator", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies?.["@cognovis/fhir-sdk"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@cognovis/fhir-sdk"]).toBe("0.23.0");
    expect(packageJson.devDependencies?.["@cognovis/codegen"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@cognovis/fhir-release"]).toBeUndefined();
    expect(packageJson.scripts?.["fhir:generate"]).toBeUndefined();
    expect(existsSync(resolve(root, "tools/generate-dental-core-types.mjs"))).toBe(false);
    expect(source("src/fhir/dentalCoreContract.ts")).toMatch(/from\s+["']@cognovis\/fhir-sdk\//);
  });

  it("exposes one Dental Core seam without a selectable legacy implementation", () => {
    const publicTypes = source("src/fhir/types.ts");
    const publicEntry = source("src/fhir/index.ts");
    const session = source("src/odontogram.ts");

    expect(`${publicTypes}\n${publicEntry}\n${session}`).not.toMatch(/FhirDialect|resolveFhirDialect|UnsupportedFhirDialect/);
    expect(publicTypes).not.toMatch(/\bdialect\??:/);
    expect(session).not.toMatch(/\bdialect\s*:/);
    for (const removed of [
      "src/fhir/codesystems.ts",
      "src/fhir/iso3950.ts",
      "src/fhir/primitives.ts",
      "src/fhir/toFhirPerio.ts",
      "src/registry/fhir.ts",
      "src/registry/fromFhir.ts",
      "src/registry/legacyAxes.ts",
      "src/__tests__/legacy-fhir-golden.test.ts",
      "src/__tests__/fixtures/legacy-fhir-golden.json",
    ]) {
      expect(existsSync(resolve(root, removed)), removed).toBe(false);
    }
  });

  it("contains no removed-dialect implementation, generated artifact, or documentation residue", () => {
    const residue = new RegExp([
      `\\b${["fhir", "dental", "de"].join("-")}\\b`,
      `\\b${["dental", "de"].join("[-_.]")}\\b`,
      `\\b${["de", "cognovis", "fhir", "dental"].join("\\.")}(?!\\.core\\b)`,
      ["\\bdental", "De(?!vice)"].join(""),
    ].join("|"), "i");
    const own = ["src", "tools", "lang", "prototypes"]
      .flatMap(distributableFiles)
      .concat(["README.md", "CHANGELOG.md", "package.json"]);
    for (const file of own) {
      expect(source(file), `Removed dialect residue in ${file}`).not.toMatch(residue);
    }

    // The workspace's shared documentation, the app and the transport package.
    const shared = ["docs", "packages/odontogram-fhir/src", "apps/standalone/src"]
      .flatMap((dir) => filesUnder(workspaceRoot, dir))
      .concat(["package.json"]);
    for (const file of shared) {
      expect(workspaceSource(file), `Removed dialect residue in ${file}`).not.toMatch(residue);
    }
  });

  it("documents the current Dental Core preservation contract in every language guide", () => {
    const guides = readdirSync(resolve(root, "lang"))
      .filter((name) => /^README-.*\.md$/.test(name))
      .map((name) => `lang/${name}`);

    expect(guides).toHaveLength(12);
    for (const guide of guides) {
      const text = source(guide);
      for (const required of [
        "de.cognovis.fhir.dental.core#0.10.0",
        "odontogram-dental-core-0.6.0",
        "rootPostType",
        "Goal",
        "implantPosition",
        "endoCanals",
        "apicalRoot",
      ]) expect(text, guide).toContain(required);
    }

    const layoutGuides = guides.filter((guide) => source(guide).includes("`src/registry/`"));
    expect(layoutGuides).toHaveLength(11);
    for (const guide of layoutGuides) {
      const text = source(guide);
      for (const currentModule of [
        "toFhirDentalCore.ts", "fromFhirDentalCore.ts", "dentalCoreContract.ts", "dentalCoreLocalCoding.ts",
      ]) expect(text, guide).toContain(currentModule);
      expect(text, guide).toContain("@cognovis/fhir-sdk");
      for (const removedModule of ["toFhir.ts", "fromFhir.ts", "codesystems.ts", "primitives.ts", "registry/fhir.ts", "registry/fromFhir.ts", "fieldMappings.ts"]) {
        expect(text, guide).not.toContain(removedModule);
      }
    }
  });
});
