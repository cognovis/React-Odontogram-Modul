// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Was im BOGEN ankommt, nicht was in einer Tabelle steht.
//
// Am 18.08.2026 war die erste Frontzahn-Draufsicht eingetragen, gemountet und
// ausgeliefert - und blieb unsichtbar. Dreimal hintereinander, aus drei
// verschiedenen Gruenden, und keiner davon wurde von 1975 gruenen Tests
// gesehen, weil alle `OCCLUSAL_TEMPLATE` lesen statt das gebaute Raster:
//
//   1. ein handgepflegter Platzhaltersatz in `buildGrid`, der vorher griff
//   2. eine Vorladeliste `occlNos`, in der die 11 fehlte
//   3. `addTile` brach bei fehlendem Template mit `return` ab, liess die Zelle
//      ersatzlos entfallen und verschob das ganze Raster - unter Label 22 stand
//      die 24
//
// Dirk hat alle drei im Browser gefunden. Dieser Test findet sie vorher.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import { OCCLUSAL_TEMPLATE, __resetChartStateForTest } from "../odontogram";

// jsdom kennt weder matchMedia noch ResizeObserver; die echte Engine - hier
// absichtlich NICHT gemockt, denn das gebaute Raster ist der Gegenstand -
// fasst beide beim Aufbau an.
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

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

afterEach(async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  cleanup();
  __resetChartStateForTest();
});

describe("Kauflaechenreihen im gebauten Bogen", () => {
  it("gibt jeder eingetragenen Position eine Kachel MIT Inhalt und haelt die Spalten", async () => {
    render(<OdontogramShell />);
    await waitFor(() => {
      expect(document.querySelectorAll("#toothGrid .tooth-tile").length).toBeGreaterThan(0);
    }, { timeout: 8000 });

    // Die Reihen stehen in der Reihenfolge, in der `buildGrid` sie anhaengt:
    // oben Beschriftung, Seitenansicht, Kauflaeche - unten Kauflaeche,
    // Seitenansicht, Beschriftung.
    const reihen = [
      { arch: ".upper-arch", teeth: UPPER },
      { arch: ".lower-arch", teeth: LOWER },
    ];
    for (const { arch, teeth } of reihen) {
      const kacheln = document.querySelectorAll(`#toothGrid ${arch} .tooth-tile.occl-view`);
      // Eine Zelle je Zahn - sonst verschiebt sich alles dahinter um eine Spalte.
      expect(kacheln.length, `${arch}: Zellen je Zahn`).toBe(teeth.length);
      teeth.forEach((toothNo, i) => {
        const kachel = kacheln[i];
        const soll = OCCLUSAL_TEMPLATE.has(toothNo);
        const hatInhalt = !!kachel.querySelector("svg");
        expect(hatInhalt, `${toothNo}: Kachel mit Inhalt`).toBe(soll);
      });
    }
  }, 20000);
});
