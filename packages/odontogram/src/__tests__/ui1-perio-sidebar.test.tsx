// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

// UI-1 Task 1: extract `PerioSidebar` out of `PerioChart.tsx` (the whole-mouth
// summary bar + "Páciens adatok" case-metadata form + 2017 classification
// block) into its own standalone, separately-mountable component, and
// view-gate `<App/>`'s shared right `<aside className="panel">` so it shows
// `<PerioSidebar/>` in the perio (Dental Chart, toggle-mode) view instead of
// the odontogram controls, and the odontogram controls everywhere else. Pure
// UI relocation — no data/derivation/FHIR change.
//
// Part (a) renders `<PerioSidebar/>` directly (no <App/> mount needed — same
// precedent as perio-p2-grid.test.ts renders <PerioChart/> directly: nothing
// PerioSidebar needs requires a live initOdontogram()/SVG-grid mount).
// Part (b) mounts <App/> with the same comprehensive partial-mock harness the
// existing p4a-case-panel.test.ts / p4b-classification-ui.test.ts use, to
// prove the view-gate itself.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import PerioSidebar from "../PerioSidebar";
import App from "../App";
import {
  __resetChartStateForTest,
  setNumberingSystem,
  getCaseMeta,
  resetCaseMeta,
  getPerioClassification,
  closePerioOverlay,
  setPerioViewMode,
} from "../odontogram";

function renderSidebar() {
  return render(createElement(PerioSidebar));
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  __resetChartStateForTest();
  setNumberingSystem("FDI");
  resetCaseMeta();
});

describe("UI-1 Task 1: <PerioSidebar/> renders standalone", () => {
  it("renders the whole-mouth summary bar items", () => {
    renderSidebar();
    expect(document.getElementById("perio-fg-summary-avgpd")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-avgcal")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-bop")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-charted")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-cal")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-maxpd")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-maxfurc")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-plaque")).toBeTruthy();
  });

  it("renders the Páciens adatok (case-metadata) controls", () => {
    renderSidebar();
    expect(document.getElementById("caseMetaPanel")).toBeTruthy();
    expect(document.getElementById("caseMetaAge")).toBeTruthy();
    expect(document.getElementById("caseMetaSmoking")).toBeTruthy();
    expect(document.getElementById("caseMetaCigarettesPerDay")).toBeTruthy();
    expect(document.getElementById("caseMetaDiabetes")).toBeTruthy();
    expect(document.getElementById("caseMetaHba1c")).toBeTruthy();
    expect(document.getElementById("caseMetaRbl")).toBeTruthy();
    expect(document.getElementById("caseMetaToothLoss")).toBeTruthy();
  });

  it("renders the 2017 classification axes", () => {
    renderSidebar();
    expect(document.getElementById("perioClassDiagnosisDerived")).toBeTruthy();
    expect(document.getElementById("perioClassDiagnosisOverride")).toBeTruthy();
    expect(document.getElementById("perioClassStageDerived")).toBeTruthy();
    expect(document.getElementById("perioClassStageOverride")).toBeTruthy();
    expect(document.getElementById("perioClassGradeDerived")).toBeTruthy();
    expect(document.getElementById("perioClassGradeOverride")).toBeTruthy();
    expect(document.getElementById("perioClassExtentDerived")).toBeTruthy();
    expect(document.getElementById("perioClassExtentOverride")).toBeTruthy();
  });
});

describe("UI-1 Task 1: <PerioSidebar/> controls still call their setters", () => {
  it("age input calls setCaseAge", () => {
    renderSidebar();
    const input = document.getElementById("caseMetaAge") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "61" } });
    expect(getCaseMeta().age).toBe(61);
  });

  it("smoking select calls setSmokingStatus", () => {
    renderSidebar();
    const select = document.getElementById("caseMetaSmoking") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "current" } });
    expect(getCaseMeta().smokingStatus).toBe("current");
  });

  it("diagnosis override select calls setDiagnosisOverride", () => {
    renderSidebar();
    const select = document.getElementById("perioClassDiagnosisOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "periodontitis" } });
    expect(getPerioClassification().diagnosis).toBe("periodontitis");
    expect(getPerioClassification().overridden.diagnosis).toBe(true);
  });

  it("stage override select calls setStageOverride", () => {
    renderSidebar();
    const select = document.getElementById("perioClassStageOverride") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "III" } });
    expect(getPerioClassification().stage).toBe("III");
    expect(getPerioClassification().overridden.stage).toBe(true);
  });
});

// --- Part (b): App-level view-gate --------------------------------------

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
      if (grid && !grid.querySelector("[data-fake-tooth-svg]")) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("data-fake-tooth-svg", "11");
        grid.appendChild(svg);
      }
      return Promise.resolve(undefined);
    }),
    destroyOdontogram: vi.fn(),
    // Real (not a bare vi.fn()) — this single file's hoisted vi.mock applies
    // to BOTH the direct <PerioSidebar/> renders (part a, which need real
    // numbering/reset behavior) and the <App/> mount (part b, which doesn't
    // care either way).
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

async function mountApp() {
  const utils = render(createElement(App));
  await Promise.resolve();
  return utils;
}

describe("UI-1 Task 1: <App/> right panel view-gate", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    document.documentElement.classList.remove("dark");
    closePerioOverlay();
    setPerioViewMode("toggle");
    resetCaseMeta();
  });

  it("odontogram view (default): shows the odontogram controls, not the perio sidebar", async () => {
    await mountApp();
    expect(document.getElementById("statusCard")).toBeTruthy();
    expect(document.getElementById("toothSelect")).toBeTruthy();
    expect(document.getElementById("caseMetaPanel")).toBeNull();
  });

  it("perio (Dental Chart) view: shows the perio sidebar; odontogram controls stay mounted but hidden", async () => {
    await mountApp();
    fireEvent.click(document.getElementById("appViewDentalChart")!);
    expect(document.getElementById("caseMetaPanel")).toBeTruthy();
    expect(document.getElementById("perio-fg-summary-avgpd")).toBeTruthy();
    // The odontogram control panel is NOT unmounted (that would drop its
    // one-time wireControls() listeners and break editing after toggling back —
    // see App.tsx). It stays in the DOM, hidden via CSS.
    const controls = document.querySelector(".panel-odontogram-controls") as HTMLElement | null;
    expect(controls).toBeTruthy();
    expect(controls!.style.display).toBe("none");
    expect(document.getElementById("statusCard")).toBeTruthy();
    expect(document.getElementById("toothSelect")).toBeTruthy();
  });

  it("switching back to the odontogram view restores the odontogram controls", async () => {
    await mountApp();
    fireEvent.click(document.getElementById("appViewDentalChart")!);
    expect(document.getElementById("caseMetaPanel")).toBeTruthy();
    fireEvent.click(document.getElementById("appViewOdontogram")!);
    expect(document.getElementById("statusCard")).toBeTruthy();
    expect(document.getElementById("caseMetaPanel")).toBeNull();
  });
});
