// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-t8y, und Zoltan Duls Bedingung im Upstream-Issue vom
// 19.08.2026: die Tastatureingabe "has to be flexible and fully configurable
// in Settings, never hard-wired".
//
// Geprueft wird deshalb nicht, dass die Schalter DA sind, sondern dass AUS
// wirklich AUS heisst - dass kein Tastendruck mehr ankommt und der Tabulator
// das Zahnschema wieder verlaesst, wie er es ueberall sonst tut.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import {
  getStatusChart, __resetChartStateForTest,
  getShorthandEnabled, setShorthandEnabled,
  getShorthandTabWalk, setShorthandTabWalk,
} from "../odontogram";

beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false, media: query, onchange: null,
        addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
      }),
    });
  }
  if (!("ResizeObserver" in window)) {
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: class { observe() {} unobserve() {} disconnect() {} },
    });
  }
});

afterEach(async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  cleanup();
  __resetChartStateForTest();
  setShorthandEnabled(true);
  setShorthandTabWalk(true);
});

function kachel(toothNo: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `#toothGrid .tooth-tile.side-view[data-tooth="${toothNo}"]`);
  if (!el) throw new Error(`keine Kachel fuer ${toothNo}`);
  return el;
}
function zahn(toothNo: number): Record<string, unknown> {
  const teeth = getStatusChart().teeth as Record<string, Record<string, unknown>>;
  return teeth[String(toothNo)] ?? {};
}
async function taste(key: string, opts: { shift?: boolean } = {}){
  const ziel = (document.activeElement as HTMLElement) ?? document.body;
  let ev!: KeyboardEvent;
  await act(async () => {
    ev = new KeyboardEvent("keydown", {
      key, bubbles: true, cancelable: true, shiftKey: !!opts.shift,
    });
    ziel.dispatchEvent(ev);
  });
  return ev;
}
async function raster(){
  render(<OdontogramShell />);
  await waitFor(() => {
    expect(document.querySelectorAll("#toothGrid .tooth-tile.side-view").length).toBeGreaterThan(0);
  }, { timeout: 8000 });
  await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  kachel(16).focus();
}

describe("Die Kurzschrift ist abschaltbar", () => {
  it("ist in diesem Fork voreingestellt an", () => {
    expect(getShorthandEnabled()).toBe(true);
    expect(getShorthandTabWalk()).toBe(true);
  });

  it("aus heisst aus: kein Tastendruck kommt mehr an", async () => {
    await raster();
    setShorthandEnabled(false);
    await taste("G");
    await taste("k");
    expect(zahn(16).restorationType ?? "none").toBe("none");
  }, 30000);

  it("und wieder an heisst wieder an", async () => {
    await raster();
    setShorthandEnabled(false);
    await taste("G");
    setShorthandEnabled(true);
    await taste("G");
    await taste("k");
    expect(zahn(16).restorationType).toBe("crown");
    expect(zahn(16).restorationMaterial).toBe("gold");
  }, 30000);

  it("laesst beim Abschalten nichts Halbgetipptes stehen", async () => {
    await raster();
    await taste("G");            // Material steht
    setShorthandEnabled(false);
    setShorthandEnabled(true);
    await taste("k");
    // Waere Gold ueber das Abschalten hinweg stehengeblieben, waere diese
    // Krone stillschweigend golden.
    expect(zahn(16).restorationMaterial ?? "none").toBe("none");
  }, 30000);
});

describe("Der Tabulatorgang ist getrennt abschaltbar", () => {
  it("an: der Tabulator wandert und wird abgefangen", async () => {
    await raster();
    const ev = await taste("Tab");
    expect(ev.defaultPrevented).toBe(true);
    expect(kachel(15).classList.contains("active")).toBe(true);
  }, 30000);

  it("aus: der Tabulator verlaesst das Zahnschema wie ueberall sonst", async () => {
    await raster();
    setShorthandTabWalk(false);
    const ev = await taste("Tab");
    // Nicht abgefangen - der Browser darf den Fokus weitergeben.
    expect(ev.defaultPrevented).toBe(false);
    expect(kachel(16).classList.contains("active")).toBe(true);
    expect(kachel(15).classList.contains("active")).toBe(false);
  }, 30000);

  it("aus lassen die Kuerzel trotzdem durch", async () => {
    await raster();
    setShorthandTabWalk(false);
    await taste("G");
    await taste("k");
    expect(zahn(16).restorationType).toBe("crown");
  }, 30000);

  it("die Kurzschrift ganz aus schaltet auch den Tabulatorgang ab", async () => {
    await raster();
    setShorthandEnabled(false);
    const ev = await taste("Tab");
    expect(ev.defaultPrevented).toBe(false);
  }, 30000);
});
