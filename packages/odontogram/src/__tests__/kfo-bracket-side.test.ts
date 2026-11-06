// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead KFO: Brackets sitzen buccal oder lingual (Lingualtechnik), also ein
// Schalter. Etappe 1 legt den Zustand; die Grafik folgt.
//
// Festgehalten:
//   1. Standard buccal, buccal | lingual gueltig, sonst nichts.
//   2. Der Waechter steht VOR dem DS-1-Gate und braucht ein Bracket: eine
//      Seite an einem Zahn ohne Bracket wird nicht beschreibbar.
//   3. buccal ist der Leerwert - ein Standardzahn stolpert den
//      Dental-Core-Export nicht (wie sensibility "none").
import { describe, it, expect, beforeEach } from "vitest";
import {
  setOrthoBracketSide, getOrthoBracketSide, orthoBracketSideAllowed,
  __setToothStateForTest, __getToothStateForTest, VALID_ORTHO_BRACKET_SIDE,
} from "../odontogram";

beforeEach(() => {
  __setToothStateForTest(11, { toothSelection: "tooth-base" });
});

describe("der Bracket-Seiten-Schalter", () => {
  it("Standard ist buccal, und der Wertebereich ist buccal|lingual", () => {
    expect(getOrthoBracketSide(11)).toBe("buccal");
    expect([...VALID_ORTHO_BRACKET_SIDE].sort()).toEqual(["buccal", "lingual"]);
  });

  it("laesst sich auf lingual setzen, wenn ein Bracket sitzt", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoAppliance: "bracket" });
    setOrthoBracketSide(11, "lingual");
    expect(getOrthoBracketSide(11)).toBe("lingual");
  });

  it("ein ungueltiger Wert bewirkt nichts", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoAppliance: "bracket" });
    setOrthoBracketSide(11, "distal");
    expect(getOrthoBracketSide(11)).toBe("buccal");
  });

  it("ohne Bracket ist lingual nicht beschreibbar (Waechter vor dem Gate)", () => {
    // Zahn mit Band, kein Bracket -> die Seite bleibt buccal.
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoAppliance: "band" });
    expect(orthoBracketSideAllowed(__getToothStateForTest(11)!)).toBe(false);
    setOrthoBracketSide(11, "lingual");
    expect(getOrthoBracketSide(11)).toBe("buccal");
  });

  it("an einem fehlenden Zahn gar nicht", () => {
    __setToothStateForTest(11, { toothSelection: "none" });
    setOrthoBracketSide(11, "lingual");
    expect(getOrthoBracketSide(11)).toBe("buccal");
  });

  it("buccal auf buccal zuruecksetzen ist erlaubt und bleibt buccal", () => {
    __setToothStateForTest(11, { toothSelection: "tooth-base", orthoAppliance: "bracket" });
    setOrthoBracketSide(11, "lingual");
    setOrthoBracketSide(11, "buccal");
    expect(getOrthoBracketSide(11)).toBe("buccal");
  });
});
