import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramExportPayload, ToothRecord } from "../document";
import { buildDentalCoreBundle, parseDentalCoreBundle, UnsupportedDentalCoreContentError } from "../fhir";
import { LOCAL_VALUE_MAPS, dentalCoreCoding } from "../registry/valueCatalog";

// Independent oracle: cognovis/fhir-dental-core commit ee9c7a1,
// docs/contracts/odontogram-value-coverage.json, entries[] and additionalWrittenTokens[].
// Fixture: src/__tests__/fixtures/odontogram-value-coverage-ee9c7a1.json.
import coverage from "./fixtures/odontogram-value-coverage-ee9c7a1.json";
import externalToothState from "./fixtures/gh35-external-tooth-state.json";

const CORE = "https://fhir.cognovis.de/dental-core";
const LEGACY = "https://github.com/ZoliQua/React-Odontogram-Modul/fhir/CodeSystem/odontogram";
const options = { subject: "Patient/example", effectiveDateTime: "2026-09-25T12:00:00Z" };
const payload = (teeth: OdontogramExportPayload["teeth"], extra: Partial<OdontogramExportPayload> = {}): OdontogramExportPayload =>
  ({ version: PAYLOAD_VERSION, globals: {}, teeth, ...extra });
const resources = (bundle: ReturnType<typeof buildDentalCoreBundle>) => bundle.entry?.map((entry) => entry.resource).filter(Boolean) ?? [];
const observations = (bundle: ReturnType<typeof buildDentalCoreBundle>) => resources(bundle).filter((resource) => resource?.resourceType === "Observation");
const profile = (resource: { meta?: { profile?: string[] } } | undefined, name: string) =>
  resource?.meta?.profile?.includes(`${CORE}/StructureDefinition/${name}`);
const codings = (value: unknown): Array<{ system?: string; code?: string }> => {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(codings);
  const record = value as Record<string, unknown>;
  return [...(typeof record.system === "string" && typeof record.code === "string" ? [record as { system: string; code: string }] : []),
    ...Object.values(record).flatMap(codings)];
};

// These empty states are deliberately omitted by the admission decision, not coded findings.
// All other coded rows must produce the coverage-record code when charted.
const omittedEmpty = new Set([
  "mobility:none", "rootCaries:none", "radiographicDepth:none", "millerClass:none",
  "fillingDefect:none", "fillingMaterial:none", "restorationType:none", "restorationMaterial:none",
  "prosthesis:none", "endo:none", "pulpDx:normal", "apicalDx:normal", "toothSubstrate:natural",
  ...["periapicalType", "pulpLatin", "resorptionType", "wearEdge", "wearCervical", "discoloration",
    "orthoAppliance", "orthoDrift", "orthoVertical", "sensibility", "percussion", "eruptionStage",
    "rootFracture", "rootPostType", "cejVisibility", "rootConcavity", "retention", "retentionSide"]
    .map((group) => `${group}:none`),
  "gingivalThickness:unknown", "periImplant:none", "toothSelection:tooth-base",
]);

function chartForCatalogValue(group: string, value: string): ToothRecord {
  if (group === "mods") return { toothSelection: "none", mods: [value] };
  if (group === "caries") return { caries: [value] };
  if (group === "fillingMaterial") return { fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: value } };
  if (group === "fillingDefect") return { fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" }, fillingDefect: { occlusal: value } };
  if (group === "radiographicDepth") return { radiographicDepth: { occlusal: value } };
  if (group === "toothSelection") return { toothSelection: value };
  if (group === "periImplant") return { toothSelection: "implant", periImplant: value };
  if (group === "prosthesis") return { toothSelection: value.startsWith("removable-") ? "none" : "implant", prosthesis: value };
  if (group === "restorationMaterial") return { restorationType: "crown", restorationMaterial: value };
  if (group === "restorationType") return value === "bridge"
    ? { toothSelection: "none", restorationType: value }
    : { restorationType: value, restorationMaterial: "gold" };
  if (group === "retention" || group === "retentionSide") return { restorationType: "crown", restorationMaterial: "gold",
    retention: group === "retention" ? value : "clasp", ...(group === "retentionSide" ? { retentionSide: value } : {}) };
  if (group === "pulpDx") return { pulpDx: value };
  if (group === "endo") return { endo: value };
  if (group === "rootCaries") return { rootCaries: value };
  if (group === "millerClass") return { millerClass: value };
  return { [group]: value } as ToothRecord;
}

function chartForToken(token: string): ToothRecord {
  if (token === "direct-filling") return { fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" } };
  if (token === "crown-leakage") return { restorationType: "crown", restorationMaterial: "gold", crownLeakage: true };
  if (token.startsWith("endoCanals:")) return { endoCanals: { mesiobuccal: [token.slice("endoCanals:".length)] } };
  if (token.startsWith("furcation-")) return { furcation: { mesial: Number(token.slice("furcation-".length)) } };
  if (token.startsWith("caries-severity-")) return { caries: ["caries-occlusal"], cariesSeverity: { occlusal: Number(token.slice("caries-severity-".length)) } };
  if (token === "pulpDx") return { pulpDx: "necrosis" };
  if (token === "apicalDx") return { apicalDx: "acute-apical-abscess" };
  if (token === "radiographic-depth") return { radiographicDepth: { occlusal: "D2" } };
  if (token === "cervical-involvement") return { caries: ["caries-buccal"], cervicalSurfaces: ["buccal"] };
  if (token === "tooth-mobility") return { mobility: "m2" };
  if (token === "calculus") return { calculus: true };
  if (token === "peri-implant-status") return { toothSelection: "implant", periImplant: "mucositis" };
  throw new Error(`No authored chart for coverage token ${token}`);
}

// The oracle's system and ValueSet names are suffixes, not codes copied from the adapter.
// Source: coverage.entries[{group,value}].{system,code,valueSet,status,reason}.
describe("#35 independent Dental Core vocabulary", () => {
  it("maps every catalog key to its recorded Core code or its exact out-of-scope marker", async () => {
    const { DENTAL_CORE_CODES, DENTAL_CORE_VALUE_SET_CODES, DENTAL_CORE_VALUE_SETS } = await import("@cognovis/fhir-sdk/terminology");
    const actualKeys = Object.entries(LOCAL_VALUE_MAPS).flatMap(([group, values]) => Object.keys(values).map((value) => `${group}:${value}`));
    expect(actualKeys.sort()).toEqual(coverage.entries.map(({ group, value }) => `${group}:${value}`).sort());
    expect(coverage.entries.filter((entry) => entry.status === "out-of-scope")).toHaveLength(15);
    for (const entry of coverage.entries) {
      const actual = dentalCoreCoding(entry.group, entry.value);
      if (entry.status === "out-of-scope") {
        expect(actual, `${entry.group}:${entry.value}: ${entry.reason}`).toBeNull();
        continue;
      }
      const system = `${CORE}/CodeSystem/${entry.system}`;
      const valueSet = `${CORE}/ValueSet/${entry.valueSet}`;
      expect(actual, `${entry.group}:${entry.value}`).toEqual({ system, code: entry.code });
      if (DENTAL_CORE_CODES[system] && DENTAL_CORE_VALUE_SET_CODES[valueSet]?.[system]) {
        expect(DENTAL_CORE_CODES[system], system).toContain(entry.code);
        expect(DENTAL_CORE_VALUE_SET_CODES[valueSet][system], valueSet).toContain(entry.code);
      } else {
        expect(DENTAL_CORE_VALUE_SETS[valueSet], valueSet).toContain(system);
      }
    }
  });

  it("round-trips every coded catalog entry and every additional written token against the independent coverage ledger", () => {
    // Source: src/__tests__/fixtures/odontogram-value-coverage-ee9c7a1.json,
    // selectors entries[status=coded] and additionalWrittenTokens[status=coded].
    const entries = coverage.entries.filter((entry) => entry.status === "coded");
    const tokens = coverage.additionalWrittenTokens.filter((entry) => entry.status === "coded");
    expect(entries).toHaveLength(162);
    expect(tokens).toHaveLength(24);
    for (const entry of entries) {
      const key = `${entry.group}:${entry.value}`;
      if (omittedEmpty.has(key)) {
        const emptyBundle = buildDentalCoreBundle(payload({}), options);
        expect(parseDentalCoreBundle(emptyBundle), `${key} default round-trip`).toBeDefined();
        continue;
      }
      const record = chartForCatalogValue(entry.group, entry.value);
      const bundle = buildDentalCoreBundle(payload({ "16": record }), options);
      const parsed = parseDentalCoreBundle(bundle);
      expect(parsed, key).toBeDefined();
      const migratedPost = entry.group === "endo" && (entry.value === "endo-glass-pin" || entry.value === "endo-metal-pin");
      expect(parsed?.teeth["16"], `${key} round-trip`).toMatchObject(migratedPost
        ? { endo: "endo-filling", rootPostType: entry.value === "endo-glass-pin" ? "glass-fiber" : "metal" }
        : record);
      const expected = { system: `${CORE}/CodeSystem/${entry.system}`, code: entry.code };
      expect(observations(bundle).flatMap(codings), `${key} written coding`).toContainEqual(expect.objectContaining(expected));
      expect(JSON.stringify(bundle), `${key} legacy system`).not.toContain(LEGACY);
    }
    for (const entry of tokens) {
      const record = chartForToken(entry.token);
      const bundle = buildDentalCoreBundle(payload({ "16": record }), options);
      expect(parseDentalCoreBundle(bundle)?.teeth["16"], `${entry.token} round-trip`).toMatchObject(record);
      expect(observations(bundle).flatMap(codings), `${entry.token} written coding`).toContainEqual(expect.objectContaining({
        system: `${CORE}/CodeSystem/${entry.system}`, code: entry.code,
      }));
      expect(JSON.stringify(bundle), `${entry.token} legacy system`).not.toContain(LEGACY);
    }
  });

  it("emits the recorded clinical carriers and reads them back without legacy codes", () => {
    // Oracle selectors: entries[group=pulpDx,apicalDx,radiographicDepth,caries,mobility,
    // periImplant,restorationMaterial]; additionalWrittenTokens[caries-severity-5,furcation-2].
    const source = payload({
      "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 }, pulpDx: "necrosis",
        apicalDx: "acute-apical-abscess", radiographicDepth: { occlusal: "D2" },
        mobility: "m2", calculus: true, furcation: { mesial: 2 } },
      "15": { toothSelection: "implant", periImplant: "peri-implantitis-moderate" },
      "14": { restorationType: "crown", restorationMaterial: "telescope" },
    });
    const bundle = buildDentalCoreBundle(source, options);
    expect(JSON.stringify(bundle)).not.toContain(LEGACY);
    for (const resource of observations(bundle)) {
      if (!resource || !resource.meta?.profile?.some((name) => name.startsWith(`${CORE}/StructureDefinition/`))) continue;
      const observation = resource as { valueCodeableConcept?: unknown; component?: Array<{ valueCodeableConcept?: unknown }> };
      for (const concept of [observation.valueCodeableConcept, ...(observation.component ?? []).map((part) => part.valueCodeableConcept)]) {
        for (const value of codings(concept)) expect(value.system, `${resource.meta?.profile?.[0]}: ${value.code}`)
          .toMatch(/^https:\/\/fhir\.cognovis\.de\/dental-core\/CodeSystem\//);
      }
    }
    for (const [name, value] of [
      ["dental-pulp-diagnosis", "pulp-necrosis"],
      ["dental-apical-diagnosis", "acute-apical-abscess"],
      ["dental-radiographic-caries-depth", "dentin-middle-third"],
      ["dental-caries-finding", "caries"],
      ["dental-peri-implant-finding", "peri-implantitis-moderate-bone-loss"],
      ["dental-periodontal-finding", "tooth-mobility-grade-2"],
    ]) {
      const matching = observations(bundle).filter((resource) => profile(resource, name));
      expect(matching.length, name).toBeGreaterThan(0);
      expect(matching.flatMap(codings).some((coding) => coding.system?.startsWith(`${CORE}/CodeSystem/`) && coding.code === value), `${name}: ${value}`).toBe(true);
    }
    expect(observations(bundle).filter((resource) => profile(resource, "dental-caries-finding")).flatMap(codings))
      .toContainEqual(expect.objectContaining({ system: `${CORE}/CodeSystem/icdas-caries-severity`, code: "5" }));
    expect(observations(bundle).filter((resource) => profile(resource, "dental-periodontal-finding")).flatMap(codings))
      .toContainEqual(expect.objectContaining({ system: `${CORE}/CodeSystem/dental-chart-value`, code: "furcation-grade-2" }));
    expect(observations(bundle).filter((resource) => profile(resource, "dental-tooth-state")).flatMap(codings))
      .toContainEqual(expect.objectContaining({ system: `${CORE}/CodeSystem/dental-chart-value`, code: "telescopic-crown" }));
    for (const [tooth, record] of Object.entries(source.teeth)) expect(parseDentalCoreBundle(bundle)?.teeth[tooth]).toMatchObject(record);
  });

  it("reads a separately authored Dental Core tooth state and refuses the former local coding", () => {
    // Worked example: Dental Core DentalToothState component[toothPresence],
    // coverage.entries[group=toothSelection,value=implant] -> implant-in-tooth-position.
    // Fixture: src/__tests__/fixtures/gh35-external-tooth-state.json, entry[0].resource.component[0].
    // This JSON is hand-authored; it never passes through the writer to create expectations.
    const external = structuredClone(externalToothState);
    expect(parseDentalCoreBundle(external)?.teeth["16"]).toMatchObject({ toothSelection: "implant" });
    expect(parseDentalCoreBundle(external)?.teeth["16"]?.toothSelection)
      .toBe(parseDentalCoreBundle(buildDentalCoreBundle(payload({ "16": { toothSelection: "implant" } }), options))?.teeth["16"]?.toothSelection);
    const presence = external.entry[0].resource.component[0].valueCodeableConcept.coding[0];
    presence.system = LEGACY;
    presence.code = "implant";
    expect(parseDentalCoreBundle(external)?.teeth["16"]?.toothSelection).not.toBe("implant");
  });

  it("uses tooth-state Observation.note and refuses assessment workflow values", () => {
    // Oracle additionalWrittenTokens[token=odontogram-note,assessed].
    const withNote = payload({ "16": { note: "Review occlusal surface" } });
    const bundle = buildDentalCoreBundle(withNote, options);
    const states = observations(bundle).filter((resource) => profile(resource, "dental-tooth-state"));
    expect(states).toHaveLength(1);
    expect(states[0]).toMatchObject({ note: [{ text: "Review occlusal surface" }] });
    expect(observations(bundle).filter((resource) => resource?.id?.includes("note"))).toHaveLength(0);
    expect(parseDentalCoreBundle(bundle)?.teeth["16"]?.note).toBe("Review occlusal surface");
    expect(() => buildDentalCoreBundle(payload({ "16": { assessment: { pulp: "assessed" } } }), options))
      .toThrow(UnsupportedDentalCoreContentError);
  });

  it("writes implant UDI carrier and text-only device property types", () => {
    // Oracle additionalWrittenTokens[token=implant-diameter,implant-length].
    const source = payload({ "16": { toothSelection: "implant", implantProduct: {
      manufacturer: "Example", diameterMm: 4.1, lengthMm: 10,
      udi: "(01)07612345678901(10)LOT4711", deviceIdentifier: "07612345678901", lot: "LOT4711",
    } } });
    const bundle = buildDentalCoreBundle(source, options);
    const device = resources(bundle).find((resource) => resource?.resourceType === "Device") as { udiCarrier?: Array<{ carrierHRF?: string }>; property?: Array<{ type: { text?: string; coding?: unknown } }> } | undefined;
    expect(device?.udiCarrier?.[0]?.carrierHRF).toBe("(01)07612345678901(10)LOT4711");
    expect(device?.property?.map((property) => property.type.text)).toEqual(expect.arrayContaining(["implant-diameter", "implant-length"]));
    for (const property of device?.property ?? []) expect(property.type.coding).toBeUndefined();
    expect(parseDentalCoreBundle(bundle)?.teeth["16"]?.implantProduct).toMatchObject(source.teeth["16"].implantProduct!);
  });

  it("keeps shared-resource provenance reasons text-only and smoking answers LOINC-only", () => {
    // Oracle additionalWrittenTokens[token=shared-resource-smokingStatus,smokingStatus].
    const shared = { smokingStatus: { resource: { resourceType: "Observation" as const, id: "smoking", status: "final" as const,
      code: { coding: [{ system: "http://loinc.org", code: "72166-2" }] }, subject: { reference: "Patient/example" },
      valueCodeableConcept: { coding: [{ system: "http://loinc.org", code: "LA15920-4" }] } } } };
    const bundle = buildDentalCoreBundle(payload({}, { case: { smokingStatus: "former" } }), { ...options, sharedResources: shared });
    const provenance = resources(bundle).filter((resource) => resource?.resourceType === "Provenance");
    expect(provenance.length).toBeGreaterThan(0);
    for (const resource of provenance) for (const reason of (resource as { reason?: Array<{ text?: string; coding?: unknown }> }).reason ?? []) {
      expect(reason.text).toBeTruthy();
      expect(reason.coding).toBeUndefined();
    }
    expect(parseDentalCoreBundle(bundle)?.case?.smokingStatus).toBe("former");
    expect(JSON.stringify(bundle)).not.toContain(LEGACY);
  });
});

describe("#35 AC1 source boundary", () => {
  it("contains neither the retired code system nor its alias in non-test source", () => {
    const workspace = resolve(__dirname, "../../../..");
    const scan = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      return entry.isDirectory() ? scan(path) : /\.(?:ts|tsx|js|mjs|py)$/.test(entry.name) ? [path] : [];
    });
    const files = ["packages/odontogram/src", "packages/odontogram-fhir/src", "apps/standalone/src"]
      .flatMap((directory) => scan(resolve(workspace, directory)))
      .filter((file) => !file.includes("/__tests__/"));
    const offenders = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return source.includes(LEGACY) || source.includes("DENTAL_CORE_LOCAL_SYSTEM");
    });
    expect(offenders).toEqual([]);
  });
});
