import { describe, expect, it } from "vitest";
import { DENTAL_CORE_VALUE_SETS } from "@cognovis/fhir-sdk/terminology";
import { buildDentalCoreBundle, parseDentalCoreBundle } from "../fhir";
import surfaceFixture from "./fixtures/fdi-surface-1.0.0.json";

const CORE = "https://fhir.cognovis.de/dental-core";
const SURFACE = "http://terminology.hl7.org/CodeSystem/FDI-surface";
const FDI = `${CORE}/CodeSystem/tooth-position-fdi`;
const CHART = `${CORE}/CodeSystem/dental-chart-value`;
const COMPONENT = `${CORE}/CodeSystem/dental-component`;
const SURFACE_URL = `${CORE}/StructureDefinition/tooth-surface`;
const options = { subject: "Patient/example", effectiveDateTime: "2026-09-25T12:00:00Z" };
const concept = (system: string, code: string) => ({ coding: [{ system, code }] });
const extension = (code: string) => ({ url: SURFACE_URL, valueCoding: { system: SURFACE, code } });
const bodySite = (tooth: string, code?: string) => ({ ...concept(FDI, tooth), ...(code ? { extension: [extension(code)] } : {}) });

// Source: tx.fhir.org CodeSystem http://terminology.hl7.org/CodeSystem/FDI-surface|1.0.0,
// content complete; fixtures/fdi-surface-1.0.0.json codes[].surfaces.
// I and DI name the incisal edge, which the chart stores as its "occlusal" surface
// (displayed "incisal" on an anterior, odontogram.ts surfaceLabelKey); the codec
// folds I onto that key when it reads, so every surface-keyed field round-trips.
describe("#39 HL7 FDI surface vocabulary at the Dental Core boundary", () => {
  it("maps every complete-system code from a hand-authored bundle and writes single-surface codings", () => {
    expect(DENTAL_CORE_VALUE_SETS[surfaceFixture.valueSet]).toContain(SURFACE);
    expect(surfaceFixture.codes.map(({ code }) => code)).toEqual(["M", "O", "I", "D", "B", "V", "L", "MO", "DO", "DI", "MOD"]);
    for (const { code, tooth, surfaces } of surfaceFixture.codes) {
      const state = {
        resourceType: "Observation", id: `state-${code}`,
        meta: { profile: [`${CORE}/StructureDefinition/dental-tooth-state`] },
        status: "final", code: concept(COMPONENT, "tooth-presence"),
        subject: { reference: "Patient/example" }, effectiveDateTime: options.effectiveDateTime,
        bodySite: bodySite(tooth),
        component: [
          { code: concept(COMPONENT, "tooth-presence"), valueCodeableConcept: concept(CHART, "tooth-present") },
          { extension: [extension(code)], code: concept(COMPONENT, "restoration-type"), valueCodeableConcept: concept(CHART, "direct-filling") },
          { extension: [extension(code)], code: concept(COMPONENT, "restoration-material"), valueCodeableConcept: concept(CHART, "composite-resin") },
        ],
      };
      // Dental Core dental-caries-finding.bodySite.tooth-surface.
      const caries = [{
        resourceType: "Observation", id: `caries-${code}`,
        meta: { profile: [`${CORE}/StructureDefinition/dental-caries-finding`] },
        status: "final", code: concept("http://snomed.info/sct", "80967001"),
        subject: { reference: "Patient/example" }, effectiveDateTime: options.effectiveDateTime,
        bodySite: bodySite(tooth, code), valueCodeableConcept: concept(CHART, "caries"),
      }];
      const bundle = { resourceType: "Bundle", type: "collection", identifier: { system: CORE, value: "odontogram-dental-core-0.9.0" },
        entry: [state, ...caries].map((resource) => ({ resource })) };
      const parsed = parseDentalCoreBundle(bundle);
      expect(parsed, `FDI-surface#${code} must parse`).toBeDefined();
      expect(parsed!.teeth[tooth]?.fillingSurfaces?.slice().sort(), code).toEqual([...surfaces].sort());
      expect(parsed!.teeth[tooth]?.fillingSurfaceMaterials, code).toEqual(Object.fromEntries(surfaces.map((surface) => [surface, "composite"])));
      expect(parsed!.teeth[tooth]?.caries?.slice().sort(), code).toEqual(surfaces.map((surface) => `caries-${surface}`).sort());
      const written = buildDentalCoreBundle(parsed!, options);
      const codedSurfaces = written.entry?.flatMap(({ resource }) => {
        const observation = resource as { bodySite?: { extension?: Array<{ valueCoding?: { code?: string } }> }; component?: Array<{ extension?: Array<{ valueCoding?: { code?: string } }> }> };
        return [observation.bodySite, ...(observation.component ?? [])].flatMap((site) => site?.extension?.map(({ valueCoding }) => valueCoding?.code) ?? []);
      }) ?? [];
      expect(codedSurfaces.length, code).toBeGreaterThan(0);
      expect(codedSurfaces.every((value) => ["M", "O", "I", "D", "B", "L"].includes(value ?? "")), code).toBe(true);
      expect(parseDentalCoreBundle(written)?.teeth, `${code} chart round-trip`).toEqual(parsed!.teeth);
    }
  });
});
