// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Progressive ortho movement (charly „zunehmend"). A boolean qualifier on the
// ortho drift/tipping/rotation axes; surfaced in the Orthodontics summary.
// Additive, omit-when-false, gated on orthoAllowed.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getStatusChart,
  getToothStateSummary,
} from "../odontogram";

describe("ortho progressive (zunehmend)", () => {
  it("defaults to false and is omitted from serialization", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base" });
    expect(getStatusChart().teeth["11"]?.orthoProgressive).toBeUndefined();
  });

  it("stores and serializes when set on an ortho-eligible tooth", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoDrift: "mesial", orthoProgressive: true });
    expect(getStatusChart().teeth["11"]?.orthoProgressive).toBe(true);
  });

  it("qualifies the drift summary line with the progressive tag", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoDrift: "mesial", orthoProgressive: true });
    const lines = getToothStateSummary(11).join(" | ");
    expect(lines.toLowerCase()).toMatch(/increasing|zunehmend/);
  });
});
