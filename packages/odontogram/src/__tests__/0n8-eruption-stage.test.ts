// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-0n8: der Zahndurchbruch in Stufen statt als Schalter.
//
// Was hier festgehalten wird, ist vor allem die GRENZE: `not-erupted` heisst,
// dass gar nichts zu sehen ist, `eruptionStage` stuft ab, was zu sehen IST. Die
// beiden ueberschneiden sich nicht, und genau das ist die Bedingung, unter der
// zwei Werte fuer eine Frage nicht auseinanderlaufen.

import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach } from "vitest";
import {
  eruptionAllowed, setEruptionStage, getEruptionStage, getPlanChanges, setChartMode,
  __setToothStateForTest, __resetChartStateForTest,
  __collectExportPayloadForTest, __hydrateImportedChartsForTest,
} from "../odontogram";
import { parseShorthand, SHORTHAND_PENDING, shouldCommit } from "../shorthand";

beforeEach(() => { __resetChartStateForTest(); setChartMode("status"); });

describe("Die Leiter", () => {
  it("setzt und liest eine Stufe am vorhandenen Zahn", () => {
    __setToothStateForTest(14, {});
    setEruptionStage(14, "half-crown");
    expect(getEruptionStage(14)).toBe("half-crown");
  });
  it("kennt drei Stufen und den Regelfall", () => {
    __setToothStateForTest(14, {});
    for(const stufe of ["emerging", "half-crown", "full-crown", "none"]){
      setEruptionStage(14, stufe);
      expect(getEruptionStage(14)).toBe(stufe);
    }
  });
  it("nimmt keinen erfundenen Wert an", () => {
    __setToothStateForTest(14, {});
    setEruptionStage(14, "halb");
    expect(getEruptionStage(14)).toBe("none");
  });
});

describe("Die Grenze zu not-erupted", () => {
  it("am NICHT durchgebrochenen Zahn gibt es nichts abzustufen", () => {
    // Jenes heisst: gar nichts zu sehen. Dieses stuft ab, was zu sehen ist.
    __setToothStateForTest(14, { toothSelection: "not-erupted" });
    expect(eruptionAllowed({ toothSelection: "not-erupted" })).toBe(false);
    setEruptionStage(14, "emerging");
    expect(getEruptionStage(14)).toBe("none");
  });
  it("am MILCHZAHN sehr wohl - das Wechselgebiss ist der Anlass", () => {
    __setToothStateForTest(63, { toothSelection: "milktooth" });
    expect(eruptionAllowed({ toothSelection: "milktooth" })).toBe(true);
    setEruptionStage(63, "half-crown");
    expect(getEruptionStage(63)).toBe("half-crown");
  });
  it("nicht an der Luecke, nicht am Implantat", () => {
    // Ein Fabrikteil bricht nicht durch.
    __setToothStateForTest(14, { toothSelection: "implant" });
    __setToothStateForTest(15, { toothSelection: "none" });
    setEruptionStage(14, "emerging");
    setEruptionStage(15, "emerging");
    expect(getEruptionStage(14)).toBe("none");
    expect(getEruptionStage(15)).toBe("none");
  });
  it("auf none zuruecksetzen geht ueberall - sonst bliebe eine Stufe stehen", () => {
    __setToothStateForTest(14, {});
    setEruptionStage(14, "emerging");
    __setToothStateForTest(14, { toothSelection: "implant", eruptionStage: "emerging" });
    setEruptionStage(14, "none");
    expect(getEruptionStage(14)).toBe("none");
  });
});

describe("Nutzlast", () => {
  it("weggelassen, solange nichts abgestuft ist", () => {
    __setToothStateForTest(14, {});
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect((p.teeth as Record<string, Record<string, unknown>>)["14"].eruptionStage).toBeUndefined();
  });
  it("faehrt bei 2.30 hin und zurueck", () => {
    __setToothStateForTest(14, {});
    setEruptionStage(14, "half-crown");
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect(p.version).toBe(PAYLOAD_VERSION);
    expect((p.teeth as Record<string, Record<string, unknown>>)["14"].eruptionStage).toBe("half-crown");
    __resetChartStateForTest();
    __hydrateImportedChartsForTest(p);
    expect(getEruptionStage(14)).toBe("half-crown");
  });
  it("ein fremder Wert faellt beim Import auf none zurueck", () => {
    __hydrateImportedChartsForTest({
      version: "2.30", teeth: { "14": { eruptionStage: "fast-fertig" } },
    });
    expect(getEruptionStage(14)).toBe("none");
  });
});

describe("Was der Plan aendert", () => {
  it("ist eine EIGENE Zeile, nicht an die Anwesenheit gehaengt", () => {
    // Ein Plan, der einen Zahn durchbrechen laesst, aendert nicht seine
    // Anwesenheit - er war schon da.
    __setToothStateForTest(14, {});
    setChartMode("plan");
    setEruptionStage(14, "full-crown");
    const changes = getPlanChanges();
    expect(changes.filter((c) => c.axis === "eruptionStage")).toHaveLength(1);
    expect(changes.filter((c) => c.axis === "presence")).toHaveLength(0);
  });
});

describe("Das Kuerzel D hat jetzt ein Ziel", () => {
  it("D1/D2/D3 schreiben die drei Stufen", () => {
    expect(parseShorthand("D1").edits).toEqual([
      { kind: "axis", field: "eruptionStage", value: "emerging" }]);
    expect(parseShorthand("D2").edits).toEqual([
      { kind: "axis", field: "eruptionStage", value: "half-crown" }]);
    expect(parseShorthand("D3").edits).toEqual([
      { kind: "axis", field: "eruptionStage", value: "full-crown" }]);
  });
  it("ein blankes D wartet auf seine Ziffer und steht auf keiner Warteliste mehr", () => {
    expect(shouldCommit("D")).toBe(false);
    expect(parseShorthand("D").pending).toEqual([]);
    expect("D" in SHORTHAND_PENDING).toBe(false);
  });
  it("und d bleibt distal", () => {
    expect(parseShorthand("A d").edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["distal"], material: "amalgam" }]);
  });
});
