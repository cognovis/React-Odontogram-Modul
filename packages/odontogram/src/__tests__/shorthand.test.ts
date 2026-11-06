// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-t8y: die Abbildung Kuerzel -> Achse, geprueft ohne Browser.
//
// Was hier festgehalten wird, ist nicht die Umsetzung, sondern die ABLESUNG
// von charlys Tastenfeld: dass `d` distal heisst und `D` etwas ganz anderes,
// dass `Twf` nicht als `T`+`wf` zerfaellt, und dass das Material VOR dem
// Befund steht. Bricht einer dieser Tests, ist die Kurzschrift falsch
// abgebildet - nicht der Kode unschoen.
import { describe, it, expect } from "vitest";
import {
  parseShorthand, tokenizeShorthand, SHORTHAND_DE, SHORTHAND_PENDING,
  nextChartTooth, CHARTING_ORDER, ARCH_ROWS, shouldCommit, dentureValueFor,
  teethBetween, isCompleteShorthand, loneSeverity } from "../shorthand";

describe("Zerlegung: laengste Uebereinstimmung, Gross- und Kleinschreibung", () => {
  it("liest Twf als EIN Kuerzel, nicht als T und wf", () => {
    expect(tokenizeShorthand("Twf")).toEqual(["Twf"]);
  });

  it("unterscheidet t (Teleskop) von TK (Teilkrone)", () => {
    expect(tokenizeShorthand("t")).toEqual(["t"]);
    expect(tokenizeShorthand("TK")).toEqual(["TK"]);
  });

  it("unterscheidet d (distal) von D (Durchbruch)", () => {
    const klein = parseShorthand("A d");
    expect(klein.edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["distal"], material: "amalgam" },
    ]);
    // Seit odontogram-0n8 traegt D seine Stufe als Ziffer, wie K3 die
    // Kariesstufe. Ein blankes D ist damit kein Schluessel mehr - es ist der
    // Anfang von dreien und wartet auf die Ziffer.
    const gross = parseShorthand("D");
    expect(gross.edits).toEqual([]);
    expect(gross.pending).toEqual([]);
    expect(shouldCommit("D")).toBe(false);
    expect(parseShorthand("D2").edits).toEqual([
      { kind: "axis", field: "eruptionStage", value: "half-crown" }]);
  });

  it("liest o.B. nicht als okklusale Flaeche", () => {
    expect(tokenizeShorthand("o.B.")).toEqual(["o.B."]);
    expect(parseShorthand("o.B.").edits).toEqual([{ kind: "reset" }]);
  });

  it("kommt ohne Trennzeichen aus und vertraegt welche", () => {
    expect(tokenizeShorthand("A mod")).toEqual(["A", "m", "o", "d"]);
    expect(tokenizeShorthand("Amod")).toEqual(["A", "m", "o", "d"]);
  });

  it("die Beschriftungen des Tastenfelds sind KEINE Tasten", () => {
    // Am waere sonst nicht von A + m (mesial) zu unterscheiden, und die
    // mesiale Flaeche verschwaende. Ein Tastaturtest hat das gefunden.
    expect(tokenizeShorthand("Am")).toEqual(["A", "m"]);
    expect(parseShorthand("Amod").edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["mesial", "occlusal", "distal"], material: "amalgam" },
    ]);
  });
});

describe("Das Material steht VOR dem Befund und bleibt stehen", () => {
  it("Dirks Beispiel: G, dann k - die Krone ist aus Gold", () => {
    const r = parseShorthand("G k");
    expect(r.material).toBe("G");
    expect(r.edits).toEqual([
      { kind: "axis", field: "restorationType", value: "crown" },
      { kind: "axis", field: "restorationMaterial", value: "gold" },
    ]);
  });

  it("gibt den Modus zurueck, damit der Aufrufer ihn weitertraegt", () => {
    const erst = parseShorthand("A");
    expect(erst.edits).toEqual([]);
    const dann = parseShorthand("mod", { material: erst.material });
    expect(dann.edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["mesial", "occlusal", "distal"], material: "amalgam" },
    ]);
  });

  it("eine blosse Flaechenkette IST eine Fuellung", () => {
    const r = parseShorthand("K mo");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["mesial", "occlusal"], material: "composite" },
    ]);
  });

  it("Gold auf Flaechen ist KEINE Fuellung, sondern ein Inlay — samt Flaechen", () => {
    // charly sagt dasselbe, ohne es auszusprechen: seine eigene Planungstabelle
    // schreibt "Fuellung n-flaechig Gold / Teilkrone". Die FLAECHEN werden als
    // inlayCoverage mitgeschrieben (Kostenplan, Dirk 31.08.2026).
    const r = parseShorthand("G od");
    expect(r.edits).toEqual([
      { kind: "axis", field: "restorationMaterial", value: "gold" },
      { kind: "surfaces", target: "restoration-coverage", surfaces: ["occlusal", "distal"] },
    ]);
  });

  it("Flaechen ohne gewaehltes Material sind Karies - charlys C-Zustand", () => {
    // charlys Modusblock hat immer eine Taste an: C (Karies) oder ein Material.
    // Ohne Material ist das C; der Karies-Schalter im Tastenfeld zeigt es an.
    const r = parseShorthand("mod");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["mesial", "occlusal", "distal"], severity: null },
    ]);
    expect(r.unknown).toEqual([]);
  });
});

describe("Karies", () => {
  it("c oeffnet den Lauf, die Stufe schliesst ihn", () => {
    const r = parseShorthand("c mod K3");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["mesial", "occlusal", "distal"], severity: 4 },
    ]);
  });

  it("eine Stufe allein bedeutet Karies, auch ohne c", () => {
    // Auf dem Tastenfeld ist K1..K5 nur ueber den Kariesschalter erreichbar.
    const r = parseShorthand("o K5");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["occlusal"], severity: 6 },
    ]);
  });

  it("Karies ohne Stufe ist zulaessig - die Stufe ist ein Zusatz", () => {
    const r = parseShorthand("c v");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["buccal"], severity: null },
    ]);
  });

  it("c schlaegt das gesetzte Material - Karies ist keine Fuellung", () => {
    const r = parseShorthand("A c o");
    expect(r.edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["occlusal"], severity: null },
    ]);
    expect(r.material).toBe("Am");
  });
});

describe("Die Materialtasten sind Einzelbuchstaben", () => {
  it("A K G E schalten Amalgam, Kunststoff, Gold, Keramik", () => {
    expect(parseShorthand("A").material).toBe("Am");
    expect(parseShorthand("K").material).toBe("Kst");
    expect(parseShorthand("G").material).toBe("G");
    expect(parseShorthand("E").material).toBe("Ker");
  });

  it("A und G wirken sofort, weil keine laengere Taste mit ihnen anfaengt", () => {
    expect(shouldCommit("A")).toBe(true);
    expect(shouldCommit("G")).toBe(true);
    expect(shouldCommit("E")).toBe(true);
    expect(shouldCommit("K")).toBe(false);   // K1..K5 fangen mit K an
  });

  it("K3 bleibt die Kariesstufe, nicht Kunststoff plus 3", () => {
    expect(tokenizeShorthand("K3")).toEqual(["K3"]);
    expect(parseShorthand("c o K3").edits).toEqual([
      { kind: "surfaces", target: "caries", surfaces: ["occlusal"], severity: 4 },
    ]);
  });

  it("K ist Kunststoff, k ist die Krone", () => {
    expect(parseShorthand("K").edits).toEqual([]);
    expect(parseShorthand("k").edits).toEqual([{ kind: "axis", field: "restorationType", value: "crown" }]);
  });

  it("eine Taste hat zwei Lesarten: Fuellung und Restauration", () => {
    // Kunststoff auf Flaechen ist eine Composite-Fuellung...
    expect(parseShorthand("K mo").edits).toEqual([
      { kind: "surfaces", target: "filling", surfaces: ["mesial", "occlusal"], material: "composite" },
    ]);
    // ...derselbe Tastendruck an einer Krone ist Gradia.
    expect(parseShorthand("K k").edits).toEqual([
      { kind: "axis", field: "restorationType", value: "crown" },
      { kind: "axis", field: "restorationMaterial", value: "gradia" },
    ]);
  });
});

describe("Brueckenglied und Prothesenzahn sind zwei verschiedene Achsen", () => {
  it("b ist die Bruecke, e der Prothesenzahn", () => {
    expect(parseShorthand("b").edits).toEqual([
      { kind: "axis", field: "toothSelection", value: "none" },
      { kind: "axis", field: "restorationType", value: "bridge" },
    ]);
    expect(parseShorthand("e").edits).toEqual([{ kind: "denture" }]);
  });

  it("e nennt den Befund, nicht seinen Umfang", () => {
    // Ob Teil- oder Totalprothese steht nicht im Tastendruck, sondern in der
    // Zahl der markierten Zaehne. Der Parser sieht die Auswahl nicht.
    for(const eingabe of ["e", "K e", "G e", "E e", "A e"]){
      expect(parseShorthand(eingabe).edits, eingabe).toEqual([{ kind: "denture" }]);
    }
  });

  it("der Materialmodus bleibt stehen, auch wenn e ihn nicht braucht", () => {
    const r = parseShorthand("K e");
    expect(r.material).toBe("Kst");
  });
});

describe("Ganzer Zahn", () => {
  it("bildet die Kuerzel ab, die Dirk selbst genannt hat", () => {
    expect(parseShorthand("k").edits).toEqual([{ kind: "axis", field: "restorationType", value: "crown" }]);
    expect(parseShorthand("x").edits).toEqual([{ kind: "axis", field: "extractionPlan", value: true }]);
    expect(parseShorthand("o.B.").edits).toEqual([{ kind: "reset" }]);
  });

  it("t nennt sein eigenes Material und laesst sich vom Modus nicht ueberschreiben", () => {
    expect(parseShorthand("G t").edits).toEqual([
      { kind: "axis", field: "restorationType", value: "crown" },
      { kind: "axis", field: "restorationMaterial", value: "telescope" },
    ]);
  });

  it("ein Material ohne Restaurations-Lesart erfindet keines", () => {
    expect(parseShorthand("A k").edits).toEqual([
      { kind: "axis", field: "restorationType", value: "crown" },
    ]);
  });

  it("ONL und charlys TK meinen dasselbe Onlay", () => {
    expect(parseShorthand("ONL").edits).toEqual(parseShorthand("TK").edits);
  });

  it("Zys qualifiziert die apikale Diagnose, statt allein zu stehen", () => {
    expect(parseShorthand("Zys").edits).toEqual([
      { kind: "axis", field: "apicalDx", value: "asymptomatic-apical-periodontitis" },
      { kind: "axis", field: "periapicalType", value: "cyst" },
    ]);
  });

  it("WR ist der Wurzelrest, R die noch heimatlose Wurzelkappe", () => {
    expect(parseShorthand("WR").edits).toEqual([{ kind: "axis", field: "toothSubstrate", value: "radix" }]);
    expect(parseShorthand("R").pending).toEqual([{ token: "R", bead: "" }]);
  });

  it("die Endo-Kuerzel treffen die richtigen Werte", () => {
    expect(parseShorthand("wf").edits).toEqual([{ kind: "axis", field: "endo", value: "endo-filling" }]);
    expect(parseShorthand("WFi").edits).toEqual([{ kind: "axis", field: "endo", value: "endo-filling-incomplete" }]);
    expect(parseShorthand("Twf").edits).toEqual([{ kind: "axis", field: "endo", value: "endo-medical-filling" }]);
    expect(parseShorthand("Sti").edits).toEqual([{ kind: "axis", field: "rootPostType", value: "metal" }]);
    expect(parseShorthand("Res").edits).toEqual([{ kind: "axis", field: "endoResection", value: true }]);
  });
});

describe("Was wir verstehen, aber nicht ablegen koennen", () => {
  it("die Vitalitaetspruefung hat seit odontogram-fu1 ein Ziel", () => {
    // Bis zum 20.08.2026 standen diese vier auf der Warteliste. Der Test
    // bleibt stehen und prueft jetzt das Gegenteil: dass sie ankommen.
    expect(parseShorthand("+").edits).toEqual([
      { kind: "axis", field: "sensibility", value: "vital" }]);
    expect(parseShorthand("-").edits).toEqual([
      { kind: "axis", field: "sensibility", value: "no-response" }]);
    expect(parseShorthand("?").edits).toEqual([
      { kind: "axis", field: "sensibility", value: "questionable" }]);
    expect(parseShorthand("p").edits).toEqual([
      { kind: "axis", field: "percussion", value: "sensitive" }]);
    expect(parseShorthand("+ - ? p").pending).toEqual([]);
  });

  it("ein vitaler Zahn kann perkussionsempfindlich sein - zwei Achsen", () => {
    expect(parseShorthand("+p").edits).toEqual([
      { kind: "axis", field: "sensibility", value: "vital" },
      { kind: "axis", field: "percussion", value: "sensitive" },
    ]);
  });

  it("die Liste der offenen Tasten ist leer, bis auf die zwei ohne Bead", () => {
    // Fra und Hem haben seit odontogram-t6y/-ca0 ein Ziel, D seit
    // odontogram-0n8. Uebrig bleiben z (zervikale Flaeche - unser Flaechensatz
    // hat sie nicht) und R (Wurzelkappe - Dirk fragt selbst, ob es die noch
    // gibt); beide tragen deshalb KEINEN Bead.
    expect(Object.keys(SHORTHAND_PENDING).sort()).toEqual(["R", "z"]);
    for(const bead of Object.values(SHORTHAND_PENDING)) expect(bead).toBe("");
  });

  it("Fra ist die WURZELfraktur, nicht die der Krone", () => {
    expect(parseShorthand("Fra").edits).toEqual([
      { kind: "axis", field: "rootFracture", value: "vertical" }]);
    expect(parseShorthand("Hem").edits).toEqual([
      { kind: "axis", field: "rootResection", value: "hemisection" }]);
    expect(parseShorthand("Fra Hem").pending).toEqual([]);
  });

  it("trennt einen Tippfehler von einer offenen Taste", () => {
    const r = parseShorthand("qq");
    expect(r.unknown).toEqual(["q", "q"]);
    expect(r.pending).toEqual([]);
  });

  it("z hat keine Flaeche bei uns und wird nicht heimlich zu buccal", () => {
    const r = parseShorthand("A z");
    expect(r.edits).toEqual([]);
    expect(r.pending.map(p => p.token)).toEqual(["z"]);
  });
});

describe("Die Tabelle selbst", () => {
  it("hat keine Taste doppelt in beiden Tabellen", () => {
    const doppelt = Object.keys(SHORTHAND_DE).filter(k => k in SHORTHAND_PENDING);
    expect(doppelt).toEqual([]);
  });

  it("schreibt jede Achsen-Taste auf ein Feld, das defaultState kennt", async () => {
    // Ein Kuerzel, das auf ein Feld zeigt, das es nicht gibt, faellt sonst erst
    // beim ersten Tastendruck auf.
    const felder = new Set<string>();
    for(const e of Object.values(SHORTHAND_DE)){
      if(e.kind === "axis") felder.add(e.field);
      if(e.kind === "axes") for(const x of e.edits) felder.add(x.field);
    }
    const bekannt = new Set([
      "toothSelection", "toothSubstrate", "restorationType", "restorationMaterial",
      "endo", "rootPostType", "endoResection", "apicalDx", "periapicalType",
      "extractionPlan", "missingClosed", "prosthesis",
      "sensibility", "percussion", "rootFracture", "rootResection",
      "eruptionStage", "calculus",
    ]);
    for(const f of felder) expect(bekannt.has(f), `unbekanntes Feld: ${f}`).toBe(true);
  });
});

describe("Der Gang durch das Gebiss: Tabulator vor, Shift-Tabulator zurueck", () => {
  it("faengt bei 18 an", () => {
    expect(CHARTING_ORDER[0]).toBe(18);
    expect(nextChartTooth(null)).toBe(18);
  });

  it("laeuft den Bogen entlang, wie er dasteht", () => {
    expect(nextChartTooth(18)).toBe(17);
    expect(nextChartTooth(11)).toBe(21);   // ueber die Mitte
    expect(nextChartTooth(28)).toBe(38);   // um den Mund herum, nicht zeilenweise
    expect(nextChartTooth(31)).toBe(41);
  });

  it("Shift-Tabulator geht denselben Weg zurueck", () => {
    expect(nextChartTooth(17, -1)).toBe(18);
    expect(nextChartTooth(21, -1)).toBe(11);
    expect(nextChartTooth(38, -1)).toBe(28);
  });

  it("laeuft um: hinter 38 kommt wieder 18", () => {
    // Ein Rundgang durch den Mund ist ein Rundgang. Am letzten Zahn
    // stehenzubleiben hiesse, zur Maus zu greifen, um von vorn anzufangen.
    expect(nextChartTooth(48)).toBe(18);
    expect(nextChartTooth(18, -1)).toBe(48);
  });

  it("ueberspringt, was nicht da ist - etwa ausgeblendete Weisheitszaehne", () => {
    const ohneWeisheit = (n: number) => ![18, 28, 38, 48].includes(n);
    expect(nextChartTooth(null, 1, ohneWeisheit)).toBe(17);
    expect(nextChartTooth(27, 1, ohneWeisheit)).toBe(37);
    expect(nextChartTooth(47, 1, ohneWeisheit)).toBe(17);
  });

  it("gibt null zurueck, wenn gar nichts da ist", () => {
    expect(nextChartTooth(18, 1, () => false)).toBe(null);
  });

  it("k dann Tabulator dann b: Krone und Brueckenglied am Nachbarn", () => {
    // Dirks Ausnahme k-b, als Gebaerde: zwei Tastenfolgen, ein Sprung.
    const zahn = 16;
    expect(parseShorthand("G k").edits).toContainEqual(
      { kind: "axis", field: "restorationType", value: "crown" });
    const nachbar = nextChartTooth(zahn);
    expect(nachbar).toBe(15);
    expect(parseShorthand("b").edits).toContainEqual(
      { kind: "axis", field: "restorationType", value: "bridge" });
  });

  it("geht um den Mund, nicht der Anzeige nach", () => {
    // Die untere Zeile wird von 48 nach 38 GEZEICHNET, aber von 38 nach 48
    // BEGANGEN. Die beiden Reihenfolgen sind absichtlich verschieden.
    expect(ARCH_ROWS[1][0]).toBe(48);
    expect(CHARTING_ORDER[16]).toBe(38);
    expect(CHARTING_ORDER[CHARTING_ORDER.length - 1]).toBe(48);
  });

  it("traegt genau die 32 Zaehne, und jeden einmal", () => {
    expect(CHARTING_ORDER.length).toBe(32);
    expect(new Set(CHARTING_ORDER).size).toBe(32);
    expect(ARCH_ROWS.length).toBe(2);
  });
});

describe("Teil- oder Totalprothese entscheidet die Auswahl", () => {
  const OK = ARCH_ROWS[0];
  const UK = ARCH_ROWS[1];

  it("ein ganzer Kiefer markiert ist eine Totalprothese", () => {
    expect(dentureValueFor(11, OK)).toBe("removable-full");
    expect(dentureValueFor(46, UK)).toBe("removable-full");
  });

  it("Dirks Fall: beide Kiefer markiert, e - beides total", () => {
    const alle = [...OK, ...UK];
    expect(dentureValueFor(18, alle)).toBe("removable-full");
    expect(dentureValueFor(38, alle)).toBe("removable-full");
  });

  it("ein Zahn weniger ist eine Teilprothese", () => {
    expect(dentureValueFor(11, OK.filter(t => t !== 13))).toBe("removable-partial");
  });

  it("der Gegenkiefer zaehlt nicht mit", () => {
    // Nur der Oberkiefer ist markiert - der Unterkiefer bleibt unberuehrt.
    expect(dentureValueFor(11, OK)).toBe("removable-full");
    expect(dentureValueFor(46, OK)).toBe("removable-partial");
  });

  it("ausgeblendete Weisheitszaehne verhindern die Totalprothese nicht", () => {
    const ohneWeisheit = (n: number) => ![18, 28, 38, 48].includes(n);
    const sichtbarOK = OK.filter(ohneWeisheit);
    expect(dentureValueFor(11, sichtbarOK, ohneWeisheit)).toBe("removable-full");
    expect(dentureValueFor(11, sichtbarOK)).toBe("removable-partial");
  });
});

describe("Wann ein Tastendruck sofort wirkt", () => {
  it("k wirkt sofort - sechs Frontzaehne markiert, ein Druck, fertig", () => {
    expect(shouldCommit("k")).toBe(true);
    expect(shouldCommit("e")).toBe(true);
    expect(shouldCommit("x")).toBe(true);
    expect(shouldCommit("b")).toBe(true);
  });

  it("nur K wartet - K1 bis K5 fangen mit ihm an", () => {
    expect(shouldCommit("K")).toBe(false);
    expect(shouldCommit("Kk")).toBe(true);
  });

  it("c wartet - Karies ohne Flaechen ist nichts; die Flaeche danach wirkt", () => {
    expect(shouldCommit("c")).toBe(false);
    expect(shouldCommit("c m")).toBe(true);
    // Eine Stufe HINTER den Flaechen (Dirks "mod K3") wartet - sie stuft die
    // eben eingetragenen Flaechen ein; das macht der Tasten-Handler.
    expect(shouldCommit("c mod K3")).toBe(false);
  });

  it("eine Flaeche wirkt sofort (Dirk, 25.09.2026: 'm o d und nichts erscheint')", () => {
    expect(shouldCommit("m")).toBe(true);
    expect(shouldCommit("A m")).toBe(true);
    expect(shouldCommit("A mod")).toBe(true);
    // o koennte noch o.B. werden - es wartet, ist aber schon vollstaendig und
    // wird nach einer kurzen Pause eingetragen.
    expect(shouldCommit("o")).toBe(false);
    expect(isCompleteShorthand("o")).toBe(true);
    expect(isCompleteShorthand("c")).toBe(false);
  });

  it("loneSeverity liest eine allein stehende Stufe", () => {
    expect(loneSeverity("K3")).toBe(4);
    expect(loneSeverity("K3o")).toBeNull();
    expect(loneSeverity("k")).toBeNull();
  });

  it("die mehrstelligen Endo-Kuerzel wirken erst, wenn sie vollstaendig sind", () => {
    expect(shouldCommit("T")).toBe(false);
    expect(shouldCommit("Tw")).toBe(false);
    expect(shouldCommit("Twf")).toBe(true);
  });

  it("ein leerer Puffer wirkt nie", () => {
    expect(shouldCommit("")).toBe(false);
  });
});

describe("Die Spanne: was zwischen zwei Zaehnen liegt (odontogram-apn)", () => {
  it("nimmt den Bogen, nicht die Geometrie", () => {
    expect(teethBetween(16, 13)).toEqual([16, 15, 14, 13]);
  });

  it("ist richtungsunabhaengig - ziehen geht in beide Richtungen", () => {
    expect(teethBetween(13, 16)).toEqual(teethBetween(16, 13));
  });

  it("geht ueber die Mitte, denn das ist eine echte Spanne", () => {
    expect(teethBetween(13, 23)).toEqual([13, 12, 11, 21, 22, 23]);
  });

  it("geht NICHT ueber den Kiefer - der Gegenkiefer war nie gemeint", () => {
    // Der haeufigste Fehlgriff einer Rechteckauswahl: ein paar Pixel zu weit
    // nach unten, und der ganze Unterkiefer haengt mit drin.
    expect(teethBetween(16, 46)).toEqual([16]);
  });

  it("ein Zahn mit sich selbst ist genau dieser Zahn", () => {
    expect(teethBetween(21, 21)).toEqual([21]);
  });

  it("laesst aus, was nicht auf dem Bogen steht", () => {
    const ohneWeisheit = (n: number) => n !== 18;
    expect(teethBetween(18, 16, ohneWeisheit)).toEqual([17, 16]);
  });
});

describe("Eine Restauration ohne Material meldet sich", () => {
  it("nennt die Taste, die ein Material gebraucht haette", () => {
    const r = parseShorthand("k");
    expect(r.needsMaterial).toEqual(["k"]);
  });

  it("mit gesetztem Material meldet sie nichts", () => {
    expect(parseShorthand("G k").needsMaterial).toEqual([]);
  });

  it("ein Material ohne Restaurations-Lesart zaehlt als fehlend", () => {
    // Amalgam ist kein Kronenmaterial - die Krone bliebe unvollstaendig.
    expect(parseShorthand("A k").needsMaterial).toEqual(["k"]);
  });

  it("t braucht keines, es nennt sein eigenes", () => {
    expect(parseShorthand("t").needsMaterial).toEqual([]);
  });
});
