// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

// P4b Task 4: the periodontal classification UI panel (Dental Chart) — the
// 2017 World Workshop diagnosis/stage/grade/extent classification, extending
// the P4a case-metadata panel (`src/PerioChart.tsx`) with a block that shows,
// per axis, the DERIVED value (`getPerioClassification().derived`) and an
// override <select> wired to the matching T2 setter
// (setDiagnosisOverride/setStageOverride/setGradeOverride/setExtentOverride).
//
// Same harness as p4a-case-panel.test.ts: <App/> mounted with the heavy
// engine lifecycle mocked out, the full P1/P2/PG-*/P4a perio data-core
// surface + the new classification getter/setters forwarded from the REAL
// module so the panel's mount + edits exercise actual production wiring.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import App from "../App";
import {
  getCaseMeta,
  resetCaseMeta,
  getPerioClassification,
  setDiagnosisOverride,
  setStageOverride,
  setGradeOverride,
  setExtentOverride,
  setPerioSite,
  __resetChartStateForTest,
  closePerioOverlay,
  setPerioViewMode,
} from "../odontogram";

vi.mock("../odontogram", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../odontogram")>();
  return {
    // Partial mock: every export not overridden below resolves to the real
    // module, so an export added to odontogram.ts never resolves to
    // `undefined` here (bead odontogram-z4y).
    ...actual,
    // Bead odontogram-3l1: engine-ownership helpers the shell calls on every
    // mount. A single mocked instance is always the sole owner.
    createEngineClaim: vi.fn(() => ({ id: 1 })),
    claimEngine: vi.fn(() => true),
    releaseEngine: vi.fn(),
    ownsEngine: vi.fn(() => true),
    onEngineOwnerChange: vi.fn(() => () => {}),
    initOdontogram: vi.fn().mockImplementation(() => {
      const grid = document.getElementById("toothGrid");
      if (grid && !grid.querySelector('[data-fake-tooth-svg]')) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("data-fake-tooth-svg", "11");
        grid.appendChild(svg);
      }
      return Promise.resolve(undefined);
    }),
    destroyOdontogram: vi.fn(),
    setNumberingSystem: vi.fn(),
    clearSelection: vi.fn(),
    setOcclusalVisible: vi.fn(),
    setWisdomVisible: vi.fn(),
    setShowBase: vi.fn(),
    setHealthyPulpVisible: vi.fn(),
    registerPlugins: vi.fn(),
    setPluginState: vi.fn(),
    getPluginState: vi.fn(),
    getToothStateSummary: vi.fn().mockReturnValue([]),
    setReadOnly: vi.fn(),
    getReadOnly: vi.fn().mockReturnValue(false),
    setNotesEnabled: vi.fn(),
    getNotesEnabled: vi.fn().mockReturnValue(false),
    setIcdasEnabled: vi.fn(),
    getIcdasEnabled: vi.fn().mockReturnValue(false),
    setPulpDetailLevel: vi.fn(),
    getPulpDetailLevel: vi.fn().mockReturnValue("aae"),
    setSecondaryCariesMode: vi.fn(),
    getSecondaryCariesMode: vi.fn().mockReturnValue("standard"),
    setRootCariesMode: vi.fn(),
    getRootCariesMode: vi.fn().mockReturnValue("simple"),
    setRadiographicDepthMode: vi.fn(),
    getRadiographicDepthMode: vi.fn().mockReturnValue("off"),
    setCariesDepthEnabled: vi.fn(),
    getCariesDepthEnabled: vi.fn().mockReturnValue(true),
    setWearDetailLevel: vi.fn(),
    getWearDetailLevel: vi.fn().mockReturnValue("complex"),
    setDiscolorationDetailLevel: vi.fn(),
    getDiscolorationDetailLevel: vi.fn().mockReturnValue("complex"),
    setSurfaceNotation: vi.fn(),
    getSurfaceNotation: vi.fn().mockReturnValue("full"),
    hasAnyPerioData: vi.fn().mockReturnValue(false),
    getOdontogramSummary: vi.fn().mockReturnValue({
      overview: "", permanentList: null, missingList: null,
      sections: [], implants: null, periodontalTitle: "", periodontalText: "",
    }),
    exportFhir: vi.fn(),
    exportImage: vi.fn(),
    exportSvg: vi.fn(),
    setImportFormat: vi.fn(),
  };
});

async function openDentalChart() {
  render(createElement(App));
  await Promise.resolve();
  fireEvent.click(document.getElementById("appViewDentalChart")!);
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.clearAllMocks();
  document.documentElement.classList.remove("dark");
  closePerioOverlay();
  setPerioViewMode("toggle");
  resetCaseMeta();
  __resetChartStateForTest();
});

describe("P4b Task 4: classification block renders in the Dental Chart", () => {
  it("renders the 4 axis override selects + derived-value displays", async () => {
    await openDentalChart();
    expect(document.getElementById("perioClassDiagnosisDerived")).toBeTruthy();
    expect(document.getElementById("perioClassDiagnosisOverride")).toBeTruthy();
    expect(document.getElementById("perioClassStageDerived")).toBeTruthy();
    expect(document.getElementById("perioClassStageOverride")).toBeTruthy();
    expect(document.getElementById("perioClassGradeDerived")).toBeTruthy();
    expect(document.getElementById("perioClassGradeOverride")).toBeTruthy();
    expect(document.getElementById("perioClassExtentDerived")).toBeTruthy();
    expect(document.getElementById("perioClassExtentOverride")).toBeTruthy();
  });

  it("shows the derived values for an untouched (healthy) case", async () => {
    await openDentalChart();
    const derived = getPerioClassification().derived;
    expect((document.getElementById("perioClassDiagnosisDerived")!.textContent || "").toLowerCase()).toContain(derived.diagnosis);
    expect(document.getElementById("perioClassStageDerived")).toBeTruthy();
    expect(document.getElementById("perioClassGradeDerived")).toBeTruthy();
    expect(document.getElementById("perioClassExtentDerived")).toBeTruthy();
  });

  it("indeterminate/na derived values are shown as such, not blank", async () => {
    await openDentalChart();
    // Untouched case: diagnosis derives to "health", which forces stage AND
    // extent to the non-authorable "na" placeholder (derivePerioClassification's
    // entry point only computes a real stage/extent once diagnosis is
    // "periodontitis"); grade is computed independent of diagnosis and reads
    // "indeterminate" (no age/RBL/smoking/diabetes charted yet).
    const derived = getPerioClassification().derived;
    expect(derived.stage).toBe("na");
    expect(derived.grade).toBe("indeterminate");
    expect(derived.extent).toBe("na");
    const stageText = document.getElementById("perioClassStageDerived")!.textContent || "";
    const gradeText = document.getElementById("perioClassGradeDerived")!.textContent || "";
    const extentText = document.getElementById("perioClassExtentDerived")!.textContent || "";
    expect(stageText.trim().length).toBeGreaterThan(0);
    expect(gradeText.trim().length).toBeGreaterThan(0);
    expect(extentText.trim().length).toBeGreaterThan(0);
    expect(stageText).not.toContain("perio.class."); // must be a resolved label, not a raw i18n key
    expect(gradeText).not.toContain("perio.class.");
    expect(extentText).not.toContain("perio.class.");
  });
});

describe("P4b Task 4: each override select calls its OWN setter (no cross-wiring)", () => {
  it("diagnosis select calls setDiagnosisOverride only", async () => {
    await openDentalChart();
    const select = document.getElementById("perioClassDiagnosisOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "periodontitis" } });
    const c = getPerioClassification();
    expect(c.diagnosis).toBe("periodontitis");
    expect(c.overridden).toEqual({ diagnosis: true, stage: false, grade: false, extent: false });
  });

  it("stage select calls setStageOverride only", async () => {
    await openDentalChart();
    const select = document.getElementById("perioClassStageOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "III" } });
    const c = getPerioClassification();
    expect(c.stage).toBe("III");
    expect(c.overridden).toEqual({ diagnosis: false, stage: true, grade: false, extent: false });
  });

  it("grade select calls setGradeOverride only", async () => {
    await openDentalChart();
    const select = document.getElementById("perioClassGradeOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "B" } });
    const c = getPerioClassification();
    expect(c.grade).toBe("B");
    expect(c.overridden).toEqual({ diagnosis: false, stage: false, grade: true, extent: false });
  });

  it("extent select calls setExtentOverride only", async () => {
    await openDentalChart();
    const select = document.getElementById("perioClassExtentOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "generalized" } });
    const c = getPerioClassification();
    expect(c.extent).toBe("generalized");
    expect(c.overridden).toEqual({ diagnosis: false, stage: false, grade: false, extent: true });
  });

  it("picking the first '(use derived)' option clears the override back to null", async () => {
    await openDentalChart();
    const select = document.getElementById("perioClassStageOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "III" } });
    expect(getPerioClassification().overridden.stage).toBe(true);
    fireEvent.change(select, { target: { value: "" } });
    expect(getPerioClassification().overridden.stage).toBe(false);
    expect(getCaseMeta().stageOverride).toBeNull();
  });
});

describe("P4b Task 4: panel re-reads getPerioClassification() on notifyStateChange", () => {
  it("charting perio data (via another API call) refreshes the derived-value display", async () => {
    await openDentalChart();
    // Two non-adjacent present teeth with interdental CAL >= 1mm qualifies
    // the 2017 periodontitis primary case definition — same shape T2/T3's
    // own tests use to reach a non-health derived diagnosis.
    act(() => {
      setPerioSite(16, "MB", { pd: 3, gm: 2 }); // CAL 5
      setPerioSite(36, "MB", { pd: 3, gm: 2 }); // CAL 5, non-adjacent arch
    });
    const derived = getPerioClassification().derived;
    expect(derived.diagnosis).toBe("periodontitis");
    const text = document.getElementById("perioClassDiagnosisDerived")!.textContent || "";
    expect(text.toLowerCase()).toContain(derived.diagnosis);
  });
});

describe("P4b Task 4: i18n keys resolve", () => {
  it("classification block labels are not raw i18n keys", async () => {
    await openDentalChart();
    const panel = document.getElementById("caseMetaPanel")!;
    const text = panel.textContent || "";
    expect(text).not.toContain("perio.class.title");
    expect(text).not.toContain("perio.class.diagnosis");
    expect(text).not.toContain("perio.class.stage");
    expect(text).not.toContain("perio.class.grade");
    expect(text).not.toContain("perio.class.extent");
    expect(text).not.toContain("perio.class.useDerived");
  });
});
