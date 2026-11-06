#!/usr/bin/env bun
// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// Bead odontogram-wt5 AC2: env-gated HL7 Validator 6.10.1 run against
// representative OBSERVED and PLANNED Dental Core collections. Missing jar or
// IG is a skip (exit 0), not a CI failure. Does not commit fixtures or the jar.

import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

// Dental Core release the pinned @cognovis/fhir-sdk carries (0.23.0 -> 0.10.0);
// `gh35-review1.test.ts` fails when the SDK moves and this default does not.
const DENTAL_CORE_VERSION = "0.10.0";

const jar =
  process.env.FHIR_VALIDATOR_JAR ||
  join(homedir(), ".fhir", "validator_cli-6.10.1.jar");

function resolveIg() {
  if (process.env.FHIR_DENTAL_CORE_IG) return process.env.FHIR_DENTAL_CORE_IG;
  const packageDir = join(homedir(), ".fhir", "packages", `de.cognovis.fhir.dental.core#${DENTAL_CORE_VERSION}`);
  const tarball = join(homedir(), ".fhir", `de.cognovis.fhir.dental.core-${DENTAL_CORE_VERSION}.tgz`);
  if (existsSync(packageDir)) return packageDir;
  return tarball;
}

function skip(reason) {
  process.stdout.write(`fhir:validate skipped: ${reason}\n`);
  process.exit(0);
}

if (!existsSync(jar)) {
  skip(`validator jar not found (${jar}). Set FHIR_VALIDATOR_JAR.`);
}

const javaProbe = spawnSync("java", ["-version"], { encoding: "utf8" });
if (javaProbe.error) {
  skip(`java is not available (${javaProbe.error.message}).`);
}

const ig = resolveIg();
if (!existsSync(ig)) {
  skip(`Dental Core IG not found (${ig}). Set FHIR_DENTAL_CORE_IG.`);
}

function validate(bundle) {
  const result = spawnSync(
    "java",
    ["-Xmx4g", "-jar", jar, bundle, "-version", "4.0.1", "-ig", ig, "-tx", "n/a", "-output-style", "compact"],
    { encoding: "utf8" },
  );
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(out);
  const errors = (out.match(/: Error -/g) ?? []).length;
  return { status: result.status ?? 1, errors };
}

const workdir = mkdtempSync(join(tmpdir(), "odontogram-validator-"));
try {
  const emit = spawnSync("bun", ["tools/emit-hl7-validator-fixtures.ts", workdir], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (emit.status !== 0) {
    process.exitCode = emit.status ?? 1;
  } else {
    const observed = validate(join(workdir, "observed-dental-core.json"));
    const planned = validate(join(workdir, "planned-dental-core.json"));
    process.stdout.write(
      `fhir:validate observed errors=${observed.errors} planned errors=${planned.errors}\n`,
    );
    process.exitCode = observed.errors !== 0 || planned.errors !== 0 ? 1 : 0;
  }
} finally {
  rmSync(workdir, { recursive: true, force: true });
}
