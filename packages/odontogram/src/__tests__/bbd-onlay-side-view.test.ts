// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-bbd: das Onlay in der Seitenansicht.
//
// Dirk, 21.08.2026: "Onlay kann ueber 4 Flaechen gehen, z.B. modl, modv, odlv
// usw." Ein modv hat einen vestibulaeren Anteil, den man von der Seite sieht.
// Und am 22.08.2026: "Das Onlay soll auf 2/3 der bukkalen Flaeche reichen. Ich
// denke, das ist ein guter Kompromiss."

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composeRestorationLayers, isValidRestoration, restorationOptions } from "../registry/restorations";

const lies = (f: string) => readFileSync(resolve(process.cwd(), "src", f), "utf8");
const css = lies("index.css");
const odo = lies("odontogram.ts");

describe("Das Onlay gilt in beiden Ansichten", () => {
  it("es war nie eine Regel, sondern der Bestand an Zeichnungen", () => {
    for(const m of ["emax", "gold", "gradia", "zircon", "temporary"]){
      expect(isValidRestoration("onlay", m as never, "front"), m).toBe(true);
      expect(isValidRestoration("onlay", m as never, "occlusal"), m).toBe(true);
    }
    expect(restorationOptions("front", {}).some((o) => o.restorationType === "onlay")).toBe(true);
  });

  it("in der Kauflaeche die gezeichnete Onlay-Ebene, in der Seitenansicht die KRONE", () => {
    // Dort gibt es keine Onlay-Zeichnung, und es waere auch keine eigene Form:
    // ein Onlay ist die Krone ohne ihr zervikales Drittel.
    expect(composeRestorationLayers("onlay", "gold", "occlusal")).toEqual(["gold-onlay"]);
    expect(composeRestorationLayers("onlay", "gold", "front")).toEqual(["gold-crown"]);
    expect(composeRestorationLayers("onlay", "emax", "front")).toEqual(["emax-crown"]);
  });
});

describe("Der Schnitt", () => {
  it("die Kachel bekommt data-onlay, nur in der Seitenansicht", () => {
    const fn = odo.slice(odo.indexOf("function updateToothOnlayClip"),
                         odo.indexOf("function updateToothOnlayClip") + 1100);
    expect(fn).toContain('st?.restorationType === "onlay"');
    expect(fn).toContain('tile.classList?.contains("side-view")');
    expect(fn).toContain("restorationRowHidden(st)");   // kein Onlay am Wurzelrest
    expect(odo).toContain("updateToothOnlayClip(toothNo);");
  });

  it("EIN Schnitt fuer beide Kiefer, und zwar oben", () => {
    // Die Falle: der Unterkiefer traegt seine Kaukante oben, das zervikale
    // Drittel liegt dort also unten - man erwartet inset(0 0 33.3% 0). Die
    // Kachel wird aber als Ganzes um 180 Grad gedreht, mit einem
    // transform-ATTRIBUT an einem Wrapper, und der Schnitt rechnet im EIGENEN
    // Koordinatensystem des Elements, also VOR der Drehung. Am Bild gefunden.
    expect(css).toContain('.tooth-tile[data-onlay] .tooth-svg svg [id$="-crown"]');
    expect(css).toMatch(/\[data-onlay\][^{]*\{[^}]*clip-path: inset\(33\.3% 0 0 0\)/s);
    // und KEINE zweite, kieferabhaengige Fassung
    expect(css).not.toContain('.lower-arch .tooth-tile[data-onlay]');
  });

  it("die innere Teleskopkrone wird mitgeschnitten", () => {
    // Sie traegt nicht die Endung `-crown`, gehoert aber zur selben Kappe.
    expect(css).toContain('[id="telescope-crown-inside"]');
  });
});
