// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Verblockung / splinting (charly). A per-tooth `splinted` flag; the connecting
// bar is DERIVED over adjacent splinted teeth (detectSplintSpans), rendered in
// both views. Additive, omit-when-false.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";
import { detectSplintSpans } from "../bridgeOverlay";

describe("Verblockung (splinting)", () => {
  it("defaults to false and is omitted from serialization", () => {
    __setToothStateForTest(13, {});
    expect(getToothDisplayState(13).splinted).toBe(false);
    expect(getStatusChart().teeth["13"]?.splinted).toBeUndefined();
  });

  it("stores and serializes the flag", () => {
    __setToothStateForTest(13, { splinted: true });
    expect(getToothDisplayState(13).splinted).toBe(true);
    expect(getStatusChart().teeth["13"]?.splinted).toBe(true);
  });

  it("derives a span only over >=2 adjacent splinted teeth within an arch", () => {
    __setToothStateForTest(13, { splinted: true });
    __setToothStateForTest(12, { splinted: true });
    __setToothStateForTest(11, { splinted: true });
    __setToothStateForTest(37, { splinted: true }); // lone → no span
    const spans = detectSplintSpans((tn) => getToothDisplayState(tn));
    expect(spans).toContainEqual([13, 12, 11]);
    expect(spans.some(s => s.includes(37))).toBe(false);
  });

});
