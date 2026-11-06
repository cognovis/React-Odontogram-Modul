// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-ap7 — what the patient arrived with, derived rather than stored.
 *
 * The archive from odontogram-2vd already knows the mouth as it was at intake,
 * so provenance is a comparison, not a second record. These tests hold that
 * line: nothing new is serialized, and every answer comes from the earliest
 * archived examination.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  __setToothStateForTest, __resetChartStateForTest, __collectExportPayloadForTest,
  captureExamination, resetExaminations, startExamination,
  getBaselineExamination, getPreExistingAxes, getChangesSinceBaseline, isToothPreExisting,
  setChartMode,
} from "../odontogram";
import { setI18nLanguage, t } from "../i18n/useI18n";

beforeEach(() => {
  __resetChartStateForTest();
  resetExaminations();
  setChartMode("status");
  setI18nLanguage("en");
});

describe("with no examination archived, nothing is pre-existing", () => {
  it("has no baseline", () => {
    expect(getBaselineExamination()).toBeNull();
  });

  it("reports nothing rather than guessing", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    expect(getPreExistingAxes(16)).toEqual([]);
    expect(getChangesSinceBaseline()).toEqual([]);
    expect(isToothPreExisting(16)).toBe(false);
  });
});

describe("a finding recorded at the initial examination", () => {
  beforeEach(() => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
  });

  it("is pre-existing", () => {
    expect(getPreExistingAxes(16)).toContain("restoration");
    expect(isToothPreExisting(16)).toBe(true);
  });

  it("names the examination it is judged against", () => {
    expect(getBaselineExamination()!.effectiveDateTime).toBe("2026-01-15");
  });

  it("stays pre-existing after a later examination is archived", () => {
    startExamination({ effectiveDateTime: "2026-06-30" });
    captureExamination();
    // The EARLIEST examination is the baseline — a routine per-visit capture
    // must not quietly become the new "what the patient arrived with".
    expect(getBaselineExamination()!.effectiveDateTime).toBe("2026-01-15");
    expect(getPreExistingAxes(16)).toContain("restoration");
  });

  it("stops being pre-existing once it is replaced under our care", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "bridge", restorationMaterial: "zircon" });
    expect(getPreExistingAxes(16)).not.toContain("restoration");
  });
});

describe("what was done under our care", () => {
  beforeEach(() => {
    __setToothStateForTest(16, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
  });

  it("is reported as a change, from the baseline's value to today's", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    const changes = getChangesSinceBaseline().filter((c) => c.toothNo === 16 && c.axis === "restoration");
    expect(changes).toHaveLength(1);
    expect(changes[0].to).toContain("rown");
  });

  it("is not pre-existing", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    expect(getPreExistingAxes(16)).not.toContain("restoration");
  });

  it("counts a tooth extracted since intake as a change too", () => {
    __setToothStateForTest(16, { toothSelection: "none" });
    expect(getChangesSinceBaseline().some((c) => c.toothNo === 16 && c.axis === "presence")).toBe(true);
  });
});

describe("an absent finding is not a pre-existing one", () => {
  it("a healthy tooth then and now reports nothing", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    expect(getPreExistingAxes(16)).toEqual([]);
    expect(isToothPreExisting(16)).toBe(false);
  });

  it("a tooth the baseline never mentioned compares against the clinical default", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    // 26 was never charted, so it was healthy at intake; crowning it now is ours.
    __setToothStateForTest(26, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
    expect(getPreExistingAxes(26)).toEqual([]);
    expect(getChangesSinceBaseline().some((c) => c.toothNo === 26 && c.axis === "restoration")).toBe(true);
  });
});

describe("provenance is about the observed mouth, not a proposal", () => {
  it("is unmoved by an edit made in Plan mode", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    setChartMode("plan");
    __setToothStateForTest(16, { toothSelection: "none" }); // planned extraction
    expect(getPreExistingAxes(16)).toContain("restoration");
    expect(getChangesSinceBaseline().some((c) => c.toothNo === 16)).toBe(false);
    setChartMode("status");
  });
});

describe("nothing is stored for it", () => {
  it("leaves the per-tooth payload untouched", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    const before = JSON.stringify(__collectExportPayloadForTest().teeth);
    captureExamination({ effectiveDateTime: "2026-01-15" });
    expect(isToothPreExisting(16)).toBe(true);
    expect(JSON.stringify(__collectExportPayloadForTest().teeth)).toBe(before);
  });
});

describe("the two findings the plan diff does not carry", () => {
  beforeEach(() => {
    __setToothStateForTest(26, {
      toothSelection: "tooth-base",
      fillingSurfaceMaterials: { occlusal: "amalgam" },
      caries: ["caries-mesial"],
    });
    captureExamination({ effectiveDateTime: "2026-01-15" });
  });

  it("counts a filling the patient arrived with", () => {
    expect(getPreExistingAxes(26)).toContain("fillings");
  });

  it("counts a caries lesion the patient arrived with", () => {
    expect(getPreExistingAxes(26)).toContain("caries");
  });

  it("reports a filling placed since intake as a change", () => {
    __setToothStateForTest(26, {
      toothSelection: "tooth-base",
      fillingSurfaceMaterials: { occlusal: "amalgam", distal: "composite" },
      caries: ["caries-mesial"],
    });
    const axes = getPreExistingAxes(26);
    expect(axes).not.toContain("fillings");   // the surface set changed
    expect(axes).toContain("caries");         // the lesion did not
    expect(getChangesSinceBaseline().some((c) => c.toothNo === 26 && c.axis === "fillings")).toBe(true);
  });

  it("leaves getPlanChanges' curated axis list alone", async () => {
    const { getPlanChanges, setChartMode: mode } = await import("../odontogram");
    mode("plan");
    __setToothStateForTest(26, {
      toothSelection: "tooth-base",
      fillingSurfaceMaterials: { occlusal: "amalgam", distal: "composite" },
      caries: ["caries-mesial"],
    });
    // The plan diff is a treatment-plan question and never grew these two.
    expect(getPlanChanges().some((c) => c.axis === "fillings" || c.axis === "caries")).toBe(false);
    mode("status");
  });
});

describe("the independent root-post axis", () => {
  it("counts a root post recorded at intake as pre-existing", () => {
    __setToothStateForTest(24, {
      toothSelection: "tooth-base",
      endo: "endo-filling-incomplete",
      rootPostType: "metal",
    });
    captureExamination({ effectiveDateTime: "2026-01-15" });

    expect(getPreExistingAxes(24)).toContain("rootPostType");
  });

  it("reports a root post added after intake without changing the root filling", () => {
    __setToothStateForTest(24, {
      toothSelection: "tooth-base",
      endo: "endo-filling-incomplete",
      rootPostType: "none",
    });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(24, {
      toothSelection: "tooth-base",
      endo: "endo-filling-incomplete",
      rootPostType: "metal",
    });

    expect(getChangesSinceBaseline().filter((c) => c.toothNo === 24 && c.axis === "rootPostType"))
      .toEqual([{
        toothNo: 24,
        axis: "rootPostType",
        from: t("planChange.none"),
        to: t("rootPost.option.metal"),
      }]);
  });
});

describe("correcting the initial examination", () => {
  beforeEach(() => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    captureExamination({ effectiveDateTime: "2026-01-15" });
    __setToothStateForTest(46, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "gold" });
  });

  it("shows the baseline while correcting, and gives today's findings back", async () => {
    const { beginBaselineCorrection, cancelBaselineCorrection, isCorrectingBaseline, __getToothStateForTest } =
      await import("../odontogram");
    expect(beginBaselineCorrection()).toBe(true);
    expect(isCorrectingBaseline()).toBe(true);
    // 46 was crowned AFTER intake, so the baseline does not have it
    expect((__getToothStateForTest(46) as any).restorationType).toBe("none");
    cancelBaselineCorrection();
    expect(isCorrectingBaseline()).toBe(false);
    expect((__getToothStateForTest(46) as any).restorationType).toBe("crown");
  });

  it("re-archives in place: still one examination, same id and date", async () => {
    const { beginBaselineCorrection, commitBaselineCorrection, listExaminations } = await import("../odontogram");
    const before = listExaminations();
    beginBaselineCorrection();
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "inlay", restorationMaterial: "gold" });
    expect(commitBaselineCorrection()).toBe(true);
    const after = listExaminations();
    expect(after).toHaveLength(before.length);
    expect(after[0].id).toBe(before[0].id);
    expect(after[0].effectiveDateTime).toBe("2026-01-15");
  });

  it("makes the correction count: the corrected finding is what is pre-existing now", async () => {
    const { beginBaselineCorrection, commitBaselineCorrection } = await import("../odontogram");
    beginBaselineCorrection();
    // the crown was mis-charted at intake; it was really an inlay
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "inlay", restorationMaterial: "gold" });
    commitBaselineCorrection();
    // today's chart still says crown, so the restoration axis now DIFFERS
    expect(getPreExistingAxes(16)).not.toContain("restoration");
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "inlay", restorationMaterial: "gold" });
    expect(getPreExistingAxes(16)).toContain("restoration");
  });

  it("refuses to enter twice — the second stash would be the baseline itself", async () => {
    const { beginBaselineCorrection, cancelBaselineCorrection } = await import("../odontogram");
    expect(beginBaselineCorrection()).toBe(true);
    expect(beginBaselineCorrection()).toBe(false);
    cancelBaselineCorrection();
  });

  it("refuses when there is no baseline at all", async () => {
    const { beginBaselineCorrection } = await import("../odontogram");
    resetExaminations();
    expect(beginBaselineCorrection()).toBe(false);
  });
});
