// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// cognovis/odontogram#33, review of PR #34. Two contracts the first cut of the
// "unsupported, not rejected" partition broke.
//
//   1. ONLY A CONFORMANT RESOURCE MAY BYPASS THE CODEC. Listing a resource as
//      unsupported is for valid Dental Core the odontogram has no field for. A
//      resource that fails its own Dental Core 0.8.1 profile — a missing
//      required element, or a tooth `bodySite` outside the required FDI
//      binding — is broken data and has to reach the all-or-nothing codec,
//      which refuses the collection and names it.
//
//   2. A SAVE MUST NOT OVERWRITE WHAT A LOAD LEFT ALONE. An unsupported
//      resource that sits at an id this live mode would generate is retained in
//      the loaded document (`fhirIdentity.reserved`), and the write plan never
//      PUTs to or DELETEs such an id: the generated write moves to another
//      deterministic id instead.

import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import type { AidboxGateway } from "../live/gateway";
import { assembleLoadResult } from "../live/load";
import { buildWritePlan, deterministicResourceId } from "../live/writePlan";
import { createOdontogramSession } from "../index";

const PATIENT = "p-33r";
const DC = "https://fhir.cognovis.de/dental-core";
const FDI_SYSTEM = `${DC}/CodeSystem/tooth-position-fdi`;
const SNOMED = "http://snomed.info/sct";

type ResourceRecord = Record<string, unknown> & { resourceType: string; id: string };

const patient = (): ResourceRecord => ({ resourceType: "Patient", id: PATIENT });

function order(id: string, fields: Record<string, unknown>): ResourceRecord {
  return {
    resourceType: "ServiceRequest",
    id,
    meta: { profile: [`${DC}/StructureDefinition/dental-service-request`] },
    status: "active",
    intent: "order",
    subject: { reference: `Patient/${PATIENT}` },
    bodySite: [{ coding: [{ system: FDI_SYSTEM, code: "46" }] }],
    ...fields,
  };
}

function textFinding(id: string, fields: Record<string, unknown> = {}): ResourceRecord {
  return {
    resourceType: "Observation",
    id,
    meta: { profile: [`${DC}/StructureDefinition/dental-finding`] },
    status: "final",
    code: { text: "Restorative follow-up" },
    subject: { reference: `Patient/${PATIENT}` },
    effectiveDateTime: "2026-07-28",
    valueString: "Deep fissures, no cavitation.",
    ...fields,
  };
}

function load(resources: ResourceRecord[]) {
  return assembleLoadResult({ patientId: PATIENT, resources: [patient(), ...resources] });
}

function expectRejectedAt(resources: ResourceRecord[], reference: string): void {
  const result = load(resources);
  expect(result.report.parsed).toBe(false);
  expect(result.document).toBeUndefined();
  expect(result.report.rejectedAt).toBe(reference);
  expect(result.report.unsupported.map((entry) => entry.reference)).not.toContain(reference);
}

describe("gh-33 review 1: only a conformant resource is listed as unsupported", () => {
  it("rejects a profiled order without the required code", () => {
    expectRejectedAt([order("no-code", {})], "ServiceRequest/no-code");
  });

  it("rejects an order whose bodySite is outside the required FDI binding", () => {
    expectRejectedAt(
      [order("text-site", { code: { coding: [{ system: SNOMED, code: "1285005000" }] }, bodySite: [{ text: "lower right" }] })],
      "ServiceRequest/text-site",
    );
  });

  it("still lists a conformant order it has no field for", () => {
    const result = load([order("bridge", { code: { coding: [{ system: SNOMED, code: "1285005000" }] } })]);
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported.map((entry) => entry.reference)).toEqual(["ServiceRequest/bridge"]);
  });

  it("rejects a text-coded finding that misses its required effective time", () => {
    const broken = textFinding("no-effective");
    delete broken.effectiveDateTime;
    expectRejectedAt([broken], "Observation/no-effective");
  });

  it("still lists a conformant text-coded finding", () => {
    const result = load([textFinding("text-only")]);
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported.map((entry) => entry.reference)).toEqual(["Observation/text-only"]);
  });

  it("rejects a foreign-coded tooth state without its required tooth", () => {
    expectRejectedAt([{
      resourceType: "Observation",
      id: "tooth-state-no-site",
      meta: { profile: [`${DC}/StructureDefinition/dental-tooth-state`] },
      status: "final",
      code: { coding: [{ system: `${DC}/CodeSystem/dental-component`, code: "tooth-presence" }] },
      subject: { reference: `Patient/${PATIENT}` },
      effectiveDateTime: "2026-07-28",
      component: [{
        code: { coding: [{ system: `${DC}/CodeSystem/dental-component`, code: "tooth-presence" }] },
        valueCodeableConcept: { coding: [{ system: "https://fhir.cognovis.de/dental/CodeSystem/sws2-zahnstatus", code: "g" }] },
      }],
    }], "Observation/tooth-state-no-site");
  });

  it("rejects a periodontal finding whose bodySite is text only", () => {
    expectRejectedAt([{
      resourceType: "Observation",
      id: "perio-text-site",
      meta: { profile: [`${DC}/StructureDefinition/dental-periodontal-finding`] },
      status: "final",
      code: { text: "Periodontal follow-up" },
      subject: { reference: `Patient/${PATIENT}` },
      effectiveDateTime: "2026-07-28",
      bodySite: { text: "Reference area of the periodontal report" },
    }], "Observation/perio-text-site");
  });
});

// ---------------------------------------------------------------------------

/** The id this live mode generates for caries on the occlusal surface of 16. */
function cariesPlan(document: OdontogramDocument) {
  return buildWritePlan({ document, patientId: PATIENT, effectiveDateTime: "2026-09-25" });
}

function cariesDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: { "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } } },
  } as OdontogramDocument;
}

const CARIES_KEY = "Observation/caries/16/occlusal";
const generatedCariesId = (): string => deterministicResourceId(PATIENT, CARIES_KEY);

describe("gh-33 review 2: a save never overwrites an unsupported resource", () => {
  it("the caries key is the one this live mode writes (fixture sanity)", () => {
    const plan = cariesPlan(cariesDocument());
    expect(plan.ops.find((op) => op.identityKey === CARIES_KEY)?.id).toBe(generatedCariesId());
  });

  it("retains the id of an unsupported resource at a generated id in the loaded document", () => {
    const result = load([textFinding(generatedCariesId())]);
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported.map((entry) => entry.reference)).toEqual([`Observation/${generatedCariesId()}`]);
    expect(result.document?.fhirIdentity?.reserved).toEqual([`Observation/${generatedCariesId()}`]);
  });

  it("moves the generated write off a reserved id instead of overwriting it", () => {
    const loaded = load([textFinding(generatedCariesId())]).document!;
    const plan = cariesPlan({ ...cariesDocument(), fhirIdentity: loaded.fhirIdentity });
    const paths = plan.ops.map((op) => `${op.method} ${op.path}`);
    expect(paths).not.toContain(`PUT /Observation/${generatedCariesId()}`);
    expect(paths).not.toContain(`DELETE /Observation/${generatedCariesId()}`);
    const caries = plan.ops.find((op) => op.identityKey === CARIES_KEY);
    expect(caries?.method).toBe("PUT");
    expect(caries?.id).not.toBe(generatedCariesId());
    expect(caries?.id.startsWith(`odo-${PATIENT}-`)).toBe(true);
  });

  it("re-ids deterministically, so a second save writes the same resource again", () => {
    const loaded = load([textFinding(generatedCariesId())]).document!;
    const first = cariesPlan({ ...cariesDocument(), fhirIdentity: loaded.fhirIdentity });
    const second = cariesPlan({ ...cariesDocument(), fhirIdentity: loaded.fhirIdentity });
    expect(first.ops.find((op) => op.identityKey === CARIES_KEY)?.id)
      .toBe(second.ops.find((op) => op.identityKey === CARIES_KEY)?.id);
  });

  it("reads the moved write back beside the resource it left alone", () => {
    const loaded = load([textFinding(generatedCariesId())]).document!;
    const plan = cariesPlan({ ...cariesDocument(), fhirIdentity: loaded.fhirIdentity });
    const server = new Map<string, ResourceRecord>([[`/Observation/${generatedCariesId()}`, textFinding(generatedCariesId())]]);
    for (const op of plan.ops) {
      if (op.method === "PUT") server.set(op.path, op.resource as unknown as ResourceRecord);
      else server.delete(op.path);
    }
    const reloaded = load([...server.values()]);
    expect(reloaded.report.parsed).toBe(true);
    expect(reloaded.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(reloaded.report.unsupported.map((entry) => entry.reference)).toEqual([`Observation/${generatedCariesId()}`]);
    expect(reloaded.document?.fhirIdentity?.reserved).toEqual([`Observation/${generatedCariesId()}`]);
  });

  it("never deletes a reserved id, even when a stale identity names it", () => {
    const plan = buildWritePlan({
      document: {
        version: PAYLOAD_VERSION,
        globals: {},
        teeth: {},
        fhirIdentity: {
          resources: { [CARIES_KEY]: { id: generatedCariesId() } },
          reserved: [`Observation/${generatedCariesId()}`],
        },
      } as OdontogramDocument,
      patientId: PATIENT,
      effectiveDateTime: "2026-09-25",
    });
    expect(plan.ops.map((op) => op.path)).not.toContain(`/Observation/${generatedCariesId()}`);
  });

  it("does not reserve unsupported resources at ids this mode never generates", () => {
    const result = load([textFinding("foreign-finding")]);
    expect(result.document?.fhirIdentity?.reserved ?? []).toEqual([]);
  });

  it("carries the reservation through a session load and save", async () => {
    const foreign = textFinding(generatedCariesId());
    const gateway: AidboxGateway = {
      async readPatient() { return patient(); },
      async search(resourceType: string) {
        return { resources: resourceType === "Observation" ? [foreign] : [], truncated: false, incomplete: false };
      },
      async put() { return {}; },
      async delete() { return {}; },
    } as unknown as AidboxGateway;
    const session = createOdontogramSession();
    const result = await session.loadFromAidbox(gateway, PATIENT);
    expect(result.report.parsed).toBe(true);
    session.setDocument({ ...session.getDocument(), ...cariesDocument(), fhirIdentity: session.getDocument().fhirIdentity });
    const seen: string[] = [];
    await session.saveToAidbox(
      { async put(path: string) { seen.push(`PUT ${path}`); return {}; }, async delete(path: string) { seen.push(`DELETE ${path}`); return {}; } },
      { patientId: PATIENT, effectiveDateTime: "2026-09-25" },
    );
    expect(seen.some((entry) => entry.startsWith("PUT /Observation/"))).toBe(true);
    expect(seen).not.toContain(`PUT /Observation/${generatedCariesId()}`);
    expect(seen).not.toContain(`DELETE /Observation/${generatedCariesId()}`);
  });
});
