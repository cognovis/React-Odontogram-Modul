// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Anatomical style "Entwurf v1" (Claude Design, 26.09.2026).
 *
 * Dirk's condition: "wenn wir nicht kaputt machen". The draft is a THIRD look
 * beside the classic one — so the properties that matter are that classic is
 * the default, that switching back leaves nothing behind, and that a
 * practice's own colours survive the draft.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAnatomicalStyle, setAnatomicalStyle, onStateChange, type AnatomicalStyle,
} from "../odontogram";
import {
  setRestorationPaletteValues, resetRestorationPaletteValues, setRestorationColourValue,
  DRAFT_V1_PALETTE, FORK_DEFAULT_PALETTE,
} from "../restorationPalette";

const root = () => document.documentElement.style;
let grid: HTMLElement;

beforeEach(() => {
  grid = document.createElement("div");
  grid.id = "toothGrid";
  grid.className = "tooth-grid";
  document.body.appendChild(grid);
  resetRestorationPaletteValues();          // the fork default, as shipped
});
afterEach(() => {
  setAnatomicalStyle("classic");
  grid.remove();
  resetRestorationPaletteValues();
});

describe("the classic look stays the default", () => {
  it("starts as classic, with no draft class", () => {
    expect(getAnatomicalStyle()).toBe("classic");
    expect(grid.classList.contains("odon-style-v1")).toBe(false);
  });

  it("ignores an unknown style instead of storing it", () => {
    setAnatomicalStyle("neon" as AnatomicalStyle);
    expect(getAnatomicalStyle()).toBe("classic");
  });
});

describe("switching to the draft", () => {
  it("sets the one class every draft rule hangs on", () => {
    setAnatomicalStyle("draft-v1");
    expect(grid.classList.contains("odon-style-v1")).toBe(true);
  });

  it("paints the draft palette where the practice kept the fork default", () => {
    setAnatomicalStyle("draft-v1");
    expect(root().getPropertyValue("--odon-fill-composite")).toBe(DRAFT_V1_PALETTE["--odon-fill-composite"]);
    expect(root().getPropertyValue("--odon-rest-gold")).toBe("#dca72a");
  });

  it("makes the two ceramic ramps flat: all nine stops one colour", () => {
    setAnatomicalStyle("draft-v1");
    const stops = Array.from({ length: 9 }, (_, i) => root().getPropertyValue(`--odon-rest-metal-ceramic-${i}`));
    expect(new Set(stops)).toEqual(new Set(["#ece0c8"]));
  });

  it("keeps a practice's OWN colours — the draft only replaces the default", () => {
    setRestorationColourValue("gold", "#123456");
    setAnatomicalStyle("draft-v1");
    expect(root().getPropertyValue("--odon-rest-gold")).toBe("#123456");
  });

  it("notifies, so mounted views re-read the setting", () => {
    let n = 0;
    const off = onStateChange(() => { n++; });
    setAnatomicalStyle("draft-v1");
    setAnatomicalStyle("draft-v1");   // no change, no second notification
    off();
    expect(n).toBe(1);
  });
});

describe("switching back leaves nothing behind", () => {
  it("removes the class and restores the fork palette exactly", () => {
    setAnatomicalStyle("draft-v1");
    setAnatomicalStyle("classic");
    expect(grid.classList.contains("odon-style-v1")).toBe(false);
    expect(root().getPropertyValue("--odon-rest-gold")).toBe(FORK_DEFAULT_PALETTE.gold);
    // a variable only the draft writes is gone again
    expect(root().getPropertyValue("--odon-fill-composite")).toBe("");
    expect(root().getPropertyValue("--odon-rest-metal-ceramic-0")).toBe("");
  });

  it("an empty (unconfigured) palette stays empty after a round trip", () => {
    setRestorationPaletteValues({});
    setAnatomicalStyle("draft-v1");
    setAnatomicalStyle("classic");
    expect(root().getPropertyValue("--odon-rest-gold")).toBe("");
  });
});
