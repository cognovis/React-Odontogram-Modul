// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-7xl: der Lockerungsgrad als roemische Ziffer.
//
// Dirk, 22.08.2026: "Wir schreiben eine roemische Ziffer I - III in das
// Kaestchen des Zahnes, unten in eine Ecke. Mir faellt nichts ein, wie man
// Lockerung sonst graphisch darstellen koennte."

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const lies = (f: string) => readFileSync(resolve(process.cwd(), "src", f), "utf8");
const odo = lies("odontogram.ts");
const css = lies("index.css");

describe("Die Ziffer statt der Zeichnung", () => {
  it("I, II, III - und nichts sonst", () => {
    expect(odo).toContain('MOBILITAETSZIFFER: Record<string, string> = { m1: "I", m2: "II", m3: "III" }');
  });

  it("steht am DIV der Kachel, nicht im SVG", () => {
    // Damit bleibt der SVG-Fingerabdruck unberuehrt - dieselbe Bauweise wie bei
    // der Retentionsmarke daneben.
    const fn = odo.slice(odo.indexOf("function updateToothMobilityMark"),
                         odo.indexOf("function updateToothMobilityMark") + 1200);
    expect(fn).toContain('tile.setAttribute("data-mobility"');
    expect(fn).toContain('tile.removeAttribute("data-mobility")');
  });

  it("DIESELBE Bedingung wie vorher die Ebene", () => {
    const fn = odo.slice(odo.indexOf("function updateToothMobilityMark"),
                         odo.indexOf("function updateToothMobilityMark") + 1200);
    expect(fn).toContain('!== "implant"');   // osseointegriert, kein Desmodont
    expect(fn).toContain('!== "none"');      // keine Luecke
    expect(fn).toContain("isExtraction");
    expect(fn).toContain("extractionWound");
  });

  it("die Ebene wird nicht mehr eingeschaltet", () => {
    expect(odo).not.toContain('setActive(svgGetById(svg, "mobility"), true)');
  });

  it("gezeichnet wird sie von CSS, unten links, und nicht in der Kauflaeche", () => {
    // `::before`, weil die Retentionsmarke `::after` benutzt: beide sitzen an
    // derselben Kachel und duerfen sich nicht verdraengen.
    expect(css).toContain(".tooth-tile[data-mobility]::before");
    expect(css).toMatch(/\[data-mobility\]::before\{[^}]*content: attr\(data-mobility\)/);
    expect(css).toMatch(/\[data-mobility\]::before\{[^}]*bottom:/);
    expect(css).toContain(".tooth-tile.occl-view[data-mobility]::before{ display: none }");
  });
});
