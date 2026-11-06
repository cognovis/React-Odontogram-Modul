// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Hemisektion/Amputation/Prämolarisierung (rootResection + rootResectionRoot)
// and WSR (endoResection) in the SCHEMATIC view. The anatomical view already
// renders both (hemisection clip/overlay, endo-resection layer); these pin the
// display-state projection and the schematic glyph, the "both views" gap.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
} from "../odontogram";

describe("root resection + WSR — projection + schematic", () => {
  it("projects rootResection / rootResectionRoot / endoResection", () => {
    __setToothStateForTest(16, { rootResection: "hemisection", rootResectionRoot: "mesiobuccal", endoResection: true });
    const d = getToothDisplayState(16);
    expect(d.rootResection).toBe("hemisection");
    expect(d.rootResectionRoot).toBe("mesiobuccal");
    expect(d.endoResection).toBe(true);
  });

});
