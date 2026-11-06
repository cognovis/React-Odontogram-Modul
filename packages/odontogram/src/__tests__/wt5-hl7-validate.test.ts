// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// Bead odontogram-wt5 AC2: optional HL7 validator hook. Skips unless
// FHIR_VALIDATOR_JAR points at an existing jar so CI without Java stays green.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const jar = process.env.FHIR_VALIDATOR_JAR;
const enabled = Boolean(jar && existsSync(jar));

describe("odontogram-wt5 AC2: HL7 validator hook", () => {
  it.skipIf(!enabled)("fhir:validate reports 0 errors on observed and planned fixtures", () => {
    const result = spawnSync("npm", ["run", "fhir:validate"], {
      encoding: "utf8",
      env: process.env,
    });
    const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    expect(result.status, out).toBe(0);
    expect(out).toMatch(/observed errors=0/);
    expect(out).toMatch(/planned errors=0/);
  });

  it("stays skipped when FHIR_VALIDATOR_JAR is unset so CI without the jar stays green", () => {
    if (enabled) return;
    expect(jar == null || jar === "" || !existsSync(jar)).toBe(true);
  });
});
