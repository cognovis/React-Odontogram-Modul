// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-fu1: die Pulpapruefung neben der Pulpadiagnose.
//
// Der Grund, aus dem es die Achsen gibt, steht in EINEM Satz: `apicalDx`
// unterscheidet symptomatische von asymptomatischer apikaler Parodontitis, und
// was diese beiden trennt, IST die Perkussionsempfindlichkeit. Wir fuehrten die
// Schlussfolgerung und nirgends den Test.
import { describe, it, expect, beforeEach } from "vitest";
import {
  setSensibility, getSensibility, setPercussion, getPercussion,
  sensibilityAllowed, percussionAllowed,
  getStatusChart, __resetChartStateForTest, __setToothStateForTest,
  rootsOf, setRootFracture, getRootFracture, getRootFractureRoot,
  setRootResection, getRootResection, getRootResectionRoot,
} from "../odontogram";

beforeEach(() => { __resetChartStateForTest(); });

describe("Zwei Achsen, nicht eine", () => {
  it("ein vitaler Zahn kann perkussionsempfindlich sein", () => {
    setSensibility(16, "vital");
    setPercussion(16, "sensitive");
    expect(getSensibility(16)).toBe("vital");
    expect(getPercussion(16)).toBe("sensitive");
  });

  it("die eine Achse raeumt die andere nicht", () => {
    setSensibility(16, "no-response");
    setPercussion(16, "negative");
    setSensibility(16, "questionable");
    expect(getPercussion(16)).toBe("negative");
  });
});

describe("`none` heisst NICHT GEPRUEFT", () => {
  it("ein unberuehrter Zahn ist nicht geprueft, nicht unauffaellig", () => {
    expect(getSensibility(11)).toBe("none");
    expect(getPercussion(11)).toBe("none");
  });

  it("geprueft und nicht klopfempfindlich ist ein eigener Befund", () => {
    // Genau der, an dem die AAE symptomatische von asymptomatischer apikaler
    // Parodontitis unterscheidet - waere er nicht von "nicht geprueft" zu
    // trennen, koennte man die Diagnose nicht begruenden.
    setPercussion(16, "negative");
    expect(getPercussion(16)).toBe("negative");
    expect(getPercussion(16)).not.toBe("none");
  });

  it("wird als NICHT gesetzt serialisiert und faellt aus der Nutzlast", () => {
    setSensibility(16, "vital");
    const teeth = getStatusChart().teeth as Record<string, Record<string, unknown>>;
    expect(teeth["16"].sensibility).toBe("vital");
    expect(teeth["16"].percussion).toBeUndefined();
    expect(teeth["11"]?.sensibility).toBeUndefined();
  });
});

describe("Wo gepruft werden kann", () => {
  it("am vorhandenen natuerlichen Zahn und am Milchzahn", () => {
    expect(sensibilityAllowed({ toothSelection: "tooth-base" })).toBe(true);
    expect(sensibilityAllowed({ toothSelection: "milktooth" })).toBe(true);
  });

  it("nicht an einer Luecke und nicht am Implantat - dort ist keine Pulpa", () => {
    expect(sensibilityAllowed({ toothSelection: "none" })).toBe(false);
    expect(sensibilityAllowed({ toothSelection: "implant" })).toBe(false);
  });

  it("die Perkussion geht weiter: ein Implantat laesst sich klopfen", () => {
    // Klopfempfindlichkeit ist dort ein periimplantaeres Zeichen.
    expect(percussionAllowed({ toothSelection: "implant" })).toBe(true);
    expect(percussionAllowed({ toothSelection: "none" })).toBe(false);
  });

  it("die Sperre steht VOR dem Gate - ein Implantat nimmt keine Sensibilitaet an", () => {
    __setToothStateForTest(16, { toothSelection: "implant" });
    setSensibility(16, "vital");
    expect(getSensibility(16)).toBe("none");
    // Die Perkussion nimmt es sehr wohl an.
    setPercussion(16, "sensitive");
    expect(getPercussion(16)).toBe("sensitive");
  });

  it("`none` darf immer geschrieben werden - sonst waere ein Wert nicht mehr wegzunehmen", () => {
    setPercussion(16, "sensitive");
    __setToothStateForTest(16, { toothSelection: "none", percussion: "sensitive" });
    setPercussion(16, "none");
    expect(getPercussion(16)).toBe("none");
  });
});

describe("Ungueltiges wird nicht angenommen", () => {
  it("ein erfundener Wert aendert nichts", () => {
    setSensibility(16, "vital");
    setSensibility(16, "halbvital");
    expect(getSensibility(16)).toBe("vital");
  });
});

describe("Welche Wurzel (Beads odontogram-t6y / -ca0)", () => {
  it("benennt die Wurzeln je nach Kiefer verschieden", () => {
    expect(rootsOf(16)).toEqual(["mesiobuccal", "distobuccal", "palatal"]);
    expect(rootsOf(46)).toEqual(["mesial", "distal"]);
    expect(rootsOf(14)).toEqual(["buccal", "palatal"]);
  });

  it("ein Einwurzler hat nichts zu waehlen", () => {
    expect(rootsOf(11)).toEqual([]);
    expect(rootsOf(15)).toEqual([]);
    expect(rootsOf(44)).toEqual([]);   // untere Praemolaren sind einwurzelig
  });

  it("nimmt nur eine Wurzel an, die es an dieser Position gibt", () => {
    setRootFracture(46, "vertical", "mesial");
    expect(getRootFractureRoot(46)).toBe("mesial");
    // Palatinal gibt es im Unterkiefer nicht - und statt leer zu bleiben faellt
    // es auf die erste Wurzel zurueck: eine Fraktur sitzt in EINER Wurzel, und
    // "nicht angegeben" hiesse beim Zeichnen "Mitte", wo bei einem unteren
    // Molaren gar keine Wurzel ist.
    setRootFracture(46, "vertical", "palatal");
    expect(getRootFractureRoot(46)).toBe("mesial");
  });

  it("belegt am mehrwurzeligen Zahn vor, statt nichts zu zeichnen", () => {
    setRootFracture(36, "horizontal", "");
    expect(getRootFractureRoot(36)).toBe("mesial");
    setRootResection(37, "hemisection", "");
    expect(getRootResectionRoot(37)).toBe("mesial");
  });

  it("ein Einwurzler nimmt gar keine an", () => {
    setRootFracture(11, "horizontal", "mesial");
    expect(getRootFracture(11)).toBe("horizontal");
    expect(getRootFractureRoot(11)).toBe("");
  });

  it("die Praemolarisierung entfernt keine Wurzel, also traegt sie auch keine", () => {
    setRootResection(46, "hemisection", "distal");
    expect(getRootResectionRoot(46)).toBe("distal");
    setRootResection(46, "premolarisation", "distal");
    expect(getRootResectionRoot(46)).toBe("");
  });

  it("ein resektives Verfahren geht nur am mehrwurzeligen Zahn", () => {
    setRootResection(45, "hemisection", "");
    expect(getRootResection(45)).toBe("none");
    setRootResection(46, "hemisection", "mesial");
    expect(getRootResection(46)).toBe("hemisection");
  });

  it("die Wurzel faellt weg, wenn der Befund weggenommen wird", () => {
    setRootFracture(36, "vertical", "distal");
    setRootFracture(36, "none");
    expect(getRootFractureRoot(36)).toBe("");
  });
});
