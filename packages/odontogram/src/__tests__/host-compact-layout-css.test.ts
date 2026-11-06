// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// The compact inspector's LAYOUT contract, read off the
// stylesheet source.
//
// jsdom applies no stylesheet, so a rendering test cannot see any of this. The
// contract is still worth pinning, because the live failure Malte reported was
// purely a cascade one: the orthodontic view column spans
// `grid-column: 1 / -1`, which in compact placement pushes the inspector onto
// the next grid row — a drawer a full chart's height below the fold reads as no
// drawer at all.
//
// The suite reads SOURCE rather than the built `dist/style.css` (unlike
// gh44-stylesheet-scope) on purpose: these are authored rules, not a build
// product, and the check should fail in the editor rather than after a build.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(__dirname, "..", "index.css"), "utf8");
const PLACEMENT = '.odontogram-root[data-panel-placement="compact"]';

interface Rule {
  /** The rule's selector list, split and trimmed. */
  selectors: string[];
  /** Its declarations, whitespace stripped, so a match is spacing-agnostic. */
  decls: string;
}

/**
 * Every style rule in the sheet.
 *
 * Deliberately crude — comments are stripped, then the sheet is split on `}`.
 * That is enough here because this file nests only `@media`/`@container`
 * blocks, whose own closing brace yields one empty rule that no query reads.
 * A selector is matched as a whole LIST ITEM rather than as a substring: the
 * first naive version of this suite read `.ortho-column{` and found the
 * responsive `grid-column:auto` reset instead of the rule it meant.
 */
const RULES: Rule[] = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
  .split("}")
  .map((chunk) => {
    const open = chunk.indexOf("{");
    if (open === -1) return null;
    const head = chunk.slice(0, open);
    const selectors = head.slice(head.lastIndexOf("{") + 1).split(",").map((s) => s.trim());
    return { selectors, decls: chunk.slice(open + 1).replace(/\s/g, "") };
  })
  .filter((rule): rule is Rule => rule !== null);

/**
 * The declarations of every rule whose selector list contains `selector`.
 *
 * Several rules legitimately share one selector — `.ortho-column` carries its
 * base layout, a two-up media query, and two compact overrides — so a query
 * asks whether the sheet declares something SOMEWHERE for that selector, never
 * which single rule does.
 */
function declsFor(selector: string): string[] {
  const found = RULES.filter((rule) => rule.selectors.includes(selector));
  expect(found.length, `no rule for ${selector}`).toBeGreaterThan(0);
  return found.map((rule) => rule.decls);
}

/** Whether any rule for `selector` carries `decl`. */
function declares(selector: string, decl: string): boolean {
  return declsFor(selector).some((decls) => decls.includes(decl));
}

describe("every clinical view column leaves the inspector its own column", () => {
  // The standalone rules these override, stated so a change to either side is
  // visible here: the orthodontic column spans the whole grid.
  it("still spans the full grid in the standalone layout", () => {
    expect(declares(".ortho-column", "grid-column:1/-1")).toBe(true);
  });

  for (const column of [".ortho-column", ".dental-chart-column"]) {
    it(`re-columns ${column} under the compact placement`, () => {
      expect(declares(`${PLACEMENT} ${column}`, "grid-column:1;")).toBe(true);
    });
  }

  it("gives the orthodontic workspace a single card track in compact", () => {
    // The two-up rule is a VIEWPORT media query, and the viewport is wide
    // exactly when an embedded chart is not.
    expect(declares(`${PLACEMENT} .ortho-column`, "grid-template-columns:minmax(0,1fr)")).toBe(true);
  });
});

describe("the compact control dimensions are scoped to the placement", () => {
  it("drops the 220px select minimum inside the inspector", () => {
    // The standalone minimum is wider than the inspector's card once padding
    // is counted, which is what made the embedded panel overflow.
    expect(declares(".odontogram-root select", "min-width:220px")).toBe(true);
    expect(declares(`${PLACEMENT} .panel select`, "min-width:0;")).toBe(true);
  });

  it("shrinks the relocated chart toggles' icons", () => {
    expect(declares(`${PLACEMENT} .panel .btn-icon .icon`, "width:18px")).toBe(true);
  });

  it("styles the relocated chart controls, which exist only in this placement", () => {
    // `.panel-chart-controls` is rendered by App.tsx only when the inspector
    // owns the chart's controls; without a rule it inherited nothing and the
    // toggles plus the Status/Plan tabs ran past the panel's width.
    expect(declares(`${PLACEMENT} .panel-chart-controls`, "flex-direction:column")).toBe(true);
    expect(RULES.filter((rule) => rule.selectors.includes(".panel-chart-controls"))).toEqual([]);
  });

  it("carries the placement attribute on every compact control rule", () => {
    // A compact dimension leaking into the standalone layout would shrink the
    // full-page panel, which no host asked for.
    for (const rule of [".panel .btn", ".panel .btn-icon", ".panel .chart-mode-btn", ".panel .row"]) {
      expect(declsFor(`${PLACEMENT} ${rule}`).join("").length, rule).toBeGreaterThan(0);
    }
  });
});

describe("the inspector's chrome and its two action bars are compacted", () => {
  it("tightens the panel header and the cards nested in it", () => {
    // Three borders deep (panel, card, control) the standalone paddings cost
    // more of a 320px drawer than the controls they frame.
    expect(declares(`${PLACEMENT} .panel-header`, "padding:10px12px")).toBe(true);
    expect(declares(`${PLACEMENT} .panel .card`, "padding:10px;")).toBe(true);
    expect(declares(`${PLACEMENT} .panel .card-title`, "font-size:13px")).toBe(true);
  });

  it("wraps both action bars rather than scrolling them sideways", () => {
    // The examination capture row — the date field that SAVES an examination,
    // beside Save and the baseline-correction buttons — and the status row are
    // the only bars in the drawer. Both are reached by an ID, so the generic
    // compact field and button rules cannot reach them: an id outranks the
    // placement attribute plus a class, hence their own rules here.
    for (const bar of [
      `${PLACEMENT} #examinationCard .examination-actions`,
      `${PLACEMENT} #statusCard .status-actions`,
    ]) {
      expect(declares(bar, "flex-wrap:wrap")).toBe(true);
      expect(declares(bar, "gap:4px")).toBe(true);
    }
  });

  it("lets the examination date field shrink with its card", () => {
    // Authored at the id level too, and the one field in the drawer that held
    // its card open past the inspector's width.
    expect(declares(`${PLACEMENT} #examinationCard input[type="date"]`, "min-width:0;")).toBe(true);
  });

  it("leaves every standalone dimension it overrides untouched", () => {
    // The point of scoping: each rule above has a standalone counterpart that
    // must keep its own value. Stated here so a change to either side fails.
    expect(declares(".panel-header", "padding:12px14px")).toBe(true);
    expect(declares(".card", "padding:12px;")).toBe(true);
    expect(declares(".card-title", "margin-bottom:8px")).toBe(true);
    expect(declares('#examinationCard input[type="date"]', "padding:4px6px")).toBe(true);
  });
});
