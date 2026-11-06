// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

// Periodontal-arc "Dental Chart" graphical redesign, Task 1: PRESENTATION only.
// The perio CONTENT is still P2's existing <PerioChart/> body (grid + summary
// bar) — this task only changes how it's HOUSED: an `Odontogram | Dental
// Chart` view toggle (default, `#appViewToggle`) that shows the perio content
// INLINE in the chart area (odontogram hidden via CSS, NEVER unmounted), plus
// a Settings option (`perioViewMode`) to fall back to P2's classic popup.
//
// Two harnesses, mirroring the established split in this test suite (see
// r2a-toggle-ui.test.ts / perio-p2-overlay.test.ts):
//   1. <App/> is rendered with the heavy engine lifecycle (initOdontogram et
//      al.) mocked out, same list as perio-p2-overlay.test.ts, EXCEPT
//      initOdontogram's mock synchronously injects a fake tooth <svg> into
//      #toothGrid so we can prove the odontogram SVG root is never unmounted
//      while the Dental Chart view is active. getPerioViewMode/
//      setPerioViewMode/onStateChange/openPerioOverlay/closePerioOverlay/
//      isPerioOverlayOpen + the full P1/P2 perio data-core surface PerioChart
//      needs to actually build its grid are forwarded from the REAL module.
//   2. Named-export resolution — `PerioChart` still resolves as a function
//      from "../App".
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import App, { PerioChart } from "../App";
import {
  getPerioViewMode,
  setPerioViewMode,
  openPerioOverlay,
  closePerioOverlay,
  isPerioOverlayOpen,
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
      // Simulate the real engine populating #toothGrid with tooth SVGs, so
      // tests can prove the Dental Chart view never unmounts the odontogram.
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

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.clearAllMocks();
  document.documentElement.classList.remove("dark");
  closePerioOverlay();
  setPerioViewMode("toggle");
});

describe("Task 1: perioViewMode state (odontogram.ts)", () => {
  it("defaults to \"toggle\"", () => {
    expect(getPerioViewMode()).toBe("toggle");
  });

  it("setPerioViewMode changes the mode", () => {
    setPerioViewMode("popup");
    expect(getPerioViewMode()).toBe("popup");
    setPerioViewMode("toggle");
    expect(getPerioViewMode()).toBe("toggle");
  });
});

describe("Task 1: PerioChart named export", () => {
  it("PerioChart is exported as a named export from ../App and is a function", () => {
    expect(typeof PerioChart).toBe("function");
  });
});

describe("Task 1: toggle mode housing (default)", () => {
  it("renders #appViewToggle with Odontogram + Dental Chart segments, Odontogram active by default", async () => {
    render(createElement(App));
    await Promise.resolve();
    const toggle = document.getElementById("appViewToggle");
    expect(toggle).toBeTruthy();
    const odontogramBtn = document.getElementById("appViewOdontogram") as HTMLButtonElement;
    const dentalChartBtn = document.getElementById("appViewDentalChart") as HTMLButtonElement;
    expect(odontogramBtn).toBeTruthy();
    expect(dentalChartBtn).toBeTruthy();
    expect(odontogramBtn.classList.contains("is-active")).toBe(true);
    expect(dentalChartBtn.classList.contains("is-active")).toBe(false);
  });

  it("no popup launch button while in toggle mode", async () => {
    render(createElement(App));
    await Promise.resolve();
    expect(document.getElementById("openPerioOverlayBtn")).toBeNull();
  });

  it("selecting \"Dental Chart\" hides .chart-column via CSS (display:none) but keeps the odontogram SVG mounted, and shows the perio content inline", async () => {
    render(createElement(App));
    await Promise.resolve();
    const toothSvgBefore = document.querySelector("#toothGrid [data-fake-tooth-svg]");
    expect(toothSvgBefore).toBeTruthy();

    fireEvent.click(document.getElementById("appViewDentalChart")!);

    const chartColumn = document.querySelector(".chart-column") as HTMLElement;
    expect(chartColumn).toBeTruthy();
    expect(chartColumn.style.display).toBe("none");

    // The odontogram SVG root must still be in the DOM — never unmounted.
    expect(document.querySelector("#toothGrid [data-fake-tooth-svg]")).toBe(toothSvgBefore);

    // Perio content shown inline (no modal dialog chrome).
    expect(document.getElementById("perioOverlay")).toBeNull();
    expect(document.getElementById("perioInlineGrid")).toBeTruthy();

    const dentalChartBtn = document.getElementById("appViewDentalChart") as HTMLButtonElement;
    const odontogramBtn = document.getElementById("appViewOdontogram") as HTMLButtonElement;
    expect(dentalChartBtn.classList.contains("is-active")).toBe(true);
    expect(odontogramBtn.classList.contains("is-active")).toBe(false);
  });

  it("selecting \"Odontogram\" again reverses it: .chart-column visible, inline perio content gone", async () => {
    render(createElement(App));
    await Promise.resolve();

    fireEvent.click(document.getElementById("appViewDentalChart")!);
    expect((document.querySelector(".chart-column") as HTMLElement).style.display).toBe("none");
    expect(document.getElementById("perioInlineGrid")).toBeTruthy();

    fireEvent.click(document.getElementById("appViewOdontogram")!);

    expect((document.querySelector(".chart-column") as HTMLElement).style.display).not.toBe("none");
    expect(document.getElementById("perioInlineGrid")).toBeNull();
  });
});

describe("Task 1: popup mode housing (perioViewMode === \"popup\")", () => {
  // Until bead odontogram-c51 there were two views and the switcher itself was
  // gated on the housing, so popup mode had none at all. There are three now,
  // and the orthodontic one has no popup housing — the switcher therefore
  // stays, carrying Odontogram | Orthodontics, and only the PERIODONTAL
  // segment is gone (that view is reached through the launch button beside it).
  it("no Dental Chart segment in popup mode — the switcher carries the other two", async () => {
    setPerioViewMode("popup");
    render(createElement(App));
    await Promise.resolve();
    expect(document.getElementById("appViewDentalChart")).toBeNull();
    expect(document.getElementById("appViewToggle")).toBeTruthy();
    expect(document.getElementById("appViewOdontogram")).toBeTruthy();
    expect(document.getElementById("appViewOrtho")).toBeTruthy();
  });

  it("P2's launch button is present and openPerioOverlay() still opens the modal", async () => {
    setPerioViewMode("popup");
    render(createElement(App));
    await Promise.resolve();

    const btn = document.getElementById("openPerioOverlayBtn");
    expect(btn).toBeTruthy();
    expect(isPerioOverlayOpen()).toBe(false);

    fireEvent.click(btn!);

    const overlay = document.getElementById("perioOverlay");
    expect(overlay).toBeTruthy();
    expect(overlay!.getAttribute("role")).toBe("dialog");
    expect(isPerioOverlayOpen()).toBe(true);

    // The odontogram SVG root must still be in the DOM behind the modal.
    expect(document.querySelector("#toothGrid [data-fake-tooth-svg]")).toBeTruthy();

    // .chart-column stays visible in popup mode (only toggle mode hides it).
    expect((document.querySelector(".chart-column") as HTMLElement).style.display).not.toBe("none");
  });

  it("closePerioOverlay() closes the popup modal", async () => {
    setPerioViewMode("popup");
    render(createElement(App));
    await Promise.resolve();
    fireEvent.click(document.getElementById("openPerioOverlayBtn")!);
    expect(document.getElementById("perioOverlay")).toBeTruthy();

    // module-level onStateChange subscription re-renders the overlay closed
    act(() => {
      closePerioOverlay();
    });
    expect(document.getElementById("perioOverlay")).toBeNull();
  });
});
