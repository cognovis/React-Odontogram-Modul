// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// The PUBLIC host layout seam.
//
// A host embedding this module as a patient page needs three things that used
// to be reachable only by reading the engine's DOM from outside: a compact
// right inspector instead of the wide standalone column, the module's own
// switch for the finding dock and the whole-mouth summary below the chart, and
// the active clinical view. Each one is a prop or a public export here, so the
// host owns none of our class names and polls none of our nodes.
//
// What the suite pins:
//   1. Every seam is OPT-IN. Omitting the props keeps the standalone layout
//      byte-for-byte: dock on (Dirk 02.09.2026), summary on, no compact marker.
//   2. Compact placement moves the EXISTING panel; it never clones a section.
//      The real `#cariesSection` and friends stay mounted exactly once.
//   3. The group navigation is ours, rendered from our own i18n, and it selects
//      a group on the panel the CSS then presents.
//   4. The active view reaches the host as a value, not as a hidden column.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import App from "../App";
import { closePerioOverlay, setPerioViewMode, setBefundDockEnabled } from "../odontogram";

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
      overview: "Synthetischer Testbefund",
      permanentList: null,
      missingList: null,
      sections: [],
      implants: null,
      periodontalTitle: "",
      periodontalText: "",
    }),
    exportImage: vi.fn(),
    exportSvg: vi.fn(),
  };
});

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.clearAllMocks();
  closePerioOverlay();
  setPerioViewMode("toggle");
  setBefundDockEnabled(true);
});

async function mount(props: Record<string, unknown> = {}) {
  const view = render(createElement(App, props));
  await Promise.resolve();
  return view;
}

function shellRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>(".odontogram-root");
  expect(root).not.toBeNull();
  return root as HTMLElement;
}

describe("standalone layout stays the default", () => {
  it("renders no compact marker and no group navigation without the props", async () => {
    await mount();

    expect(shellRoot().dataset.panelPlacement).toBeUndefined();
    expect(document.querySelector(".panel-group-nav")).toBeNull();
    expect(document.querySelector(".befund-dock-column")).not.toBeNull();
    expect(document.querySelector(".tooth-info")).not.toBeNull();
  });
});

describe("panelPlacement is the public compact inspector", () => {
  it("marks the shell compact and offers the group navigation inside the panel", async () => {
    await mount({ panelPlacement: "compact" });

    expect(shellRoot().dataset.panelPlacement).toBe("compact");
    const nav = document.querySelector<HTMLElement>(".panel-group-nav");
    expect(nav).not.toBeNull();
    expect(nav?.closest("aside.panel")).not.toBeNull();
    const labels = Array.from(nav!.querySelectorAll("button")).map((button) => button.textContent);
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps the real panel sections mounted exactly once", async () => {
    await mount({ panelPlacement: "compact" });

    for (const id of ["cariesSection", "fillingSection", "rootPeriodontiumSection"]) {
      expect(document.querySelectorAll(`#${id}`).length).toBe(1);
    }
    expect(document.querySelectorAll("aside.panel").length).toBe(1);
  });

  it("selects a group on the panel the stylesheet then presents", async () => {
    await mount({ panelPlacement: "compact" });

    const panel = document.querySelector<HTMLElement>("aside.panel");
    expect(panel?.dataset.panelGroup).toBe("tooth");

    const nav = document.querySelector<HTMLElement>(".panel-group-nav")!;
    const surfaces = Array.from(nav.querySelectorAll("button"))[1] as HTMLButtonElement;
    fireEvent.click(surfaces);

    expect(panel?.dataset.panelGroup).toBe("surfaces");
    expect(surfaces.getAttribute("aria-pressed")).toBe("true");
  });

  it("hides the dock and the summary when the host turns them off", async () => {
    await mount({ panelPlacement: "compact", befundDock: false, toothInfoCard: false });

    expect(document.querySelector(".befund-dock-column")).toBeNull();
    expect(document.querySelector(".tooth-info")).toBeNull();
  });
});

describe("the active clinical view reaches the host", () => {
  it("reports every view change through onViewChange", async () => {
    const onViewChange = vi.fn();
    await mount({ onViewChange });

    expect(onViewChange).toHaveBeenLastCalledWith("odontogram");

    fireEvent.click(document.getElementById("appViewDentalChart")!);
    expect(onViewChange).toHaveBeenLastCalledWith("dentalChart");

    fireEvent.click(document.getElementById("appViewOrtho")!);
    expect(onViewChange).toHaveBeenLastCalledWith("ortho");
  });
});

describe("the selection seam is public", () => {
  it("exports the selection readers, writers and observer from the package entry", async () => {
    // Imported from the library entry on purpose: a host consumes the package,
    // not `../odontogram`. These were engine-internal before the host seam existed,
    // which is why an embedding host had to read `.tooth-tile.active` from the
    // DOM. Nothing here is new behaviour — it is the same engine state, now
    // reachable without touching our markup.
    const api = await import("../index");

    for (const name of [
      "onChartSelectionChange",
      "getSelectedTeeth",
      "getActiveTooth",
      "setChartSelection",
      "selectToothInChart",
      "clearSelection",
      "getBefundDockEnabled",
      "setBefundDockEnabled",
    ]) {
      expect(typeof (api as Record<string, unknown>)[name], name).toBe("function");
    }
  });

  it("hands back an unsubscribe function so a host can scope its observer", async () => {
    // The engine's own selection behaviour has its own suites (odontogram-ip3,
    // odontogram-3l1). What matters for the host seam is that subscribing is
    // reversible: an embedded view must be able to stop observing on unmount.
    const { onChartSelectionChange, getSelectedTeeth } = await import("../index");

    const unsubscribe = onChartSelectionChange(() => {});
    expect(typeof unsubscribe).toBe("function");
    expect(() => unsubscribe()).not.toThrow();
    expect(Array.isArray(getSelectedTeeth())).toBe(true);
  });
})

describe("the compact inspector stays visible in every clinical view", () => {
  // The embedded chart showed no drawer
  // in the schematic view and a scrambled one in KFO. Two independent causes,
  // so two independent checks:
  //   - KFO hid the panel with an INLINE style, which no stylesheet rule can
  //     override. That one is pinned here, in the DOM.
  //   - The KFO column spans `1 / -1`, which pushes the panel
  //     onto the next grid row. jsdom applies no stylesheet, so that one is
  //     pinned against the stylesheet source below.
  const views: Array<[string, string]> = [
    ["odontogram", "appViewOdontogram"],
    ["dentalChart", "appViewDentalChart"],
    ["ortho", "appViewOrtho"],
  ];

  for (const [view, buttonId] of views) {
    it(`keeps the panel displayed in the ${view} view`, async () => {
      await mount({ panelPlacement: "compact" });

      const button = document.getElementById(buttonId);
      if (button) fireEvent.click(button);

      const panel = document.querySelector<HTMLElement>("aside.panel");
      expect(panel).not.toBeNull();
      // Not merely mounted: no inline `display:none`, which is the one channel
      // the compact stylesheet cannot reach.
      expect(panel!.style.display).not.toBe("none");
    });
  }

  it("still hides the panel beside the standalone orthodontic workspace", async () => {
    // The standalone relocation is deliberate and unchanged: both KFO cards
    // want the full page width there, and nothing in the panel is per-tooth.
    await mount();

    fireEvent.click(document.getElementById("appViewOrtho")!);

    expect(document.querySelector<HTMLElement>("aside.panel")!.style.display).toBe("none");
  });
});

describe("the compact inspector's own order", () => {
  it("puts the chart images and the Status/Plan tabs above the selection actions", async () => {
    // Malte, 04.10.2026: mode and visual controls first, then which teeth are
    // selected, then the form for the selected tooth. The relocated controls
    // are the SAME nodes the chart header holds standalone — every id the
    // engine wires in wireControls() is rendered exactly once — so this pins
    // the order, not a copy.
    await mount({ panelPlacement: "compact" });

    const header = document.querySelector<HTMLElement>("aside.panel .panel-header")!;
    const relocated = header.querySelector<HTMLElement>(".panel-chart-controls")!;
    const actions = document.getElementById("controlsActions")!;

    expect(relocated.querySelector("#chartModeToggle")).not.toBeNull();
    expect(relocated.querySelector(".chart-actions")).not.toBeNull();
    expect(actions.closest(".panel-header")).toBe(header);
    // DOCUMENT_POSITION_FOLLOWING: the actions come after the controls.
    expect(relocated.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const id of ["chartModeToggle", "chartModeStatus", "btnOcclView", "btnSelectUpperFront"]) {
      expect(document.querySelectorAll(`#${id}`).length, id).toBe(1);
    }
  });

  it("leaves the chart header to own them in the standalone layout", async () => {
    await mount();

    expect(document.querySelector(".panel-chart-controls")).toBeNull();
    expect(document.querySelector("#chartModeToggle")!.closest(".chart-header")).not.toBeNull();
  });
});
