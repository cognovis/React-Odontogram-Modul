// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// The compact KFO inspector.
//
// The drawer stays visible in every clinical view, which left the KFO view
// showing per-tooth controls (active tooth, caries, fillings) beside a workspace
// where no finding is per-tooth. The cards are split along the seam they already
// had — what is TYPED goes in the drawer, what is DERIVED stays beside the chart
// — so the model-analysis record is split across the drawer and the column.
//
// What the suite pins:
//   1. Compact KFO offers the KFO entry and hides the per-tooth controls, which
//      stay MOUNTED (their wireControls() listeners are one-time).
//   2. One entry form and one results block are mounted
//      and no id appears twice.
//   3. Every original field and interaction survives the split.
//   4. Standalone KFO is untouched: the whole card, panel hidden.
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
    initOdontogram: vi.fn().mockResolvedValue(undefined),
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

async function mountOrtho(props: Record<string, unknown> = {}) {
  const view = render(createElement(App, props));
  await Promise.resolve();
  fireEvent.click(document.getElementById("appViewOrtho")!);
  return view;
}

/** Every id this split could duplicate, checked document-wide. */
const KFO_IDS = [
  "modelAnalysisCard", "modelAnalysisResults", "maTitle", "maResultsTitle",
  "ma-overjet", "ma-overbite", "ma-midlineUpper", "ma-midlineLower",
];

function expectNoDuplicateIds() {
  for (const id of KFO_IDS) {
    const n = document.querySelectorAll(`[id="${id}"]`).length;
    expect(n, `id ${id} appears ${n} times`).toBeLessThanOrEqual(1);
  }
}

describe("compact KFO puts the entry in the drawer and the results beside the chart", () => {
  it("offers the KFO entry instead of the per-tooth controls", async () => {
    await mountOrtho({ panelPlacement: "compact" });

    const panel = document.querySelector<HTMLElement>("aside.panel")!;
    // The drawer is there (that is the compact layout's other half) and it is KFO's.
    expect(panel.style.display).not.toBe("none");
    expect(panel.querySelector(".panel-ortho-controls")).not.toBeNull();

    // The per-tooth controls are HIDDEN, never unmounted: their wireControls()
    // listeners are attached once and would not come back.
    const odo = panel.querySelector<HTMLElement>(".panel-odontogram-controls")!;
    expect(odo).not.toBeNull();
    expect(odo.style.display).toBe("none");
  });

  it("splits the model card: fields in the drawer, derived values in the column", async () => {
    await mountOrtho({ panelPlacement: "compact" });

    // The entry half keeps the card's own id, so a host selector still finds
    // the form rather than the read-out.
    expect(document.querySelector(".panel-ortho-controls #modelAnalysisCard")).not.toBeNull();
    expect(document.querySelector(".ortho-column #modelAnalysisResults")).not.toBeNull();

    // The derived half carries no field, and the entry half carries no index
    // table — otherwise the drawer would repeat the column.
    expect(document.querySelector("#modelAnalysisResults input")).toBeNull();
    expect(document.querySelector("#modelAnalysisCard .ma-indices")).toBeNull();
    expect(document.querySelector("#modelAnalysisResults .ma-indices")).not.toBeNull();

    expectNoDuplicateIds();
  });

  it("preserves every original model-analysis field and its view switch", async () => {
    await mountOrtho({ panelPlacement: "compact" });

    const entry = document.querySelector<HTMLElement>("#modelAnalysisCard")!;
    // The four occlusal readings.
    for (const id of ["ma-overjet", "ma-overbite", "ma-midlineUpper", "ma-midlineLower"]) {
      expect(entry.querySelector(`#${id}`), id).not.toBeNull();
    }
    // The width record: one field per measured tooth, all 24 positions.
    expect(entry.querySelectorAll("input[data-tooth]").length).toBe(24);

    // A 320px drawer opens on the LIST view, and the arch is still offered.
    const views = entry.querySelectorAll<HTMLButtonElement>(".ma-viewswitch button");
    expect(views.length).toBe(2);
    const pressed = Array.from(views).filter(b => b.getAttribute("aria-pressed") === "true");
    expect(pressed.length).toBe(1);
    expect(pressed[0].textContent).not.toBe(views[0].textContent);

    fireEvent.click(views[0]);
    expect(entry.querySelector(".ma-arch")).not.toBeNull();
  });

  it("honours the read-only chart in the KFO entry", async () => {
    await mountOrtho({ panelPlacement: "compact", readOnly: true });

    const fields = document.querySelectorAll<HTMLInputElement>("#modelAnalysisCard input[data-tooth]");
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) expect(field.disabled).toBe(true);
  });
});

describe("the standalone orthodontic workspace is unchanged", () => {
  it("renders the whole card and keeps the panel hidden beside it", async () => {
    await mountOrtho();

    // The whole card: the entry ids AND the derived tables.
    expect(document.querySelector(".ortho-column #modelAnalysisCard .ma-indices")).not.toBeNull();

    // No split halves exist outside the compact placement.
    expect(document.getElementById("modelAnalysisResults")).toBeNull();
    expect(document.querySelector(".panel-ortho-controls")).toBeNull();

    expect(document.querySelector<HTMLElement>("aside.panel")!.style.display).toBe("none");
    expectNoDuplicateIds();
  });
});
