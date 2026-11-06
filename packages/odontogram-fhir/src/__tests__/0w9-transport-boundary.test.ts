// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-0w9, AC2: what this package is allowed to be.
//
// The transport is a thin thing on purpose. It holds the ONE
// `@cognovis/fhir-sdk/client` factory in the workspace and fills the chart
// SDK's `AidboxGateway` shape — nothing else. Three properties keep it thin,
// and each of them is a mistake that has already been made somewhere:
//
//   1. The arrow points ONE way. This package depends on `@cognovis/odontogram`
//      for the gateway shape; the SDK must never depend back, or the HTTP-free
//      guarantee that lets the chart run in a test and in every host
//      application is gone.
//   2. No `keycloak-js`. Authentication here is the scoped machine client's
//      HTTP Basic credential, handed in by the host. A browser SSO library in a
//      transport package would drag a login flow into every consumer.
//   3. No `import.meta.env`. That is a build-time substitution: a library that
//      reads it works only in the app that was built with those variables. The
//      configuration is an ARGUMENT (`AidboxConnection`), resolved by whoever
//      owns the deployment.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import * as transport from "../index";
import * as chartSdk from "@cognovis/odontogram";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function sources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      out.push(...sources(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const SOURCES = sources(resolve(root, "src"));
const SHIPPED = SOURCES.filter((path) => !path.includes("/__tests__/"));

/**
 * Comments out, code in.
 *
 * Every scan below looks for a literal — `keycloak`, `import.meta.env`, a
 * client subpath. Run against raw text, such a scan forbids DOCUMENTING the
 * very rule it enforces: the first version of this file failed on its own
 * header, and on the prose in `index.ts` that explains why the client import
 * lives beside it. A boundary one may not write down is a boundary nobody
 * learns, so the text is stripped of comments first and the assertion is about
 * what the module actually does.
 */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function relative(paths: string[]): string[] {
  return paths.map((path) => path.slice(root.length + 1));
}

describe("bead odontogram-0w9: the Aidbox transport package's boundary", () => {
  it("is the package the Aidbox factories are exported from", () => {
    expect(packageJson.name).toBe("@cognovis/odontogram-fhir");
    expect(typeof transport.createAidboxGateway).toBe("function");
    expect(typeof transport.createAidboxTransport).toBe("function");
    expect(typeof transport.searchAllPages).toBe("function");
    expect(typeof transport.basicAuthorization).toBe("function");
    expect(typeof transport.fhirBaseUrl).toBe("function");
  });

  it("is NOT the chart SDK — none of those factories leak back into it", () => {
    for (const name of [
      "createAidboxGateway",
      "createAidboxTransport",
      "searchAllPages",
      "basicAuthorization",
      "fhirBaseUrl",
    ]) {
      expect(chartSdk).not.toHaveProperty(name);
    }
  });

  it("depends on exactly one workspace sibling, the chart SDK", () => {
    const deps = packageJson.dependencies ?? {};
    const workspaceDeps = Object.entries(deps)
      .filter(([, range]) => typeof range === "string" && range.startsWith("workspace:"))
      .map(([name]) => name);
    expect(workspaceDeps).toEqual(["@cognovis/odontogram"]);
    // The executable host owns the SDK shared by the chart and its transport.
    expect(deps["@cognovis/fhir-sdk"]).toBeUndefined();
    expect(packageJson.peerDependencies["@cognovis/fhir-sdk"]).toBe("^0.22.0 || ^0.23.0");
    expect(packageJson.devDependencies["@cognovis/fhir-sdk"]).toBe("0.23.0");
  });

  it("never depends on keycloak-js, in any dependency field", () => {
    const fields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
    const offenders: string[] = [];
    for (const field of fields) {
      for (const name of Object.keys(packageJson[field] ?? {})) {
        if (/keycloak/i.test(name)) offenders.push(`${field}.${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never imports keycloak-js in any source", () => {
    expect(relative(SHIPPED.filter((path) => /keycloak/i.test(code(path))))).toEqual([]);
  });

  it("never reads import.meta.env — the connection is an argument", () => {
    expect(relative(SHIPPED.filter((path) => code(path).includes("import.meta.env")))).toEqual([]);
  });

  it("names no VITE_ key: resolving the environment belongs to the app", () => {
    expect(relative(SHIPPED.filter((path) => /\bVITE_[A-Z0-9_]+/.test(code(path))))).toEqual([]);
  });

  it("holds the client import in exactly one file", () => {
    const carriers = SHIPPED.filter((path) => code(path).includes("@cognovis/fhir-sdk/client"));
    expect(relative(carriers)).toEqual(["src/aidbox.ts"]);
  });

  it("takes an AidboxConnection, not the app's whole live configuration", () => {
    // A patient id says what a chart is ABOUT; it is not part of reaching a
    // server. The app's `LiveConfig` extends this type rather than the
    // transport widening to hold it.
    const text = readFileSync(resolve(root, "src/connection.ts"), "utf8");
    expect(text).toMatch(/baseUrl/);
    expect(text).toMatch(/clientId/);
    expect(text).toMatch(/clientSecret/);
    expect(text).not.toMatch(/patientId/);
  });
});
