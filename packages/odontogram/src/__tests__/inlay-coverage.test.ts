// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Inlay-Flächen für den Kostenplan (Dirk, 31.08.2026): ein Restaurationsmaterial
// auf Flächen ist ein INLAY, und die Flächen werden als `inlayCoverage`
// gespeichert (früher verworfen), damit die Engine „Inlay n-flächig" abrechnen
// kann. Plus die neuen Materialien Zirkon/NEM.
import { describe, it, expect } from "vitest";
import { parseShorthand, MATERIALS } from "../shorthand";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
  toggleInlaySurface,
  getInlayCoverage,
  toggleVeneerSurface,
  getVeneerCoverage,
} from "../odontogram";

describe("materials: Zirkon + NEM", () => {
  it("map to the zircon and metal restoration materials", () => {
    expect(MATERIALS.Zir.restoration).toBe("zircon");
    expect(MATERIALS.NEM.restoration).toBe("metal");
    expect(MATERIALS.Zir.filling).toBeNull();
  });
});

describe("restoration from material + surfaces", () => {
  it("a restoration material on surfaces sets the material AND keeps the surfaces as coverage", () => {
    const r = parseShorthand("Gmod");   // Gold on m/o/d
    expect(r.edits).toContainEqual({ kind: "axis", field: "restorationMaterial", value: "gold" });
    // the surfaces are kept as the restoration's extent, not dropped; which
    // coverage (inlay/onlay/veneer) is decided by the writer from the tooth state
    const cov = r.edits.find(e => e.kind === "surfaces" && (e as { target: string }).target === "restoration-coverage");
    expect(cov).toBeTruthy();
    expect((cov as { surfaces: string[] }).surfaces.sort()).toEqual(["distal", "mesial", "occlusal"]);
  });

  it("Zirkon on surfaces carries the zircon material", () => {
    const r = parseShorthand("Ziro");   // Zirkon on occlusal
    expect(r.edits).toContainEqual({ kind: "axis", field: "restorationMaterial", value: "zircon" });
  });
});

describe("inlayCoverage model + schema", () => {
  it("stores and serializes only on an inlay, omit-when-empty", () => {
    __setToothStateForTest(16, { restorationType: "inlay", restorationMaterial: "gold" });
    expect(getInlayCoverage(16)).toEqual([]);
    expect(getStatusChart().teeth["16"]?.inlayCoverage).toBeUndefined();
    __setToothStateForTest(16, { restorationType: "inlay", restorationMaterial: "gold", inlayCoverage: ["mesial", "occlusal", "distal"] });
    expect(getStatusChart().teeth["16"]?.inlayCoverage).toEqual(["mesial", "occlusal", "distal"]);
  });

  it("the setter only takes on an inlay", () => {
    __setToothStateForTest(26, { restorationType: "crown" });
    toggleInlaySurface(26, "occlusal");
    expect(getInlayCoverage(26)).toEqual([]);
    __setToothStateForTest(26, { restorationType: "inlay" });
    toggleInlaySurface(26, "occlusal");
    expect(getInlayCoverage(26)).toEqual(["occlusal"]);
  });

});

describe("veneerCoverage model + schema", () => {
  it("stores and serializes only on a veneer, omit-when-empty", () => {
    __setToothStateForTest(11, { restorationType: "veneer", restorationMaterial: "emax" });
    expect(getVeneerCoverage(11)).toEqual([]);
    expect(getStatusChart().teeth["11"]?.veneerCoverage).toBeUndefined();
    __setToothStateForTest(11, { restorationType: "veneer", restorationMaterial: "emax", veneerCoverage: ["buccal", "occlusal"] });
    expect(getStatusChart().teeth["11"]?.veneerCoverage).toEqual(["buccal", "occlusal"]);
  });

  it("the setter only takes on a veneer", () => {
    __setToothStateForTest(21, { restorationType: "crown" });
    toggleVeneerSurface(21, "buccal");
    expect(getVeneerCoverage(21)).toEqual([]);
    __setToothStateForTest(21, { restorationType: "veneer" });
    toggleVeneerSurface(21, "buccal");
    expect(getVeneerCoverage(21)).toEqual(["buccal"]);
  });

});
