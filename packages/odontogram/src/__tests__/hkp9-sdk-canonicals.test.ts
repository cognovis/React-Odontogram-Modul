import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS, DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES } from "@cognovis/fhir-sdk/canonicals";
import { SYSTEM_LOINC_ORG, SYSTEM_SCT } from "@cognovis/fhir-sdk/terminology";
import { DENTAL_CORE_PROFILES, SNOMED_SYSTEM } from "../fhir/dentalCoreContract";

// hkp-9: every Dental Core canonical and every external code system URL the
// FHIR seam writes or reads comes from the pinned @cognovis/fhir-sdk
// (`/canonicals`, `/terminology`) wherever the SDK has a constant for it. A
// hand-built `${DENTAL_CORE}/StructureDefinition/...` string or an inline
// SNOMED/LOINC URL drifts silently when the SDK moves; a lookup does not.

const FHIR_DIR = resolve(__dirname, "../fhir");
const sources = readdirSync(FHIR_DIR)
  .filter((name) => /\.ts$/.test(name))
  .map((name) => [name, readFileSync(resolve(FHIR_DIR, name), "utf8")] as const);

describe("hkp-9: SDK canonicals and terminology in the FHIR seam", () => {
  it("builds no Dental Core StructureDefinition URL by string", () => {
    const offenders = sources.filter(([, source]) => /\/StructureDefinition\//.test(source)).map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  it("names no SNOMED CT or LOINC system URL inline", () => {
    const offenders = sources
      .filter(([, source]) => source.includes("http://snomed.info/sct") || source.includes("http://loinc.org"))
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  it("resolves every recorded-* extension and the target chart profile from the SDK", () => {
    const sdk = new Set<string>([
      ...Object.values(DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES),
      ...Object.values(DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS),
    ]);
    for (const id of [
      "measurement-location-detail", "recorded-root-resection", "recorded-papilla-loss",
      "recorded-orthodontic-progression", "recorded-implant-position", "recorded-crown-fracture-type",
      "recorded-bracket-surface", "recorded-cantilever-pontic-role", "recorded-root-endodontic-state",
      "recorded-root-fracture", "recorded-apical-finding", "dental-target-chart-state",
    ]) {
      expect(sdk.has(DENTAL_CORE_PROFILES[id]), id).toBe(true);
    }
  });

  it("uses the SDK's SNOMED CT and LOINC systems", () => {
    expect(SNOMED_SYSTEM).toBe(SYSTEM_SCT);
    expect(SYSTEM_SCT).toBe("http://snomed.info/sct");
    expect(SYSTEM_LOINC_ORG).toBe("http://loinc.org");
  });
});
