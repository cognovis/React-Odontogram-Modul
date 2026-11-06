import { describe, expect, it } from "vitest";
import { buildDentalCoreBundle, parseDentalCoreBundle } from "../fhir";
import { __importStatusForTest, __resetChartStateForTest, getStatusChart } from "../odontogram";

// cognovis/odontogram#39 review: I (and the I of DI) names the incisal edge,
// which the chart stores as its `occlusal` surface. The codec folds it there
// when it reads, for every surface-keyed field, and an explicit O wins over I.
// A surface named twice (MO beside O) is fine with the same value and a
// conflict with a different one.

const CORE = "https://fhir.cognovis.de/dental-core";
const SURFACE = "http://terminology.hl7.org/CodeSystem/FDI-surface";
const SURFACE_URL = `${CORE}/StructureDefinition/tooth-surface`;
const FDI = `${CORE}/CodeSystem/tooth-position-fdi`;
const CHART = `${CORE}/CodeSystem/dental-chart-value`;
const COMPONENT = `${CORE}/CodeSystem/dental-component`;
const options = { subject: "Patient/example", effectiveDateTime: "2026-09-25T12:00:00Z" };
const concept = (system: string, code: string) => ({ coding: [{ system, code }] });
const extension = (code: string) => ({ url: SURFACE_URL, valueCoding: { system: SURFACE, code } });

type Json = Record<string, any>;
type Bundle = { resourceType: string; entry?: Array<{ fullUrl?: string; resource?: Json }> };

const build = (teeth: Json): Bundle => buildDentalCoreBundle({ version: "2.46", globals: {}, teeth } as never, options) as unknown as Bundle;
const profileOf = (resource: Json | undefined): string => resource?.meta?.profile?.[0] ?? "";
const byProfile = (bundle: Bundle, name: string): Json[] =>
  (bundle.entry ?? []).map((entry) => entry.resource!).filter((resource) => profileOf(resource).endsWith(`/${name}`));
/** Recode every tooth-surface extension of a resource (bodySite and components). */
const recode = (resource: Json, from: string, to: string): Json => {
  const copy = structuredClone(resource);
  for (const site of [copy.bodySite, ...(copy.component ?? [])]) {
    for (const ext of site?.extension ?? []) if (ext.url === SURFACE_URL && ext.valueCoding?.code === from) ext.valueCoding.code = to;
  }
  return copy;
};
const bundleOf = (resources: Json[]): Bundle => ({
  resourceType: "Bundle", type: "collection", identifier: { system: CORE, value: "odontogram-dental-core-0.9.0" },
  entry: resources.map((resource, index) => ({ fullUrl: `urn:uuid:00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, resource })),
} as Bundle);
const writtenSurfaceCodes = (bundle: Bundle): string[] => (bundle.entry ?? []).flatMap(({ resource }) =>
  [resource?.bodySite, ...(resource?.component ?? [])].flatMap((site: Json | undefined) =>
    (site?.extension ?? []).filter((ext: Json) => ext.url === SURFACE_URL).map((ext: Json) => ext.valueCoding?.code)));
const toothState = (tooth: string, components: Json[]): Json => ({
  resourceType: "Observation", meta: { profile: [`${CORE}/StructureDefinition/dental-tooth-state`] },
  status: "final", code: concept(COMPONENT, "tooth-presence"),
  subject: { reference: "Patient/example" }, effectiveDateTime: options.effectiveDateTime,
  bodySite: concept(FDI, tooth),
  component: [{ code: concept(COMPONENT, "tooth-presence"), valueCodeableConcept: concept(CHART, "tooth-present") }, ...components],
});
const filling = (code: string, material: string): Json[] => [
  { extension: [extension(code)], code: concept(COMPONENT, "restoration-type"), valueCodeableConcept: concept(CHART, "direct-filling") },
  { extension: [extension(code)], code: concept(COMPONENT, "restoration-material"), valueCodeableConcept: concept(CHART, material) },
];

describe("#39 incisal edge folds onto the occlusal key at the codec", () => {
  it("charts I and DI caries, with severity, on the occlusal edge", () => {
    const occlusal = byProfile(build({ "11": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } } }), "dental-caries-finding")[0];
    const distal = byProfile(build({ "11": { caries: ["caries-distal"], cariesSeverity: { distal: 3 } } }), "dental-caries-finding")[0];

    const incisal = parseDentalCoreBundle(bundleOf([recode(occlusal, "O", "I")]));
    expect(incisal?.teeth["11"]?.caries).toEqual(["caries-occlusal"]);
    expect(incisal?.teeth["11"]?.cariesSeverity).toEqual({ occlusal: 3 });

    const distoincisal = parseDentalCoreBundle(bundleOf([recode(distal, "D", "DI")]));
    expect(distoincisal?.teeth["11"]?.caries?.slice().sort()).toEqual(["caries-distal", "caries-occlusal"]);
    expect(distoincisal?.teeth["11"]?.cariesSeverity).toEqual({ distal: 3, occlusal: 3 });
  });

  it("lets an explicit O caries win over an I caries on the same tooth, in either order", () => {
    const explicit = byProfile(build({ "11": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 2 } } }), "dental-caries-finding")[0];
    const folded = recode(byProfile(build({ "11": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } } }), "dental-caries-finding")[0], "O", "I");
    for (const order of [[explicit, folded], [folded, explicit]]) {
      const parsed = parseDentalCoreBundle(bundleOf(order));
      expect(parsed?.teeth["11"]?.caries).toEqual(["caries-occlusal"]);
      expect(parsed?.teeth["11"]?.cariesSeverity).toEqual({ occlusal: 2 });
    }
    // Two explicit findings on one surface stay a conflict, as before.
    expect(parseDentalCoreBundle(bundleOf([explicit, structuredClone(explicit)]))).toBeUndefined();
  });

  it("reads I radiographic depth onto occlusal and writes it back", () => {
    const depth = byProfile(build({ "11": { radiographicDepth: { occlusal: "D2" } } }), "dental-radiographic-caries-depth")[0];
    const parsed = parseDentalCoreBundle(bundleOf([recode(depth, "O", "I")]));
    expect(parsed?.teeth["11"]?.radiographicDepth).toEqual({ occlusal: "D2" });
    const written = buildDentalCoreBundle(parsed!, options) as unknown as Bundle;
    expect(writtenSurfaceCodes(written)).toEqual(["O"]);
    expect(parseDentalCoreBundle(written)?.teeth).toEqual(parsed!.teeth);
  });

  it("round-trips every I-coded surface field read -> write -> read without an incisal key", () => {
    const source = build({ "11": {
      fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" }, fillingDefect: { occlusal: "marginal" },
      caries: ["caries-occlusal"], cariesSeverity: { occlusal: 4 }, radiographicDepth: { occlusal: "E2" },
    } });
    const recoded = bundleOf((source.entry ?? []).map(({ resource }) => recode(resource!, "O", "I")));
    expect(writtenSurfaceCodes(recoded).every((code) => code === "I")).toBe(true);
    const parsed = parseDentalCoreBundle(recoded);
    expect(parsed?.teeth["11"]).toMatchObject({
      fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" }, fillingDefect: { occlusal: "marginal" },
      caries: ["caries-occlusal"], cariesSeverity: { occlusal: 4 }, radiographicDepth: { occlusal: "E2" },
    });
    expect(JSON.stringify(parsed)).not.toContain("incisal");
    const written = buildDentalCoreBundle(parsed!, options) as unknown as Bundle;
    expect(writtenSurfaceCodes(written).every((code) => code === "O")).toBe(true);
    expect(parseDentalCoreBundle(written)?.teeth).toEqual(parsed!.teeth);
  });

  it("hydrates an I filling into the interactive chart on the occlusal edge", () => {
    const parsed = parseDentalCoreBundle(bundleOf([toothState("11", filling("I", "composite-resin"))]));
    __resetChartStateForTest();
    __importStatusForTest(parsed);
    const tooth = getStatusChart().teeth["11"];
    expect(tooth.fillingSurfaces).toEqual(["occlusal"]);
    expect(tooth.fillingSurfaceMaterials).toEqual({ occlusal: "composite" });
    __resetChartStateForTest();
  });
});

describe("#39 overlapping surfaces in one tooth state", () => {
  it("accepts MO beside O with the same material", () => {
    const parsed = parseDentalCoreBundle(bundleOf([toothState("16", [...filling("MO", "composite-resin"), ...filling("O", "composite-resin")])]));
    expect(parsed?.teeth["16"]?.fillingSurfaces).toEqual(["mesial", "occlusal"]);
    expect(parsed?.teeth["16"]?.fillingSurfaceMaterials).toEqual({ mesial: "composite", occlusal: "composite" });
  });

  it("rejects MO beside O with a different material", () => {
    expect(parseDentalCoreBundle(bundleOf([toothState("16", [...filling("MO", "composite-resin"), ...filling("O", "amalgam")])]))).toBeUndefined();
  });

  it("lets an explicit O filling win over an I filling, in either order", () => {
    for (const components of [[...filling("I", "amalgam"), ...filling("O", "composite-resin")], [...filling("O", "composite-resin"), ...filling("I", "amalgam")]]) {
      const parsed = parseDentalCoreBundle(bundleOf([toothState("11", components)]));
      expect(parsed?.teeth["11"]?.fillingSurfaces).toEqual(["occlusal"]);
      expect(parsed?.teeth["11"]?.fillingSurfaceMaterials).toEqual({ occlusal: "composite" });
    }
  });
});
