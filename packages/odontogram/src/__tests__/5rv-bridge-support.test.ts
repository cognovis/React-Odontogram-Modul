// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-5rv: eine Bruecke ohne Pfeiler ist kein Befund.
//
// Dirk, 19.08.2026: "zu b gehoert irgendwo ein k, oder links und rechts irgendwo
// jeweils ein k, k-b ist die Ausnahme, bedeutet Krone mit schwebendem
// Brueckenglied."
//
// Geprueft wird beides: dass die Pruefung die drei Faelle auseinanderhaelt, und
// dass sie NICHTS verhindert - der Overlay zeichnet weiter, was gechartet ist.

import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkBridgeSpans, bridgeSpanNeedsAttention, detectBridgeSpans,
  type BridgeToothState,
} from "../bridgeOverlay";
import {
  setCantilever, getCantilever, cantileverAllowed, getBridgeSpanChecks,
  bridgeSupportGap,
  __setToothStateForTest, __resetChartStateForTest,
  __collectExportPayloadForTest, __hydrateImportedChartsForTest,
} from "../odontogram";

/** Eine Karte aus einer knappen Beschreibung: "k" Krone, "b" Brueckenpfeiler
 *  (vorhandener Zahn als Bruecke), "g" Glied (Luecke als Bruecke), "-" nichts. */
function karte(spec: Record<number, "k" | "b" | "g" | "-">) {
  const map = new Map<number, BridgeToothState>();
  for(const [tn, art] of Object.entries(spec)){
    if(art === "k") map.set(Number(tn), { toothSelection: "tooth-base", restorationType: "crown" });
    else if(art === "b") map.set(Number(tn), { toothSelection: "tooth-base", restorationType: "bridge" });
    else if(art === "g") map.set(Number(tn), { toothSelection: "none", restorationType: "bridge" });
    else map.set(Number(tn), { toothSelection: "tooth-base", restorationType: "none" });
  }
  return (tn: number) => map.get(tn);
}

describe("checkBridgeSpans: wird die Spanne getragen?", () => {
  it("beidseitig gelagert: Pfeiler als Bruecke gechartet, Glied dazwischen", () => {
    const c = checkBridgeSpans(karte({ 15: "b", 14: "g", 13: "b" }));
    expect(c).toHaveLength(1);
    expect(c[0].support).toBe("supported");
    expect(c[0].pontics).toEqual([14]);
    expect(bridgeSpanNeedsAttention(c[0])).toBe(false);
  });

  it("DER PFEILER DARF EINE KRONE SEIN und steht dann NEBEN dem Lauf", () => {
    // Dirks Regel sagt "irgendwo ein k". Eine Krone traegt restorationType
    // "crown", faellt also aus detectBridgeSpans heraus - die Pruefung muss die
    // Nachbarn des Laufs mitnehmen, sonst meldet sie eine gute Bruecke an.
    const state = karte({ 15: "k", 14: "g", 13: "g", 12: "k" });
    expect(detectBridgeSpans(state)).toEqual([[14, 13]]);
    const c = checkBridgeSpans(state);
    expect(c[0].support).toBe("supported");
    expect(c[0].abutments).toEqual([15, 12]);
  });

  it("kein Pfeiler: zwei Luecken nebeneinander, beide als Bruecke markiert", () => {
    const c = checkBridgeSpans(karte({ 15: "-", 14: "g", 13: "g", 12: "-" }));
    expect(c[0].support).toBe("unsupported");
    expect(c[0].abutments).toEqual([]);
    expect(bridgeSpanNeedsAttention(c[0])).toBe(true);
  });

  it("nur auf einer Seite: die Schwebebruecke", () => {
    const c = checkBridgeSpans(karte({ 15: "k", 14: "g", 13: "-" }));
    expect(c[0].support).toBe("cantilever");
    expect(c[0].abutments).toEqual([15]);
  });

  it("ein Lauf OHNE Glied haengt an nichts und wird nicht gemeldet", () => {
    // Zwei verblockte Kronen etwa. Da kann nichts herunterfallen.
    const c = checkBridgeSpans(karte({ 15: "b", 14: "b" }));
    expect(c[0].support).toBe("supported");
    expect(c[0].pontics).toEqual([]);
  });

  it("ein Wurzelrest traegt nichts", () => {
    const map = new Map<number, BridgeToothState>([
      [15, { toothSelection: "tooth-base", restorationType: "crown" }],
      [14, { toothSelection: "none", restorationType: "bridge" }],
      [13, { toothSelection: "none", restorationType: "bridge" }],
    ]);
    const c = checkBridgeSpans((tn) => map.get(tn));
    expect(c[0].support).toBe("cantilever");
  });

  it("eine Spanne laeuft nie ueber die Kiefermitte hinweg von 28 nach 48", () => {
    // Zwei Laeufe, nicht einer: die beiden Boegen werden getrennt abgesucht.
    const c = checkBridgeSpans(karte({ 28: "b", 48: "b" }));
    expect(c.map((x) => x.span)).toEqual([[28], [48]]);
  });

  it("EIN Glied ist schon eine Bruecke - Dirks Ausnahmefall k-b", () => {
    // Der Pfeiler ist eine Krone, das Glied haengt allein daneben: ein Lauf der
    // Laenge EINS. detectBridgeSpans sieht ihn nicht (es zeichnet Saettel und
    // braucht zwei Kacheln), die Pruefung muss ihn sehen.
    const state = karte({ 15: "k", 14: "g", 13: "-" });
    expect(detectBridgeSpans(state)).toEqual([]);
    const c = checkBridgeSpans(state);
    expect(c).toHaveLength(1);
    expect(c[0].support).toBe("cantilever");
  });
});

describe("Die erklaerte Schwebebruecke schweigt", () => {
  it("ohne Erklaerung meldet die einseitige Lagerung", () => {
    const c = checkBridgeSpans(karte({ 15: "k", 14: "g", 13: "-" }));
    expect(c[0].declaredCantilever).toBe(false);
    expect(bridgeSpanNeedsAttention(c[0])).toBe(true);
  });
  it("mit Erklaerung nicht mehr - der Befund ist fertig", () => {
    const map = new Map<number, BridgeToothState>([
      [15, { toothSelection: "tooth-base", restorationType: "crown" }],
      [14, { toothSelection: "none", restorationType: "bridge", cantilever: true }],
    ]);
    const c = checkBridgeSpans((tn) => map.get(tn));
    expect(c[0].declaredCantilever).toBe(true);
    expect(bridgeSpanNeedsAttention(c[0])).toBe(false);
  });
  it("aber ein Glied ganz ohne Pfeiler bleibt gemeldet, auch als schwebend erklaert", () => {
    // Schwebend heisst einseitig gelagert, nicht gar nicht gelagert.
    const map = new Map<number, BridgeToothState>([
      [14, { toothSelection: "none", restorationType: "bridge", cantilever: true }],
      [13, { toothSelection: "none", restorationType: "bridge" }],
    ]);
    const c = checkBridgeSpans((tn) => map.get(tn));
    expect(c[0].support).toBe("unsupported");
    expect(bridgeSpanNeedsAttention(c[0])).toBe(true);
  });
});

describe("Am lebenden Chart", () => {
  beforeEach(() => __resetChartStateForTest());

  it("cantileverAllowed nur am Glied, nicht am Pfeiler", () => {
    expect(cantileverAllowed({ toothSelection: "none", restorationType: "bridge" })).toBe(true);
    expect(cantileverAllowed({ toothSelection: "tooth-base", restorationType: "bridge" })).toBe(false);
    expect(cantileverAllowed({ toothSelection: "none", restorationType: "none" })).toBe(false);
  });

  it("setCantilever ist am Pfeilerzahn ein Leerlauf", () => {
    __setToothStateForTest(15, { toothSelection: "tooth-base", restorationType: "bridge" });
    setCantilever(15, true);
    expect(getCantilever(15)).toBe(false);
  });

  it("und am Glied wirkt er", () => {
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    setCantilever(14, true);
    expect(getCantilever(14)).toBe(true);
  });

  it("bridgeSupportGap meldet am Zahn, nicht an der Spanne", () => {
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    __setToothStateForTest(13, { toothSelection: "none", restorationType: "bridge" });
    expect(bridgeSupportGap(14)).toBe("unsupported");
    expect(bridgeSupportGap(13)).toBe("unsupported");
    expect(bridgeSupportGap(11)).toBeNull();
  });

  it("der Hinweis verschwindet, sobald ein Pfeiler steht", () => {
    __setToothStateForTest(15, { toothSelection: "tooth-base", restorationType: "crown" });
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    __setToothStateForTest(13, { toothSelection: "none", restorationType: "bridge" });
    expect(bridgeSupportGap(14)).toBe("cantilever");
    __setToothStateForTest(12, { toothSelection: "tooth-base", restorationType: "crown" });
    expect(bridgeSupportGap(14)).toBeNull();
  });

  it("MELDET, VERHINDERT NICHT: der Lauf wird weiter abgeleitet und gezeichnet", () => {
    // Ein Befund entsteht in Bruchstuecken - erst das Glied, dann die Pfeiler.
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    __setToothStateForTest(13, { toothSelection: "none", restorationType: "bridge" });
    expect(getBridgeSpanChecks()).toHaveLength(1);
    expect(getBridgeSpanChecks()[0].span).toEqual([14, 13]);
  });

  it("die Angabe faellt weg, wenn die Restauration keine Bruecke mehr ist", () => {
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    setCantilever(14, true);
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge", cantilever: true });
    expect(getCantilever(14)).toBe(true);
  });
});

describe("Nutzlast", () => {
  beforeEach(() => __resetChartStateForTest());

  it("weggelassen, solange nichts schwebt", () => {
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect((p.teeth as Record<string, Record<string, unknown>>)["14"].cantilever).toBeUndefined();
  });

  it("faehrt bei 2.30 hin und zurueck", () => {
    __setToothStateForTest(14, { toothSelection: "none", restorationType: "bridge" });
    setCantilever(14, true);
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect(p.version).toBe(PAYLOAD_VERSION);
    expect((p.teeth as Record<string, Record<string, unknown>>)["14"].cantilever).toBe(true);
    __resetChartStateForTest();
    __hydrateImportedChartsForTest(p);
    expect(getCantilever(14)).toBe(true);
  });
});
