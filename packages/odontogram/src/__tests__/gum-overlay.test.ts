// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-9nb: die Baender liegen in EINER Auflage hinter dem Raster.
//
// jsdom hat kein Layout - `getBoundingClientRect` liefert Nullen, und die
// Auflage steigt dann aus. Die Geometrie wird deshalb GESTELLT: nur so laesst
// sich pruefen, dass die Umrechnung von viewBox-Koordinaten in Rasterpixel
// stimmt, und genau die entscheidet, ob das Band am Zahn sitzt.
import { describe, it, expect, beforeEach } from "vitest";
import { renderGumOverlay, BAND_LAYER_IDS } from "../gumOverlay";

const SVG_NS = "http://www.w3.org/2000/svg";

function rect(el: Element, r: {left:number;top:number;width:number;height:number}){
  (el as HTMLElement).getBoundingClientRect = () => ({
    left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height,
    width: r.width, height: r.height, x: r.left, y: r.top, toJSON(){ return r; },
  }) as DOMRect;
}

/** Ein Raster mit einer Kachel, deren SVG bei (100,50) steht, 70x140 px gross
 *  ist und einen viewBox von 0 0 40 80 traegt. Das Raster selbst beginnt bei
 *  (20,10) - so faellt auf, wenn die Verschiebung des Rasters vergessen wird. */
function raster(opts: { aktiv?: boolean; drehung?: string } = {}){
  const grid = document.createElement("div");
  grid.id = "toothGrid";
  rect(grid, { left: 20, top: 10, width: 600, height: 400 });

  const kachel = document.createElement("div");
  kachel.className = "tooth-tile side-view";
  const halter = document.createElement("div");
  halter.className = "tooth-svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 40 80");
  rect(svg, { left: 100, top: 50, width: 70, height: 140 });

  let elternteil: Element = svg;
  if(opts.drehung){
    const huelle = document.createElementNS(SVG_NS, "g");
    huelle.setAttribute("transform", opts.drehung);
    svg.appendChild(huelle);
    elternteil = huelle;
  }
  for(const id of BAND_LAYER_IDS){
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("id", id);
    g.setAttribute("data-active", opts.aktiv === false ? "0" : "1");
    elternteil.appendChild(g);
  }
  halter.appendChild(svg); kachel.appendChild(halter); grid.appendChild(kachel);
  document.body.appendChild(grid);
  return grid;
}

beforeEach(() => { document.body.innerHTML = ""; });

describe("Bandauflage", () => {
  it("legt EINE Auflage an, als erstes Kind, und fuellt sie mit je einem Klon", () => {
    const grid = raster();
    renderGumOverlay(grid);
    const overlay = grid.querySelector(":scope > svg.gum-overlay")!;
    expect(overlay, "Auflage vorhanden").toBeTruthy();
    expect(grid.firstChild, "liegt hinter allen Kacheln").toBe(overlay);
    expect(overlay.getAttribute("viewBox")).toBe("0 0 600 400");
    expect(overlay.children.length, "je Band eine Huelle").toBe(BAND_LAYER_IDS.length);
    for(const id of BAND_LAYER_IDS){
      expect(overlay.querySelector(`[id="${id}"]`), `${id} geklont`).toBeTruthy();
    }
  });

  it("rechnet viewBox-Koordinaten in Rasterpixel um", () => {
    const grid = raster();
    renderGumOverlay(grid);
    const huelle = grid.querySelector(":scope > svg.gum-overlay > g")!;
    // SVG bei (100,50) im Fenster, Raster bei (20,10) -> (80,40) im Raster.
    // 70 px auf 40 Einheiten = 1.75, 140 px auf 80 Einheiten = 1.75.
    expect(huelle.getAttribute("transform"))
      .toBe("translate(80 40) scale(1.75 1.75) translate(0 0) ");
  });

  it("nimmt die Drehung des Zahns mit - sonst stuende das Band im Unterkiefer auf dem Kopf", () => {
    const grid = raster({ drehung: "rotate(180 20 40)" });
    renderGumOverlay(grid);
    const t = grid.querySelector(":scope > svg.gum-overlay > g")!.getAttribute("transform")!;
    expect(t.endsWith("rotate(180 20 40)"), t).toBe(true);
    // Die Drehung rechnet in viewBox-Koordinaten und muss deshalb INNEN stehen.
    expect(t.indexOf("scale")).toBeLessThan(t.indexOf("rotate"));
  });

  it("ueberspringt ein abgeschaltetes Band - ein fehlender Zahn hat keines", () => {
    const grid = raster({ aktiv: false });
    renderGumOverlay(grid);
    expect(grid.querySelector(":scope > svg.gum-overlay")!.children.length).toBe(0);
  });

  it("ist wiederholbar: zweimal gerufen steht nicht das Doppelte darin", () => {
    const grid = raster();
    renderGumOverlay(grid);
    renderGumOverlay(grid);
    expect(grid.querySelectorAll(":scope > svg.gum-overlay").length).toBe(1);
    expect(grid.querySelector(":scope > svg.gum-overlay")!.children.length)
      .toBe(BAND_LAYER_IDS.length);
  });

  it("faellt nicht um, wenn kein Raster steht", () => {
    expect(() => renderGumOverlay(null)).not.toThrow();
  });
});
