// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

// Bead odontogram-v90: a live readOnly flip must reach an ALREADY-MOUNTED
// periodontal chart.
//
// `setReadOnly()` toggles the `.read-only` CSS class on the mounted perio
// container, but the controls' own `disabled` attribute is decided in
// `syncToothCells()` from `getReadOnly()` — and that only runs on grid build
// and on a `fullResync()` driven by the `onStateChange` subscription. Before
// this bead `setReadOnly()` never called `notifyStateChange()`, so a flip taken
// while the chart was open left every perio control looking locked (CSS) while
// its `disabled` attribute kept the pre-flip value and a programmatic click
// still wrote to the record.
//
// AC1 covers the lock, AC2 the release: the resync that re-enables controls
// must re-derive each cell from its real gates (capability matrix, charted
// state), never blanket-enable the grid.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, act } from "@testing-library/react";
import PerioChart from "../PerioChart";
import {
  __resetChartStateForTest,
  __setToothStateForTest,
  getToothPlaque,
  getToothPerio,
  setPerioSite,
  setNumberingSystem,
  setReadOnly,
} from "../odontogram";

function openGrid() {
  return render(createElement(PerioChart, { open: true, onClose: () => {} }));
}

function cell(id: string): HTMLInputElement & HTMLButtonElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`perio cell #${id} not found`);
  return el as HTMLInputElement & HTMLButtonElement;
}

function click(el: HTMLElement): void {
  act(() => {
    el.click();
  });
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  __resetChartStateForTest();
  setNumberingSystem("FDI");
  setReadOnly(false);
});

afterEach(() => {
  cleanup();
  setReadOnly(false);
});

describe("odontogram-v90 AC1: setReadOnly(true) locks an already-mounted perio chart", () => {
  it("disables the mounted controls without a rebuild and refuses the write", () => {
    openGrid();
    const plaque = cell("perio-fg-plaque-16-buccal");
    const pd = cell("perio-fg-pd-16-MB");
    expect(plaque.disabled).toBe(false);
    expect(pd.disabled).toBe(false);

    act(() => {
      setReadOnly(true);
    });

    // The same DOM nodes — no rebuild, no remount.
    expect(document.getElementById("perio-fg-plaque-16-buccal")).toBe(plaque);
    expect(plaque.disabled).toBe(true);
    expect(pd.disabled).toBe(true);

    // ...and the lock is real, not cosmetic: the write does not land.
    click(plaque);
    expect(getToothPlaque(16)).toEqual([]);
  });
});

describe("odontogram-v90 AC2: setReadOnly(false) releases only what is authorable", () => {
  it("re-enables an authorable cell while the real gates stay in force", () => {
    // A charted site (so its dependent GM/BOP cells are authorable at all) and
    // a tooth with no periodontium (capability matrix).
    setPerioSite(16, "MB", { pd: 4 });
    __setToothStateForTest(21, { toothSelection: "none" }); // missing
    openGrid();

    act(() => {
      setReadOnly(true);
    });
    expect(cell("perio-fg-pd-16-MB").disabled).toBe(true);

    act(() => {
      setReadOnly(false);
    });

    // Released where it should be...
    expect(cell("perio-fg-pd-16-MB").disabled).toBe(false);
    expect(cell("perio-fg-gm-16-MB").disabled).toBe(false);
    // ...but the capability matrix still blocks a tooth with no periodontium,
    // and an uncharted site still has no gingival margin to record.
    expect(cell("perio-fg-pd-21-MB").disabled).toBe(true);
    expect(cell("perio-fg-gm-16-DB").disabled).toBe(true);

    // The released cell really is authorable again.
    const bop = cell("perio-fg-bop-16-MB");
    expect(bop.disabled).toBe(false);
    click(bop);
    expect(getToothPerio(16).bop).toContain("MB");
  });
});
