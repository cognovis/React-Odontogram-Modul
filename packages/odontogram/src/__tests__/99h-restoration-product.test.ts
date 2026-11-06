// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-99h: WELCHES Produkt in der Restauration steckt.
//
// Der Pruefstein steht im Bead selbst: wer "welche Patienten tragen Los X"
// nicht beantworten kann, hat das Problem nicht geloest, das dieses Feld
// rechtfertigt. Und Dirks Randbedingung vom 21.08.2026 daneben: "eine derartige
// Versorgung muss auch gueltig sein, wenn sie nicht erhoben wird."

import { describe, it, expect, beforeEach } from "vitest";
import {
  isEmptyRestorationProduct, normalizeRestorationProduct, knownProducts, knownLabs,
} from "../restorationProduct";
import {
  setRestorationProduct, getRestorationProduct, restorationProductAllowed,
  getChartedRestorationProducts, isRestorationProductGap,
  captureExamination, resetExaminations,
  setFillingProduct, getFillingProduct, getFillingProducts, fillingProductAllowed,
  fillingMaterialsOn, getChartedFillingProducts, __getToothStateForTest,
  __setToothStateForTest, __resetChartStateForTest,
  __collectExportPayloadForTest, __hydrateImportedChartsForTest,
} from "../odontogram";
import { buildDentalCoreBundle } from "../fhir/toFhirDentalCore";
import { PAYLOAD_VERSION } from "../document";

// Eine echte GS1-UDI: (01) GTIN, (17) Verfall, (10) Charge.
const UDI = "(01)07612345678901(17)300630(10)LOT4711";
const KRONE = { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "emax" };

beforeEach(() => { __resetChartStateForTest(); resetExaminations(); });

describe("Der Satz fuer sich", () => {
  it("leer heisst leer", () => {
    expect(isEmptyRestorationProduct(null)).toBe(true);
    expect(isEmptyRestorationProduct({})).toBe(true);
    expect(isEmptyRestorationProduct({ manufacturer: "  " })).toBe(false);  // roh, ungerueckt
    expect(normalizeRestorationProduct({ manufacturer: "  " })).toBeNull();
  });

  it("die UDI wird GELESEN, eine getippte Charge kann ihr nicht widersprechen", () => {
    const p = normalizeRestorationProduct({ udi: UDI, lot: "von Hand etwas anderes" });
    expect(p?.lot).toBe("LOT4711");
    expect(p?.expiry).toBe("2030-06-30");
    expect(p?.deviceIdentifier).toBe("07612345678901");
  });

  it("aber ohne Traeger bleibt eine getippte Charge stehen", () => {
    // Nicht jedes Produkt kommt mit einem Barcode, und die Charge ist der
    // Grund, warum es dieses Feld gibt.
    expect(normalizeRestorationProduct({ lot: "K-2231" })?.lot).toBe("K-2231");
  });

  it("die Liste der Praxis entsteht aus ihren eigenen Charts", () => {
    const alle = [
      { manufacturer: "Ivoclar Vivadent", product: "IPS e.max CAD" },
      { product: "Ceramill Zolid", lab: "Dentallabor Meier" },
      { manufacturer: "Ivoclar Vivadent", product: "IPS e.max CAD" },   // doppelt
      { lab: "dentallabor meier" },                                      // andere Schreibweise
    ];
    expect(knownProducts(alle)).toEqual(["Ceramill Zolid", "Ivoclar Vivadent IPS e.max CAD"]);
    expect(knownLabs(alle)).toEqual(["Dentallabor Meier"]);
  });
});

describe("Am Zahn", () => {
  it("nur, wo ueberhaupt eine Restauration steht", () => {
    expect(restorationProductAllowed({ ...KRONE })).toBe(true);
    expect(restorationProductAllowed({ toothSelection: "tooth-base", restorationType: "none", restorationMaterial: "none" })).toBe(false);
    // Ein Wurzelrest traegt keine Restauration - restorationRowHidden blendet
    // die Zeile aus, und dieselbe Frage muss hier dieselbe Antwort geben.
    expect(restorationProductAllowed({ ...KRONE, toothSubstrate: "radix" })).toBe(false);
  });

  it("der Setter ist am blanken Zahn ein Leerlauf", () => {
    __setToothStateForTest(16, {});
    setRestorationProduct(16, { product: "IPS e.max CAD" });
    expect(getRestorationProduct(16)).toBeNull();
  });

  it("und an der Krone wirkt er", () => {
    __setToothStateForTest(16, KRONE);
    setRestorationProduct(16, { manufacturer: "Ivoclar Vivadent", product: "IPS e.max CAD", shade: "A3", udi: UDI });
    expect(getRestorationProduct(16)).toEqual({
      manufacturer: "Ivoclar Vivadent", product: "IPS e.max CAD", shade: "A3",
      udi: UDI, deviceIdentifier: "07612345678901", lot: "LOT4711", expiry: "2030-06-30",
    });
  });

  it("null loescht", () => {
    __setToothStateForTest(16, KRONE);
    setRestorationProduct(16, { product: "IPS e.max CAD" });
    setRestorationProduct(16, null);
    expect(getRestorationProduct(16)).toBeNull();
  });

  it("sammelt, was die Praxis schon eingegliedert hat", () => {
    __setToothStateForTest(16, KRONE);
    __setToothStateForTest(26, KRONE);
    setRestorationProduct(16, { product: "IPS e.max CAD" });
    setRestorationProduct(26, { product: "Ceramill Zolid" });
    expect(knownProducts(getChartedRestorationProducts())).toEqual(["Ceramill Zolid", "IPS e.max CAD"]);
  });
});

describe("EINE KRONE OHNE PRODUKT IST EIN VOLLSTAENDIGER BEFUND", () => {
  it("ohne Eingangsuntersuchung wird gar nichts gemeldet", () => {
    // Dirk: "Bei einem Eingangsbefund wird sie mit grosser Wahrscheinlichkeit
    // sowieso nicht zu ermitteln sein." Ohne Vergleichspunkt waere die Warnung
    // geraten - und geraten wird hier nicht.
    __setToothStateForTest(16, KRONE);
    expect(isRestorationProductGap(16)).toBe(false);
  });

  it("was der Patient mitgebracht hat, bleibt vollstaendig", () => {
    __setToothStateForTest(16, KRONE);
    captureExamination({ effectiveDateTime: "2026-01-10" });            // die Krone war schon da
    expect(isRestorationProductGap(16)).toBe(false);
  });

  it("aber was WIR eingegliedert haben, ist ohne Angabe eine Luecke", () => {
    __setToothStateForTest(16, {});
    captureExamination({ effectiveDateTime: "2026-01-10" });            // beim Eingang blank
    __setToothStateForTest(16, KRONE);           // heute eine Krone
    expect(isRestorationProductGap(16)).toBe(true);
    setRestorationProduct(16, { lot: "K-2231" });
    expect(isRestorationProductGap(16)).toBe(false);
  });
});

describe("Nutzlast", () => {
  it("weggelassen, solange nichts bekannt ist", () => {
    __setToothStateForTest(16, KRONE);
    const p = __collectExportPayloadForTest() as Record<string, never>;
    expect((p.teeth as Record<string, Record<string, unknown>>)["16"].restorationProduct).toBeUndefined();
  });

  it("faehrt hin und zurueck", () => {
    __setToothStateForTest(16, KRONE);
    setRestorationProduct(16, { product: "IPS e.max CAD", lab: "Dentallabor Meier", udi: UDI });
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect(p.version).toBe(PAYLOAD_VERSION);
    __resetChartStateForTest();
    __hydrateImportedChartsForTest(p);
    expect(getRestorationProduct(16)?.lot).toBe("LOT4711");
    expect(getRestorationProduct(16)?.lab).toBe("Dentallabor Meier");
  });

  it("ein unlesbarer Satz reisst den Zahn nicht mit", () => {
    __hydrateImportedChartsForTest({
      version: PAYLOAD_VERSION,
      teeth: { "16": { ...KRONE, restorationProduct: "keine Karte" } },
    });
    expect(getRestorationProduct(16)).toBeNull();
  });
});

describe("FHIR", () => {
  it("die CHARGE steht dort, wo ein Rueckruf sie sucht", () => {
    __setToothStateForTest(16, KRONE);
    setRestorationProduct(16, { manufacturer: "Ivoclar Vivadent", product: "IPS e.max CAD", udi: UDI });
    const bundle = buildDentalCoreBundle(__collectExportPayloadForTest() as never, { effectiveDateTime: "2026-08-21T09:00:00Z" } as never);
    const geraete = (bundle.entry ?? []).map((e) => e.resource as unknown as Record<string, unknown>)
      .filter((r) => r?.resourceType === "Device" && r.lotNumber === "LOT4711");
    expect(geraete).toHaveLength(1);
    expect(geraete[0].manufacturer).toBe("Ivoclar Vivadent");
    expect(geraete[0].expirationDate).toBe("2030-06-30");
    expect(JSON.stringify(geraete[0])).toContain("IPS e.max CAD");
  });

  it("ohne Produkt kein Device", () => {
    __setToothStateForTest(16, KRONE);
    const bundle = buildDentalCoreBundle(__collectExportPayloadForTest() as never, { effectiveDateTime: "2026-08-21T09:00:00Z" } as never);
    const geraete = (bundle.entry ?? []).map((e) => e.resource as unknown as Record<string, unknown>)
      .filter((r) => r?.resourceType === "Device");
    expect(geraete).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Zweiter Teil, Dirk am 21.08.2026: "Ja, beim Komposit machen wir es der
// Vollstaendigkeit halber mit dazu, erlauben aber, dass es fehlt."

describe("Das Produkt einer direkten Fuellung", () => {
  // Roh wie eine Nutzlast - `__setToothStateForTest` hydratisiert, nimmt also
  // Objekte und keine Maps.
  const MIT_KOMPOSIT = {
    fillingSurfaces: ["mesial", "occlusal"],
    fillingSurfaceMaterials: { mesial: "composite", occlusal: "composite" },
  };

  it("JE MATERIAL, nicht je Flaeche - eine Spritze fuellt mehrere Flaechen", () => {
    // `mod` ist EINE Fuellung, nicht drei. Je Flaeche zu speichern hiesse,
    // dieselbe Charge dreimal zu fuehren und dreimal auseinanderlaufen zu
    // lassen.
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    setFillingProduct(16, "composite", { product: "Tetric EvoCeram", lot: "K-2231" });
    expect(getFillingProduct(16, "composite")?.lot).toBe("K-2231");
    expect(getFillingProducts(16)).toEqual({ composite: { product: "Tetric EvoCeram", lot: "K-2231" } });
  });

  it("aber EIN Satz je Zahn genuegt nicht - zwei Materialien, zwei Produkte", () => {
    __setToothStateForTest(16, {
      fillingSurfaces: ["mesial", "distal"],
      fillingSurfaceMaterials: { mesial: "composite", distal: "gic" },
    } as never);
    setFillingProduct(16, "composite", { product: "Tetric EvoCeram" });
    setFillingProduct(16, "gic", { product: "Fuji IX" });
    expect(fillingMaterialsOn(16)).toEqual(["composite", "gic"]);
    expect(getFillingProduct(16, "gic")?.product).toBe("Fuji IX");
  });

  it("nur fuer ein Material, das an diesem Zahn wirklich liegt", () => {
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    expect(fillingProductAllowed(__getToothStateForTest(16), "composite")).toBe(true);
    expect(fillingProductAllowed(__getToothStateForTest(16), "amalgam")).toBe(false);
    setFillingProduct(16, "amalgam", { product: "irgendwas" });
    expect(getFillingProduct(16, "amalgam")).toBeNull();
  });

  it("die UDI wird auch hier gelesen", () => {
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    setFillingProduct(16, "composite", { udi: UDI });
    expect(getFillingProduct(16, "composite")?.lot).toBe("LOT4711");
  });

  it("ES DARF FEHLEN - kein Hinweis, nirgends", () => {
    // Der Unterschied zur Laborarbeit: dort meldet isRestorationProductGap, was
    // diese Praxis eingegliedert hat, ohne dass etwas notiert ist. Eine
    // Fuellung ohne Produktangabe ist nie ein Mangel.
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    captureExamination({ effectiveDateTime: "2026-01-10" });
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    expect(getFillingProducts(16)).toEqual({});
    // Es gibt schlicht kein Praedikat, das hier etwas melden koennte:
    expect(isRestorationProductGap(16)).toBe(false);
  });

  it("die Vorschlagsliste ist EINE, nicht zwei", () => {
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    __setToothStateForTest(26, { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "emax" });
    setFillingProduct(16, "composite", { product: "Tetric EvoCeram" });
    setRestorationProduct(26, { product: "IPS e.max CAD" });
    expect(knownProducts([...getChartedFillingProducts(), ...getChartedRestorationProducts()]))
      .toEqual(["IPS e.max CAD", "Tetric EvoCeram"]);
  });

  it("faehrt hin und zurueck, und ein fremdes Material faellt beim Import weg", () => {
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    setFillingProduct(16, "composite", { product: "Tetric EvoCeram", lot: "K-2231" });
    const p = __collectExportPayloadForTest() as Record<string, unknown>;
    expect((p.teeth as Record<string, Record<string, unknown>>)["16"].fillingProducts)
      .toEqual({ composite: { product: "Tetric EvoCeram", lot: "K-2231" } });
    __resetChartStateForTest();
    __hydrateImportedChartsForTest(p);
    expect(getFillingProduct(16, "composite")?.lot).toBe("K-2231");

    __resetChartStateForTest();
    __hydrateImportedChartsForTest({
      version: PAYLOAD_VERSION,
      teeth: { "16": { ...p.teeth ? {} : {}, fillingProducts: { zement: { lot: "X" }, composite: { lot: "Y" } } } },
    });
    expect(getFillingProducts(16)).toEqual({ composite: { lot: "Y" } });
  });

  it("FHIR: ein Device je Material, mit der Charge in lotNumber", () => {
    __setToothStateForTest(16, MIT_KOMPOSIT as never);
    setFillingProduct(16, "composite", { manufacturer: "Ivoclar Vivadent", product: "Tetric EvoCeram", shade: "A3", lot: "K-2231" });
    const bundle = buildDentalCoreBundle(__collectExportPayloadForTest() as never, { effectiveDateTime: "2026-08-21T09:00:00Z" } as never);
    const geraete = (bundle.entry ?? []).map((e) => e.resource as unknown as Record<string, unknown>)
      .filter((r) => r?.resourceType === "Device");
    expect(geraete).toHaveLength(1);
    expect(geraete[0].lotNumber).toBe("K-2231");
    expect(JSON.stringify(geraete[0])).toContain("composite");
    expect(JSON.stringify(geraete[0])).toContain("A3");
  });
});
