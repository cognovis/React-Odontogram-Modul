// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-0w9, AC3: what the standalone app is allowed to be.
//
// It is the only package here that is not published, and that is what lets it
// read `import.meta.env`. Everything else follows from being the CONSUMER of
// the two packages rather than a place they are kept:
//
//   * ONE HTML entry. There used to be `index.html` and `live.html`, i.e. two
//     builds and two CSP headers for one app in two modes. The mode is now a
//     decision in `main.tsx`.
//   * No copied library or transport SOURCE. The app resolves both packages by
//     name — via a Vite alias to their source in development, via the published
//     artifacts anywhere else. A copy would be a second chart that drifts.
//   * `VITE_*` is named in `config.ts` and read in `main.tsx`, and nowhere
//     else. That is the whole reason the resolution takes the environment as an
//     ARGUMENT: it stays testable without a build.

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { isLiveModeRequested } from "../config";
import { saveIsOffered } from "../LiveApp";

const root = process.cwd();
const workspaceRoot = resolve(root, "../..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      out.push(...filesUnder(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const APP_SOURCES = filesUnder(resolve(root, "src"));
const SHIPPED = APP_SOURCES.filter((path) => !path.includes("/__tests__/"));
const relative = (paths: string[]) => paths.map((path) => path.slice(root.length + 1)).sort();

/**
 * Comments out, code in.
 *
 * Each scan below looks for a literal, and run against raw text such a scan
 * forbids DOCUMENTING the very rule it enforces — `config.ts` explains at
 * length why it is the only file naming a `VITE_*` key, and that explanation
 * cannot be written without naming one.
 */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("bead odontogram-0w9: the standalone app's boundary", () => {
  it("is the private workspace app, consuming both packages by name", () => {
    expect(packageJson.name).toBe("@cognovis/odontogram-standalone");
    expect(packageJson.private).toBe(true);
    expect(packageJson.dependencies["@cognovis/odontogram"]).toBe("workspace:*");
    expect(packageJson.dependencies["@cognovis/odontogram-fhir"]).toBe("workspace:*");
  });

  it("has ONE html entry, and it is not live.html", () => {
    const html = readdirSync(root).filter((name) => name.endsWith(".html"));
    expect(html).toEqual(["index.html"]);
    expect(readFileSync(resolve(root, "index.html"), "utf8")).toContain('src="/src/main.tsx"');
    // Nowhere in the workspace, not just here.
    expect(existsSync(resolve(workspaceRoot, "live.html"))).toBe(false);
    expect(existsSync(resolve(root, "live.html"))).toBe(false);
  });

  it("reaches into neither package's source by relative path", () => {
    const offenders = APP_SOURCES.filter((path) => /from\s+["'][^"']*\.\.\/\.\.\/(?:\.\.\/)*packages\//.test(code(path)));
    expect(relative(offenders)).toEqual([]);
  });

  it("holds no copy of the chart or transport source", () => {
    // The library's own modules would announce themselves by name.
    for (const copied of ["src/App.tsx", "src/odontogram.ts", "src/session.ts", "src/aidbox.ts", "src/index.css"]) {
      expect(existsSync(resolve(root, copied)), copied).toBe(false);
    }
  });

  it("names VITE_ keys in config.ts and nowhere else", () => {
    const carriers = SHIPPED.filter((path) => /\bVITE_[A-Z0-9_]+/.test(code(path)));
    expect(relative(carriers)).toEqual(["src/config.ts"]);
  });

  it("keeps no tooling of its own", () => {
    // Tooling that reads library internals belongs in the library package,
    // where a relative import is legitimate.
    expect(existsSync(resolve(root, "tools"))).toBe(false);
    expect(packageJson.scripts["live:provision"]).toBeUndefined();
  });

  it("reads import.meta.env in main.tsx alone, and hands it straight on", () => {
    const carriers = SHIPPED.filter((path) => code(path).includes("import.meta.env"));
    expect(relative(carriers)).toEqual(["src/main.tsx"]);
    // Handed on as a plain record, so `config.ts` and `LiveApp` both stay
    // mountable and testable without a build-time environment.
    expect(code(resolve(root, "src/main.tsx"))).toMatch(/isLiveModeRequested\(env, search\)/);
    expect(code(resolve(root, "src/main.tsx"))).toMatch(/<LiveApp env=\{env\} search=\{search\} \/>/);
  });

  it("consumes only the library's published surface", () => {
    // AC2: the app is a consumer like any other, so it may reach only what a
    // consumer can. The library's internal `isSaveAllowed`, `buildWritePlan`,
    // `assembleLoadResult`, `SEARCHED_RESOURCE_TYPES` and `PAYLOAD_VERSION`
    // were briefly published to keep this app compiling through the split;
    // they are internal again and the app must not name them.
    const internal = /\b(?:isSaveAllowed|assembleLoadResult|SEARCHED_RESOURCE_TYPES|buildWritePlan|PAYLOAD_VERSION)\b/;
    expect(relative(SHIPPED.filter((path) => internal.test(code(path))))).toEqual([]);
    // Tests may NAME them — this one has to, in order to forbid them — but no
    // file here, test or not, may import one from the package.
    const imported = APP_SOURCES.filter((path) => {
      const text = code(path);
      return [...text.matchAll(/import[^;]*?from\s+["']@cognovis\/odontogram["']/g)]
        .some((match) => internal.test(match[0]));
    });
    expect(relative(imported)).toEqual([]);
  });

  it("never pulls in keycloak-js", () => {
    const fields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
    const offenders = fields.flatMap((field) => Object.keys(packageJson[field] ?? {}).filter((name) => /keycloak/i.test(name)));
    expect(offenders).toEqual([]);
  });
});

describe("bead odontogram-0w9: which mode the one entry boots", () => {
  const live = {
    VITE_AIDBOX_BASE_URL: "http://localhost:8081",
    VITE_AIDBOX_CLIENT_ID: "odontogram-live",
    VITE_AIDBOX_CLIENT_SECRET: "s3cret",
    VITE_DEFAULT_PATIENT_ID: "p-1",
  };

  it("boots the fixture playground when nothing is configured", () => {
    // Exactly what `index.html` served before the two entries became one.
    expect(isLiveModeRequested({}, "")).toBe(false);
    expect(isLiveModeRequested({}, "?other=1")).toBe(false);
  });

  it("boots live mode when the environment carries a live configuration", () => {
    expect(isLiveModeRequested(live, "")).toBe(true);
  });

  it("boots live mode on ?live, so the setup hint is reachable", () => {
    // The point of asking whether live mode was REQUESTED rather than whether
    // it RESOLVES: a half-configured live mode must show the list of missing
    // keys, not silently fall back to the playground and hide it.
    expect(isLiveModeRequested({}, "?live")).toBe(true);
    expect(isLiveModeRequested({}, "?live=1")).toBe(true);
    expect(isLiveModeRequested({ VITE_AIDBOX_BASE_URL: "http://localhost:8081" }, "")).toBe(true);
  });

  it("boots live mode on ?patient=, which only means anything against a server", () => {
    expect(isLiveModeRequested({}, "?patient=p-1")).toBe(true);
    // A blank one is not an id, so it asks for nothing.
    expect(isLiveModeRequested({}, "?patient=")).toBe(false);
    expect(isLiveModeRequested({}, "?patient=%20")).toBe(false);
  });

  it("treats a whitespace-only environment value as absent", () => {
    expect(isLiveModeRequested({ VITE_AIDBOX_CLIENT_ID: "   " }, "")).toBe(false);
  });
});

/**
 * The app's own save gate.
 *
 * This is the app's copy of a rule the library also applies to its own
 * `saveToAidbox` — see `saveIsOffered`'s comment for why it is a copy and not
 * an import. A copy that nobody checks is how two copies drift, so the five
 * conditions are pinned here exactly as `6fi-live-save.test.ts` pins the
 * library's.
 */
describe("bead odontogram-0w9: when the standalone app offers Save", () => {
  const clean = { patientId: "p-1", parsed: true };

  it("offers it after one clean load of this patient", () => {
    expect(saveIsOffered({ busy: false, patientId: "p-1", load: clean })).toBe(true);
  });

  it("refuses before any load, and while one is running", () => {
    expect(saveIsOffered({ busy: false, patientId: "p-1" })).toBe(false);
    expect(saveIsOffered({ busy: true, patientId: "p-1", load: clean })).toBe(false);
  });

  it("refuses when the load was for a different patient", () => {
    // Otherwise switching patients would write p-1's chart onto p-2.
    expect(saveIsOffered({ busy: false, patientId: "p-2", load: clean })).toBe(false);
  });

  it("refuses when the codec charted nothing, or reported an error", () => {
    expect(saveIsOffered({ busy: false, patientId: "p-1", load: { ...clean, parsed: false } })).toBe(false);
    expect(saveIsOffered({ busy: false, patientId: "p-1", load: { ...clean, error: "HTTP 403" } })).toBe(false);
  });

  it("refuses after a partial read", () => {
    // The findings that never arrived would be written away as absent.
    expect(saveIsOffered({ busy: false, patientId: "p-1", load: { ...clean, truncated: ["Observation"] } })).toBe(false);
    expect(saveIsOffered({ busy: false, patientId: "p-1", load: { ...clean, truncated: [] } })).toBe(true);
  });
});
