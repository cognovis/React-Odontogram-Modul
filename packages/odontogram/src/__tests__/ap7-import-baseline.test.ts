// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-ap7 — an imported chart is somebody else's record.
 *
 * The rule has to resolve itself, because both cases arrive through the same
 * door: a foreign chart carries no archive and IS the baseline; a chart this
 * program exported carries its archive and must keep it, or a re-import would
 * file today's date over the patient's real intake date.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  __setToothStateForTest, __resetChartStateForTest,
  __importStatusForTest as importStatus, captureExamination, resetExaminations, listExaminations,
  getBaselineExamination, getPreExistingAxes, getStatusChart,
  getImportAsBaseline, setImportAsBaseline, setChartMode,
} from "../odontogram";
import { PAYLOAD_VERSION } from "../fhir/types";
import { setI18nLanguage } from "../i18n/useI18n";

const FOREIGN = {
  version: PAYLOAD_VERSION, globals: {}, teeth: {
    "16": { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" },
    "26": { toothSelection: "tooth-base", fillingSurfaceMaterials: { occlusal: "amalgam" } },
  },
} as never;

beforeEach(() => {
  __resetChartStateForTest();
  resetExaminations();
  setChartMode("status");
  setI18nLanguage("en");
  setImportAsBaseline(true);
});

describe("a chart with no archive of its own", () => {
  it("becomes the initial examination, so everything in it is pre-existing", () => {
    importStatus(FOREIGN);
    expect(listExaminations()).toHaveLength(1);
    expect(getPreExistingAxes(16)).toContain("restoration");
    expect(getPreExistingAxes(26)).toContain("fillings");
  });

  it("is dated the day this practice took it over", () => {
    importStatus(FOREIGN);
    expect(getBaselineExamination()!.effectiveDateTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is left alone when the choice is turned off", () => {
    setImportAsBaseline(false);
    importStatus(FOREIGN);
    expect(listExaminations()).toHaveLength(0);
    expect(getPreExistingAxes(16)).toEqual([]);
  });
});

describe("a chart this program exported", () => {
  it("keeps its own archive rather than being re-dated", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" });
    captureExamination({ effectiveDateTime: "2019-03-04" });
    const exported = getStatusChart();
    __resetChartStateForTest();
    resetExaminations();

    importStatus(exported);
    expect(listExaminations()).toHaveLength(1);
    // the patient's real intake date, not today
    expect(getBaselineExamination()!.effectiveDateTime).toBe("2019-03-04");
  });

  it("does not accumulate an examination on every round trip", () => {
    __setToothStateForTest(16, { toothSelection: "tooth-base" });
    captureExamination({ effectiveDateTime: "2019-03-04" });
    let doc = getStatusChart();
    for(let i = 0; i < 3; i++){
      importStatus(doc);
      doc = getStatusChart();
    }
    expect(listExaminations()).toHaveLength(1);
  });
});

describe("the choice itself", () => {
  it("defaults to on and is a session flag, never part of the payload", () => {
    expect(getImportAsBaseline()).toBe(true);
    setImportAsBaseline(false);
    expect(getImportAsBaseline()).toBe(false);
    __setToothStateForTest(16, { toothSelection: "tooth-base" });
    expect(JSON.stringify(getStatusChart())).not.toContain("importAsBaseline");
  });
});
