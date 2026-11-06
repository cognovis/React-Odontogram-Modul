// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-gry: WO das Dreieck des Papillenverlusts sitzt.
//
// Dirk, 22.08.2026: "das Dreieck wird mit dem Grad von 1 zu 3 groesser und soll
// die Papilla verdecken. Dazu muesste es nach meinem Verstaendnis aber tiefer
// sitzen, besonders bei Grad 3."
//
// Gemessen war es schlimmer als es aussah: es sass VOLLSTAENDIG AUSSERHALB des
// Zahnfleischs, auf der Kronenseite (16: Band y 119..139, Dreieck 139 bis 151),
// und reichte mit steigender Klasse immer WEITER WEG vom Zahnfleisch.
//
// Gelesen wird die Quelle: die Geometrie entsteht aus einer gemessenen
// Bandhoehe im Browser, und ein jsdom-Test haette dort ueberall Nullen. Was hier
// festgehalten wird, ist die Verabredung - Spitze an der Papillenspitze, Basis
// apikal, Tiefe als ANTEIL der Bandhoehe.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(process.cwd(), "src", "gumOverlay.ts"), "utf8");
const fn = src.slice(src.indexOf("function papillenluecken"),
                     src.indexOf("function papillenluecken") + 6500);

describe("Das Dreieck liegt AUF dem Zahnfleisch", () => {
  it("die Spitze sitzt am Rand, die Basis apikal davon", () => {
    // `rand` ist die koronale Kante des Bandes, also die Papillenspitze.
    // Oberkiefer: apikal heisst kleineres y, Unterkiefer groesseres.
    expect(fn).toContain("const basis = oben ? rand - hoehe : rand + hoehe;");
    expect(fn).toMatch(/M\$\{gelenk - halb\},\$\{basis\}L\$\{gelenk \+ halb\},\$\{basis\}L\$\{gelenk\},\$\{rand\}Z/);
  });

  it("die Tiefe ist ein ANTEIL der gemessenen Bandhoehe, keine feste Zahl", () => {
    // Seit 2.25.0 haengt das Band an der eigenen Zervikallinie jedes Zahns -
    // eine feste Zahl waere am Einundvierziger etwas anderes als am Dreier.
    expect(fn).toContain("const hoehe = bandhoehe * (TIEFE[klasse]");
    expect(src).toContain('const TIEFE: Record<string, number> = { "1": 0.35, "2": 0.65, "3": 1.0 };');
  });

  it("Klasse III bedeutet die VOLLE Hoehe - die Papille ist weg", () => {
    // Nordland & Tarnow III: die Spitze steht auf oder apikal der bukkalen
    // Schmelz-Zement-Grenze, also nichts mehr da.
    const m = src.match(/const TIEFE[^;]+;/)![0];
    expect(m).toContain('"3": 1.0');
    // und sie waechst monoton
    const werte = [...m.matchAll(/"[123]":\s*([\d.]+)/g)].map((x) => Number(x[1]));
    expect(werte).toEqual([...werte].sort((a, b) => a - b));
  });

  it("die Bandhoehe wird GEMESSEN, mit einem Rueckfall ohne Layout", () => {
    // getBoundingClientRect am KLON in der Auflage - `gum-base` ist in der
    // Kachel display:none, und ein verstecktes Element misst sich als null.
    expect(fn).toContain("bandhoehe = kasten.height;");
    expect(fn).toContain("let bandhoehe = r.height * 0.13;");
  });
});
