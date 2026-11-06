// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51.1 — the model-analysis derivation core.
//
// The reference case below is one real model measurement whose printed
// evaluation was supplied with the bead. Only the widths are reproduced; no
// patient identity is carried here. Every expectation marked REFERENCE is a
// value that appears on that printout, so these tests check our arithmetic
// against a working clinical program rather than against itself.

import { describe, it, expect } from "vitest";
import {
  deriveModelAnalysis,
  hasAnyModelData,
  sumWidths,
  boltonDiscrepancy,
  contralateral,
  resolveWidths,
  TONN_TARGET_PERCENT,
  BOLTON_ANTERIOR_TARGET_PERCENT,
  BOLTON_OVERALL_TARGET_PERCENT,
  UPPER_TOTAL_TEETH,
  type ModelAnalysisInput,
} from "../modelAnalysis";

/** Mesiodistal widths in mm from the reference model measurement. */
const REFERENCE_WIDTHS: Record<number, number> = {
  16: 10.5, 15: 6.5, 14: 7.1, 13: 8.1, 12: 7.1, 11: 8.7,
  21: 8.8, 22: 7.0, 23: 8.1, 24: 7.1, 25: 6.4, 26: 10.5,
  46: 11.4, 45: 6.8, 44: 6.8, 43: 7.0, 42: 6.2, 41: 5.8,
  31: 5.8, 32: 6.2, 33: 7.0, 34: 6.8, 35: 6.8, 36: 11.4,
};

const reference = (): ModelAnalysisInput => ({ widths: { ...REFERENCE_WIDTHS } });

describe("sums", () => {
  it("REFERENCE: reproduces every printed sum", () => {
    const { sums } = deriveModelAnalysis(reference());
    expect(sums.upperTotal).toBeCloseTo(95.9, 6);      // Bolton OK gesamt
    expect(sums.upperAnterior).toBeCloseTo(47.8, 6);   // Bolton OK vorn
    expect(sums.lowerTotal).toBeCloseTo(88.0, 6);      // Bolton UK gesamt
    expect(sums.lowerAnterior).toBeCloseTo(38.0, 6);   // Bolton UK vorn
    expect(sums.upperIncisors).toBeCloseTo(31.6, 6);   // Summe Inzisivi OK (SI)
    expect(sums.lowerIncisors).toBeCloseTo(24.0, 6);   // Summe Inzisivi UK (si)
  });

  it("a sum with ANY unmeasured tooth is null, never a partial total", () => {
    const widths = { ...REFERENCE_WIDTHS };
    delete widths[26];
    const { sums } = deriveModelAnalysis({ widths });
    expect(sums.upperTotal).toBeNull();
    // the groups that do not contain 26 are unaffected
    expect(sums.upperAnterior).toBeCloseTo(47.8, 6);
    expect(sums.upperIncisors).toBeCloseTo(31.6, 6);
  });

  it("treats NaN, Infinity and non-positive readings as not measured", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -3]) {
      expect(sumWidths({ ...REFERENCE_WIDTHS, 16: bad }, UPPER_TOTAL_TEETH)).toBeNull();
    }
  });
});

describe("indices", () => {
  it("REFERENCE: reproduces every printed percentage", () => {
    const a = deriveModelAnalysis(reference());
    // printed as 75,9 % / 79,5 % / 91,8 %
    expect(a.tonn.actualPercent!).toBeCloseTo(75.9494, 3);
    expect(a.boltonAnterior.actualPercent!).toBeCloseTo(79.4979, 3);
    expect(a.boltonOverall.actualPercent!).toBeCloseTo(91.7622, 3);
    expect(a.tonn.actualPercent!.toFixed(1)).toBe("75.9");
    expect(a.boltonAnterior.actualPercent!.toFixed(1)).toBe("79.5");
    expect(a.boltonOverall.actualPercent!.toFixed(1)).toBe("91.8");
  });

  it("REFERENCE: carries the published norms unchanged", () => {
    const a = deriveModelAnalysis(reference());
    expect(a.tonn.targetPercent).toBe(74.0);
    expect(a.boltonAnterior.targetPercent).toBe(77.2);
    expect(a.boltonOverall.targetPercent).toBe(91.3);
    expect([TONN_TARGET_PERCENT, BOLTON_ANTERIOR_TARGET_PERCENT, BOLTON_OVERALL_TARGET_PERCENT])
      .toEqual([74.0, 77.2, 91.3]);
  });

  it("REFERENCE: target upper incisor sum is si / 0,74 and prints as 32,4 mm", () => {
    const a = deriveModelAnalysis(reference());
    expect(a.targetUpperIncisorSum!).toBeCloseTo(32.4324, 4);
    expect(a.targetUpperIncisorSum!.toFixed(1)).toBe("32.4");
  });

  it("every index is null when its inputs are incomplete", () => {
    const a = deriveModelAnalysis({ widths: { 11: 8.7 } });
    for (const idx of [a.tonn, a.boltonAnterior, a.boltonOverall]) {
      expect(idx.actualPercent).toBeNull();
      expect(idx.deltaPercent).toBeNull();
      expect(idx.excess).toBeNull();
      expect(idx.excessMm).toBeNull();
    }
    // ...but the norm still travels with it, so a UI can show the target row
    expect(a.tonn.targetPercent).toBe(74.0);
  });
});

describe("tooth-size discrepancy", () => {
  it("names the arch carrying the surplus", () => {
    const a = deriveModelAnalysis(reference());
    // all three ratios sit ABOVE their norm here, so the lower arch is wide
    expect(a.tonn.excess).toBe("lower");
    expect(a.boltonAnterior.excess).toBe("lower");
    expect(a.boltonOverall.excess).toBe("lower");
  });

  it("flips to the upper arch when the ratio falls below its norm", () => {
    // narrow the lower incisors well below Tonn's norm
    const widths = { ...REFERENCE_WIDTHS, 41: 4.0, 31: 4.0 };
    const a = deriveModelAnalysis({ widths });
    expect(a.tonn.actualPercent!).toBeLessThan(74.0);
    expect(a.tonn.excess).toBe("upper");
    expect(a.tonn.excessMm!).toBeGreaterThan(0);
  });

  it("reports no excess when the ratio sits exactly on its norm", () => {
    const { excess, excessMm } = boltonDiscrepancy(77.2, 100, BOLTON_ANTERIOR_TARGET_PERCENT);
    expect(excess).toBeNull();
    expect(excessMm).toBeNull();
  });

  it("DIVERGENCE, deliberate: classical Bolton excess, not the printout's figure", () => {
    const a = deriveModelAnalysis(reference());
    // Classical: lower sum minus the norm applied to the upper sum.
    // 38,0 - 47,8 x 0,772 = 1,098 mm of mandibular excess.
    expect(a.boltonAnterior.excessMm!).toBeCloseTo(1.0984, 3);

    // The reference printout instead prints 0,9 mm, because it multiplies the
    // percentage-point deviation by the ratio's own numerator. Reproduced here
    // so the divergence stays visible and cannot be mistaken for a bug: if this
    // line ever equals excessMm above, one of the two conventions has moved.
    const printoutConvention = (a.boltonAnterior.deltaPercent! * a.sums.lowerAnterior!) / 100;
    expect(printoutConvention.toFixed(1)).toBe("0.9");
    expect(printoutConvention).not.toBeCloseTo(a.boltonAnterior.excessMm!, 2);
  });
});

describe("purity and emptiness", () => {
  it("is a pure function - same input, same output, and the input is untouched", () => {
    const input = reference();
    const snapshot = JSON.stringify(input);
    const first = deriveModelAnalysis(input);
    const second = deriveModelAnalysis(input);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("hasAnyModelData separates a blank record from a measured one", () => {
    expect(hasAnyModelData({ widths: {} })).toBe(false);
    expect(hasAnyModelData({ widths: { 11: 0 } })).toBe(false);
    expect(hasAnyModelData({ widths: { 11: Number.NaN } })).toBe(false);
    expect(hasAnyModelData({ widths: { 11: 8.7 } })).toBe(true);
  });
});

describe("contralateral substitution", () => {
  // Dirk's rule: a tooth that is not on the model takes the width of the same
  // tooth on the other side, so Tonn and Bolton still mean something instead of
  // collapsing to "not computable".

  it("mirrors within the arch, permanent and primary", () => {
    expect(contralateral(12)).toBe(22);
    expect(contralateral(22)).toBe(12);
    expect(contralateral(11)).toBe(21);
    expect(contralateral(46)).toBe(36);
    expect(contralateral(36)).toBe(46);
    expect(contralateral(52)).toBe(62);
    expect(contralateral(83)).toBe(73);
  });

  it("returns null for anything that is not an FDI tooth", () => {
    expect(contralateral(9)).toBeNull();
    expect(contralateral(19)).toBeNull();
    expect(contralateral(99)).toBeNull();
  });

  it("REFERENCE: 12 missing but 22 present — SI still computes, from 22's width", () => {
    const widths = { ...REFERENCE_WIDTHS };
    delete widths[12];
    const a = deriveModelAnalysis({ widths, absentTeeth: [12] });
    // 22 is 7.0, so SI = 8.7 + 8.8 + 7.0 + 7.0 = 31.5
    expect(a.sums.upperIncisors).toBeCloseTo(31.5, 6);
    expect(a.substitutions).toEqual([{ toothNo: 12, from: 22, mm: 7.0 }]);
  });

  it("without the rule the same case computes nothing at all", () => {
    const widths = { ...REFERENCE_WIDTHS };
    delete widths[12];
    const a = deriveModelAnalysis({ widths });   // no absentTeeth — 12 is merely unmeasured
    expect(a.sums.upperIncisors).toBeNull();
    expect(a.substitutions).toEqual([]);
  });

  it("an absent tooth ignores a width stored against itself", () => {
    // There was nothing on the model to put the caliper on, so a reading filed
    // under this position is stale. The partner's value wins.
    const a = deriveModelAnalysis({
      widths: { ...REFERENCE_WIDTHS, 12: 99 },
      absentTeeth: [12],
    });
    expect(a.substitutions).toEqual([{ toothNo: 12, from: 22, mm: 7.0 }]);
    expect(a.sums.upperIncisors).toBeCloseTo(31.5, 6);
  });

  it("...and the stored width is only ignored, never destroyed", () => {
    const widths = { ...REFERENCE_WIDTHS };
    const absent = deriveModelAnalysis({ widths, absentTeeth: [12] });
    const present = deriveModelAnalysis({ widths });
    expect(absent.substitutions).toHaveLength(1);
    expect(present.substitutions).toHaveLength(0);
    expect(present.sums.upperIncisors).toBeCloseTo(31.6, 6);   // 12's own 7.1 is back
  });

  it("never chains: two absent contralaterals borrow from nobody", () => {
    const widths = { ...REFERENCE_WIDTHS };
    const a = deriveModelAnalysis({ widths, absentTeeth: [12, 22] });
    expect(a.substitutions).toEqual([]);
    expect(a.sums.upperIncisors).toBeNull();   // the honest answer
  });

  it("works in the lower arch and across several teeth at once", () => {
    const widths = { ...REFERENCE_WIDTHS };
    const a = deriveModelAnalysis({ widths, absentTeeth: [46, 31] });
    expect(a.substitutions).toEqual([
      { toothNo: 46, from: 36, mm: 11.4 },
      { toothNo: 31, from: 41, mm: 5.8 },
    ]);
    expect(a.sums.lowerTotal).toBeCloseTo(88.0, 6);   // symmetric case, unchanged
  });

  it("an absent tooth whose partner was never measured stays unmeasured", () => {
    const widths = { ...REFERENCE_WIDTHS };
    delete widths[22];
    const a = deriveModelAnalysis({ widths, absentTeeth: [12] });
    expect(a.substitutions).toEqual([]);
    expect(a.sums.upperIncisors).toBeNull();
  });

  it("resolveWidths reports the effective set the sums were built from", () => {
    const widths = { ...REFERENCE_WIDTHS };
    delete widths[12];
    const { effective, substitutions } = resolveWidths({ widths, absentTeeth: [12] });
    expect(effective[12]).toBe(7.0);
    expect(effective[11]).toBe(8.7);
    expect(substitutions).toHaveLength(1);
  });
});
