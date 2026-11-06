// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

// Bead odontogram-z4y: three repository-hygiene invariants that kept regressing
// by hand and are cheap to hold with a test.
//
//   1. tsconfig.tsbuildinfo is a derived `tsc -b` incremental cache. It changes
//      on every build, so while it was tracked it rode along in unrelated
//      commits (odontogram-vnt commit 3cbda0f) and left a stray stash behind.
//      It must stay git-ignored and untracked.
//   2. The suites that mock ../odontogram must PARTIAL-mock it: spread the
//      original module first, then override only what the suite stubs. A
//      hand-enumerated factory resolves every not-yet-listed export to
//      `undefined`, so an unrelated bead that adds an export to odontogram.ts
//      and calls it from App.tsx / PerioChart.tsx breaks suites it never
//      touched. That happened twice — odontogram-3l1's engine-claim exports and
//      odontogram-vnt's isAssessmentCharted.
//   3. The lockfile's own version fields must track package.json. They drifted
//      three releases (lockfile 2.4.0 vs package 2.7.1) because releases bumped
//      package.json without regenerating the lockfile.
//
// Bead odontogram-0w9 made the repository a bun workspace, which moves two of
// the three: `.gitignore` and the lockfile belong to the WORKSPACE, while this
// package's own README badges and test sources stay here. `bun.lock` replaced
// `package-lock.json` and records the version per workspace member, so the
// third invariant is now read out of `workspaces["packages/odontogram"]` — the
// drift it guards against is the same one.
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Held in a const so Vite's import-analysis does not rewrite the `new URL(...,
// import.meta.url)` pattern into a served asset URL — the same indirection the
// other file-reading suites use (see ui1-dynamic-scale.test.ts).
const testFileUrl = import.meta.url;
const PACKAGE_ROOT = fileURLToPath(new URL("../../", testFileUrl));
const REPO_ROOT = fileURLToPath(new URL("../../../../", testFileUrl));
const TESTS_DIR = fileURLToPath(new URL("./", testFileUrl));

/** This package's path inside the workspace, as `bun.lock` keys it. */
const PACKAGE_PATH = "packages/odontogram";

const BUILD_CACHE = "tsconfig.tsbuildinfo";

/** Every export a partial mock forwards by hand, e.g. `getCaseMeta: actual.getCaseMeta,`. */
const PASS_THROUGH_LINE = /^\s*[A-Za-z_$][\w$]*\s*:\s*actual\.[\w$]+\s*,?\s*$/;

/** An override entry in the returned object, e.g. `initOdontogram: vi.fn(),`. */
const OVERRIDE_LINE = /^\s*[A-Za-z_$][\w$]*\s*:/;

/** The spread that makes the mock partial. */
const SPREAD_LINE = /^\s*\.\.\.actual,\s*$/;

/** The `vi.mock("../odontogram"` / `vi.mock('../odontogram'` call opener. */
const MOCK_OPENER = /vi\.mock\(\s*(['"])\.\.\/odontogram\1/;

/**
 * Extract each `vi.mock("../odontogram", ...)` factory body from a test source,
 * line based: from the opener line up to the first line that closes the call at
 * column 0 (`});`), which is how every such factory in this repository is
 * formatted. A missing terminator is reported rather than silently skipped.
 */
function odontogramMockFactories(source: string): string[][] {
  const lines = source.split("\n");
  const factories: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!MOCK_OPENER.test(lines[i])) continue;
    const end = lines.findIndex((line, index) => index > i && /^\}\)\s*;?\s*$/.test(line));
    if (end === -1) throw new Error(`unterminated vi.mock("../odontogram") factory at line ${i + 1}`);
    factories.push(lines.slice(i, end + 1));
    i = end;
  }
  return factories;
}

/** This file quotes the mock opener it looks for, so it must not scan itself. */
const SELF = "z4y-repo-hygiene.test.ts";

function testSources(): { name: string; source: string }[] {
  return readdirSync(TESTS_DIR)
    .filter((name) => /\.test\.tsx?$/.test(name) && name !== SELF)
    .map((name) => ({ name, source: readFileSync(`${TESTS_DIR}${name}`, "utf8") }));
}

describe("odontogram-z4y: the derived TypeScript build cache is not tracked", () => {
  it(`.gitignore carries a rule for ${BUILD_CACHE}`, () => {
    const rules = readFileSync(`${REPO_ROOT}.gitignore`, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    expect(rules).toEqual(expect.arrayContaining([expect.stringMatching(/^\*?\.?tsconfig\.tsbuildinfo$|^\*\.tsbuildinfo$/)]));
  });

  it(`git does not track ${BUILD_CACHE}`, () => {
    let tracked: string;
    try {
      tracked = execFileSync("git", ["ls-files", "--", BUILD_CACHE], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
    } catch {
      // No git available (for example an extracted tarball) — the .gitignore
      // rule above is then the only checkable half of this invariant.
      return;
    }
    expect(tracked.trim()).toBe("");
  });
});

describe("odontogram-z4y: ../odontogram is partial-mocked, never hand-enumerated", () => {
  const suites = testSources()
    .map(({ name, source }) => ({ name, factories: odontogramMockFactories(source) }))
    .filter(({ factories }) => factories.length > 0);

  it("finds the suites that mock the engine module", () => {
    // Guards the scan itself: a broken extractor must fail here rather than
    // make the two assertions below vacuously pass.
    expect(suites.length).toBeGreaterThanOrEqual(18);
  });

  it("every factory spreads the original module before its overrides", () => {
    // Order is the whole point: a spread placed after the overrides would let
    // the real exports overwrite the suite's stubs, which is worse than the
    // hand enumeration it replaced.
    const offenders: string[] = [];
    for (const { name, factories } of suites) {
      for (const lines of factories) {
        const spread = lines.findIndex((line) => SPREAD_LINE.test(line));
        const firstOverride = lines.findIndex((line) => OVERRIDE_LINE.test(line));
        if (spread === -1) {
          offenders.push(`${name}: no \`...actual,\` spread`);
        } else if (firstOverride !== -1 && firstOverride < spread) {
          offenders.push(`${name}: spread comes after the override \`${lines[firstOverride].trim()}\``);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no factory forwards an export by hand", () => {
    const offenders: string[] = [];
    for (const { name, factories } of suites) {
      for (const lines of factories) {
        for (const line of lines) {
          if (PASS_THROUGH_LINE.test(line)) offenders.push(`${name}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("odontogram-z4y: the lockfile tracks the released version", () => {
  it("bun.lock records this package at package.json's version", () => {
    const pkg = JSON.parse(readFileSync(`${PACKAGE_ROOT}package.json`, "utf8")) as { name: string; version: string };
    // `bun.lock` is JSONC — it carries trailing commas, which `JSON.parse`
    // refuses. Stripping them is enough: the file holds no comments.
    const lock = JSON.parse(
      readFileSync(`${REPO_ROOT}bun.lock`, "utf8").replace(/,(\s*[}\]])/g, "$1"),
    ) as { workspaces: Record<string, { name?: string; version?: string }> };
    const member = lock.workspaces[PACKAGE_PATH];
    expect(member, `bun.lock has no workspace entry for ${PACKAGE_PATH}`).toBeDefined();
    expect(member.name).toBe(pkg.name);
    expect(member.version).toBe(pkg.version);
  });

  /** The English source of truth plus the eleven guides translated from it. */
  function guides(): string[] {
    return [
      "README.md",
      ...readdirSync(`${PACKAGE_ROOT}lang`)
        .filter((name) => /^README-.*\.md$/.test(name))
        .map((name) => `lang/${name}`),
    ];
  }

  it("every README version badge tracks package.json", () => {
    const pkg = JSON.parse(readFileSync(`${PACKAGE_ROOT}package.json`, "utf8")) as { version: string };

    for (const readme of guides()) {
      expect(readFileSync(`${PACKAGE_ROOT}${readme}`, "utf8"), readme).toContain(`version-${pkg.version}-green`);
    }
  });

  // Bead odontogram-0w9. English is the source of truth and the twelve guides
  // are translated FROM it, which is exactly how a guide goes stale unnoticed:
  // the English page is rewritten, the other eleven are not, and each keeps
  // telling its readers to open a file that no longer exists. `live.html` was
  // the second HTML entry until the workspace split; a reader following that
  // instruction now gets a 404 and no hint of what replaced it.
  //
  // A named-file check, not a general staleness check — the latter cannot be
  // written. It holds for exactly as long as the name is wrong, which is the
  // life of the mistake it is here to prevent.
  it("no guide sends a reader to the retired second HTML entry", () => {
    const offenders = guides().filter((guide) => readFileSync(`${PACKAGE_ROOT}${guide}`, "utf8").includes("live.html"));
    expect(offenders).toEqual([]);
  });

  // Bead odontogram-0w9. The workspace move put two directories between a
  // guide and the repository root, and every relative link in all twelve went
  // one level short overnight — `../docs/aidbox-live-mode.md`,
  // `../CITATION.cff`. Nothing broke, nothing failed, the links simply stopped
  // resolving. A link is checkable, so it is checked rather than re-reviewed.
  it("resolves every relative link out of the guides", () => {
    const broken: string[] = [];
    for (const guide of guides()) {
      const directory = dirname(`${PACKAGE_ROOT}${guide}`);
      const text = readFileSync(`${PACKAGE_ROOT}${guide}`, "utf8");
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(?:https?:|mailto:|#)/.test(target)) continue;
        const path = resolve(directory, target.split("#")[0]);
        if (!existsSync(path)) broken.push(`${guide} -> ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("every guide names the live mode as the standalone app's, reachable at /?live", () => {
    // The replacement, not just the absence: a guide that simply dropped the
    // paragraph would pass the check above while leaving live mode
    // undiscoverable.
    for (const guide of guides()) {
      const text = readFileSync(`${PACKAGE_ROOT}${guide}`, "utf8");
      if (!/aidbox/i.test(text)) continue;
      expect(text, guide).toContain("?live");
      expect(text, guide).toMatch(/bun run dev/);
    }
  });
});
