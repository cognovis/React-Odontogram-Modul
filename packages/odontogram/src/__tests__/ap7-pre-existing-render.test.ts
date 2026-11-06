// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-ap7 — hatching what the patient arrived with.
 *
 * Same harness as `r2c-proposed-styling.test.ts`: no live grid (that needs
 * async template fetches), so each test paints a detached parsed SVG with the
 * active chart's state and then calls the post-pass `applyStateToSvg`'s roots
 * loop would call right after — reproducing the real two-step sequence.
 *
 * What must hold, and why the third assertion is the important one: hatch only
 * the FINDINGS. If the anatomy a healthy tooth already draws were hatched too,
 * every tooth in the mouth would be striped and the marking would carry no
 * information at all.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";
import {
  setChartMode, captureExamination, resetExaminations,
  __setToothStateForTest, __resetChartStateForTest,
  __parseSvgForTest, __renderActiveLayersOnNode,
  __applyPreExistingStylingForTest,
} from "../odontogram";

const svg11 = readFileSync(fileURLToPath(new NodeURL("../assets/teeth-svgs/11.svg", import.meta.url)), "utf8");

const TOOTH = 11;
const CROWN_LAYER_ID = "zircon-crown";
const SOUND = { toothSelection: "tooth-base", restorationType: "none", restorationMaterial: "none" };
const CROWN = { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" };

const fillOf = (node: any, sel: string) => (node.querySelector(sel) as any)?.style.fill ?? "";
const hatched = (node: any, sel: string) => /^url\(["']?#odon-preexist-/.test(fillOf(node, sel));

/** Paint the node with `state` and run the post-pass, as the roots loop does. */
function render(state: Record<string, unknown>) {
  const node = __parseSvgForTest(svg11);
  __renderActiveLayersOnNode(node, TOOTH, state);
  __applyPreExistingStylingForTest(TOOTH, node);
  return node;
}

beforeEach(() => {
  __resetChartStateForTest();
  resetExaminations();
  setChartMode("status");
});

describe("a finding that was there at intake is hatched", () => {
  it("hatches a crown the patient arrived with", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    expect(hatched(render(CROWN), "#" + CROWN_LAYER_ID)).toBe(true);
  });

  it("leaves a crown placed under our care solid", () => {
    __setToothStateForTest(TOOTH, SOUND);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(TOOTH, CROWN);
    expect(hatched(render(CROWN), "#" + CROWN_LAYER_ID)).toBe(false);
  });

  it("never hatches the anatomy a healthy tooth draws anyway", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = render(CROWN);
    for(const id of ["tooth-base", "gum-base", "bone-base"]){
      expect(hatched(node, "#" + id)).toBe(false);
    }
  });
});

describe("the hatch keeps the finding's own colour", () => {
  it("paints the original fill back underneath the lines", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = render(CROWN);
    const shape = node.querySelector("#" + CROWN_LAYER_ID) as any;
    const base = shape.getAttribute("data-base-pfill");
    expect(base).toBeTruthy();
    const pattern = node.querySelector(`#${/url\(["']?#(.+?)["']?\)/.exec(shape.style.fill)![1]}`) as any;
    expect(pattern).toBeTruthy();
    expect(pattern.querySelector("rect")!.getAttribute("fill")).toBe(base);
  });

  it("puts the pattern in <defs>, where the parity fingerprint never looks", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = render(CROWN);
    const id = /url\(["']?#(.+?)["']?\)/.exec(fillOf(node, "#" + CROWN_LAYER_ID))![1];
    expect(node.querySelector(`defs #${id}`)).toBeTruthy();
  });
});

describe("with nothing archived, the pass is a no-op", () => {
  it("hatches nothing at all", () => {
    __setToothStateForTest(TOOTH, CROWN);
    const node = render(CROWN);
    expect(hatched(node, "#" + CROWN_LAYER_ID)).toBe(false);
    expect(node.querySelector("[data-preexisting]")).toBeNull();
  });
});

describe("the reset is symmetric", () => {
  it("un-hatches a finding once it is replaced under our care", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = __parseSvgForTest(svg11);
    __renderActiveLayersOnNode(node, TOOTH, CROWN);
    __applyPreExistingStylingForTest(TOOTH, node);
    expect(hatched(node, "#" + CROWN_LAYER_ID)).toBe(true);
    const original = (node.querySelector("#" + CROWN_LAYER_ID) as any).getAttribute("data-base-pfill");

    // the crown is redone: no longer what the patient arrived with
    resetExaminations();
    __setToothStateForTest(TOOTH, SOUND);
    captureExamination({ effectiveDateTime: "2026-02-01" });
    __setToothStateForTest(TOOTH, CROWN);
    __renderActiveLayersOnNode(node, TOOTH, CROWN);
    __applyPreExistingStylingForTest(TOOTH, node);

    expect(hatched(node, "#" + CROWN_LAYER_ID)).toBe(false);
    expect(fillOf(node, "#" + CROWN_LAYER_ID)).toBe(original);
  });

  it("re-rendering twice does not capture an already-hatched fill as the base", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = __parseSvgForTest(svg11);
    __renderActiveLayersOnNode(node, TOOTH, CROWN);
    __applyPreExistingStylingForTest(TOOTH, node);
    const first = (node.querySelector("#" + CROWN_LAYER_ID) as any).getAttribute("data-base-pfill");
    __renderActiveLayersOnNode(node, TOOTH, CROWN);
    __applyPreExistingStylingForTest(TOOTH, node);
    expect((node.querySelector("#" + CROWN_LAYER_ID) as any).getAttribute("data-base-pfill")).toBe(first);
    expect(first).not.toMatch(/^url\(/);
  });
});

describe("Plan mode leaves the tooth to the dashed channel", () => {
  it("hatches nothing while a plan is being drawn", () => {
    __setToothStateForTest(TOOTH, CROWN);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    setChartMode("plan");
    const node = render(CROWN);
    expect(hatched(node, "#" + CROWN_LAYER_ID)).toBe(false);
    setChartMode("status");
  });
});

describe("the hatch marks WORK, never the tooth and never the disease", () => {
  const svg16 = readFileSync(fileURLToPath(new NodeURL("../assets/teeth-svgs/16.svg", import.meta.url)), "utf8");
  const TOOTH16 = 16;

  /** Every layer id the hatch actually marked, for a state archived at intake. */
  function markedFor(state: Record<string, unknown>): string[] {
    __resetChartStateForTest();
    resetExaminations();
    setChartMode("status");
    __setToothStateForTest(TOOTH16, state);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    const node = __parseSvgForTest(svg16);
    __renderActiveLayersOnNode(node, TOOTH16, state);
    __applyPreExistingStylingForTest(TOOTH16, node);
    return [...new Set(Array.from(node.querySelectorAll('[data-preexisting="1"]'))
      .map((e: any) => e.id).filter(Boolean))] as string[];
  }

  it("hatches a root canal filling the patient arrived with", () => {
    // Dirk, 2026-08-11: a root filling is work somebody carried out, so the
    // same question applies to it as to a crown.
    expect(markedFor({ toothSelection: "tooth-base", endo: "endo-filling" })).toContain("endo-filling");
  });

  it("hatches an independent root post together with its incomplete root filling", () => {
    const marked = markedFor({
      toothSelection: "tooth-base",
      endo: "endo-filling-incomplete",
      rootPostType: "metal",
    });
    expect(marked).toContain("endo-filling-incomplete");
    expect(marked).toContain("endo-metal-pin");
  });

  it("hatches a direct filling", () => {
    expect(markedFor({ toothSelection: "tooth-base", fillingSurfaceMaterials: { occlusal: "amalgam" } }))
      .toContain("filling-amalgam-occlusal");
  });

  it("never hatches the tooth body — a radix is a tooth, not work", () => {
    expect(markedFor({ toothSelection: "tooth-base", toothSubstrate: "radix" })).toEqual([]);
  });

  it("never hatches an implant body", () => {
    expect(markedFor({ toothSelection: "implant" })).toEqual([]);
  });

  it("never hatches disease — caries, calculus, periodontal findings", () => {
    expect(markedFor({ toothSelection: "tooth-base", caries: ["caries-occlusal"] })).toEqual([]);
    expect(markedFor({ toothSelection: "tooth-base", calculus: true })).toEqual([]);
    expect(markedFor({ toothSelection: "tooth-base", mods: ["parodontal"] })).toEqual([]);
  });

  it("does not paint the invisible siblings inside a material wrapper group", () => {
    // <g id="gold"> also contains gold-inlay / gold-veneer / gold-bridge-connector,
    // all switched off. Marking them paints shapes nobody can see.
    const marked = markedFor({ toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
    expect(marked).toContain("gold-crown");
    for(const sibling of ["gold-inlay", "gold-veneer", "gold-bridge-connector"]){
      expect(marked).not.toContain(sibling);
    }
  });

  it("still records the tooth as pre-existing even where nothing is hatched", async () => {
    // The chart narrows; the record does not. im1 needs to know an implant was
    // already there, and the tooltip/summary still say so.
    const { getPreExistingAxes } = await import("../odontogram");
    markedFor({ toothSelection: "implant" });
    expect(getPreExistingAxes(TOOTH16)).toContain("presence");
  });
});
