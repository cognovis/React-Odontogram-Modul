// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-1u2: "kein Goldinlay, kein Keramikinlay waehlbar oder ich
// finde es nicht."
//
// Sie WAREN waehlbar und sogar schon nach Art gruppiert. Was hier gepruefte
// wird, sind deshalb nicht die Eintraege, sondern die zwei Eigenschaften, an
// denen das Finden scheiterte.

import { describe, it, expect } from "vitest";
import { __getRestorationOptionsForTest as menue } from "../odontogram";

describe("Die Ueberschrift ist die Art, nicht 'Fest'", () => {
  it("keine feste Gruppe traegt mehr ein Wort, das alle tragen", () => {
    // Sechs Ueberschriften, die alle mit demselben Wort beginnen,
    // unterscheiden nichts - das Wort muss bei jedem Lesen uebersprungen werden.
    const gruppen = [...new Set(menue("occlusal").map((o) => o.group).filter(Boolean))];
    expect(gruppen.length).toBeGreaterThan(3);
    for(const g of gruppen) expect(g).not.toMatch(/^Fixed:/);
    expect(gruppen).toContain("Inlay");
    expect(gruppen).toContain("Crown");
  });
  it("die herausnehmbaren behalten ihre eigene - DA liegt der Unterschied", () => {
    const gruppen = menue("occlusal", { toothSelection: "none" }).map((o) => o.group);
    expect(gruppen).toContain("Removable");
  });
});

describe("Jede Zeile nennt ihre Art", () => {
  it("das Goldinlay heisst Goldinlay und nicht 'Gold'", () => {
    // Ein <select> vergleicht getippte Zeichen AUSSCHLIESSLICH mit dem Text der
    // OPTION, nie mit dem Label der optgroup. Hiesse die Zeile nur "gold",
    // waere das Goldinlay von der Tastatur aus nicht erreichbar - wer "gold"
    // tippt, landet immer auf der Krone.
    const e = menue("occlusal").find((o) => o.value === "inlay|gold");
    expect(e).toBeTruthy();
    expect(e!.label).toContain("Inlay");
    expect(e!.label.toLowerCase()).toContain("gold");
  });
  it("und keine zwei Zeilen heissen gleich", () => {
    // Der eigentliche Fehler in einer Liste aus 31 Zeilen: 'gold' stand
    // fuenfmal da, 'Lithium disilicate' fuenfmal.
    const texte = menue("occlusal").map((o) => o.label);
    expect(new Set(texte).size).toBe(texte.length);
  });
  it("die Zeile liest sich wie die Kurzinfo desselben Befundes", () => {
    // Beide kommen aus restorationSummaryLabel. Eine zweite Fassung derselben
    // Beschriftung waere genau die Stelle, an der sie auseinanderlaufen.
    const e = menue("occlusal").find((o) => o.value === "crown|metal-ceramic");
    expect(e!.label).toMatch(/Crown\s+–\s+Metal-ceramic/);
  });
});
