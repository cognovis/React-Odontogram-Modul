// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Wurzelkappe / root cap (charly). A per-tooth `rootCap` flag, allowed only on a
// radix substrate (the restoration control is hidden there). Additive,
// omit-when-false; drawn in the Schema as a metal coping over the root.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
  setRootCap,
  getRootCap,
} from "../odontogram";

describe("Wurzelkappe (root cap)", () => {
  it("defaults to false and is omitted from serialization", () => {
    __setToothStateForTest(14, { toothSubstrate: "radix" });
    expect(getToothDisplayState(14).rootCap).toBe(false);
    expect(getStatusChart().teeth["14"]?.rootCap).toBeUndefined();
  });

  it("stores and serializes on a radix", () => {
    __setToothStateForTest(14, { toothSubstrate: "radix", rootCap: true });
    expect(getToothDisplayState(14).rootCap).toBe(true);
    expect(getStatusChart().teeth["14"]?.rootCap).toBe(true);
  });

  it("the setter only takes on a radix substrate", () => {
    __setToothStateForTest(24, { toothSubstrate: "natural" });
    setRootCap(24, true);
    expect(getRootCap(24)).toBe(false);        // natural: no-op
    __setToothStateForTest(24, { toothSubstrate: "radix" });
    setRootCap(24, true);
    expect(getRootCap(24)).toBe(true);
  });

});
