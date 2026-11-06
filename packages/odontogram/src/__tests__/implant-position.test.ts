// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Implantatposition (charly BefundAngabeImplantat: MITTIG/MESIAL/DISTAL/
// MESIAL_UND_DISTAL). A per-tooth categorical axis, gated to implant teeth,
// omit-when-"center" on serialize. Rendered in BOTH views (transform on the
// anatomical implant group, offset screw(s) in the schematic) — that part is
// visual and not asserted here; this pins the model + serialization contract.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";

describe("implant position", () => {
  it("defaults to center and is omitted from serialization", () => {
    __setToothStateForTest(21, { toothSelection: "implant" });
    expect(getToothDisplayState(21).implantPosition).toBe("center");
    expect(getStatusChart().teeth["21"]?.implantPosition).toBeUndefined();
  });

  it("stores and serializes a repositioned implant", () => {
    __setToothStateForTest(16, { toothSelection: "implant", implantPosition: "mesial" });
    expect(getToothDisplayState(16).implantPosition).toBe("mesial");
    expect(getStatusChart().teeth["16"]?.implantPosition).toBe("mesial");
  });

  it("serializes 'both'", () => {
    __setToothStateForTest(46, { toothSelection: "implant", implantPosition: "both" });
    expect(getStatusChart().teeth["46"]?.implantPosition).toBe("both");
  });

  it("ignores an invalid value on hydrate (falls back to center)", () => {
    __setToothStateForTest(26, { toothSelection: "implant", implantPosition: "sideways" });
    expect(getToothDisplayState(26).implantPosition).toBe("center");
  });
});
