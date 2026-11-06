// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * odontogram-im1 slice 2 — the product on the tooth: state, gate, payload.
 *
 * The constraint under test throughout is Dirk's: nothing is required. An
 * implant that arrived with the patient may carry no product at all, and that
 * must serialize, round-trip and read back as a complete record rather than a
 * gap.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  __setToothStateForTest, __resetChartStateForTest, __importStatusForTest,
  getImplantProduct, setImplantProduct, getChartedImplantProducts, getStatusChart,
} from "../odontogram";
import { PAYLOAD_VERSION } from "../fhir/types";
import { knownSystems } from "../implantProduct";

const UDI = "(01)07612345678901(17)300630(10)LOT4711";

beforeEach(() => { __resetChartStateForTest(); });

describe("the setter is implant-gated", () => {
  it("stores a product on an implant", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setImplantProduct(36, { manufacturer: "Straumann", system: "BLX", diameterMm: 4, lengthMm: 10 });
    expect(getImplantProduct(36)).toMatchObject({
      manufacturer: "Straumann", system: "BLX", diameterMm: 4, lengthMm: 10,
    });
  });

  it("is a silent no-op on a natural tooth", () => {
    __setToothStateForTest(36, { toothSelection: "tooth-base" });
    setImplantProduct(36, { manufacturer: "Straumann" });
    expect(getImplantProduct(36)).toBeNull();
  });

  it("reads the UDI into lot and expiry", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setImplantProduct(36, { udi: UDI });
    expect(getImplantProduct(36)).toMatchObject({
      udi: UDI, deviceIdentifier: "07612345678901", lot: "LOT4711", expiry: "2030-06-30",
    });
  });

  it("clears back to null, and null is a state not an error", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setImplantProduct(36, { system: "BLX" });
    setImplantProduct(36, null);
    expect(getImplantProduct(36)).toBeNull();
  });

  it("hands back a copy, so a caller cannot mutate the chart through it", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setImplantProduct(36, { system: "BLX" });
    const p = getImplantProduct(36)!;
    p.system = "tampered";
    expect(getImplantProduct(36)!.system).toBe("BLX");
  });
});

describe("an implant with no product is a complete record", () => {
  it("serializes nothing at all for it", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    const teeth = getStatusChart().teeth as Record<string, Record<string, unknown>>;
    expect(teeth["36"]).toBeDefined();
    expect("implantProduct" in teeth["36"]).toBe(false);
  });

  it("leaves the payload byte-identical apart from the version", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    const before = JSON.stringify(getStatusChart());
    setImplantProduct(36, null);
    expect(JSON.stringify(getStatusChart())).toBe(before);
  });
});

describe("payload", () => {
  it("die Achse hat die Nutzlast bei ihrer Einfuehrung auf 2.30 gehoben", () => {
    // Die Zusicherung galt der GLOBALEN Nutzlastversion und musste deshalb bei
    // jeder spaeteren Achse mitgezogen werden - sie sagte nichts ueber im1 und
    // brach bei jedem fremden Feld. Was hier zaehlt, ist nur, dass die Version
    // seit der Einfuehrung nicht ZURUECK gegangen ist.
    const [maj, min] = PAYLOAD_VERSION.split(".").map(Number);
    expect(maj * 1000 + min).toBeGreaterThanOrEqual(2 * 1000 + 30);
  });

  it("round-trips a product through export and import", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setImplantProduct(36, { manufacturer: "Straumann", system: "BLX", diameterMm: 4.1, lengthMm: 10, udi: UDI });
    const payload = getStatusChart();
    __resetChartStateForTest();
    expect(getImplantProduct(36)).toBeNull();
    __importStatusForTest(payload);
    expect(getImplantProduct(36)).toEqual({
      manufacturer: "Straumann", system: "BLX", diameterMm: 4.1, lengthMm: 10,
      udi: UDI, deviceIdentifier: "07612345678901", lot: "LOT4711", expiry: "2030-06-30",
    });
  });

  it("hydrates tolerantly — a hand-edited lot cannot contradict its carrier", () => {
    __importStatusForTest({
      version: PAYLOAD_VERSION, globals: {}, teeth: {
        "36": { toothSelection: "implant", implantProduct: { udi: UDI, lot: "TAMPERED" } },
      },
    });
    expect(getImplantProduct(36)!.lot).toBe("LOT4711");
  });

  it("ignores a product that says nothing", () => {
    __importStatusForTest({
      version: PAYLOAD_VERSION, globals: {}, teeth: {
        "36": { toothSelection: "implant", implantProduct: { manufacturer: "   " } },
      },
    });
    expect(getImplantProduct(36)).toBeNull();
  });
});

describe("the systems list writes itself from the chart", () => {
  it("offers what this practice has actually placed", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    __setToothStateForTest(46, { toothSelection: "implant" });
    __setToothStateForTest(16, { toothSelection: "implant" });
    setImplantProduct(36, { manufacturer: "Straumann", system: "BLX" });
    setImplantProduct(46, { manufacturer: "Straumann", system: "BLX" });
    setImplantProduct(16, { manufacturer: "Camlog", system: "Progressive" });
    expect(knownSystems(getChartedImplantProducts()))
      .toEqual(["Camlog Progressive", "Straumann BLX"]);
  });
});
