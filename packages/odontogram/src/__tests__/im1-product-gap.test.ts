// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-im1's last rule, and the reason it waited for ap7.
 *
 * Two empties look alike and are not alike. Dirk: not every patient carries an
 * implant passport, so an empty product on an implant the practice inherited
 * is a fact rather than an omission — and one on an implant the practice
 * placed is an incomplete record.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  __setToothStateForTest, __resetChartStateForTest,
  captureExamination, resetExaminations, setChartMode,
  setImplantProduct, isImplantProductGap,
} from "../odontogram";
import { setI18nLanguage } from "../i18n/useI18n";

const IMPLANT = { toothSelection: "implant" };

beforeEach(() => {
  __resetChartStateForTest();
  resetExaminations();
  setChartMode("status");
  setI18nLanguage("en");
});

describe("with no examination archived it stays silent", () => {
  it("says nothing, because provenance is genuinely unknown", () => {
    // Warning here would be a guess dressed as a finding — the same silence
    // im1 kept before ap7 existed, now conditioned on the archive.
    __setToothStateForTest(36, IMPLANT);
    expect(isImplantProductGap(36)).toBe(false);
  });
});

describe("once a baseline exists", () => {
  it("an implant the patient arrived with is COMPLETE without a product", () => {
    __setToothStateForTest(36, IMPLANT);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    expect(isImplantProductGap(36)).toBe(false);
  });

  it("an implant WE placed with no product is a gap", () => {
    __setToothStateForTest(36, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(36, IMPLANT);          // placed under our care
    expect(isImplantProductGap(36)).toBe(true);
  });

  it("closes the moment anything at all is recorded about the product", () => {
    __setToothStateForTest(36, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(36, IMPLANT);
    expect(isImplantProductGap(36)).toBe(true);
    setImplantProduct(36, { system: "BLX" });
    expect(isImplantProductGap(36)).toBe(false);
  });

  it("never fires on a tooth that is not an implant", () => {
    __setToothStateForTest(36, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(36, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
    expect(isImplantProductGap(36)).toBe(false);
  });
});

describe("it stores nothing of its own", () => {
  it("is derived, so no second provenance flag can drift from ap7's", async () => {
    const { __collectExportPayloadForTest } = await import("../odontogram");
    __setToothStateForTest(36, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(36, IMPLANT);
    expect(isImplantProductGap(36)).toBe(true);
    const json = JSON.stringify(__collectExportPayloadForTest().teeth);
    expect(json).not.toContain("productGap");
    expect(json).not.toContain("placedByUs");
  });
});
