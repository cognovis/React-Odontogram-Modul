// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";
import { namespacePaintServers, OCCLUSAL_TEMPLATE, TOOTH_TEMPLATE } from "../odontogram";

const SIDE = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "41", "42", "43", "44", "45", "46", "47", "48",
] as const;
const POSTERIOR_SIDE = ["14", "15", "16", "17", "18", "44", "45", "46", "47", "48"] as const;
const ALL = [...SIDE, "14_occl", "16_occl"] as const;

function readSvg(name: string): string {
  // Use Node's own URL (not the jsdom-provided global URL, which mis-resolves
  // relative `file:` URLs against `window.location` under the jsdom test
  // environment) so this always resolves relative to this test file on disk.
  const url = new NodeURL(`../assets/teeth-svgs/${name}.svg`, import.meta.url);
  return readFileSync(fileURLToPath(url), "utf8");
}

// Drawable leaf ids that are NEW clinical layers; each MUST carry inline
// display:none so the engine hides it at load (it is never toggled in SP1).
const NEW_LEAVES_ALL = [
  "metal-ceramic-crown", "metal-ceramic-bridge-connector",
  "gold-crown", "gold-bridge-connector",
  "gradia-crown", "gradia-bridge-connector",
  "crown-leakage",
];
const NEW_LEAVES_FRONT = ["caries-root", "fracture-horizontal-1", "fracture-vertical-1", "ortho-ring", "ortho-bracket", "arrow-up", "arrow-down"];

function clinicalElementIds(svg: string): string[] {
  const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
  return Array.from(root.querySelectorAll(":scope > g [id]"), (element) => element.id);
}

function transformedX(x: number, width: number, placement: { rot: number; mirror: boolean }): number {
  let result = x;
  if (placement.rot === 180) result = width - result;
  if (placement.mirror) result = width - result;
  return result;
}

describe("installed tooth SVG assets", () => {
  it("every file carries SVG Version 2.5.0", () => {
    for (const n of ALL) expect(readSvg(n), n).toContain("SVG Version: 2.5.0");
  });

  it("no file still carries an old SVG version tag", () => {
    for (const n of ALL) {
      const s = readSvg(n);
      expect(s, n).not.toContain("SVG Version: 2.1");
      expect(s, n).not.toContain("Build 109"); // raw Illustrator tag must be gone
    }
  });

  it("16_occl uses prosthesis-connector, not the bridge-connector typo", () => {
    const s = readSvg("16_occl");
    expect(s).toContain('id="prosthesis-connector"');
    expect(s).not.toContain('id="prosthesis-bridge-connector"');
  });

  it("front teeth use the corrected 'incisal' broken-crown ids (no 'inicisal')", () => {
    for (const n of SIDE) {
      const s = readSvg(n);
      expect(s, n).not.toContain("inicisal");
      expect(s, n).toContain('id="tooth-broken-incisal"');
    }
  });

  it("all 7 broken-crown variant ids exist in each front template", () => {
    const variants = [
      "tooth-broken-mesial", "tooth-broken-distal", "tooth-broken-incisal",
      "tooth-broken-mesial-distal", "tooth-broken-mesial-incisal",
      "tooth-broken-distal-incisal", "tooth-broken-mesial-distal-incisal",
    ];
    for (const n of SIDE) {
      const s = readSvg(n);
      for (const v of variants) expect(s, `${n}:${v}`).toContain(`id="${v}"`);
    }
  });

  it("existing metal-crown layer is preserved (no visual change for crownMaterial=metal)", () => {
    for (const n of ALL) expect(readSvg(n), n).toContain('id="metal-crown"');
  });

  it("new dormant clinical leaves are hidden by default (display:none on the element or an ancestor)", () => {
    // Parse each file ONCE, not once per layer id. It used to re-parse inside
    // the loop, which cost 7 x 18 full DOM parses after the template set grew
    // from nine drawings to sixteen plus ten deciduous - and tipped this test
    // over the 5 s budget. Same assertions, same files.
    const docs = new Map<string, Document>();
    const docFor = (svg: string): Document => {
      let doc = docs.get(svg);
      if (!doc) { doc = new DOMParser().parseFromString(svg, "image/svg+xml"); docs.set(svg, doc); }
      return doc;
    };
    const isHiddenByDefault = (svg: string, id: string): boolean => {
      const start = docFor(svg).getElementById(id);
      for (let cur: Element | null = start; cur; cur = cur.parentElement) {
        if (/display\s*:\s*none/i.test(cur.getAttribute("style") || "")) return true;
      }
      return false;
    };
    for (const n of ALL) {
      const s = readSvg(n);
      for (const id of NEW_LEAVES_ALL) {
        if (s.includes(`id="${id}"`)) expect(isHiddenByDefault(s, id), `${n}:${id}`).toBe(true);
      }
    }
    for (const n of SIDE) {
      const s = readSvg(n);
      for (const id of NEW_LEAVES_FRONT) {
        if (s.includes(`id="${id}"`)) expect(isHiddenByDefault(s, id), `${n}:${id}`).toBe(true);
      }
    }
  });

  it("engine-toggled container groups are not display:none (plan/specials), so their children can be shown", () => {
    const containerNotHidden = (svg: string, id: string): boolean => {
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      const el = doc.getElementById(id);
      if (!el) return true; // absent is fine (e.g. occlusal files have no `specials`)
      return !/display\s*:\s*none/i.test(el.getAttribute("style") || "");
    };
    for (const n of ALL) {
      const s = readSvg(n);
      for (const id of ["plan", "specials"]) {
        expect(containerNotHidden(s, id), `${n}:${id} container must not be display:none`).toBe(true);
      }
    }
  });

  it("base anatomy layers are present", () => {
    for (const n of SIDE) {
      const s = readSvg(n);
      for (const id of ["tooth-base", "bone-base", "gum-base"]) expect(s, `${n}:${id}`).toContain(`id="${id}"`);
    }
  });

  it("posterior side templates declare the generated anatomy and dimensions", () => {
    // Heights grew across the board on 2026-08-11 (odontogram-3y9): roots are
    // drawn at 75 % of measured length instead of 60 %, and `root_frac` is now
    // read off the Odontographie plates. Widths are unchanged, deliberately —
    // the length decision divides itself back out of `width_frac`, so how wide
    // a tooth is drawn did not move.
    // Measured off the shipped files. BOTH the frame's height and its left edge
    // are derived per template now: the height is sized so the drawn
    // incisal/occlusal edge sits a fixed distance above the bottom edge (which
    // puts every tooth's occlusal plane on one line), and the left edge is set
    // so the crown's widest point - the contact point - sits in the middle of
    // the frame. The grid centres the FRAME in its column, so an off-centre
    // crown made neighbours drift into each other once the columns were tight
    // enough to see it.
    const expected = {
      "14": { roots: "2", viewBox: "-0.09 0.0 39.8 89.89" },
      "15": { roots: "1", viewBox: "-3.72 0.0 39.8 82.75" },
      "16": { roots: "3", viewBox: "-2.52 0.0 42.9 91.23" },
      "17": { roots: "3", viewBox: "-4.54 0.0 42.9 88.74" },
      "18": { roots: "3", viewBox: "0.44 0.0 42.9 87.40" },
      "44": { roots: "1", viewBox: "0.85 0.0 39.8 83.29" },
      "45": { roots: "1", viewBox: "-0.89 0.0 39.8 80.97" },
      "46": { roots: "2", viewBox: "-0.55 0.0 42.9 90.99" },
      "47": { roots: "2", viewBox: "-0.51 0.0 42.9 84.79" },
      "48": { roots: "2", viewBox: "-0.58 0.0 42.9 83.42" },
    } as const;

    for (const template of POSTERIOR_SIDE) {
      const root = new DOMParser().parseFromString(readSvg(template), "image/svg+xml").documentElement;
      expect(root.getAttribute("data-root-count"), template).toBe(expected[template].roots);
      expect(root.getAttribute("viewBox"), template).toBe(expected[template].viewBox);
    }
  });

  // One template per POSITION since 2026-08-17: the upper right and lower right
  // quadrants are drawn, the other two are those drawings mirrored. Nothing is
  // shared across the jaws any more - 18 no longer draws itself as 17, and the
  // lower premolars no longer as 15.
  it("maps every tooth to the template of its own position", () => {
    for (const toothNo of [11, 12, 13, 14, 15, 16, 17, 18]) {
      expect(TOOTH_TEMPLATE.get(toothNo)?.tpl, String(toothNo)).toBe(toothNo);
      expect(TOOTH_TEMPLATE.get(toothNo + 10)?.tpl, String(toothNo + 10)).toBe(toothNo);
    }
    for (const toothNo of [41, 42, 43, 44, 45, 46, 47, 48]) {
      expect(TOOTH_TEMPLATE.get(toothNo)?.tpl, String(toothNo)).toBe(toothNo);
      expect(TOOTH_TEMPLATE.get(toothNo - 10)?.tpl, String(toothNo - 10)).toBe(toothNo);
    }
  });

  // Pinned independently of OCCLUSAL_TEMPLATE. Iterating the map alone would
  // silently skip a tooth that fell out of it, which is exactly the regression
  // this suite has to catch: every posterior tooth that renders an occlusal
  // tile must still get one after the side-view mapping was split out.
  // Seit 18.08.2026 auch die mittleren Schneidezaehne: eine palatinale Fuellung
  // hat in der Seitenansicht keinen Platz, also bekommt der Frontzahn eine
  // Draufsicht wie der Seitenzahn. Die uebrigen zehn Frontzahn-Positionen
  // folgen, sobald Dirk sie gezeichnet hat.
  it("renders an occlusal tile for the posterior teeth and the drawn incisors", () => {
    expect([...OCCLUSAL_TEMPLATE.keys()].sort((a, b) => a - b)).toEqual([
      11, 12, 13,
      14, 15, 16, 17, 18,
      21, 22, 23,
      24, 25, 26, 27, 28,
      31, 32, 33,
      34, 35, 36, 37, 38,
      41, 42, 43,
      44, 45, 46, 47, 48,
    ]);
    // Ten occlusal drawings for the twenty posterior teeth - one per position
    // in the upper and lower right quadrant, the other side mirrored. It was
    // two before odontogram-vlw, then four, and now one per position.
    for (const [toothNo, placement] of OCCLUSAL_TEMPLATE) {
      const quadrant = Math.floor(toothNo / 10);
      const own = quadrant === 2 ? toothNo - 10 : quadrant === 3 ? toothNo + 10 : toothNo;
      expect(placement.tpl, String(toothNo)).toBe(own);
    }
  });

  it("keeps mesial occlusal geometry toward the arch midline in every quadrant", () => {
    expect(OCCLUSAL_TEMPLATE.size).toBe(32);
    for (const [toothNo, placement] of OCCLUSAL_TEMPLATE) {
      const svg = readSvg(`${placement.tpl}_occl`);
      const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
      const width = Number(root.getAttribute("viewBox")?.split(/\s+/)[2]);
      const mesialX = Number(root.querySelector("#mesial-shape")?.getAttribute("d")?.match(/^M([\d.]+)/)?.[1]);
      const distalX = Number(root.querySelector("#distal-shape")?.getAttribute("d")?.match(/^M([\d.]+)/)?.[1]);
      const transformedMesial = transformedX(mesialX, width, placement);
      const transformedDistal = transformedX(distalX, width, placement);
      const viewerLeft = Math.floor(toothNo / 10) === 1 || Math.floor(toothNo / 10) === 4;
      expect(transformedMesial > transformedDistal, String(toothNo)).toBe(viewerLeft);
    }
  });

  // Every position has its own drawing since 2026-08-17, and every one of them
  // takes its ~200 clinical layers from a donor template. That the layer
  // sequence survived the redraw is what keeps the SVG-fingerprint parity
  // contract true across sixteen files instead of nine, so it is asserted for
  // all of them at once rather than for a handful of pairs.
  // Grouped by DONOR, not globally: an anterior template carries no fissure
  // sealing and no per-surface resorption, so the sequences differ BETWEEN the
  // families and must be identical WITHIN one. That is the property the redraw
  // had to preserve, and the one the SVG-fingerprint parity contract rests on.
  it("preserves the complete clinical layer sequence within each donor family", () => {
    const families = [
      ["11", "12", "41", "42"],
      ["13", "43"],
      ["14", "15", "44", "45"],
      ["16", "17", "18", "46", "47", "48"],
    ];
    expect(families.flat().sort()).toEqual([...SIDE].sort());
    for (const family of families) {
      const reference = clinicalElementIds(readSvg(family[0]));
      expect(reference.length, family[0]).toBeGreaterThan(100);
      for (const n of family) expect(clinicalElementIds(readSvg(n)), n).toEqual(reference);
    }
  });

  it("keeps paint-server ids unique across side-view templates", () => {
    const paintServerIds: string[] = [];
    for (const template of SIDE) {
      const root = new DOMParser().parseFromString(readSvg(template), "image/svg+xml").documentElement;
      paintServerIds.push(...Array.from(root.querySelectorAll("defs [id]"), (element) => element.id));
    }
    expect(new Set(paintServerIds).size).toBe(paintServerIds.length);
  });

  it("namespaces paint servers per rendered tooth without changing clinical ids", () => {
    const parser = new DOMParser();
    const first = parser.parseFromString(readSvg("15"), "image/svg+xml").documentElement;
    const second = first.cloneNode(true) as Element;
    const clinicalId = first.querySelector(":scope > g [id]")?.id;

    namespacePaintServers(first, "tooth-15-side-");
    namespacePaintServers(second, "tooth-25-side-");

    expect(first.querySelector(":scope > g [id]")?.id).toBe(clinicalId);
    expect(second.querySelector(":scope > g [id]")?.id).toBe(clinicalId);
    const ids = [...first.querySelectorAll("defs [id]"), ...second.querySelectorAll("defs [id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const root of [first, second]) {
      const defined = new Set(Array.from(root.querySelectorAll("defs [id]"), (element) => element.id));
      const references = Array.from(root.querySelectorAll("*"))
        .flatMap((element) => Array.from(element.attributes, (attribute) => attribute.value))
        .flatMap((value) => Array.from(value.matchAll(/url\(#([^)]+)\)/g), (match) => match[1]));
      expect(references.every((id) => defined.has(id))).toBe(true);
    }
  });
});
