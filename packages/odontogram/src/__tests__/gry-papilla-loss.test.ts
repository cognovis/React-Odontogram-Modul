// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-gry: der BEOBACHTETE Papillenverlust neben der ABGELEITETEN
// Cairo-Klasse. Was hier gepruefte wird, ist genau der Unterschied zwischen den
// beiden - und die Regel, unter der eine tolerant importierte Angabe zwar
// gespeichert, aber nirgends angezeigt wird, wo die Bedienung sie verweigert.

import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach } from "vitest";
import {
  papillaSites, papillaLossAllowed, setPapillaLoss, getToothPapillaLoss,
  getPerioSummary, getOdontogramSummary, getPlanChanges, setChartMode,
  getToothRecessionType, setPerioSite,
  __setToothStateForTest, __resetChartStateForTest,
  __collectExportPayloadForTest, __hydrateImportedChartsForTest,
} from "../odontogram";
import { mesialIsLeft } from "../retention";
import { buildDentalCoreBundle } from "../fhir/toFhirDentalCore";
import { parseDentalCoreBundle } from "../fhir/fromFhirDentalCore";

beforeEach(() => { __resetChartStateForTest(); setChartMode("status"); });

describe("papillaSites: die Zwischenraeume einer Position", () => {
  it("ein Zahn mitten im Bogen grenzt an zwei", () => {
    expect(papillaSites(45)).toEqual(["mesial", "distal"]);
    expect(papillaSites(23)).toEqual(["mesial", "distal"]);
  });
  it("der letzte Zahn im Bogen hat distal keinen Nachbarn", () => {
    for(const t of [18, 28, 38, 48]) expect(papillaSites(t)).toEqual(["mesial"]);
  });
  it("ueber die Mittellinie hinweg gibt es sie sehr wohl", () => {
    // 11 mesial ist die Papille zwischen 11 und 21 - die, die am haeufigsten
    // fehlt. Sie hier wegzulassen waere der teuerste Fehler der Tabelle.
    expect(papillaSites(11)).toContain("mesial");
    expect(papillaSites(41)).toContain("mesial");
  });
  it("im Milchgebiss endet der Bogen am zweiten Milchmolaren", () => {
    expect(papillaSites(55)).toEqual(["mesial"]);
    expect(papillaSites(85)).toEqual(["mesial"]);
    expect(papillaSites(54)).toEqual(["mesial", "distal"]);
  });
});

describe("setPapillaLoss", () => {
  it("setzt und liest eine Klasse", () => {
    __setToothStateForTest(11, {});
    setPapillaLoss(11, "mesial", 2);
    expect(getToothPapillaLoss(11)).toEqual({ mesial: 2 });
  });
  it("null nimmt den Eintrag zurueck - nicht Klasse 0", () => {
    __setToothStateForTest(11, {});
    setPapillaLoss(11, "mesial", 2);
    setPapillaLoss(11, "mesial", null);
    expect(getToothPapillaLoss(11)).toEqual({});
  });
  it("eine Stelle, die es an diesem Zahn nicht gibt, ist Leerlauf", () => {
    __setToothStateForTest(18, {});
    setPapillaLoss(18, "distal", 2);   // 18 hat distal keinen Nachbarn
    expect(getToothPapillaLoss(18)).toEqual({});
  });
  it("Klasse 0 und 4 sind Leerlauf, nicht gespeichert", () => {
    __setToothStateForTest(11, {});
    setPapillaLoss(11, "mesial", 0);
    setPapillaLoss(11, "mesial", 4);
    setPapillaLoss(11, "mesial", 1.5);
    expect(getToothPapillaLoss(11)).toEqual({});
  });
});

describe("Wo eine Papille zu beurteilen ist", () => {
  it("am vorhandenen Zahn ja", () => {
    __setToothStateForTest(11, {});
    expect(papillaLossAllowed(11)).toBe(true);
  });
  it("AM IMPLANTAT AUCH - dort ist ihr Verlust die haeufigste Beschwerde", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    expect(papillaLossAllowed(11)).toBe(true);
    setPapillaLoss(11, "mesial", 3);
    expect(getToothPapillaLoss(11)).toEqual({ mesial: 3 });
  });
  it("an einer Luecke nicht", () => {
    __setToothStateForTest(11, { toothSelection: "none" });
    expect(papillaLossAllowed(11)).toBe(false);
    setPapillaLoss(11, "mesial", 2);
    expect(getToothPapillaLoss(11)).toEqual({});
  });
  it("am nicht durchgebrochenen und am frisch extrahierten Platz nicht", () => {
    __setToothStateForTest(12, { toothSelection: "not-erupted" });
    __setToothStateForTest(13, { toothSelection: "no-tooth-after-extraction" });
    expect(papillaLossAllowed(12)).toBe(false);
    expect(papillaLossAllowed(13)).toBe(false);
  });
});

describe("Der beobachtete Befund neben dem abgeleiteten", () => {
  it("steht ohne eine einzige sondierte Stelle da - genau das ist sein Zweck", () => {
    __setToothStateForTest(11, {});
    setPapillaLoss(11, "mesial", 2);
    // Cairo braucht sechs Stellen und hat sie nicht.
    expect(getToothRecessionType(11)).toBe("none");
    expect(getToothPapillaLoss(11)).toEqual({ mesial: 2 });
  });
  it("und ueberschreibt den abgeleiteten nicht, wenn beide da sind", () => {
    __setToothStateForTest(11, {});
    setPerioSite(11, "B", { pd: 3, gm: 2 });
    setPerioSite(11, "MB", { pd: 3, gm: 0 });
    setPerioSite(11, "DB", { pd: 3, gm: 0 });
    const abgeleitet = getToothRecessionType(11);
    setPapillaLoss(11, "mesial", 3);
    expect(getToothRecessionType(11)).toBe(abgeleitet);
  });
});

describe("Nutzlast", () => {
  it("wird weggelassen, wo nichts beurteilt ist", () => {
    __setToothStateForTest(11, {});
    const p = __collectExportPayloadForTest() as Record<string, never>;
    expect((p.teeth as Record<string, Record<string, unknown>>)["11"]?.papillaLoss).toBeUndefined();
  });
  it("faehrt bei 2.30 hin und zurueck", () => {
    __setToothStateForTest(11, {});
    setPapillaLoss(11, "mesial", 2);
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect(p.version).toBe(PAYLOAD_VERSION);
    expect((p.teeth as Record<string, Record<string, unknown>>)["11"].papillaLoss).toEqual({ mesial: 2 });
    __resetChartStateForTest();
    __hydrateImportedChartsForTest(p);
    expect(getToothPapillaLoss(11)).toEqual({ mesial: 2 });
  });
  it("nimmt eine fremde Stelle und eine fremde Klasse nicht an", () => {
    __hydrateImportedChartsForTest({
      version: "2.30",
      teeth: { "11": { papillaLoss: { buccal: 2, mesial: 7, distal: 1 } } },
    });
    expect(getToothPapillaLoss(11)).toEqual({ distal: 1 });
  });
});

describe("Zusammenfassung", () => {
  it("zaehlt je Zahn UND SEITE, nicht je Zwischenraum", () => {
    // 45 distal und 46 mesial sind DERSELBE Zwischenraum. Zusammenzufassen
    // hiesse zu entscheiden, welche der beiden Beobachtungen gilt.
    __setToothStateForTest(45, {});
    __setToothStateForTest(46, {});
    setPapillaLoss(45, "distal", 1);
    setPapillaLoss(46, "mesial", 3);
    const s = getPerioSummary();
    expect(s.gradedPapillae).toBe(2);
    expect(s.maxPapillaLoss).toBe(3);
  });
  it("erscheint im parodontalen Text", () => {
    __setToothStateForTest(46, {});
    setPapillaLoss(46, "mesial", 2);
    const text = getOdontogramSummary().periodontalText;
    expect(text).toContain("Papilla loss");
  });
  it("zeigt NICHT, was die Bedienung verweigert", () => {
    // Tolerant importiert: eine distale Papille am letzten Zahn. Gespeichert,
    // aber nirgends angezeigt - dieselbe Regel wie bei der Retention.
    __hydrateImportedChartsForTest({
      version: "2.30",
      teeth: { "18": { papillaLoss: { distal: 3 } } },
    });
    expect(getToothPapillaLoss(18)).toEqual({ distal: 3 });
    expect(getOdontogramSummary().periodontalText).not.toContain("Papilla loss");
  });
});

describe("Was der Plan aendert", () => {
  it("nennt den Papillenverlust als EINE Zeile je Zahn", () => {
    __setToothStateForTest(46, {});
    setChartMode("plan");
    setPapillaLoss(46, "mesial", 2);
    setPapillaLoss(46, "distal", 3);
    const changes = getPlanChanges().filter((c) => c.axis === "papillaLoss");
    expect(changes).toHaveLength(1);
    expect(changes[0].toothNo).toBe(46);
  });
});

describe("FHIR", () => {
  it("roundtrips populated papilla loss through its recorded source carrier", () => {
    __setToothStateForTest(46, {});
    setPapillaLoss(46, "mesial", 2);
    const bundle = buildDentalCoreBundle(
      __collectExportPayloadForTest() as never,
      { effectiveDateTime: "2026-08-14" },
    );
    expect(parseDentalCoreBundle(bundle).teeth["46"]?.papillaLoss).toEqual({ mesial: 2 });
  });
  it("does not emit papilla loss when none was assessed", () => {
    __setToothStateForTest(46, {});
    const bundle = buildDentalCoreBundle(
      __collectExportPayloadForTest() as never,
      { effectiveDateTime: "2026-08-14" },
    );
    expect(JSON.stringify(bundle)).not.toContain("papilla-loss-nordland-tarnow");
  });
});

describe("mesialIsLeft kennt jetzt auch die Milchquadranten", () => {
  it("6 steht oben links wie 2, 7 unten links wie 3", () => {
    expect(mesialIsLeft(63)).toBe(true);
    expect(mesialIsLeft(73)).toBe(true);
    expect(mesialIsLeft(53)).toBe(false);
    expect(mesialIsLeft(83)).toBe(false);
  });
});
