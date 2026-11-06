// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-t8y: der Widerruf, und was eine Restauration ohne Material ist.
//
// Von `shorthand-tastatur.test.tsx` GETRENNT, weil jeder dieser Tests eine
// ganze Schale montiert: fuenfzehn davon in einem Prozess sprengen den
// Arbeitsspeicher des Arbeiters, und der Lauf bricht ab, ohne dass etwas an
// der Sache falsch waere.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import { getStatusChart, getShorthandUndoDepth, __resetChartStateForTest } from "../odontogram";

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
});

function kachel(toothNo: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `#toothGrid .tooth-tile.side-view[data-tooth="${toothNo}"]`);
  if(!el) throw new Error(`keine Seitenansicht fuer ${toothNo}`);
  return el;
}

/** Tippt auf der Kachel, die gerade den Fokus hat - so wie am Stuhl. */
async function tippe(text: string, opts: { shift?: boolean } = {}){
  for(const key of text){
    const ziel = (document.activeElement as HTMLElement) ?? document.body;
    await act(async () => {
      ziel.dispatchEvent(new KeyboardEvent("keydown", {
        key, bubbles: true, cancelable: true, shiftKey: !!opts.shift,
      }));
    });
  }
}

async function taste(key: string, opts: { shift?: boolean; meta?: boolean } = {}){
  const ziel = (document.activeElement as HTMLElement) ?? document.body;
  await act(async () => {
    ziel.dispatchEvent(new KeyboardEvent("keydown", {
      key, bubbles: true, cancelable: true,
      shiftKey: !!opts.shift, metaKey: !!opts.meta,
    }));
  });
}

function zahn(toothNo: number): Record<string, unknown> {
  const teeth = getStatusChart().teeth as Record<string, Record<string, unknown>>;
  return teeth[String(toothNo)] ?? {};
}

async function raster(){
  render(<OdontogramShell />);
  await waitFor(() => {
    expect(document.querySelectorAll("#toothGrid .tooth-tile.side-view").length).toBeGreaterThan(0);
  }, { timeout: 8000 });
}

function anzeige(): HTMLElement | null {
  return document.getElementById("shorthandBuffer");
}

describe("Widerruf", () => {
  it("nimmt den letzten Befund zurueck, ueber alle Zaehne, die er traf", async () => {
    await raster();
    for(const t of [13, 12, 11]){
      await act(async () => {
        kachel(t).dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
      });
    }
    kachel(11).focus();
    await tippe("Ek");
    for(const t of [13, 12, 11]) expect(zahn(t).restorationType, `${t}`).toBe("crown");

    await taste("z", { meta: true });
    for(const t of [13, 12, 11]){
      expect(zahn(t).restorationType ?? "none", `${t}`).toBe("none");
      expect(zahn(t).restorationMaterial ?? "none", `${t}`).toBe("none");
    }
  }, 30000);

  it("nimmt den Materialmodus mit zurueck", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("G");            // Gold gesetzt, wirkt sofort
    await tippe("k");            // Goldkrone
    expect(zahn(16).restorationMaterial).toBe("gold");
    await taste("z", { meta: true });   // die Krone zurueck
    await taste("z", { meta: true });   // das Material zurueck
    await tippe("k");
    // Ohne den zweiten Widerruf staende Gold noch und diese Krone waere
    // stillschweigend ebenfalls golden. So fehlt jetzt das Material - und
    // die Anzeige sagt es, statt die Taste ins Leere laufen zu lassen.
    expect(zahn(16).restorationMaterial ?? "none").toBe("none");
    expect(anzeige()?.textContent ?? "").toContain("Choose a material");
  }, 30000);

  it("geht mehrere Schritte zurueck, nicht nur einen", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("Gk");
    await tippe("x");
    expect(zahn(16).extractionPlan).toBe(true);
    await taste("z", { meta: true });
    expect(zahn(16).extractionPlan ?? false).toBe(false);
    expect(zahn(16).restorationType).toBe("crown");
    await taste("z", { meta: true });
    expect(zahn(16).restorationType ?? "none").toBe("none");
  }, 30000);

  it("raeumt zuerst den ungeschriebenen Puffer, dann den Befund", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("Gk");           // geschrieben
    await tippe("c");            // wartet noch im Puffer
    await taste("z", { meta: true });
    // Der Puffer war das Juengere - die Krone steht noch.
    expect(zahn(16).restorationType).toBe("crown");
    await taste("z", { meta: true });
    expect(zahn(16).restorationType ?? "none").toBe("none");
  }, 30000);

  it("sagt es, wenn nichts zurueckzunehmen ist", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    expect(getShorthandUndoDepth()).toBe(0);
    await taste("z", { meta: true });
    expect(anzeige()?.textContent ?? "").toContain("Nothing to undo");
  }, 30000);
});

describe("Eine Restauration ohne Material ist kein Befund", () => {
  it("sagt es, statt die Taste ins Leere laufen zu lassen", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("k");
    // Der Zustand normalisiert eine Krone ohne Material wieder weg - sie ist
    // keine gueltige Restauration. Ohne Meldung sieht das aus wie nichts.
    expect(zahn(16).restorationType ?? "none").toBe("none");
    expect(anzeige()?.classList.contains("notice")).toBe(true);
    expect(anzeige()?.textContent ?? "").toContain("k");
  }, 30000);

  it("mit Material geht dieselbe Taste durch", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("Gk");
    expect(zahn(16).restorationType).toBe("crown");
    expect(anzeige()?.classList.contains("notice")).toBe(false);
  }, 30000);
});
