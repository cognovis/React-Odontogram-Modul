// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-vnt, AC3: an authored assessment status is READABLE where the
// affected axes already are — the per-tooth tooltip (`getToothStateSummary`)
// and the whole-mouth periodontal summary (`getOdontogramSummary`'s
// `periodontalText`). Like every other periodontal line, it is gated on the
// same predicate the control itself uses (`perioAxisApplies`), so a tolerant
// import can never surface a status on a tooth whose control the UI refuses.
import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetChartStateForTest,
  __setToothStateForTest,
  __hydrateImportedChartsForTest,
  getToothStateSummary,
  getOdontogramSummary,
  setAssessmentStatus,
  setPerioSite,
} from "../odontogram";
import { t } from "../i18n/useI18n";

beforeEach(() => {
  __resetChartStateForTest();
});

describe("odontogram-vnt AC3: the per-tooth tooltip", () => {
  it("says nothing when nothing was recorded", () => {
    __setToothStateForTest(16, {});
    const summary = getToothStateSummary(16);
    expect(summary.some((line) => line.includes(t("assessment.label")))).toBe(false);
  });

  it("groups the recorded points by status, naming index and measurement point", () => {
    __setToothStateForTest(16, {});
    setAssessmentStatus(16, "pd", "MB", "unmeasurable");
    setAssessmentStatus(16, "furcation", "buccal", "unmeasurable");
    setAssessmentStatus(16, "mobility", null, "assessed");

    const summary = getToothStateSummary(16);
    const unmeasurable = summary.find((line) => line.includes(t("assessment.status.unmeasurable")));
    expect(unmeasurable).toBeTruthy();
    expect(unmeasurable).toContain(t("perio.pd"));
    expect(unmeasurable).toContain(t("perio.site.MB"));
    expect(unmeasurable).toContain(t("furcation.label"));

    const assessed = summary.find((line) => line.includes(t("assessment.status.assessed")));
    expect(assessed).toBeTruthy();
    expect(assessed).toContain(t("perio.mobility"));
  });

  it("never surfaces a status the tooth's own control would refuse", () => {
    __hydrateImportedChartsForTest({
      version: "2.21",
      globals: {},
      teeth: { "21": { toothSelection: "none", assessment: { "pd:MB": "unmeasurable" } } },
    });
    const summary = getToothStateSummary(21);
    expect(summary.some((line) => line.includes(t("assessment.status.unmeasurable")))).toBe(false);
  });

  it("drops the line once a real measurement supersedes the recorded gap", () => {
    __setToothStateForTest(16, {});
    setAssessmentStatus(16, "pd", "MB", "unmeasurable");
    setPerioSite(16, "MB", { pd: 5 });
    const summary = getToothStateSummary(16);
    expect(summary.some((line) => line.includes(t("assessment.status.unmeasurable")))).toBe(false);
  });
});

describe("odontogram-vnt AC3: the whole-mouth periodontal summary", () => {
  it("is unchanged on a chart with no recorded assessment", () => {
    __setToothStateForTest(16, {});
    expect(getOdontogramSummary().periodontalText).not.toContain(t("assessment.label"));
  });

  it("counts the recorded statuses across the mouth", () => {
    __setToothStateForTest(16, {});
    __setToothStateForTest(26, {});
    setAssessmentStatus(16, "pd", "MB", "unmeasurable");
    setAssessmentStatus(16, "mobility", null, "assessed");
    setAssessmentStatus(26, "kg", null, "assessed");

    const text = getOdontogramSummary().periodontalText;
    expect(text).toContain(t("assessment.label"));
    expect(text).toContain(`${t("assessment.status.assessed")} 2`);
    expect(text).toContain(`${t("assessment.status.unmeasurable")} 1`);
  });

  it("counts only what the capability matrix allows", () => {
    __hydrateImportedChartsForTest({
      version: "2.21",
      globals: {},
      teeth: {
        "21": { toothSelection: "none", assessment: { "pd:MB": "unmeasurable" } },
        "16": { toothSelection: "tooth-base", assessment: { "pd:MB": "unmeasurable" } },
      },
    });
    const text = getOdontogramSummary().periodontalText;
    expect(text).toContain(`${t("assessment.status.unmeasurable")} 1`);
  });
});
