// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-d1b — cervical fillings and caries on all four sides, and a
 * cervical finding whose side the source does not record.
 *
 * Charly (pvs-adapter-charly PR #117): of 621 cervical fillings 134 sit mesial
 * or distal and 257 have no proven side; every cervical caries has none. Dirk's
 * rule: "im Befund nichts behaupten, was wir nicht genau wissen" — the unknown
 * side is an open finding, never drawn on a surface and never counted as one.
 * At the FHIR boundary it takes the shape fhir-dental-core fdc-w9z defines:
 * cervical-involvement WITHOUT a tooth surface, its value naming the kind.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import { buildDentalCoreBundle, parseDentalCoreBundle } from "../fhir";
import type { OdontogramExportPayload } from "../fhir/types";
import {
  __resetChartStateForTest, __setToothStateForTest, __getToothStateForTest,
  getCervicalSurfaces, setCervicalInvolvement, getCervicalSideUnknown, setCervicalSideUnknown,
  getFillingSurfaceCount, getToothStateSummary, getStatusChart,
} from "../odontogram";

const options = { subject: "Patient/example", effectiveDateTime: "2026-10-03T09:00:00Z" };
const filling = (surfaces: string[], material = "composite") => ({
  fillingSurfaces: surfaces,
  fillingSurfaceMaterials: Object.fromEntries(surfaces.map((x) => [x, material])),
});
type Res = { code?: { coding?: { system?: string; code?: string }[] }; bodySite?: { extension?: unknown[] }; valueCodeableConcept?: unknown; valueBoolean?: boolean };
const cervicalResources = (bundle: { entry?: { resource?: unknown }[] }) => (bundle.entry ?? [])
  .map((e) => e.resource as Res)
  .filter((r) => r?.code?.coding?.some((c) => c.code === "cervical-involvement"));

beforeEach(() => { __resetChartStateForTest(); });

describe("cervical involvement on all four sides", () => {
  it("takes mesial and distal now (charly mz/dz), still never occlusal", () => {
    __setToothStateForTest(16, filling(["mesial", "distal", "occlusal"]));
    setCervicalInvolvement(16, "mesial", true);
    setCervicalInvolvement(16, "distal", true);
    setCervicalInvolvement(16, "occlusal", true);
    expect(getCervicalSurfaces(16)).toEqual(["mesial", "distal"]);
  });

  it("is still a marker, not a surface: the surface count does not move", () => {
    __setToothStateForTest(16, { ...filling(["mesial"]), cervicalSurfaces: ["mesial"] });
    expect(getFillingSurfaceCount(16)).toBe(1);
  });

  it("survives a hand-written payload with mesial/distal", () => {
    __setToothStateForTest(26, { ...filling(["distal"], "amalgam"), cervicalSurfaces: ["distal", "occlusal"] });
    expect(__getToothStateForTest(26)?.cervicalSurfaces).toEqual(["distal"]);
  });
});

describe("cervical, side not documented", () => {
  it("is set and cleared per kind on a present tooth", () => {
    setCervicalSideUnknown(36, "filling", true);
    setCervicalSideUnknown(36, "caries", true);
    expect(getCervicalSideUnknown(36)).toEqual(["filling", "caries"]);
    setCervicalSideUnknown(36, "caries", false);
    expect(getCervicalSideUnknown(36)).toEqual(["filling"]);
  });

  it("is refused where there is no tooth to have a neck", () => {
    __setToothStateForTest(36, { toothSelection: "implant" });
    setCervicalSideUnknown(36, "filling", true);
    __setToothStateForTest(37, { toothSelection: "none" });
    setCervicalSideUnknown(37, "filling", true);
    expect(getCervicalSideUnknown(36)).toEqual([]);
    expect(getCervicalSideUnknown(37)).toEqual([]);
  });

  it("never counts as a surface and never claims one", () => {
    __setToothStateForTest(36, { cervicalSideUnknown: ["filling"] });
    expect(getFillingSurfaceCount(36)).toBe(0);
    expect(getCervicalSurfaces(36)).toEqual([]);
  });

  it("says so in the tooltip", () => {
    __setToothStateForTest(36, { cervicalSideUnknown: ["filling", "caries"] });
    expect(getToothStateSummary(36).join(" | ")).toMatch(/Cervical, side not documented \(filling, caries\)/);
  });

  it("is omitted from the document when empty, kept when set", () => {
    expect(getStatusChart().teeth["36"]?.cervicalSideUnknown).toBeUndefined();
    __setToothStateForTest(36, { cervicalSideUnknown: ["caries", "bogus"] });
    expect(getStatusChart().teeth["36"]?.cervicalSideUnknown).toEqual(["caries"]);
    expect(PAYLOAD_VERSION).toBe("2.48");
  });
});

describe("Dental Core", () => {
  it("round-trips a mesial and a distal marker (the decoder used to reject the bundle)", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION, globals: {},
      teeth: { "16": { ...filling(["mesial", "distal"]), cervicalSurfaces: ["mesial", "distal"] } },
    };
    expect(parseDentalCoreBundle(buildDentalCoreBundle(source, options))).toMatchObject(source);
  });

  it("writes an unknown side as cervical-involvement WITHOUT a surface, valued with the kind (fdc-w9z)", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION, globals: {},
      teeth: { "36": { cervicalSideUnknown: ["filling", "caries"] }, "45": { cervicalSideUnknown: ["caries"] } },
    };
    const bundle = buildDentalCoreBundle(source, options);
    const cervical = cervicalResources(bundle);
    expect(cervical).toHaveLength(3);
    expect(cervical.every((r) => !r.bodySite?.extension?.length && r.valueBoolean === undefined)).toBe(true);
    const codes = cervical.map((r) => (r.valueCodeableConcept as { coding: { system: string; code: string }[] }).coding[0]);
    expect(codes.every((c) => c.system.endsWith("/CodeSystem/dental-chart-value"))).toBe(true);
    expect(codes.map((c) => c.code).sort()).toEqual(["caries", "caries", "direct-filling"]);
    const back = parseDentalCoreBundle(bundle);
    expect(back).toMatchObject(source);
    // never root caries, never a surface
    expect(back?.teeth["45"]?.rootCaries).toBeUndefined();
    expect(back?.teeth["45"]?.caries).toBeUndefined();
  });

  it("rejects a surfaceless cervical finding that does not say what is cervical", () => {
    const source: OdontogramExportPayload = { version: PAYLOAD_VERSION, globals: {}, teeth: { "36": { cervicalSideUnknown: ["caries"] } } };
    const bundle = structuredClone(buildDentalCoreBundle(source, options));
    const r = cervicalResources(bundle)[0] as Record<string, unknown>;
    delete r.valueCodeableConcept; r.valueBoolean = true;
    expect(parseDentalCoreBundle(bundle)).toBeUndefined();
  });
});
