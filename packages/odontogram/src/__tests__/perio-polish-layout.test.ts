// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

// Periodontal "Dental Chart" polish, Task 1: occlusal-to-occlusal arch
// orientation + browser-responsive sizing + tighter/bigger teeth. Structural
// tests only — visual correctness (arches face occlusal-to-occlusal, the
// diagram resizes with the window, the curve tracks the teeth with deep
// pockets toward the root) is a browser check, see task-1-report.md.
//
// Same sync-core-against-a-hand-built-cache technique as
// perio-graphic-toothrow.test.ts (readFileSync + DOMParser on the real SVG
// asset text) — no fetch(), the live odontogram tiles are never touched.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  buildBuccalArchSvg,
  buildPalatalArchSvg,
  TOOTH_GAP,
  PERIO_DISPLAY_SCALE,
  type TemplateDocCache,
  type TemplateNo,
} from "../perioGraphic";
import { TEMPLATES } from "../odontogram";

const testFileUrl = import.meta.url;
const svgText = (tplNo: TemplateNo) =>
  readFileSync(fileURLToPath(new URL(`../assets/teeth-svgs/${tplNo}.svg`, testFileUrl)), "utf8");

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
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// UI-3a Task 2: `buildArchGraphic`'s old per-arch-CONDITIONAL orientation
// (upper flips crown-down, lower stays crown-up — "arch-aware") was
// literally the opposite of what UI-3a Task 1 introduced: `buildBuccalArchSvg`/
// `buildPalatalArchSvg` orient UNIFORMLY across BOTH arches (buccal always
// crown-down, palatal always crown-up). Migrated to assert the new uniform
// contract instead of the retired per-arch one; full coverage of the split
// builders lives in `ui3a-arch-split.test.ts`.
// Orientation follows the JAW, not the aspect: maxillary roots point cranially
// and mandibular roots caudally, in the facial and the palatal/lingual view
// alike. UI-3a had flipped per aspect and deliberately asserted that the
// transform was arch-INDEPENDENT, which left exactly one row of every jaw
// upside down (an upper palatal row with caudal roots, a lower buccal row with
// cranial roots). These assertions are the reverse of those.
describe("orientation is per JAW, in both aspects alike", () => {
  const cache = buildCache();

  // matrix(1 0 0 -1 0 80) == scale(1,-1) about y = ROW_BASELINE_Y (40): flips
  // the row while the CEJ baseline, the transform's fixed point, stays put.
  const FLIP = /matrix\(1 0 0 -1 0 80\)/;

  it("both UPPER rows are flipped, so maxillary roots point cranially", () => {
    for (const build of [buildBuccalArchSvg, buildPalatalArchSvg]) {
      const svg = build(cache, UPPER_ARCH);
      const row = svg.querySelector(".perio-tooth-row-buccal, .perio-tooth-row-palatal-inner")!;
      expect(row.getAttribute("transform") || "").toMatch(FLIP);
    }
  });

  it("neither LOWER row is flipped, so mandibular roots point caudally", () => {
    for (const build of [buildBuccalArchSvg, buildPalatalArchSvg]) {
      const svg = build(cache, LOWER_ARCH);
      const row = svg.querySelector(".perio-tooth-row-buccal, .perio-tooth-row-palatal-inner")!;
      expect(row.getAttribute("transform")).toBeNull();
    }
  });

  it("the two arches carry OPPOSITE orientation — the point of the rule", () => {
    for (const build of [buildBuccalArchSvg, buildPalatalArchSvg]) {
      const upper = build(cache, UPPER_ARCH).querySelector(".perio-tooth-row-buccal, .perio-tooth-row-palatal-inner")!;
      const lower = build(cache, LOWER_ARCH).querySelector(".perio-tooth-row-buccal, .perio-tooth-row-palatal-inner")!;
      expect(upper.getAttribute("transform")).not.toBe(lower.getAttribute("transform"));
    }
  });

  it("within ONE jaw both aspects agree — neither row can drift upside down again", () => {
    for (const arch of [UPPER_ARCH, LOWER_ARCH]) {
      const buccal = buildBuccalArchSvg(cache, arch).querySelector(".perio-tooth-row-buccal")!;
      const palatal = buildPalatalArchSvg(cache, arch).querySelector(".perio-tooth-row-palatal-inner")!;
      expect(buccal.getAttribute("transform")).toBe(palatal.getAttribute("transform"));
    }
  });
});

describe("Task 1: browser-responsive SVG (no pinned intrinsic size)", () => {
  const cache = buildCache();

  it("neither arch SVG sets a fixed width/height (so CSS width:100% can scale it)", () => {
    for (const svg of [buildBuccalArchSvg(cache, UPPER_ARCH), buildPalatalArchSvg(cache, UPPER_ARCH)]) {
      expect(svg.getAttribute("width")).toBeNull();
      expect(svg.getAttribute("height")).toBeNull();
    }
  });

  it("keeps the viewBox + preserveAspectRatio so the aspect ratio is preserved when scaled", () => {
    for (const svg of [buildBuccalArchSvg(cache, UPPER_ARCH), buildPalatalArchSvg(cache, UPPER_ARCH)]) {
      expect(svg.getAttribute("viewBox")).toBeTruthy();
      expect(svg.getAttribute("preserveAspectRatio")).toBe("xMinYMid meet");
    }
  });
});

describe("Task 1: tighter + bigger teeth", () => {
  it("TOOTH_GAP is tightened to 2 (denser row)", () => {
    expect(TOOTH_GAP).toBe(2);
  });

  it("PERIO_DISPLAY_SCALE bumps the per-unit display scale above 1 (bigger teeth)", () => {
    expect(PERIO_DISPLAY_SCALE).toBeGreaterThan(1);
  });
});
