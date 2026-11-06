// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-apn: Zaehne durch Ziehen markieren, und mit Shift und
// Pfeiltaste.
//
// jsdom hat kein Layout: `document.elementFromPoint` liefert immer null, und
// eine Ziehauswahl, die den Zahn unter dem Zeiger sucht, findet dann nie
// einen. Der Zeiger wird deshalb GESTELLT - eine Abbildung x -> Zahn, die der
// Test selbst fuehrt. Damit prueft er, was er pruefen soll: dass aus zwei
// Punkten die richtige Spanne wird und dass ein Ziehen nicht als Klick
// durchschlaegt.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import { __resetChartStateForTest } from "../odontogram";

let zeigerKarte = new Map<number, number>();   // x -> Zahnnummer

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
  if (!("PointerEvent" in window)) {
    Object.defineProperty(window, "PointerEvent", { writable: true, value: MouseEvent });
  }
  zeigerKarte = new Map();
  document.elementFromPoint = ((x: number) => {
    const toothNo = zeigerKarte.get(x);
    if (toothNo === undefined) return null;
    return document.querySelector(`#toothGrid .tooth-tile.side-view[data-tooth="${toothNo}"]`);
  }) as typeof document.elementFromPoint;
});

afterEach(async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  cleanup();
  __resetChartStateForTest();
  vi.restoreAllMocks();
});

function kachel(toothNo: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `#toothGrid .tooth-tile.side-view[data-tooth="${toothNo}"]`);
  if (!el) throw new Error(`keine Kachel fuer ${toothNo}`);
  return el;
}

function markiert(): number[] {
  return Array.from(document.querySelectorAll<HTMLElement>("#toothGrid .tooth-tile.side-view.active"))
    .map(el => Number(el.dataset.tooth))
    .sort((a, b) => a - b);
}

/** Legt die Zaehne der Reihe nach auf x = 0, 10, 20 ... */
function zeigerAuf(zaehne: number[]) {
  zaehne.forEach((t, i) => zeigerKarte.set(i * 10, t));
  return (t: number) => zaehne.indexOf(t) * 10;
}

async function ziehe(von: number, bis: number, x: (t: number) => number, opts: { shift?: boolean } = {}) {
  await act(async () => {
    kachel(von).dispatchEvent(new MouseEvent("pointerdown", {
      bubbles: true, button: 0, clientX: x(von), clientY: 0, shiftKey: !!opts.shift,
    }));
    document.dispatchEvent(new MouseEvent("pointermove", {
      bubbles: true, clientX: x(bis), clientY: 0,
    }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    // Der Klick, der nach jedem Loslassen ohnehin feuert.
    kachel(bis).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function raster() {
  render(<OdontogramShell />);
  await waitFor(() => {
    expect(document.querySelectorAll("#toothGrid .tooth-tile.side-view").length).toBeGreaterThan(0);
  }, { timeout: 30000 });
}

describe("Markieren durch Ziehen", () => {
  it("markiert alle beruehrten Zaehne, und das Ziehen schlaegt nicht als Klick durch", async () => {
    await raster();
    const x = zeigerAuf([16, 15, 14, 13]);
    await ziehe(16, 13, x);
    expect(markiert()).toEqual([13, 14, 15, 16]);
  }, 30000);

  it("zieht in beide Richtungen gleich", async () => {
    await raster();
    const x = zeigerAuf([16, 15, 14, 13]);
    await ziehe(13, 16, x);
    expect(markiert()).toEqual([13, 14, 15, 16]);
  }, 30000);

  it("geht ueber die Mitte", async () => {
    await raster();
    const x = zeigerAuf([13, 12, 11, 21, 22, 23]);
    await ziehe(13, 23, x);
    expect(markiert()).toEqual([11, 12, 13, 21, 22, 23]);
  }, 30000);

  it("greift nicht in den Gegenkiefer", async () => {
    await raster();
    const x = zeigerAuf([16, 46]);
    await ziehe(16, 46, x);
    expect(markiert()).toEqual([16]);
  }, 30000);

  it("ersetzt die Auswahl, mit Shift kommt sie dazu", async () => {
    await raster();
    const x = zeigerAuf([16, 15, 14, 26, 25]);
    await ziehe(16, 15, x);
    expect(markiert()).toEqual([15, 16]);
    await ziehe(26, 25, x);                       // ohne Shift: ersetzt
    expect(markiert()).toEqual([25, 26]);
    await ziehe(16, 15, x, { shift: true });      // mit Shift: kommt dazu
    expect(markiert()).toEqual([15, 16, 25, 26]);
  }, 30000);

  it("ein Klick bleibt ein Klick - unterhalb der Schwelle keine Spanne", async () => {
    await raster();
    zeigerKarte.set(0, 16);
    await act(async () => {
      kachel(16).dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
      document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 2, clientY: 1 }));
      document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(markiert()).toEqual([16]);
  }, 30000);

  it("Escape waehrend des Ziehens stellt die vorherige Auswahl wieder her", async () => {
    await raster();
    const x = zeigerAuf([16, 15, 14, 13]);
    await act(async () => { kachel(14).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(markiert()).toEqual([14]);
    await act(async () => {
      kachel(16).dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: x(16), clientY: 0 }));
      document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: x(13), clientY: 0 }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    expect(markiert()).toEqual([]);
  }, 30000);
});

describe("Markieren mit Shift und Pfeiltaste", () => {
  it("erweitert die Auswahl, statt durch sie hindurchzugehen", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", {
          key: "ArrowRight", bubbles: true, cancelable: true, shiftKey: true,
        }));
      });
    }
    expect(markiert()).toEqual([13, 14, 15, 16]);
  }, 30000);

  it("zurueck verkleinert die Spanne wieder, weil das ferne Ende steht", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    const pfeil = async (key: string) => {
      await act(async () => {
        (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", {
          key, bubbles: true, cancelable: true, shiftKey: true,
        }));
      });
    };
    await pfeil("ArrowRight");
    await pfeil("ArrowRight");
    expect(markiert()).toEqual([14, 15, 16]);
    await pfeil("ArrowLeft");
    expect(markiert()).toEqual([15, 16]);
  }, 30000);

  it("eine Pfeiltaste ohne Shift laesst die Auswahl in Ruhe", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await act(async () => {
      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", {
        key: "ArrowRight", bubbles: true, cancelable: true,
      }));
    });
    expect(markiert()).toEqual([16]);
  }, 30000);
});
