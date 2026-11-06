// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Teilkrone pro Fläche (charly TEILKRONE1-4). `onlayCoverage: string[]` — which
// surfaces a partial crown (onlay) covers. Empty = whole table. Only on an onlay.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
  toggleOnlaySurface,
  getOnlayCoverage,
} from "../odontogram";

describe("onlay coverage (Teilkrone pro Fläche)", () => {
  it("defaults to empty and is omitted from serialization", () => {
    __setToothStateForTest(16, { restorationType: "onlay", restorationMaterial: "gold" });
    expect(getToothDisplayState(16).onlayCoverage).toEqual([]);
    expect(getStatusChart().teeth["16"]?.onlayCoverage).toBeUndefined();
  });

  it("stores and serializes covered surfaces", () => {
    __setToothStateForTest(16, { restorationType: "onlay", restorationMaterial: "gold", onlayCoverage: ["occlusal", "distal"] });
    expect(getToothDisplayState(16).onlayCoverage).toEqual(["occlusal", "distal"]);
    expect(getStatusChart().teeth["16"]?.onlayCoverage).toEqual(["occlusal", "distal"]);
  });

  it("drops invalid surfaces on hydrate", () => {
    __setToothStateForTest(26, { restorationType: "onlay", onlayCoverage: ["occlusal", "bogus"] });
    expect(getToothDisplayState(26).onlayCoverage).toEqual(["occlusal"]);
  });

  it("toggles only on an onlay, adding then removing", () => {
    __setToothStateForTest(36, { restorationType: "crown" });
    toggleOnlaySurface(36, "occlusal");
    expect(getOnlayCoverage(36)).toEqual([]);          // not an onlay: no-op
    __setToothStateForTest(36, { restorationType: "onlay" });
    toggleOnlaySurface(36, "occlusal");
    expect(getOnlayCoverage(36)).toEqual(["occlusal"]);
    toggleOnlaySurface(36, "occlusal");
    expect(getOnlayCoverage(36)).toEqual([]);
  });

});
