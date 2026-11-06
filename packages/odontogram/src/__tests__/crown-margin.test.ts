// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Kronenrand-Typisierung + Seite (charly BefundAngabeKronerandBefund + …Seite):
// crownMarginType (none|overhang|caries|filling) + crownMarginSide. A typed crown
// margin lights the anatomical crown-leakage slab; the Schema shows type + side.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";

describe("crown margin typing", () => {
  it("defaults to none/'' and is omitted from serialization", () => {
    __setToothStateForTest(11, { restorationType: "crown", restorationMaterial: "emax" });
    expect(getToothDisplayState(11).crownMarginType).toBe("none");
    expect(getStatusChart().teeth["11"]?.crownMarginType).toBeUndefined();
    expect(getStatusChart().teeth["11"]?.crownMarginSide).toBeUndefined();
  });

  it("stores and serializes a typed + sided margin", () => {
    __setToothStateForTest(21, { restorationType: "crown", restorationMaterial: "emax", crownMarginType: "overhang", crownMarginSide: "mesial" });
    const d = getToothDisplayState(21);
    expect(d.crownMarginType).toBe("overhang");
    expect(d.crownMarginSide).toBe("mesial");
    const rec = getStatusChart().teeth["21"];
    expect(rec?.crownMarginType).toBe("overhang");
    expect(rec?.crownMarginSide).toBe("mesial");
  });

  it("ignores invalid values on hydrate", () => {
    __setToothStateForTest(22, { restorationType: "crown", crownMarginType: "chipped", crownMarginSide: "occlusal" });
    expect(getToothDisplayState(22).crownMarginType).toBe("none");
    expect(getToothDisplayState(22).crownMarginSide).toBe("");
  });

});
