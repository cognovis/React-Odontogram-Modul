// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Brücken-Kennzahlen für den Kostenplan (Dirk, 31.08.2026): Anzahl der Spannen,
// Glieder (pontics) und Pfeiler (abutments). Reine Ableitung aus den Befunden;
// die Festzuschuss-Rechnung selbst gehört in einen nachgelagerten Dienst, nicht hierher.
import { describe, it, expect } from "vitest";
import { __setToothStateForTest, getBridgeSummary } from "../odontogram";

describe("bridge summary (spans / pontics / abutments)", () => {
  it("counts a Krone–Glied–Krone span", () => {
    // 14 (crown abutment) – 15 (pontic) – 16 (crown abutment): one span, one
    // pontic, two abutments.
    __setToothStateForTest(14, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
    __setToothStateForTest(15, { toothSelection: "none", restorationType: "bridge" });
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
    const b = getBridgeSummary();
    expect(b.spans).toBe(1);
    expect(b.pontics).toBe(1);
    expect(b.abutments).toBe(2);
  });

  it("is empty with no bridge", () => {
    __setToothStateForTest(14, {});
    __setToothStateForTest(15, {});
    __setToothStateForTest(16, {});
    expect(getBridgeSummary()).toEqual({ spans: 0, pontics: 0, abutments: 0 });
  });
});
