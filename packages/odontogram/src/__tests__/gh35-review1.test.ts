// cognovis/odontogram#35, review 1: a per-canal endodontic state is read from
// its Dental Core coding alone, and the HL7 validator hook targets the Dental
// Core release the pinned SDK carries.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Observation } from "fhir/r4";
import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramExportPayload } from "../document";
import { buildDentalCoreBundle, DENTAL_CORE_PACKAGE_VERSION, DENTAL_CORE_PROFILES, parseDentalCoreBundle } from "../fhir";

const options = { subject: "Patient/example", effectiveDateTime: "2026-09-25T12:00:00Z" };
const source: OdontogramExportPayload = {
  version: PAYLOAD_VERSION,
  globals: {},
  teeth: { "16": { endoCanals: { mesiobuccal: ["filling", "post"], palatal: ["incomplete"] } } },
};

function canalComponents(bundle: ReturnType<typeof buildDentalCoreBundle>) {
  const state = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))
    ?.resource as Observation;
  return (state.component ?? []).filter((component) =>
    component.extension?.some((extension) => extension.url.endsWith("measurement-location-detail")));
}

describe("#35 review 1: canal state comes from the Dental Core code", () => {
  it("parses the same endoCanals when a third party replaces the canal text with free narrative", () => {
    const bundle = buildDentalCoreBundle(source, options);
    const canals = canalComponents(bundle);
    expect(canals).toHaveLength(3);
    for (const component of canals) component.valueCodeableConcept!.text = "Canal treatment verified";
    expect(parseDentalCoreBundle(bundle)?.teeth["16"]?.endoCanals).toEqual(source.teeth["16"].endoCanals);
  });

  it("parses the same endoCanals when the canal text is absent", () => {
    const bundle = buildDentalCoreBundle(source, options);
    for (const component of canalComponents(bundle)) delete component.valueCodeableConcept!.text;
    expect(parseDentalCoreBundle(bundle)?.teeth["16"]?.endoCanals).toEqual(source.teeth["16"].endoCanals);
  });

  it("does not let a text naming another state override the code", () => {
    const bundle = buildDentalCoreBundle(source, options);
    for (const component of canalComponents(bundle)) component.valueCodeableConcept!.text = "temporary";
    expect(parseDentalCoreBundle(bundle)?.teeth["16"]?.endoCanals).toEqual(source.teeth["16"].endoCanals);
  });
});

describe("#35 review 1: fhir:validate targets the pinned Dental Core release", () => {
  it("defaults the IG package and tarball to the SDK's Dental Core version", () => {
    const script = readFileSync(join(__dirname, "..", "..", "tools", "fhir-validate.mjs"), "utf8");
    expect(DENTAL_CORE_PACKAGE_VERSION).toBe("0.10.0");
    expect(script).toContain(`const DENTAL_CORE_VERSION = "${DENTAL_CORE_PACKAGE_VERSION}";`);
    expect(script).toContain("de.cognovis.fhir.dental.core#${DENTAL_CORE_VERSION}");
    expect(script).toContain('join(homedir(), ".fhir", `de.cognovis.fhir.dental.core-${DENTAL_CORE_VERSION}.tgz`)');
    expect(script).not.toContain("0.8.1");
  });
});
