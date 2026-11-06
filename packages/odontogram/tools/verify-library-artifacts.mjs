// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (packageJson.exports["./fhir"]) {
  throw new Error("The published package must not expose a ./fhir JSON-bundle entry");
}
const typeEntries = [
  packageJson.types,
  ...Object.values(packageJson.exports).flatMap((entry) => entry.types ? [entry.types] : []),
];
const removedDialectSymbols = [
  ["Fhir", "Dialect"].join(""),
  ["Fhir", "CodecOptions"].join(""),
  ["Unsupported", "Fhir", "Dialect"].join(""),
];

for (const typeEntry of typeEntries) {
  const artifact = resolve(root, typeEntry);
  if (!existsSync(artifact)) {
    throw new Error(`Missing declaration artifact: ${typeEntry}`);
  }
  const declaration = readFileSync(artifact, "utf8");
  for (const removedSymbol of removedDialectSymbols) {
    if (declaration.includes(removedSymbol)) {
      throw new Error(`Removed FHIR dialect symbol ${removedSymbol} leaked into ${typeEntry}`);
    }
  }
  for (const leaked of ["buildFhirBundle", "parseFhirBundle", "exportFhirBundle", "importFhirBundle"]) {
    if (declaration.includes(leaked)) {
      throw new Error(`Removed JSON-bundle API ${leaked} leaked into ${typeEntry}`);
    }
  }
  for (const required of ["loadFromAidbox", "saveToAidbox", "AidboxGateway", "LoadResult", "WriteTarget"]) {
    if (!declaration.includes(required)) {
      throw new Error(`Published session Aidbox seam ${required} missing from ${typeEntry}`);
    }
  }
  // Bead odontogram-0w9, AC2. The session SPI's internals stay internal: they
  // are reachable inside the package by relative path and from nowhere else.
  // Matched as EXPORTED DECLARATIONS rather than as substrings, so the
  // declaration may still mention one in a doc comment — `saveToAidbox`
  // documents itself as delegating to `buildWritePlan`, and losing that
  // sentence would be a worse trade than the check is worth.
  for (const internal of [
    "isSaveAllowed",
    "assembleLoadResult",
    "SEARCHED_RESOURCE_TYPES",
    "buildWritePlan",
    "PAYLOAD_VERSION",
  ]) {
    const exported = new RegExp(`^export\\s+declare\\s+(?:function|const|let|var|class)\\s+${internal}\\b`, "m");
    if (exported.test(declaration)) {
      throw new Error(`Library internal ${internal} is exported from ${typeEntry}; AC2 keeps it off the public surface`);
    }
  }
}

const jsArtifact = resolve(root, packageJson.module ?? "dist/odontogram.js");
if (existsSync(jsArtifact) && readFileSync(jsArtifact, "utf8").includes("@cognovis/fhir-sdk/client")) {
  throw new Error("Published odontogram.js must not import @cognovis/fhir-sdk/client");
}

const consumerDirectory = mkdtempSync(join(root, ".odontogram-library-consumer-"));

try {
  writeFileSync(join(consumerDirectory, "consumer.ts"), [
    'import Odontogram from "@cognovis/odontogram";',
    "void Odontogram;",
    "",
  ].join("\n"));

  execFileSync("bunx", [
    "tsc",
    "--noEmit",
    "--module", "NodeNext",
    "--moduleResolution", "NodeNext",
    "--target", "ES2022",
    "--skipLibCheck",
    join(consumerDirectory, "consumer.ts"),
  ], { cwd: root, stdio: "inherit" });

  writeFileSync(join(consumerDirectory, "forbidden.ts"), [
    'import { buildFhirBundle } from "@cognovis/odontogram/fhir";',
    "void buildFhirBundle;",
    "",
  ].join("\n"));

  let forbiddenFailed = false;
  try {
    execFileSync("bunx", [
      "tsc",
      "--noEmit",
      "--module", "NodeNext",
      "--moduleResolution", "NodeNext",
      "--target", "ES2022",
      "--skipLibCheck",
      join(consumerDirectory, "forbidden.ts"),
    ], { cwd: root, stdio: "pipe" });
  } catch {
    forbiddenFailed = true;
  }
  if (!forbiddenFailed) {
    throw new Error("A consumer must not be able to import @cognovis/odontogram/fhir");
  }
} finally {
  rmSync(consumerDirectory, { recursive: true, force: true });
}
