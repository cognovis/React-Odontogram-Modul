// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Schiene / occlusal splint (charly). A per-tooth `occlusalSplint` flag; the
// guard band is DERIVED over adjacent marked teeth (detectOcclusalSplintSpans,
// minLen 1 — a splint may sit on a single tooth). Additive, omit-when-false.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";
import { detectOcclusalSplintSpans } from "../bridgeOverlay";

describe("Schiene (occlusal splint)", () => {
  it("defaults to false and is omitted from serialization", () => {
    __setToothStateForTest(15, {});
    expect(getToothDisplayState(15).occlusalSplint).toBe(false);
    expect(getStatusChart().teeth["15"]?.occlusalSplint).toBeUndefined();
  });

  it("stores and serializes the flag", () => {
    __setToothStateForTest(15, { occlusalSplint: true });
    expect(getToothDisplayState(15).occlusalSplint).toBe(true);
    expect(getStatusChart().teeth["15"]?.occlusalSplint).toBe(true);
  });

  it("derives a span over a single marked tooth (minLen 1)", () => {
    __setToothStateForTest(16, { occlusalSplint: true });
    const spans = detectOcclusalSplintSpans((tn) => getToothDisplayState(tn));
    expect(spans.some(s => s.includes(16))).toBe(true);
  });

});
