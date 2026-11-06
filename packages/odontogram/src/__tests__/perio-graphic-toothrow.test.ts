// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

// Periodontal-arc "Dental Chart" graphical redesign, Task 2: the tooth-row
// graphic — reuse the existing `tooth-base` artwork (read-only, structural
// tests only; visual correctness is confirmed in a browser, see
// .superpowers/sdd/task-2-report.md).
//
// These tests exercise the SYNC core (`getToothBaseGroupFromCache` /
// `buildBuccalArchSvg`/`buildPalatalArchSvg`) directly against a hand-built template-doc cache
// parsed from the real SVG asset text via DOMParser — the exact same
// `readFileSync` + `DOMParser().parseFromString(..., "image/svg+xml")`
// technique `parity.test.ts` already uses (see its `svgText` helper) — so no
// `fetch()` is needed and the live odontogram's `toothSvgRoot` tiles /
// `buildGrid()` fetch path is never touched (parity-safe by construction:
// this module only ever READS the template asset text into its OWN new DOM,
// same as `__renderActiveLayers` does).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  getToothBaseGroupFromCache,
  buildBuccalArchSvg,
  buildPalatalArchSvg,
  CEJ_Y,
  EXCLUDED_TOOTH_BASE_IDS,
  type TemplateDocCache,
  type TemplateNo,
} from "../perioGraphic";
import { TEMPLATES, TOOTH_TEMPLATE } from "../odontogram";

const testFileUrl = import.meta.url;
const svgText = (tplNo: TemplateNo) =>
  readFileSync(fileURLToPath(new URL(`../assets/teeth-svgs/${tplNo}.svg`, testFileUrl)), "utf8");

// Which template each tooth used below is drawn from, read from the engine's
// own map rather than restated here — a hand-written copy would keep passing
// after TOOTH_TEMPLATE changed underneath it.
const TOOTH_TO_TPL: Record<number, TemplateNo> = Object.fromEntries(
  [...TOOTH_TEMPLATE.entries()].map(([toothNo, m]) => [toothNo, (m as { tpl: number }).tpl as TemplateNo]),
);

// The root length each template is DRAWN with, taken from the `toothgen`
// metadata the generator stamps into every file (`length` = occlusal edge to
// apex, `root_frac` = the root's share of it). Parsed rather than hardcoded so
// re-running the generator with a different ROOT_DISPLAY_SCALE cannot leave a
// stale number here silently passing.
const ROOT_LEN_DISPLAY: Record<number, number> = Object.fromEntries(
  TEMPLATE_NOS_FOR_META().map((tplNo) => {
    const m = svgText(tplNo).match(/<!-- toothgen:.*?root_frac=([\d.]+) length=([\d.]+)/);
    if (!m) throw new Error(`no toothgen metadata in template ${tplNo}`);
    return [tplNo, Number(m[1]) * Number(m[2])];
  }),
);
function TEMPLATE_NOS_FOR_META(): TemplateNo[] {
  return (Object.keys(TEMPLATES).map(Number) as TemplateNo[]).sort((a, b) => a - b);
}

// Derived from TEMPLATES instead of hard-wired: the tooth-template set has
// grown (9 instead of 4, see TOOTH_TEMPLATE in odontogram.ts). A fixed list
// would silently make these tests cover fewer templates than actually exist.
const TEMPLATE_NOS: readonly TemplateNo[] = (
  Object.keys(TEMPLATES).map(Number) as TemplateNo[]
).sort((a, b) => a - b);

function buildCache(): TemplateDocCache {
  const cache: TemplateDocCache = new Map();
  for (const tplNo of TEMPLATE_NOS) {
    cache.set(tplNo, new DOMParser().parseFromString(svgText(tplNo), "image/svg+xml"));
  }
  return cache;
}

const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];

describe("getToothBaseGroupFromCache", () => {
  const cache = buildCache();
  const sample = [11, 12, 13, 14, 16, 21, 22, 31, 33, 46];

  it("returns a group containing the tooth-base geometry and none of the excluded layers", () => {
    for (const toothNo of sample) {
      const group = getToothBaseGroupFromCache(cache, toothNo);
      const ids = Array.from(group.querySelectorAll("[id]")).map((el) => el.getAttribute("id"));
      expect(ids, `tooth ${toothNo}`).toContain("tooth-base");
      for (const excluded of EXCLUDED_TOOTH_BASE_IDS) {
        expect(ids, `tooth ${toothNo} must not include ${excluded}`).not.toContain(excluded);
      }
    }
  });

  it("clones any gradient <defs> the tooth-base subtree references (never renders black)", () => {
    for (const toothNo of sample) {
      const group = getToothBaseGroupFromCache(cache, toothNo);
      const toothBaseEl = group.querySelector("#tooth-base")!;
      expect(toothBaseEl).toBeTruthy();
      const fillSrc = `${toothBaseEl.getAttribute("fill") || ""} ${toothBaseEl.getAttribute("style") || ""}`;
      const ref = fillSrc.match(/url\(#([^)]+)\)/);
      if (ref) {
        const defsIds = Array.from(group.querySelectorAll("defs [id]")).map((el) => el.getAttribute("id"));
        expect(defsIds, `tooth ${toothNo} gradient ${ref[1]}`).toContain(ref[1]);
      }
      // else: this template's #tooth-base uses a flat fill (no gradient ref) —
      // nothing to clone; not a failure (verified true for all 4 current
      // templates, see task-2-report.md).
    }
  });

  // The lateral incisor's 0.8 width factor is RETIRED (2026-08-17). It existed
  // because a lateral was drawn as its central neighbour - in the lower arch
  // one template served 31, 32, 41 and 42 alike. Every position has its own
  // contour now, at the width it was drawn at, so the factor would narrow a
  // correct drawing by a further fifth.
  it("carries no width transform on any position, lateral incisor included", () => {
    for (const toothNo of [11, 12, 41, 42]) {
      const group = getToothBaseGroupFromCache(cache, toothNo);
      expect(group.querySelector('[data-perio-size^="position-2"]'), String(toothNo)).toBeNull();
    }
  });

  // Root restoration (perio chart only): the odontogram draws roots at 60 % of
  // their measured length, this chart puts them back, because here the root is
  // the scale a probing depth is read against. Asserted through the transform
  // rather than by eye — the failure it guards against (a root that stops short
  // of the pockets being charted) is silent otherwise.
  const rootScaleOf = (group: Element): { k: number; f: number } => {
    const node = group.querySelector('[data-perio-size^="root-"]');
    expect(node, "no root-scale node").toBeTruthy();
    const m = (node!.getAttribute("transform") || "").match(/matrix\(1 0 0 ([0-9.]+) 0 (-?[0-9.]+)\)/);
    expect(m, node!.getAttribute("transform") || "").toBeTruthy();
    return { k: Number(m![1]), f: Number(m![2]) };
  };

  it("every tooth's root is scaled back up, anchored at the CEJ so the baseline never moves", () => {
    for (const toothNo of [11, 12, 13, 14, 15, 16, 17, 18]) {
      const { k, f } = rootScaleOf(getToothBaseGroupFromCache(cache, toothNo));
      expect(k, `tooth ${toothNo}`).toBeGreaterThan(1);
      // Anchored scale about CEJ_Y: f = cejY*(1-k). The fixed point staying at
      // the CEJ is what keeps row-baseline alignment correct afterwards.
      // Tolerance covers the transform attribute's 3-decimal formatting only —
      // 0.005 row units is a ten-thousandth of a tooth.
      const tplNo = TOOTH_TO_TPL[toothNo];
      expect(f, `tooth ${toothNo}`).toBeCloseTo(CEJ_Y[tplNo] * (1 - k), 2);
    }
  });

  it("scales the ROOT only — the crown copy is clipped off at the CEJ and left untouched", () => {
    const group = getToothBaseGroupFromCache(cache, 16);
    const crown = group.querySelector('[data-perio-part="crown"]');
    const root = group.querySelector('[data-perio-part="root"]');
    expect(crown, "crown part").toBeTruthy();
    expect(root, "root part").toBeTruthy();
    // The crown copy carries no scale of its own — that is the whole point of
    // splitting: an affine transform cannot bend at the CEJ.
    expect(crown!.querySelector("[data-perio-size]")).toBeNull();
    // Root drawn first, crown over it: the crown's seam overlap must win.
    const parts = [...group.querySelectorAll("[data-perio-part]")].map(n => n.getAttribute("data-perio-part"));
    expect(parts).toEqual(["root", "crown"]);
    // The two clips meet at the CEJ, which is the scale's fixed point — so the
    // silhouette stays continuous across the cut.
    const rootClipId = (root!.getAttribute("clip-path") || "").replace(/^url\(#|\)$/g, "");
    const rect = group.querySelector(`#${rootClipId} rect`);
    expect(rect, "root clip rect").toBeTruthy();
    expect(Number(rect!.getAttribute("y"))).toBeCloseTo(CEJ_Y[16], 5);
  });

  it("the canine's root stays the longest despite its damping factor", () => {
    // CANINE_ROOT_SCALE damps position 3 (0.9) because a flat restore read too
    // long on the grid. It must not damp so far that the canine drops below a
    // central incisor — the one root-length proportion everybody recognises.
    const rootLen = (toothNo: number, tplNo: TemplateNo) => {
      const { k } = rootScaleOf(getToothBaseGroupFromCache(cache, toothNo));
      return k * ROOT_LEN_DISPLAY[tplNo];
    };
    expect(rootLen(13, 13)).toBeGreaterThanOrEqual(rootLen(11, 11));
    expect(rootLen(13, 13)).toBeGreaterThan(rootLen(16, 16));
  });

  it("positions 4-8 (premolars/molars) carry no WIDTH transform", () => {
    for (const toothNo of [14, 15, 16, 17, 18]) {
      const group = getToothBaseGroupFromCache(cache, toothNo);
      expect(group.querySelector('[data-perio-size^="position-2"]'), `tooth ${toothNo}`).toBeNull();
    }
  });

  it("mirrors horizontally only for the mirrored side of the arch (21 vs 11)", () => {
    const left = getToothBaseGroupFromCache(cache, 11); // mirror:false
    const right = getToothBaseGroupFromCache(cache, 21); // mirror:true, same tpl(11)
    expect(left.querySelector('[data-perio-mirror="1"]')).toBeNull();
    const rightMirror = right.querySelector('[data-perio-mirror="1"]');
    expect(rightMirror).toBeTruthy();
    expect(rightMirror!.getAttribute("transform") || "").toMatch(/matrix\(-1 0 0 1 /);
  });

  it("der UNTERKIEFER wird andersherum gespiegelt als der Oberkiefer", () => {
    // Dirk, 21.08.2026: "In der PAR-Ansicht sind die Kauflaechen der UK Molaren
    // zwischen 3/4 Quadranten vertauscht."
    //
    // Die Tabelle steht hier AUSGESCHRIEBEN und nicht als Regel, weil die Regel
    // genau das war, was schiefging: `map.mirror` allein gelesen, obwohl eine
    // Drehung um 180 Grad BEIDE Achsen kippt. Im Oberkiefer faellt das nicht
    // auf (dort ist rot=0), im Unterkiefer dreht es beide Haelften auf einmal um
    // - weshalb jeder einzelne Zahn plausibel aussah und erst das PAAR als
    // vertauscht zu lesen war.
    const gespiegelt = (toothNo: number) =>
      getToothBaseGroupFromCache(cache, toothNo).querySelector('[data-perio-mirror="1"]') !== null;

    for(const t of [11, 12, 13, 14, 15, 16, 17, 18]) expect(gespiegelt(t), `${t}`).toBe(false);
    for(const t of [21, 22, 23, 24, 25, 26, 27, 28]) expect(gespiegelt(t), `${t}`).toBe(true);
    // Dirks untere Zeichnungen SIND Quadrant 4 - sie stehen, wie sie gezeichnet
    // sind, und die Spiegelung macht aus 41 die 31.
    for(const t of [41, 42, 43, 44, 45, 46, 47, 48]) expect(gespiegelt(t), `${t}`).toBe(false);
    for(const t of [31, 32, 33, 34, 35, 36, 37, 38]) expect(gespiegelt(t), `${t}`).toBe(true);
  });

  it("und die beiden Molaren eines Paares sind Spiegelbilder, nicht Kopien", () => {
    // 46 und 36 kommen aus DERSELBEN Vorlage. Genau einer von beiden traegt die
    // Spiegelung - traegt sie keiner oder tragen sie beide, zeigen die beiden
    // Kieferhaelften dieselbe Hand.
    for(const [rechts, links] of [[46, 36], [47, 37], [44, 34], [41, 31]] as const){
      const a = getToothBaseGroupFromCache(cache, rechts);
      const b = getToothBaseGroupFromCache(cache, links);
      expect(a.getAttribute("data-tpl")).toBe(b.getAttribute("data-tpl"));
      const zahl = (g: SVGGElement) => (g.querySelector('[data-perio-mirror="1"]') ? 1 : 0);
      expect(zahl(a) + zahl(b), `${rechts}/${links}`).toBe(1);
    }
  });

  it("throws for a tooth number absent from TOOTH_TEMPLATE", () => {
    expect(() => getToothBaseGroupFromCache(cache, 99)).toThrow();
  });

  it("throws if the requested template was not loaded into the cache", () => {
    const partial: TemplateDocCache = new Map([[11, cache.get(11)!]]);
    expect(() => getToothBaseGroupFromCache(partial, 13)).toThrow();
  });
});

describe("CEJ_Y anchors", () => {
  it("defines a positive numeric anchor for every template", () => {
    for (const tpl of TEMPLATE_NOS) {
      expect(typeof CEJ_Y[tpl], String(tpl)).toBe("number");
      expect(CEJ_Y[tpl], String(tpl)).toBeGreaterThan(0);
    }
  });
});

// UI-3a Task 2: `buildArchGraphic` (the legacy combined single-SVG builder)
// has been removed — `buildBuccalArchSvg`/`buildPalatalArchSvg` are now the
// only arch-artwork API (each independently viewBoxed, uniformly oriented
// across both arches). Full coverage of the uniform-orientation contract
// lives in `ui3a-arch-split.test.ts`; this suite keeps a few targeted
// regression checks migrated from the old `buildArchGraphic` describe block.
describe("buildBuccalArchSvg / buildPalatalArchSvg", () => {
  const cache = buildCache();

  it("renders all 16 upper teeth, in FDI order 18->11,21->28, in the buccal row", () => {
    const svg = buildBuccalArchSvg(cache, UPPER_ARCH);
    const buccal = svg.querySelector(".perio-tooth-row-buccal");
    expect(buccal).toBeTruthy();
    const toothEls = Array.from(buccal!.querySelectorAll("[data-tooth]"));
    expect(toothEls.map((el) => el.getAttribute("data-tooth"))).toEqual(UPPER_ARCH.map(String));
  });

  it("every rendered tooth carries the tooth-base geometry (buccal + palatal)", () => {
    const buccalSvg = buildBuccalArchSvg(cache, UPPER_ARCH);
    const buccal = buccalSvg.querySelector(".perio-tooth-row-buccal")!;
    const palatalSvg = buildPalatalArchSvg(cache, UPPER_ARCH);
    const palatal = palatalSvg.querySelector(".perio-tooth-row-palatal-inner")!;
    for (const row of [buccal, palatal]) {
      for (const toothNo of UPPER_ARCH) {
        const toothEl = row.querySelector(`[data-tooth="${toothNo}"]`);
        expect(toothEl, `tooth ${toothNo}`).toBeTruthy();
        const ids = Array.from(toothEl!.querySelectorAll("[id]")).map((el) => el.getAttribute("id"));
        expect(ids, `tooth ${toothNo}`).toContain("tooth-base");
      }
    }
  });

  it("the palatal SVG's teeth are the SAME teeth, same order, as the buccal SVG's (independent bands, same tooth set)", () => {
    const buccal = buildBuccalArchSvg(cache, UPPER_ARCH).querySelector(".perio-tooth-row-buccal")!;
    const palatal = buildPalatalArchSvg(cache, UPPER_ARCH).querySelector(".perio-tooth-row-palatal-inner")!;
    const buccalTeeth = Array.from(buccal.querySelectorAll("[data-tooth]")).map((el) => el.getAttribute("data-tooth"));
    const palatalTeeth = Array.from(palatal.querySelectorAll("[data-tooth]")).map((el) => el.getAttribute("data-tooth"));
    expect(palatalTeeth).toEqual(buccalTeeth);
  });

  it("also renders the lower arch buccal row in FDI order 48->41,31->38", () => {
    const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
    const svg = buildBuccalArchSvg(cache, LOWER_ARCH);
    const buccal = svg.querySelector(".perio-tooth-row-buccal")!;
    const toothEls = Array.from(buccal.querySelectorAll("[data-tooth]"));
    expect(toothEls.map((el) => el.getAttribute("data-tooth"))).toEqual(LOWER_ARCH.map(String));
  });

  it("both SVGs are marked aria-hidden — purely decorative, the accessible data lives in the number cells/summary", () => {
    for (const svg of [buildBuccalArchSvg(cache, UPPER_ARCH), buildPalatalArchSvg(cache, UPPER_ARCH)]) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      // No nameless role="img" left for axe-core to flag either.
      expect(svg.getAttribute("role")).toBeNull();
    }
  });
});
