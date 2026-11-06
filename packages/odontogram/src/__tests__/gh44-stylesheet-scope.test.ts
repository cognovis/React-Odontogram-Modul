// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

// GitHub cognovis/odontogram#44, AC1. A host imports
// `@cognovis/odontogram/style.css` globally (an embedding host may, in its root layout), so
// every page-level rule in it lands on the host's whole page: a `:root` token
// block replaced the host's own `--muted`, `--card` and `--accent`, and the
// `html`/`body`/`*` rules restyled its page. The chart's tokens live on
// `.odontogram-root` and `.odontogram-portal` instead.
//
// This reads the BUILT stylesheet, the file a host actually imports, so it
// also catches a global that a build step (Tailwind, autoprefixer) would add.
// CI runs `build:lib` before the tests; locally, build first.

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const builtStylesheet = resolve(process.cwd(), "dist/style.css");

/** The one page-level rule the package keeps: a cursor class it adds to
 *  `<body>` itself while a span drag is running and removes afterwards. */
const ALLOWED_PAGE_SELECTORS = new Set(["body.odon-dragging"]);

/** Every selector that styles the host page rather than the chart: one that
 *  names `:root`, `html` or `body` anywhere, one that LEADS with the universal
 *  selector (`.odontogram-root *` is scoped and fine), and the bare `.dark`
 *  theme class, which a host puts on its own `<html>` (the 5.0.2 stylesheet
 *  set the chart's dark tokens there and so replaced the host's dark theme).
 *  Also reject leading type selectors, including after a lone `.dark`, so
 *  host controls cannot be restyled by rules such as `select:focus`. */
function pageLevelSelectors(css: string): string[] {
  const found: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    const parent = rule.parent;
    if (parent?.type === "atrule" && /keyframes$/i.test((parent as postcss.AtRule).name)) return;
    for (const raw of rule.selectors) {
      const selector = raw.trim();
      const compounds = selector.split(/\s*[\s>+~]\s*/);
      const namesPage = compounds.some((compound) => /^(?::root|html|body)(?![\w-])/i.test(compound));
      const leadsUniversal = compounds[0].startsWith("*");
      const isBareThemeClass = selector === ".dark";
      const firstCompound = compounds[compounds[0] === ".dark" ? 1 : 0] ?? "";
      const leadsTypeSelector = /^[a-z][\w-]*/i.test(firstCompound);
      if ((namesPage || leadsUniversal || isBareThemeClass || leadsTypeSelector) && !ALLOWED_PAGE_SELECTORS.has(selector)) {
        found.push(selector);
      }
    }
  });
  return found;
}

describe("gh#44: the built stylesheet leaves the host page alone", () => {
  it("has been built (run `bun run build:lib` first)", () => {
    expect(existsSync(builtStylesheet), `${builtStylesheet} is missing`).toBe(true);
  });

  it("declares no rule on :root, html, body, * or .dark outside an odontogram scope", () => {
    const css = readFileSync(builtStylesheet, "utf8");
    expect(pageLevelSelectors(css)).toEqual([]);
  });

  it("still scopes the chart's tokens, light and dark, to the root and the portal class", () => {
    const css = readFileSync(builtStylesheet, "utf8");
    const tokenOwners: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      let setsMuted = false;
      rule.walkDecls("--muted", () => { setsMuted = true; });
      if (setsMuted) tokenOwners.push(...rule.selectors.map((s) => s.trim()));
    });
    expect(tokenOwners).toEqual(expect.arrayContaining([
      ".odontogram-root",
      ".odontogram-portal",
      ".dark .odontogram-root",
      ".dark .odontogram-portal",
    ]));
  });

  // The detector itself, against known inputs, so a green run above means the
  // stylesheet is clean rather than that the scan sees nothing.
  it("detects page-level selectors and ignores scoped ones", () => {
    expect(pageLevelSelectors(
      ":root{--a:1}html,body{height:100%}*{box-sizing:border-box}*::before{x:1}"
      + "body{margin:0}body.odon-dragging{cursor:cell}"
      + ".odontogram-root *{box-sizing:border-box}.dark .odontogram-root{--a:2}"
      + "@media (min-width:1px){html .x{y:1}}@keyframes k{from{opacity:0}}"
      + ".bodyish{z:1}.dark{--a:3}.dark body{b:1}.dark .odontogram-portal{--a:4}"
      + "select{x:1}select:focus{x:1}.dark select{x:1}input[type=text]{x:1}"
      + ".dark button:hover{x:1}.odontogram-root select{x:1}"
      + ".odontogram-portal select:focus{x:1}.dark .odontogram-root select{x:1}"
      + ".dark .odontogram-portal select{x:1}",
    )).toEqual([":root", "html", "body", "*", "*::before", "body", "html .x", ".dark", ".dark body",
      "select", "select:focus", ".dark select", "input[type=text]", ".dark button:hover"]);
  });
});
