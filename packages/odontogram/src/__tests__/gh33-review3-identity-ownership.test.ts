// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// cognovis/odontogram#33, third review of PR #34: "this patient's chart
// resource" is not enough to overwrite one. A stored resource at a generated
// id belongs to the CHART IDENTITY the load derives for it (tooth, surface,
// finding kind …). A write for another identity must not land there: it moves
// to a replacement id, and a removal naming it is dropped. A write for the
// same identity updates it in place.

import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import type { AidboxGateway } from "../live/gateway";
import { assembleLoadResult } from "../live/load";
import { buildWritePlan, deterministicResourceId } from "../live/writePlan";
import { createOdontogramSession } from "../index";

const PATIENT = "p-33o";
const EFFECTIVE = "2026-09-25";
const KEY_16 = "Observation/caries/16/occlusal";
const KEY_17 = "Observation/caries/17/occlusal";
const id16 = (): string => deterministicResourceId(PATIENT, KEY_16);

type ResourceRecord = Record<string, unknown> & { resourceType: string; id: string };

function document(teeth: OdontogramDocument["teeth"]): OdontogramDocument {
  return { version: PAYLOAD_VERSION, globals: {}, teeth } as OdontogramDocument;
}

const caries = (severity: number) => ({ caries: ["caries-occlusal"], cariesSeverity: { occlusal: severity } });

/** The chart's own caries resource for `key`, stored at `id`. */
function chartResource(teeth: OdontogramDocument["teeth"], key: string, id: string): ResourceRecord {
  const op = buildWritePlan({ document: document(teeth), patientId: PATIENT, effectiveDateTime: EFFECTIVE })
    .ops.find((candidate) => candidate.identityKey === key);
  if (!op?.resource) throw new Error(`no write for ${key}`);
  return { ...(op.resource as unknown as ResourceRecord), id };
}

function store(initial: ResourceRecord[]) {
  const resources = new Map<string, ResourceRecord>(initial.map((resource) => [`/${resource.resourceType}/${resource.id}`, resource]));
  const log: string[] = [];
  const gateway = {
    async readPatient() { return { resourceType: "Patient", id: PATIENT }; },
    async search(resourceType: string, query: Record<string, string | string[]>) {
      const ids = typeof query._id === "string" ? query._id.split(",") : undefined;
      const subject = typeof query.subject === "string" ? query.subject : undefined;
      const found = [...resources.values()].filter((resource) =>
        resource.resourceType === resourceType
        && (!ids || ids.includes(resource.id))
        && (!subject || (resource.subject as { reference?: string } | undefined)?.reference === subject));
      return { resources: found, truncated: false, incomplete: false };
    },
    async put(path: string, resource: unknown) {
      log.push(`PUT ${path}`);
      resources.set(path, resource as ResourceRecord);
      return resource;
    },
    async delete(path: string) {
      log.push(`DELETE ${path}`);
      resources.delete(path);
      return {};
    },
  };
  return { resources, log, gateway: gateway as AidboxGateway & typeof gateway };
}

function reload(resources: Iterable<ResourceRecord>) {
  return assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }, ...resources] });
}

const toothAt = (resource: ResourceRecord | undefined): string | undefined =>
  ((resource?.bodySite as { coding?: Array<{ code?: string }> } | undefined)?.coding ?? [])[0]?.code;

describe("gh-33 review 3: a stored resource belongs to its chart identity", () => {
  it("loads tooth 17's caries stored at tooth 16's generated id (fixture sanity)", () => {
    const loaded = reload([chartResource({ "17": caries(5) }, KEY_17, id16())]);
    expect(loaded.report.parsed).toBe(true);
    expect(loaded.document?.teeth["17"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(loaded.document?.fhirIdentity?.resources?.[KEY_17]?.id).toBe(id16());
  });

  it("does not write tooth 16 over tooth 17's finding after a load", async () => {
    const server = store([chartResource({ "17": caries(5) }, KEY_17, id16())]);
    const session = createOdontogramSession();
    await session.loadFromAidbox(server.gateway, PATIENT);
    const loaded = session.getDocument();
    session.setDocument({ ...loaded, teeth: { ...loaded.teeth, "16": caries(3) }, fhirIdentity: loaded.fhirIdentity });
    const result = await session.saveToAidbox(server.gateway, { patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(result.failure).toBeUndefined();
    expect(toothAt(server.resources.get(`/Observation/${id16()}`))).toBe("17");
    expect(result.written.find((op) => op.identityKey === KEY_16)?.id).not.toBe(id16());
    const after = reload(server.resources.values());
    expect(after.report.parsed).toBe(true);
    expect(after.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } });
    expect(after.document?.teeth["17"]).toMatchObject({ caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } });
  });

  it("does not write tooth 16 over tooth 17's finding when the host dropped fhirIdentity", async () => {
    const server = store([chartResource({ "17": caries(5) }, KEY_17, id16())]);
    const result = await createOdontogramSession(document({ "16": caries(3), "17": caries(5) }))
      .saveToAidbox(server.gateway, { patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(result.failure).toBeUndefined();
    expect(toothAt(server.resources.get(`/Observation/${id16()}`))).toBe("17");
    const after = reload(server.resources.values());
    expect(after.report.parsed).toBe(true);
    expect(after.report.unsupported).toEqual([]);
    expect(after.document?.teeth["16"]).toMatchObject({ cariesSeverity: { occlusal: 3 } });
    expect(after.document?.teeth["17"]).toMatchObject({ cariesSeverity: { occlusal: 5 } });
  });

  it("updates a finding of the same identity in place", async () => {
    const server = store([chartResource({ "16": caries(5) }, KEY_16, id16())]);
    const result = await createOdontogramSession(document({ "16": caries(2) }))
      .saveToAidbox(server.gateway, { patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(result.written.find((op) => op.identityKey === KEY_16)?.id).toBe(id16());
    expect(server.log).toContain(`PUT /Observation/${id16()}`);
    const after = reload(server.resources.values());
    expect(after.document?.teeth["16"]).toMatchObject({ cariesSeverity: { occlusal: 2 } });
  });

  it("drops a removal whose id now holds another identity", async () => {
    const server = store([chartResource({ "17": caries(5) }, KEY_17, id16())]);
    const stale = { ...document({}), fhirIdentity: { resources: { [KEY_16]: { id: id16() } }, reserved: [] } } as OdontogramDocument;
    await createOdontogramSession(stale).saveToAidbox(server.gateway, { patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(server.log).not.toContain(`DELETE /Observation/${id16()}`);
    expect(toothAt(server.resources.get(`/Observation/${id16()}`))).toBe("17");
  });

  it("still deletes a cleared finding of the same identity", async () => {
    const server = store([chartResource({ "16": caries(5) }, KEY_16, id16())]);
    const loaded = reload(server.resources.values()).document!;
    await createOdontogramSession({ ...document({}), fhirIdentity: loaded.fhirIdentity })
      .saveToAidbox(server.gateway, { patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(server.log).toContain(`DELETE /Observation/${id16()}`);
  });
});
