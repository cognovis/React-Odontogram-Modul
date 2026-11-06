// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-iqj: die Dentition aus dem Alter VORSCHLAGEN.
//
// Der Kern der Pruefung ist, dass nichts von selbst geschieht. Ein Preset setzt
// jeden Zahn auf den Ausgangszustand zurueck; wer ein Geburtsdatum nachtraegt,
// hat womoeglich schon befundet.

import { describe, it, expect, beforeEach } from "vitest";
import {
  ageFromDob, suggestDentition,
  DENTITION_MIXED_FROM, DENTITION_PERMANENT_FROM,
} from "../dentition";
import {
  getDentitionSuggestion, applyDentitionSuggestion,
  setPatientDob, setCaseAge, getCaseMeta, resetCaseMeta,
  __setToothStateForTest, __resetChartStateForTest, __getToothStateForTest,
} from "../odontogram";

beforeEach(() => { __resetChartStateForTest(); resetCaseMeta(); });

describe("ageFromDob", () => {
  it("zaehlt volle Jahre", () => {
    expect(ageFromDob("2018-08-21", "2026-08-21")).toBe(8);
    expect(ageFromDob("2018-08-22", "2026-08-21")).toBe(7);   // einen Tag zu frueh
  });
  it("ein Tag entscheidet, wo die Grenze liegt", () => {
    // Genau daran haengt der Vorschlag: mit sechs beginnt das Wechselgebiss.
    expect(suggestDentition(ageFromDob("2020-08-21", "2026-08-20"))).toBe("primary");
    expect(suggestDentition(ageFromDob("2020-08-21", "2026-08-21"))).toBe("mixed");
  });
  it("nimmt kein Datum aus der Zukunft und keinen Unsinn", () => {
    expect(ageFromDob("2030-01-01", "2026-08-21")).toBeNull();
    expect(ageFromDob("irgendwas", "2026-08-21")).toBeNull();
    expect(ageFromDob("2018-08-21", "auch nicht")).toBeNull();
  });
});

describe("suggestDentition", () => {
  it("die drei Stufen", () => {
    expect(suggestDentition(0)).toBe("primary");
    expect(suggestDentition(DENTITION_MIXED_FROM - 1)).toBe("primary");
    expect(suggestDentition(DENTITION_MIXED_FROM)).toBe("mixed");
    expect(suggestDentition(DENTITION_PERMANENT_FROM - 1)).toBe("mixed");
    expect(suggestDentition(DENTITION_PERMANENT_FROM)).toBe("permanent");
    expect(suggestDentition(62)).toBe("permanent");
  });
  it("ohne Alter kein Vorschlag - und NICHT 'bleibend'", () => {
    // Ein fehlendes Alter ist keine Aussage ueber das Gebiss.
    expect(suggestDentition(null)).toBeNull();
    expect(suggestDentition(undefined)).toBeNull();
    expect(suggestDentition(Number.NaN)).toBeNull();
  });
});

describe("Woher das Alter kommt", () => {
  it("aus dem Geburtsdatum, wenn es da ist", () => {
    setPatientDob("2022-01-01");
    expect(getDentitionSuggestion("2026-08-21")).toEqual({ kind: "primary", age: 4, source: "dob" });
    setPatientDob("2020-01-01");
    expect(getDentitionSuggestion("2026-08-21")).toEqual({ kind: "mixed", age: 6, source: "dob" });
  });
  it("aus dem eingetragenen Alter, wenn kein Datum da ist", () => {
    setCaseAge(4);
    expect(getDentitionSuggestion("2026-08-21")).toEqual({ kind: "primary", age: 4, source: "age" });
  });
  it("DAS DATUM GEHT VOR - es ist die genauere Angabe und altert mit", () => {
    setCaseAge(40);
    setPatientDob("2018-01-01");
    const v = getDentitionSuggestion("2026-08-21");
    expect(v?.source).toBe("dob");
    expect(v?.kind).toBe("mixed");
    // und das eingetragene Alter bleibt unangetastet - die
    // Parodontalklassifikation liest es.
    expect(getCaseMeta().age).toBe(40);
  });
  it("ohne beides kein Vorschlag", () => {
    expect(getDentitionSuggestion("2026-08-21")).toBeNull();
  });
});

describe("Nichts geschieht von selbst", () => {
  // `caries` haelt die EBENEN-ids, nicht die blossen Flaechennamen
  // ("caries-occlusal", nicht "occlusal") - anders als `fillingSurfaces`.
  it("ein Geburtsdatum zu setzen aendert KEINEN Zahn", () => {
    __setToothStateForTest(36, { caries: ["caries-occlusal"] });
    setPatientDob("2021-01-01");
    expect(__getToothStateForTest(36)?.caries).toContain("caries-occlusal");
    expect(__getToothStateForTest(36)?.toothSelection).toBe("tooth-base");
  });
  it("erst der Knopf wendet an", () => {
    __setToothStateForTest(36, { caries: ["caries-occlusal"] });
    applyDentitionSuggestion("primary");
    // 36 gehoert nicht zum Milchgebiss: nicht durchgebrochen, nicht fehlend.
    expect(__getToothStateForTest(36)?.toothSelection).toBe("not-erupted");
    // Ein Milchzahn wird unter der BLEIBENDEN Nummer gefuehrt: 75 ist der
    // Zustand von 35 mit toothSelection "milktooth". Die Milchnummern sind
    // eine Sache der Anzeige, nicht des Zustands.
    expect(__getToothStateForTest(35)?.toothSelection).toBe("milktooth");
  });
  it("'bleibend' wendet NICHTS an - das waere ein Zuruecksetzen, keine Uebernahme", () => {
    __setToothStateForTest(36, { caries: ["caries-occlusal"] });
    applyDentitionSuggestion("permanent");
    expect(__getToothStateForTest(36)?.caries).toContain("caries-occlusal");
  });
});
