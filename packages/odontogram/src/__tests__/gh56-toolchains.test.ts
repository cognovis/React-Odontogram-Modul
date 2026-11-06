// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// cognovis/odontogram#56: the package's own scripts run on Bun.
//
// Nothing else stops a `node <file>` script from coming back. Node stays only behind third-party bins
// (vite, vitest, tsc), which these scripts call by name, never as `node`.

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const scripts: Record<string, string> =
  JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts ?? {};

describe("cognovis/odontogram#56: latest toolchains", () => {
  it("runs no package script under a bare node interpreter", () => {
    const offenders = Object.entries(scripts)
      .filter(([, command]) => /(^|[\s&|;])node\s/.test(command))
      .map(([name, command]) => `${name}: ${command}`);
    expect(offenders).toEqual([]);
  });

  it("runs the artifact contract and the HL7 validation with Bun", () => {
    expect(scripts["verify:lib-artifacts"]).toBe("bun tools/verify-library-artifacts.mjs");
    expect(scripts["fhir:validate"]).toBe("bun tools/fhir-validate.mjs");
  });
});
