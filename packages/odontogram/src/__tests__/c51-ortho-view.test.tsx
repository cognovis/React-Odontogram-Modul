// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51, the wiring: the orthodontic workspace becomes the THIRD
// clinical view, which is what the bead's own title says it is. Dirk chose it
// over the two alternatives (cards in the right column, an overlay of its own)
// on 22.08.2026, and chose "KFO" as the German label.
//
// What is worth pinning here is not that the card renders — it has its
// own suite (c51-model-analysis-card). It is the three
// properties the HOUSING has to keep:
//
//   1. The odontogram is never unmounted. Its column is hidden with CSS, the
//      same construction the periodontal view uses, and for the same two
//      reasons: `wireControls()`'s one-time listeners, and the SVG-fingerprint
//      parity that a re-mount would put at risk.
//   2. The switcher survives popup mode. It used to be gated on
//      `perioViewMode` as a whole because both its segments were about the
//      periodontal view; the orthodontic one has no popup housing, so the
//      switcher now outlives the mode and only the periodontal SEGMENT goes.
//   3. The right control panel is hidden beside the orthodontic view — but
//      hidden, not unmounted, for the same reason as (1).
//
// The harness is the one from perio-graphical-presentation.test.ts: <App/>
// with the heavy engine lifecycle mocked, `initOdontogram` injecting a fake
// tooth <svg> so the never-unmounted claim is provable.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import App from "../App";
import { setPerioViewMode, closePerioOverlay } from "../odontogram";

vi.mock("../odontogram", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../odontogram")>();
  return {
    ...actual,
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
  closePerioOverlay();
  setPerioViewMode("toggle");
});

async function mount() {
  render(createElement(App));
  await Promise.resolve();
}

describe("the orthodontic view is the third segment of the switcher", () => {
  it("renders #appViewOrtho beside the other two, none of them active at mount", async () => {
    await mount();
    const ortho = document.getElementById("appViewOrtho") as HTMLButtonElement;
    expect(ortho).toBeTruthy();
    expect(ortho.parentElement?.id).toBe("appViewToggle");
    expect(ortho.classList.contains("is-active")).toBe(false);
    expect(
      (document.getElementById("appViewOdontogram") as HTMLButtonElement).classList.contains("is-active"),
    ).toBe(true);
  });

  it("the segments stand in reading order: odontogram, periodontal, orthodontic", async () => {
    await mount();
    const ids = [...document.querySelectorAll("#appViewToggle > button")].map(b => b.id);
    expect(ids).toEqual(["appViewOdontogram", "appViewDentalChart", "appViewOrtho"]);
  });

  it("selecting it mounts the model-analysis card and marks the segment active", async () => {
    await mount();
    expect(document.getElementById("modelAnalysisCard")).toBeNull();

    fireEvent.click(document.getElementById("appViewOrtho")!);

    expect(document.querySelector(".ortho-column")).toBeTruthy();
    expect(document.getElementById("modelAnalysisCard")).toBeTruthy();
    const ortho = document.getElementById("appViewOrtho") as HTMLButtonElement;
    expect(ortho.classList.contains("is-active")).toBe(true);
    expect(ortho.getAttribute("aria-selected")).toBe("true");
  });
});

describe("what the housing must not break", () => {
  it("hides the odontogram column with CSS and keeps its SVG mounted", async () => {
    await mount();
    const before = document.querySelector("#toothGrid [data-fake-tooth-svg]");
    expect(before).toBeTruthy();

    fireEvent.click(document.getElementById("appViewOrtho")!);

    expect((document.querySelector(".chart-column") as HTMLElement).style.display).toBe("none");
    expect(document.querySelector("#toothGrid [data-fake-tooth-svg]")).toBe(before);
  });

  it("hides the right control panel beside it — hidden, never unmounted", async () => {
    await mount();
    fireEvent.click(document.getElementById("appViewOrtho")!);

    const panel = document.querySelector("aside.panel") as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.display).toBe("none");
    // The controls themselves are still there, listeners and all.
    expect(document.getElementById("btnSelectAll")).toBeTruthy();
  });

  it("does not mount the periodontal sidebar or the inline periodontal grid", async () => {
    await mount();
    fireEvent.click(document.getElementById("appViewOrtho")!);
    expect(document.getElementById("perioInlineGrid")).toBeNull();
    expect(document.querySelector(".dental-chart-column")).toBeNull();
  });

  it("switching back to the odontogram reverses all of it", async () => {
    await mount();
    fireEvent.click(document.getElementById("appViewOrtho")!);
    fireEvent.click(document.getElementById("appViewOdontogram")!);

    expect((document.querySelector(".chart-column") as HTMLElement).style.display).not.toBe("none");
    expect((document.querySelector("aside.panel") as HTMLElement).style.display).not.toBe("none");
    expect(document.querySelector(".ortho-column")).toBeNull();
    expect(document.getElementById("modelAnalysisCard")).toBeNull();
  });

  it("a round trip through the orthodontic view leaves the periodontal one working", async () => {
    await mount();
    fireEvent.click(document.getElementById("appViewOrtho")!);
    fireEvent.click(document.getElementById("appViewDentalChart")!);

    expect(document.getElementById("perioInlineGrid")).toBeTruthy();
    expect(document.querySelector(".ortho-column")).toBeNull();
    expect((document.querySelector("aside.panel") as HTMLElement).style.display).not.toBe("none");
  });
});

describe("popup mode: the switcher outlives the periodontal segment", () => {
  it("keeps Odontogram | Orthodontics and the periodontal launch button", async () => {
    setPerioViewMode("popup");
    await mount();
    expect(document.getElementById("appViewToggle")).toBeTruthy();
    expect(document.getElementById("appViewOrtho")).toBeTruthy();
    expect(document.getElementById("appViewDentalChart")).toBeNull();
    expect(document.getElementById("openPerioOverlayBtn")).toBeTruthy();
  });

  it("the orthodontic view is reachable there too", async () => {
    setPerioViewMode("popup");
    await mount();
    fireEvent.click(document.getElementById("appViewOrtho")!);
    expect(document.getElementById("modelAnalysisCard")).toBeTruthy();
    expect((document.querySelector(".chart-column") as HTMLElement).style.display).toBe("none");
  });
});
