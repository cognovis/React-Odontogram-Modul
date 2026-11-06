// Verify the host-owned SDK through real packed packages outside the workspace.
// Build both packages first. Pass an SDK version to check an older peer minor.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const packages = ["odontogram", "odontogram-fhir"];
const chart = JSON.parse(readFileSync(join(root, "packages/odontogram/package.json"), "utf8"));
const sdkVersion = process.argv[2] ?? chart.devDependencies["@cognovis/fhir-sdk"];
const consumer = mkdtempSync(join(tmpdir(), "odontogram-packed-sdk-"));

function run(command, args, cwd = consumer) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed:\n${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(result.stderr, /peer dep|ERESOLVE/i);
  return result.stdout.trim();
}

try {
  const tarballs = packages.map((name) => run("bun", [
    "pm", "pack", "--ignore-scripts", "--quiet", "--destination", consumer,
  ], join(root, "packages", name)));
  writeFileSync(join(consumer, "package.json"), JSON.stringify({
    name: "odontogram-packed-sdk-consumer", private: true, type: "module",
  }));
  const installed = run("npm", [
    "install", "--ignore-scripts", "--strict-peer-deps", "--no-audit", "--no-fund",
    ...tarballs.map((file) => resolve(consumer, file)),
    `@cognovis/fhir-sdk@${sdkVersion}`, "react@19.2.4", "react-dom@19.2.4",
  ]);
  assert.doesNotMatch(installed, /peer dep|ERESOLVE/i);
  const sdkCopies = run("npm", ["ls", "@cognovis/fhir-sdk", "--all", "--parseable"])
    .split("\n").filter(Boolean);
  assert.equal(sdkCopies.length, 1, `Expected one SDK copy, found: ${sdkCopies.join(", ")}`);
  const sdk = JSON.parse(readFileSync(join(sdkCopies[0], "package.json"), "utf8"));
  assert.equal(sdk.version, sdkVersion);
  for (const name of ["odontogram", "odontogram-fhir"]) {
    const manifest = JSON.parse(readFileSync(join(consumer, "node_modules/@cognovis", name, "package.json"), "utf8"));
    assert.equal(manifest.peerDependencies["@cognovis/fhir-sdk"], "^0.22.0 || ^0.23.0");
    assert.equal(manifest.dependencies?.["@cognovis/fhir-sdk"], undefined);
  }
  writeFileSync(join(consumer, "consumer.ts"), [
    'import Odontogram, { type AidboxGateway } from "@cognovis/odontogram";',
    'import { createAidboxGateway } from "@cognovis/odontogram-fhir";',
    'const gateway: AidboxGateway = createAidboxGateway({ baseUrl: "https://example.invalid", clientId: "packed", clientSecret: "synthetic" });',
    "void Odontogram; void gateway;",
  ].join("\n"));
  run(join(root, "node_modules/.bin/tsc"), [
    "--noEmit", "--module", "NodeNext", "--moduleResolution", "NodeNext",
    "--target", "ES2022", "--skipLibCheck", join(consumer, "consumer.ts"),
  ]);
  console.log(`PASS: two packed packages, SDK ${sdkVersion}, one copy, strict peers, consumer types`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
