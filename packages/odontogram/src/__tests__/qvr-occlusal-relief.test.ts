// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-qvr: Fissuren und Hoecker sollen auch unter der Krone zu
// sehen sein. Gezeichnet wird dabei NICHTS Neues - die Kachel bekommt das
// Material angeschrieben, und die Regeln in index.css nehmen der Kappe ihre
// Fuellung. Geprueft wird deshalb die Anschrift, nicht das Bild: dass sie
// steht, wo sie stehen soll, und nirgends sonst.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Gelesen wird die QUELLE, nicht das Gerenderte: was hier geprueft wird, ist
// eine Verabredung zwischen odontogram.ts (schreibt die Anschrift) und
// index.css (liest sie). Ein DOM-Test wuerde die Verabredung nicht sehen,
// sondern nur ihr Ergebnis - und der Fehler, der hier gefangen werden soll,
// war eine zu schwache Spezifitaet, also genau eine Frage der Quelle.
const lies = (f: string) => readFileSync(resolve(process.cwd(), "src", f), "utf8");
const css = lies("index.css");
const odo = lies("odontogram.ts");
const app = lies("App.tsx");

const MATERIALIEN = ["gold", "gradia", "zircon", "metal", "temporary",
                     "telescope", "emax", "metal-ceramic"];

describe("Die Anschrift an der Kachel", () => {
  it("nur an der KAUFLAECHENkachel - aber an jeder, auch der Front", () => {
    // Dirk, 21.08.2026: "Mach bitte bei Kronen in der Front, 13-23, 33-43 auch
    // die feine Zeichnung der Incisalkante mit in die okklusale Ansicht."
    // Der erste Wurf hatte die Front ausgenommen, weil sie keine Fissuren hat -
    // sie traegt aber sehr wohl `cusps` und `fissure`, und das IST die
    // Zeichnung der Schneidekante.
    expect(odo).toContain("function syncOcclusalRelief");
    const fn = odo.slice(odo.indexOf("function syncOcclusalRelief"),
                         odo.indexOf("function syncOcclusalRelief") + 1400);
    expect(fn).not.toContain("isAnteriorTooth");
    expect(fn).toContain('tile.classList.contains("occl-view")');
    expect(fn).toContain("tile.dataset.occlResto");
  });

  it("nur unter voller oder teilweiser Ueberkronung, nie ohne Material", () => {
    const fn = odo.slice(odo.indexOf("function syncOcclusalRelief"),
                         odo.indexOf("function syncOcclusalRelief") + 1400);
    for(const t of ["crown", "bridge", "onlay"]) expect(fn).toContain(`"${t}"`);
    expect(fn).toContain('material !== "none"');
  });

  it("laeuft in derselben Schleife wie die uebrigen Kachelmarken", () => {
    expect(odo).toContain("syncOcclusalRelief(toothNo);");
  });
});

describe("Die Regeln", () => {
  it("jedes Material hat seinen Satz", () => {
    for(const m of MATERIALIEN){
      expect(css, m).toContain(`[data-occl-resto="${m}"]`);
    }
  });

  it("die Kappe verliert ihre Fuellung, die Hoecker bekommen sie", () => {
    expect(css).toContain('[data-occl-resto="gold"] [id$="-crown"]');
    expect(css).toMatch(/\[data-occl-resto="gold"\][^{]*\{ fill: none !important; \}/);
    expect(css).toContain('[data-occl-resto="gold"] [id="tooth-base"] [id="cusps"] path[style]');
  });

  it("die Hoeckerregel ist SPEZIFISCHER als die Tiefenwirkung", () => {
    // Sonst gewinnt `odonDepthCusp` und die Hoecker bleiben grau - genau das
    // war der erste Versuch, und im Bild sah die Goldkrone weiss aus.
    const tiefe = css.indexOf("url(#odonDepthCusp)");
    const meins = css.indexOf('[id="cusps"] path[style]');
    expect(tiefe).toBeGreaterThan(-1);
    expect(meins).toBeGreaterThan(tiefe);          // spaeter in der Datei
    expect(css.slice(meins - 200, meins)).toContain('[id="tooth-base"]');  // und laenger
  });

  it("jedes Material hat auch seinen Kuppelverlauf", () => {
    for(const gid of ["odonKroneGold","odonKroneGradia","odonKroneZirkon","odonKroneMetall",
                      "odonKroneProvi","odonKroneTeleAussen","odonKroneEmax","odonKroneMetKer"]){
      expect(app, gid).toContain(`id="${gid}"`);
      expect(css, gid).toContain(`url(#${gid})`);
    }
  });
});
