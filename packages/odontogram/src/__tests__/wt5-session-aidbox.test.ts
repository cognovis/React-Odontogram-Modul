// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-wt5: the published session is the only FHIR seam. Hosts
// inject an Aidbox gateway and never a Bundle.

import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import { createOdontogramSession } from "../session";
import { buildWritePlan } from "../live/writePlan";

const PATIENT = "p-1";
const EFFECTIVE = "2026-08-23";
const CHARLY_PROFILE = "https://fhir.cognovis.de/dental/StructureDefinition/dental-finding";

function chartedDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } },
    },
  } as OdontogramDocument;
}

function savedResources(): Record<string, unknown>[] {
  const byPath = new Map<string, Record<string, unknown>>();
  for (const op of buildWritePlan({
    document: chartedDocument(),
    patientId: PATIENT,
    effectiveDateTime: EFFECTIVE,
  }).ops) {
    if (op.resource) byPath.set(op.path, op.resource as unknown as Record<string, unknown>);
  }
  return [...byPath.values()];
}

function charlyObservation(): Record<string, unknown> {
  return {
    resourceType: "Observation",
    id: "charly-tooth-11",
    meta: { profile: [CHARLY_PROFILE] },
    status: "final",
    code: { coding: [{ system: "https://fhir.cognovis.de/dental/CodeSystem/ze-befund", code: "4198" }] },
    subject: { reference: `Patient/${PATIENT}` },
    valueString: "4198",
    extension: [{ url: "https://fhir.cognovis.de/dental/StructureDefinition/fdi-tooth-number", valueCode: "11" }],
  };
}

function fakeGateway(resources: Record<string, unknown>[]) {
  return {
    async readPatient(patientId: string) {
      return { resourceType: "Patient", id: patientId };
    },
    async search(resourceType: string) {
      return {
        resources: resources.filter((resource) => resource.resourceType === resourceType),
        truncated: false,
        incomplete: false,
      };
    },
    async put() { return {}; },
    async delete() { return {}; },
  };
}

describe("odontogram-wt5: session Aidbox seam", () => {
  it("exposes loadFromAidbox/saveToAidbox and no JSON-bundle methods", () => {
    const session = createOdontogramSession();
    expect(typeof session.loadFromAidbox).toBe("function");
    expect(typeof session.saveToAidbox).toBe("function");
    expect(session).not.toHaveProperty("importFhirBundle");
    expect(session).not.toHaveProperty("exportFhirBundle");
    expect(session).not.toHaveProperty("buildFhirBundle");
    expect(session).not.toHaveProperty("parseFhirBundle");
  });

  it("loadFromAidbox hydrates the session and lists unsupported foreign profiles", async () => {
    const session = createOdontogramSession();
    const result = await session.loadFromAidbox(
      fakeGateway([{ resourceType: "Patient", id: PATIENT }, ...savedResources(), charlyObservation()]),
      PATIENT,
    );
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(session.getDocument().teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(result.report.unsupported).toEqual([
      expect.objectContaining({
        reference: "Observation/charly-tooth-11",
        profile: CHARLY_PROFILE,
      }),
    ]);
  });

  it("saveToAidbox writes the session document through the injected target", async () => {
    const session = createOdontogramSession({
      ...chartedDocument(),
      fhirIdentity: {
        resources: {
          "Observation/stale-finding": { id: "stale-16", resourceType: "Observation" },
        },
      },
    } as OdontogramDocument);
    const puts: string[] = [];
    const deletes: string[] = [];
    const result = await session.saveToAidbox(
      {
        async put(path: string) {
          puts.push(path);
          return {};
        },
        async delete(path: string) {
          deletes.push(path);
          return {};
        },
        // Since cognovis/odontogram#33 a save checks the store before writing;
        // an empty store holds nothing the chart must leave alone.
        async search() {
          return { resources: [], truncated: false, incomplete: false };
        },
      },
      { patientId: PATIENT, effectiveDateTime: EFFECTIVE },
    );
    expect(puts.length).toBeGreaterThan(0);
    expect(deletes).toContain("/Observation/stale-16");
    expect(result.written.some((op) => op.method === "PUT")).toBe(true);
    expect(result.written.some((op) => op.method === "DELETE" && op.path === "/Observation/stale-16")).toBe(true);
  });
});
