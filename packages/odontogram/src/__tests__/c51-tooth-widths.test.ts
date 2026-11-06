// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51.1 — measured mesiodistal crown widths.
//
// The widths are SESSION state, not document state: c51's audit found no
// published Dental Core profile for model analysis, and c51's rule is to stay
// blocked rather than invent a local-code path. These tests pin that boundary
// so a later change cannot quietly cross it — the export payload must stay
// untouched by anything recorded here.

import { describe, it, expect, beforeEach } from "vitest";
import {
  getToothWidth, getToothWidths, setToothWidth, resetToothWidths,
  isToothMeasurable, getAbsentTeeth,
  getOcclusalMeasurements, setOcclusalMeasurement, resetOcclusalMeasurements,
  onStateChange,
  __resetChartStateForTest, __collectExportPayloadForTest, __setToothStateForTest,
} from "../odontogram";
import { deriveModelAnalysis } from "../modelAnalysis";

beforeEach(() => {
  __resetChartStateForTest();
  resetToothWidths();
  resetOcclusalMeasurements();
});

describe("recording a width", () => {
  it("stores and reads back one tooth", () => {
    setToothWidth(11, 8.7);
    expect(getToothWidth(11)).toBe(8.7);
    expect(getToothWidths()).toEqual({ 11: 8.7 });
  });

  it("an unmeasured tooth has NO key — absence is not zero", () => {
    setToothWidth(11, 8.7);
    expect(getToothWidth(21)).toBeNull();
    expect(Object.keys(getToothWidths())).toEqual(["11"]);
  });

  it("null clears the entry rather than storing a sentinel", () => {
    setToothWidth(11, 8.7);
    setToothWidth(11, null);
    expect(getToothWidth(11)).toBeNull();
    expect(getToothWidths()).toEqual({});
  });

  it("rejects non-finite and non-positive readings by clearing", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      setToothWidth(11, 8.7);
      setToothWidth(11, bad);
      expect(getToothWidth(11)).toBeNull();
    }
  });

  it("clamps a caliper slip into a plausible crown range", () => {
    setToothWidth(11, 900);
    expect(getToothWidth(11)).toBe(20);
    setToothWidth(12, 0.2);
    expect(getToothWidth(12)).toBe(1);
  });

  it("ignores a tooth number that is not in the arch", () => {
    setToothWidth(99, 8.7);
    expect(getToothWidths()).toEqual({});
  });
});

describe("change notification", () => {
  it("fires on a real change and stays silent when the value is unchanged", () => {
    let fired = 0;
    const off = onStateChange(() => { fired += 1; });
    try {
      setToothWidth(11, 8.7);
      expect(fired).toBe(1);
      setToothWidth(11, 8.7);       // same value — idempotent, no notification
      expect(fired).toBe(1);
      setToothWidth(11, 8.8);
      expect(fired).toBe(2);
      setToothWidth(11, null);
      expect(fired).toBe(3);
      setToothWidth(11, null);      // already absent — nothing to clear
      expect(fired).toBe(3);
    } finally {
      off();
    }
  });
});

describe("reset", () => {
  it("resetToothWidths drops everything", () => {
    setToothWidth(11, 8.7);
    setToothWidth(21, 8.8);
    resetToothWidths();
    expect(getToothWidths()).toEqual({});
  });

  it("the blank-slate chart reset clears the widths too", () => {
    setToothWidth(11, 8.7);
    __resetChartStateForTest();
    expect(getToothWidths()).toEqual({});
  });
});

describe("the persistence boundary holds", () => {
  it("recording widths leaves the export payload byte-identical", () => {
    const before = JSON.stringify(__collectExportPayloadForTest());
    setToothWidth(11, 8.7);
    setToothWidth(21, 8.8);
    setToothWidth(16, 10.5);
    const after = JSON.stringify(__collectExportPayloadForTest());
    expect(after).toBe(before);
  });
});

describe("feeding the derivation", () => {
  it("getToothWidths plugs straight into deriveModelAnalysis", () => {
    const widths: Record<number, number> = {
      16: 10.5, 15: 6.5, 14: 7.1, 13: 8.1, 12: 7.1, 11: 8.7,
      21: 8.8, 22: 7.0, 23: 8.1, 24: 7.1, 25: 6.4, 26: 10.5,
      46: 11.4, 45: 6.8, 44: 6.8, 43: 7.0, 42: 6.2, 41: 5.8,
      31: 5.8, 32: 6.2, 33: 7.0, 34: 6.8, 35: 6.8, 36: 11.4,
    };
    for (const [no, mm] of Object.entries(widths)) setToothWidth(Number(no), mm);

    const a = deriveModelAnalysis({ widths: getToothWidths() });
    expect(a.sums.upperTotal!).toBeCloseTo(95.9, 6);
    expect(a.sums.lowerIncisors!).toBeCloseTo(24.0, 6);
    expect(a.boltonOverall.actualPercent!.toFixed(1)).toBe("91.8");
  });

  it("a half-measured arch derives nothing rather than a wrong ratio", () => {
    setToothWidth(11, 8.7);
    setToothWidth(21, 8.8);
    const a = deriveModelAnalysis({ widths: getToothWidths() });
    expect(a.sums.upperIncisors).toBeNull();
    expect(a.tonn.actualPercent).toBeNull();
  });
});

describe("which teeth are measurable", () => {
  it("a normal tooth is measurable", () => {
    expect(isToothMeasurable(11)).toBe(true);
  });

  it("an implant counts only once it carries a crown", () => {
    // Dirk's ruling: the crown's width is the reading, but a bare fixture or a
    // healing abutment has no width to measure. He also notes this has not
    // arisen once in thirty years — correctness, not load-bearing.
    __setToothStateForTest(11, { toothSelection: "implant" });
    expect(isToothMeasurable(11)).toBe(false);

    for (const restoration of ["crown", "bridge"]) {
      __setToothStateForTest(11, { toothSelection: "implant", restorationType: restoration });
      expect(isToothMeasurable(11), restoration).toBe(true);
    }
  });

  it("a bare implant substitutes from the contralateral like any empty position", () => {
    setToothWidth(21, 8.8);
    __setToothStateForTest(11, { toothSelection: "implant" });
    const a = deriveModelAnalysis({ widths: getToothWidths(), absentTeeth: getAbsentTeeth() });
    expect(a.substitutions).toEqual([{ toothNo: 11, from: 21, mm: 8.8 }]);
  });

  it("the four empty positions are not measurable", () => {
    for (const sel of ["none", "not-erupted", "no-tooth-after-extraction", "tooth-under-gum"]) {
      __setToothStateForTest(12, { toothSelection: sel });
      expect(isToothMeasurable(12), sel).toBe(false);
      expect(getAbsentTeeth()).toContain(12);
    }
  });

  it("getAbsentTeeth is empty on a fresh chart", () => {
    expect(getAbsentTeeth()).toEqual([]);
  });
});

describe("the substitution rule end to end", () => {
  it("12 missing, 22 present: the analysis borrows 22's width", () => {
    const widths: Record<number, number> = {
      16: 10.5, 15: 6.5, 14: 7.1, 13: 8.1, 11: 8.7,
      21: 8.8, 22: 7.0, 23: 8.1, 24: 7.1, 25: 6.4, 26: 10.5,
    };
    for (const [no, mm] of Object.entries(widths)) setToothWidth(Number(no), mm);
    __setToothStateForTest(12, { toothSelection: "none" });

    const a = deriveModelAnalysis({ widths: getToothWidths(), absentTeeth: getAbsentTeeth() });
    expect(a.substitutions).toEqual([{ toothNo: 12, from: 22, mm: 7.0 }]);
    expect(a.sums.upperIncisors).toBeCloseTo(31.5, 6);
  });
});

describe("occlusal measurements", () => {
  it("records and reads back all four", () => {
    setOcclusalMeasurement("overjet", 4.4);
    setOcclusalMeasurement("overbite", 6.3);
    setOcclusalMeasurement("midlineUpper", 0);
    setOcclusalMeasurement("midlineLower", -1.5);
    expect(getOcclusalMeasurements()).toEqual({
      overjet: 4.4, overbite: 6.3, midlineUpper: 0, midlineLower: -1.5,
    });
  });

  it("defaults to null, and 0 is a real reading rather than an absent one", () => {
    expect(getOcclusalMeasurements()).toEqual({
      overjet: null, overbite: null, midlineUpper: null, midlineLower: null,
    });
    setOcclusalMeasurement("overbite", 0);
    expect(getOcclusalMeasurements().overbite).toBe(0);
  });

  it("keeps negatives — a reversed overjet and an open bite are findings", () => {
    setOcclusalMeasurement("overjet", -2.5);
    setOcclusalMeasurement("overbite", -3);
    expect(getOcclusalMeasurements().overjet).toBe(-2.5);
    expect(getOcclusalMeasurements().overbite).toBe(-3);
  });

  it("clamps a slip to plus or minus 20 mm", () => {
    setOcclusalMeasurement("overjet", 400);
    expect(getOcclusalMeasurements().overjet).toBe(20);
    setOcclusalMeasurement("overjet", -400);
    expect(getOcclusalMeasurements().overjet).toBe(-20);
  });

  it("null clears, and non-finite input clears rather than storing NaN", () => {
    setOcclusalMeasurement("overjet", 4.4);
    setOcclusalMeasurement("overjet", null);
    expect(getOcclusalMeasurements().overjet).toBeNull();
    setOcclusalMeasurement("overjet", Number.NaN);
    expect(getOcclusalMeasurements().overjet).toBeNull();
  });

  it("notifies once per real change and stays silent when unchanged", () => {
    let fired = 0;
    const off = onStateChange(() => { fired += 1; });
    try {
      setOcclusalMeasurement("overjet", 4.4);
      expect(fired).toBe(1);
      setOcclusalMeasurement("overjet", 4.4);
      expect(fired).toBe(1);
    } finally { off(); }
  });

  it("the blank-slate reset clears them", () => {
    setOcclusalMeasurement("overjet", 4.4);
    __resetChartStateForTest();
    expect(getOcclusalMeasurements().overjet).toBeNull();
  });

  it("recording them leaves the export payload byte-identical", () => {
    const before = JSON.stringify(__collectExportPayloadForTest());
    setOcclusalMeasurement("overjet", 4.4);
    setOcclusalMeasurement("overbite", 6.3);
    setOcclusalMeasurement("midlineLower", -1.5);
    expect(JSON.stringify(__collectExportPayloadForTest())).toBe(before);
  });
});
