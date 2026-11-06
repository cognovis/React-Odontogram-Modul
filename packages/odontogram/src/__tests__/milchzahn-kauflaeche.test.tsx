// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Die Kaeflaeche muss den Milchzahn laden, wenn auf einen Milchzahn umgestellt
// wird.
//
// Bis zum 19.08.2026 tat sie das nicht: eine Kaufaeche wurde in `buildGrid`
// EINMAL gebaut und nie neu getemplatet, anders als die Seitenansicht, die
// `syncToothTemplate` tauscht. Ein Milchmolar zeigte deshalb die Kauflaeche
// seines Nachfolgers, und sobald die Milchfrontzaehne ihre Draufsicht bekamen,
// galt dasselbe fuer sie. Der Fehler war unsichtbar fuer jeden Test, der
// Tabellen liest statt das gebaute Raster.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import { __applyDentitionPresetForTest, __resetChartStateForTest } from "../odontogram";

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

/** Die Kauflaechenkachel einer Position, ueber die Klasse die `buildGrid`
 *  vergibt - nicht ueber die Reihenfolge, damit der Test nicht bricht, wenn
 *  eine Reihe umsortiert wird. */
function occlKachel(toothNo: number): Element | null {
  return document.querySelector(`#toothGrid .tooth-tile.occl-view[data-tooth="${toothNo}"]`);
}
function tplKlasse(el: Element | null): string | undefined {
  return Array.from(el?.classList ?? []).find((c) => /^tpl-\d+-occl$/.test(c));
}

describe("Kauflaeche folgt dem Milchzahn", () => {
  it("tauscht die Draufsicht auf das Milchzahn-Template und wieder zurueck", async () => {
    render(<OdontogramShell />);
    await waitFor(() => {
      expect(document.querySelectorAll("#toothGrid .tooth-tile.occl-view").length).toBeGreaterThan(0);
    }, { timeout: 8000 });

    // 11 -> 51, 14 -> 54, 41 -> 81, 45 -> 85: je ein Frontzahn und ein Molar
    // pro Kiefer, damit beide Ladewege abgedeckt sind.
    const paare: [number, number][] = [[11, 51], [14, 54], [41, 81], [45, 85]];

    const vorher = new Map<number, string | undefined>();
    for (const [toothNo, primary] of paare) {
      const k = tplKlasse(occlKachel(toothNo));
      expect(k, `${toothNo}: bleibende Draufsicht zu Beginn`).toBeDefined();
      expect(k, `${toothNo}: nicht schon das Milchzahn-Template`).not.toBe(`tpl-${primary}-occl`);
      vorher.set(toothNo, k);
    }

    await act(async () => { __applyDentitionPresetForTest("primary"); });
    for (const [toothNo, primary] of paare) {
      await waitFor(() => {
        expect(tplKlasse(occlKachel(toothNo)), `${toothNo}: Milchzahn-Draufsicht`)
          .toBe(`tpl-${primary}-occl`);
      }, { timeout: 10000 });
      // Die Kachel darf dabei nie leer werden.
      const svg = occlKachel(toothNo)?.querySelector("svg");
      expect(svg, `${toothNo}: Kachel hat Inhalt`).toBeTruthy();
      // ... und sie muss den GEZEICHNETEN Umriss zeigen, nicht die Form des
      // Spenders. Ein Milchzahn-Template wird als gewoehnlicher Zahn gezeichnet
      // (`drawnState`), also ist `tooth-base` aktiv und die milktooth-Ebene,
      // die noch die Spenderform traegt, aus. War sie es nicht, stand auf einem
      // Milchschneidezahn eine Praemolaren-Kauflaeche - und auf einem
      // Milchmolaren gar nichts, weil 16_occl keine milktooth-Ebene hat.
      // Ueber das ATTRIBUT, nicht ueber `#id`: jsdoms Selektor-Maschine findet
      // eine id-Auswahl innerhalb des SVG nicht zuverlaessig, `[id="..."]` schon.
      const aktiv = (id: string) =>
        svg?.querySelector(`[id="${id}"]`)?.getAttribute("data-active") === "1";
      expect(aktiv("tooth-base"), `${toothNo}: zeigt den gezeichneten Umriss`).toBe(true);
      expect(aktiv("milktooth-base"), `${toothNo}: nicht die Spenderform`).toBe(false);
    }

    // ... und zurueck, sonst bliebe der Milchzahn stehen, wenn der bleibende
    // Zahn durchbricht.
    await act(async () => { __resetChartStateForTest(); });
    for (const [toothNo] of paare) {
      await waitFor(() => {
        expect(tplKlasse(occlKachel(toothNo)), `${toothNo}: wieder bleibend`).toBe(vorher.get(toothNo));
      }, { timeout: 10000 });
    }
  }, 40000);
});
