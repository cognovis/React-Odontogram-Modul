// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-sjr — the restoration colours are choosable.
 *
 * The 58n palette becomes the DEFAULT, not the only answer. Two properties
 * carry the whole design: an untouched palette must write nothing at all (so
 * an unconfigured chart is byte-identical to before), and a ramp material must
 * keep its lightness sweep (so ceramic still reads as ceramic).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  RESTORATION_PALETTE, deriveRamp, lighten, parseHex, resolveEntry,
  restorationColour, setRestorationColourValue, resetRestorationPaletteValues,
  setRestorationPaletteValues, applyRestorationPalette, getRestorationPalette,
  FORK_DEFAULT_PALETTE, restorationPaletteIsDefault,
} from "../restorationPalette";

const entry = (key: string) => RESTORATION_PALETTE.find((e) => e.key === key)!;

/** A stand-in for a root element, recording what was written and removed. */
function fakeRoot() {
  const set = new Map<string, string>();
  const removed: string[] = [];
  return {
    set, removed,
    style: {
      setProperty: (k: string, v: string) => { set.set(k, v); },
      removeProperty: (k: string) => { removed.push(k); set.delete(k); },
    } as unknown as CSSStyleDeclaration,
  };
}

// Clear to a GENUINELY empty palette (not the fork default reset now restores),
// so the "unconfigured writes nothing / reports no chosen colours" guarantees
// below still test the byte-identical unconfigured state the parity contract
// rests on.
beforeEach(() => { setRestorationPaletteValues({}); });

describe("an untouched palette writes nothing", () => {
  it("removes rather than writing the defaults back", () => {
    // Writing the default back would leave a chart that merely LOOKS
    // unconfigured while carrying inline properties that outlive a reset.
    const root = fakeRoot();
    applyRestorationPalette(root);
    expect(root.set.size).toBe(0);
    expect(root.removed.length).toBeGreaterThan(0);
  });

  it("reports no chosen colours", () => {
    expect(getRestorationPalette()).toEqual({});
  });

  it("still tells a picker what each material renders today", () => {
    expect(restorationColour("gold")).toBe("#e0a80d");
    expect(restorationColour("composite")).toBe("#2f7a4d");
  });

  it("shows a ramp material by its OWN colour, not its near-white first stop", () => {
    // e.max starts at #fff; a picker showing white would name the wrong thing.
    expect(restorationColour("emax")).toBe("#cebda3");
  });
});

describe("choosing a colour", () => {
  it("writes only the entry that was chosen", () => {
    setRestorationColourValue("gold", "#8b1a1a");
    const root = fakeRoot();
    applyRestorationPalette(root);
    expect(root.set.get("--odon-rest-gold")).toBe("#8b1a1a");
    expect(root.set.has("--odon-fill-composite")).toBe(false);
  });

  it("clears back to the shipped default with null", () => {
    setRestorationColourValue("gold", "#8b1a1a");
    setRestorationColourValue("gold", null);
    expect(restorationColour("gold")).toBe("#e0a80d");
    const root = fakeRoot();
    applyRestorationPalette(root);
    expect(root.set.has("--odon-rest-gold")).toBe(false);
  });

  it("refuses an unknown key and an unparsable colour", () => {
    expect(setRestorationColourValue("nosuch", "#fff")).toBe(false);
    expect(setRestorationColourValue("gold", "rot")).toBe(false);
    expect(restorationColour("gold")).toBe("#e0a80d");
  });

  it("keeps the two reported collisions separable", () => {
    // GIC shares #f9ae94 with the denture base, and a metal crown shares
    // #0051bf with a telescopic one. Separate variables is the whole point.
    setRestorationColourValue("gic", "#111111");
    const root = fakeRoot();
    applyRestorationPalette(root);
    expect(root.set.get("--odon-fill-gic")).toBe("#111111");
    expect(root.set.has("--odon-rest-denture-base")).toBe(false);
  });
});

describe("a ramp keeps its lightness sweep", () => {
  const defaults = entry("emax").defaults;

  it("still runs from near-white to the picked colour's darkness", () => {
    const out = deriveRamp(defaults, "#3355aa");
    expect(out).toHaveLength(9);
    const l = (hex: string) => {
      const [r, g, b] = parseHex(hex)!;
      return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    };
    // monotonically darkening, exactly as the shipped ramp is
    for(let i = 1; i < out.length; i++) expect(l(out[i])).toBeLessThanOrEqual(l(out[i - 1]) + 1e-6);
    expect(l(out[0])).toBeGreaterThan(0.9);   // the near-white end survives
  });

  it("does not flatten the ramp into one colour", () => {
    const out = deriveRamp(defaults, "#3355aa");
    expect(new Set(out).size).toBeGreaterThan(5);
  });

  it("returns the defaults untouched for a colour it cannot read", () => {
    expect(deriveRamp(defaults, "not-a-colour")).toEqual(defaults);
  });

  it("drives all nine variables from one pick", () => {
    setRestorationColourValue("emax", "#3355aa");
    const root = fakeRoot();
    applyRestorationPalette(root);
    for(let i = 0; i < 9; i++) expect(root.set.has(`--odon-rest-emax-${i}`)).toBe(true);
  });
});

describe("the telescope's anterior contrast is derived, not lost", () => {
  it("one pick drives crown, connector and the lighter anterior connector", () => {
    const out = resolveEntry(entry("telescope"), "#0051bf");
    expect(out[0]).toBe("#0051bf");
    expect(out[1]).toBe("#0051bf");
    expect(out[2]).not.toBe("#0051bf");
    const l = (hex: string) => { const [r, g, b] = parseHex(hex)!; return (Math.max(r, g, b) + Math.min(r, g, b)) / 2; };
    expect(l(out[2])).toBeGreaterThan(l(out[1]));   // lighter, as it ships today
  });

  it("lightens toward white without leaving the hue", () => {
    expect(lighten("#0051bf", 0)).toBe("#0051bf");
    expect(parseHex(lighten("#0051bf", 1))).toEqual([1, 1, 1]);
  });
});

describe("a persisted palette round-trips", () => {
  it("restores what was chosen and drops what it cannot use", () => {
    setRestorationPaletteValues({ gold: "#123456", nosuch: "#fff", gic: "nope" });
    expect(getRestorationPalette()).toEqual({ gold: "#123456" });
  });

  it("an empty restore is a reset", () => {
    setRestorationColourValue("gold", "#123456");
    setRestorationPaletteValues(null);
    expect(getRestorationPalette()).toEqual({});
  });
});

describe("the Cognovis fork default palette", () => {
  it("Reset to defaults restores the fork palette, not an empty one", () => {
    setRestorationColourValue("gold", "#123456");
    expect(restorationPaletteIsDefault()).toBe(false);
    resetRestorationPaletteValues();
    expect(getRestorationPalette()).toEqual(FORK_DEFAULT_PALETTE);
    expect(restorationPaletteIsDefault()).toBe(true);
  });

  it("writes the fork colours onto the root when applied", () => {
    resetRestorationPaletteValues();               // -> fork default
    const root = fakeRoot();
    applyRestorationPalette(root);
    expect(root.set.get("--odon-rest-gold")).toBe("#dfa507");
    expect(root.set.get("--odon-rest-telescope-connector-anterior")).toBe("#09ff05");
  });
});
