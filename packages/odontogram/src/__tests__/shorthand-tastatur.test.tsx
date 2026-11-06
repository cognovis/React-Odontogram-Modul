// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-t8y: der Weg vom Tastendruck bis in den Zustand.
//
// `shorthand.test.ts` prueft die ABBILDUNG ohne Browser. Hier wird das Raster
// wirklich gebaut und wirklich getippt - denn die Abbildung kann stimmen und
// der Tastendruck trotzdem nirgends ankommen. Genau das war der Fehler, an dem
// die Milchzahn-Kauflaeche haengengeblieben ist: eine Tabelle zu lesen ist
// nicht dasselbe, wie das gebaute Raster zu befragen.
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

function kachelOccl(toothNo: number): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `#toothGrid .tooth-tile.occl-view[data-tooth="${toothNo}"]`);
  if(!el) throw new Error(`keine Aufsicht fuer ${toothNo}`);
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
  }, { timeout: 30000 });
}

function anzeige(): HTMLElement | null {
  return document.getElementById("shorthandBuffer");
}

// FRISTEN, und warum sie so grosszuegig sind.
//
// Jeder dieser Tests montiert die volle Schale und tippt wirklich - allein
// braucht der schnellste 5 und der langsamste 43 Sekunden. Unter der Last der
// vollen Suite wird daraus ein Vielfaches: am 22.08.2026 ist "k wirkt sofort
// auf einer Mehrfachauswahl" bei 30 s abgelaufen, allein gemessen 11 s.
//
// Ein Fehlschlag aus Zeitmangel sagt nichts ueber die Sache aus, sondern nur
// ueber die Auslastung der Maschine - und er kostet mehr, als er einbringt:
// die Suite wird rot, und wer das oft sieht, liest "1 failed" als normal
// (siehe odontogram-xtj). Deshalb 90 Sekunden fuer alle, dreifach ueber dem
// gemessenen Bedarf unter Last.

describe("Kurzschrift auf der Tastatur", () => {
  it("k wirkt sofort auf einer Mehrfachauswahl - Dirks sechs Frontzaehne", async () => {
    await raster();
    // Sechs obere Frontzaehne markieren, wie mit gedrueckter Meta-Taste.
    for(const t of [13, 12, 11, 21, 22, 23]){
      await act(async () => {
        kachel(t).dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
      });
    }
    kachel(23).focus();
    // Keramik, dann Krone. Ein Anschlag je Taste, kein Enter hinterher.
    await tippe("Ek");
    for(const t of [13, 12, 11, 21, 22, 23]){
      expect(zahn(t).restorationType, `${t}`).toBe("crown");
      expect(zahn(t).restorationMaterial, `${t}`).toBe("emax");
    }
    // Ein nicht markierter Zahn bleibt unberuehrt.
    expect(zahn(24).restorationType ?? "none").toBe("none");
  }, 90000);

  it("Tabulator geht zum naechsten Zahn und nimmt die Auswahl mit", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await taste("Tab");
    expect(kachel(15).classList.contains("active")).toBe(true);
    expect(kachel(16).classList.contains("active")).toBe(false);
    await taste("Tab", { shift: true });
    expect(kachel(16).classList.contains("active")).toBe(true);
  }, 90000);

  it("k, Tabulator, b - Krone und Brueckenglied am Nachbarn", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("Gk");
    await taste("Tab");
    await tippe("b");
    expect(zahn(16).restorationType).toBe("crown");
    expect(zahn(16).restorationMaterial).toBe("gold");
    expect(zahn(15).toothSelection).toBe("none");
    expect(zahn(15).restorationType).toBe("bridge");
  }, 90000);

  it("Flaechen erscheinen beim Tippen, ohne Tab oder Enter", async () => {
    // Dirk, 25.09.2026: "Ich aktiviere Karies und druecke m o d und nichts
    // erscheint." Frueher sammelten sich die Flaechen bis Tab/Enter.
    await raster();
    await act(async () => { kachel(36).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(36).focus();
    await tippe("Amod");   // Amalgam, dann m o d - jede Flaeche wirkt sofort
    const flaechen = zahn(36).fillingSurfaces as string[];
    expect(new Set(flaechen)).toEqual(new Set(["mesial", "occlusal", "distal"]));
  }, 90000);

  it("Karies ohne Material: m o d erscheinen sofort, K3 danach stuft sie ein", async () => {
    await raster();
    await act(async () => { kachel(46).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(46).focus();
    await tippe("mod");
    expect(new Set(zahn(46).caries as string[]))
      .toEqual(new Set(["caries-mesial", "caries-occlusal", "caries-distal"]));
    await tippe("K3");     // Dirks Reihenfolge: "mod K3"
    expect(zahn(46).cariesSeverity).toEqual({ mesial: 4, occlusal: 4, distal: 4 });
  }, 90000);

  it("MZ schaltet Milchzahn und bleibenden Zahn um - nur auf den Plaetzen 1 bis 5, Befunde bleiben", async () => {
    await raster();
    await act(async () => { kachel(34).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(34).focus();
    await tippe("MZ");
    expect(zahn(34).toothSelection).toBe("milktooth");
    await tippe("co");                       // ein Befund darauf ...
    await tippe("MZ");                       // ... und MZ nochmal: zurueck zum bleibenden Zahn
    expect(zahn(34).toothSelection ?? "tooth-base").toBe("tooth-base");
    expect(zahn(34).caries).toContain("caries-occlusal");   // der Befund bleibt
    await tippe("MZ");
    expect(zahn(34).toothSelection).toBe("milktooth");
    await act(async () => { kachel(36).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(36).focus();
    await tippe("MZ");                       // ein Molarenplatz hat keinen Milchzahn
    expect(zahn(36).toothSelection ?? "tooth-base").toBe("tooth-base");
  }, 90000);

  it("Totalprothese: alles markiert, ein e", async () => {
    await raster();
    const sichtbar = Array.from(
      document.querySelectorAll<HTMLElement>("#toothGrid .tooth-tile.side-view"))
      .filter(el => !el.classList.contains("wisdom-hidden") && !el.classList.contains("placeholder"))
      .map(el => Number(el.dataset.tooth));
    for(const t of sichtbar){
      await act(async () => {
        kachel(t).dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
      });
    }
    kachel(sichtbar[0]).focus();
    await tippe("e");
    for(const t of [11, 16, 31, 36]){
      expect(zahn(t).prosthesis, `${t}`).toBe("removable-full");
      expect(zahn(t).toothSelection, `${t}`).toBe("none");
    }
    // Der Test klickt achtundzwanzig Kacheln EINZELN durch `act()` und rendert
    // danach das ganze Raster neu. Bis odontogram-szc kostete jede Auswahl-
    // aenderung ~1s (setControlsEnabled rief pro Control eine dokumentweite
    // Label-Query ueber das ~6400-Knoten-Grid), sodass allein die Klicks ~42s
    // brauchten; seit dem gecachten getControlLabel sind es ~9s. Die 90s bleiben
    // als grosszuegige Reserve fuer den Grid-Aufbau unter der Last des CI-Laufs.
  }, 90000);

  it("sagt es, wenn eine Taste nichts bewirkt hat", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    // `z` ist charlys zervikale Flaeche - verstanden, aber unser Flaechensatz
    // hat sie nicht. Vorher stand hier `p` (bis odontogram-fu1) und dann `D`
    // (bis odontogram-0n8); beide haben inzwischen ein Ziel und taugen als
    // Beispiel nicht mehr. `z` und `R` sind die letzten zwei, und sie tragen
    // absichtlich keinen Bead.
    await tippe("z");
    await taste("Enter");
    expect(anzeige()?.classList.contains("notice")).toBe(true);
    expect(anzeige()?.textContent ?? "").toContain("z");
    expect(anzeige()?.classList.contains("empty")).toBe(false);
  }, 90000);

  it("meldet einen Tippfehler getrennt vom noch Fehlenden", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("q");
    await taste("Enter");
    const text = anzeige()?.textContent ?? "";
    expect(text).toContain("q");
    // Es ist die Unbekannt-Meldung, nicht die Noch-nicht-erfassbar-Meldung.
    // (Die Testumgebung laeuft auf Englisch.)
    expect(text).toContain("Unknown");
    expect(text).not.toContain("Not chartable");
  }, 90000);

  it("Klick auf die Aufsicht fokussiert die Kachel, sodass Tippen ankommt", async () => {
    // Regression: die Aufsicht/Draufsicht trug einen keydown-Handler, aber
    // KEIN tabindex - ein Klick dort waehlte den Zahn, fokussierte aber nichts,
    // und die danach getippte Kurzschrift landete nirgends ("nicht sauber").
    // onToothClick fokussiert jetzt die kanonische Seitenansicht-Kachel.
    await raster();
    await act(async () => {
      kachelOccl(16).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // Der Klick auf die AUFSICHT muss die SEITENANSICHT fokussiert haben.
    expect(document.activeElement).toBe(kachel(16));
    // Und ab jetzt kommt Kurzschrift auf 16 an - ohne manuelles focus().
    await tippe("Gk");
    expect(zahn(16).restorationType).toBe("crown");
    expect(zahn(16).restorationMaterial).toBe("gold");
  }, 90000);

  it("Bruecken-Overlay skaliert per viewBox, ohne width/height", async () => {
    // Regression: renderBridgeOverlay (und die 4 Geschwister-Overlays) setzten
    // width/height auf die SCREEN-Groesse (getBoundingClientRect). Bei fit-to-
    // window-Skalierung (clientWidth != boundingRect) deckte die SVG nur ~82%
    // des Rasters ab, und JEDER Verbinder rutschte nach oben-links auf die
    // falschen Zaehne (Bruecke 17-15 zeichnete ihr Band ueber 18-17). Fix: nur
    // viewBox, wie die gum-overlay. jsdom hat kein Layout, also wird hier der
    // STRUKTURELLE Vertrag gepinnt: die Auflage traegt eine viewBox und KEINE
    // width/height-Attribute.
    await raster();
    await act(async () => { kachel(17).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    await tippe("Gk");                       // 17 Krone
    await taste("Tab"); await tippe("b");    // 16 Brueckenglied
    await taste("Tab"); await tippe("Gk");   // 15 Krone
    const ov = document.querySelector("svg.bridge-overlay");
    expect(ov).not.toBeNull();
    expect(ov!.hasAttribute("viewBox")).toBe(true);
    expect(ov!.hasAttribute("width")).toBe(false);
    expect(ov!.hasAttribute("height")).toBe(false);
  }, 90000);

  it("Escape raeumt den Puffer, bevor es die Auswahl raeumt", async () => {
    await raster();
    await act(async () => { kachel(16).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    kachel(16).focus();
    await tippe("A");                       // wartet, weil Am daraus werden koennte
    await taste("Escape");
    expect(kachel(16).classList.contains("active")).toBe(true);
    await taste("Escape");
    expect(kachel(16).classList.contains("active")).toBe(false);
  }, 90000);
});
