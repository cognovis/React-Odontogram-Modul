// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Kronenfraktur dreistufig (charly: Riss / gesplittert / Bruch). Severity
// qualifier `crownFractureType`, orthogonal to WHERE the crown is broken
// (brokenMesial/Incisal/Distal). Schema draws a graded crack; both share the
// tooltip line. Additive, omit-when-none.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";

describe("crown fracture severity", () => {
  it("defaults to none and is omitted from serialization", () => {
    __setToothStateForTest(11, {});
    expect(getToothDisplayState(11).crownFractureType).toBe("none");
    expect(getStatusChart().teeth["11"]?.crownFractureType).toBeUndefined();
  });

  it("stores and serializes a severity", () => {
    __setToothStateForTest(21, { crownFractureType: "split" });
    expect(getToothDisplayState(21).crownFractureType).toBe("split");
    expect(getStatusChart().teeth["21"]?.crownFractureType).toBe("split");
  });

  it("ignores an invalid value on hydrate", () => {
    __setToothStateForTest(22, { crownFractureType: "shattered" });
    expect(getToothDisplayState(22).crownFractureType).toBe("none");
  });

});
