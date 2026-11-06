// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// cognovis/odontogram#33, second review of PR #34.
//
//   1. The required FDI binding is a VALUE SET, not a system: a `bodySite`
//      code outside `tooth-position-fdi` (e.g. `99`) is broken data and must
//      reach the rejecting codec. The value set is pinned against the Dental
//      Core 0.8.1 package artifacts vendored under fixtures/dental-core-0.8.1.
//
//   2. A save must be safe even when the host drops `fhirIdentity` (and with it
//      the `reserved` sidecar). The store is asked before writing: every id the
//      plan would PUT to or DELETE is looked up through the target's `search`,
//      and a resource there that the chart did not produce is never touched —
//      the generated write moves to another deterministic id. A target that
//      cannot search is written to only when the load's reservations are
//      known; otherwise the save refuses before its first write.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import { FDI_TOOTH_POSITIONS } from "../fhir/dentalCoreConformance";
import { assembleLoadResult } from "../live/load";
import { buildWritePlan, deterministicResourceId } from "../live/writePlan";
import { SaveReservationsUnknownError } from "../live/save";
import { createOdontogramSession } from "../index";

const PATIENT = "p-33s";
const DC = "https://fhir.cognovis.de/dental-core";
const FDI_SYSTEM = `${DC}/CodeSystem/tooth-position-fdi`;
const FIXTURES = join(__dirname, "fixtures", "dental-core-0.8.1");

type ResourceRecord = Record<string, unknown> & { resourceType: string; id: string };

describe("gh-33 review 2.1: the FDI binding is checked against the value set", () => {
  it("pins the value set to the Dental Core 0.8.1 CodeSystem it includes", () => {
    const valueSet = JSON.parse(readFileSync(join(FIXTURES, "ValueSet-tooth-position-fdi.json"), "utf8")) as {
      version: string;
      compose: { include: Array<{ system: string; concept?: unknown }> };
    };
    const codeSystem = JSON.parse(readFileSync(join(FIXTURES, "CodeSystem-tooth-position-fdi.json"), "utf8")) as {
      url: string;
      version: string;
      content: string;
      concept: Array<{ code: string }>;
    };
    expect(valueSet.version).toBe("0.8.1");
    expect(valueSet.compose.include).toEqual([{ system: FDI_SYSTEM }]);
    expect(codeSystem.url).toBe(FDI_SYSTEM);
    expect(codeSystem.content).toBe("complete");
    expect([...FDI_TOOTH_POSITIONS].sort()).toEqual(codeSystem.concept.map((concept) => concept.code).sort());
  });

  function swsToothState(code: string): ResourceRecord {
    return {
      resourceType: "Observation",
      id: `tooth-state-${code}`,
      meta: { profile: [`${DC}/StructureDefinition/dental-tooth-state`] },
      status: "final",
      code: { coding: [{ system: `${DC}/CodeSystem/dental-component`, code: "tooth-presence" }] },
      subject: { reference: `Patient/${PATIENT}` },
      effectiveDateTime: "2026-07-28",
      bodySite: { coding: [{ system: FDI_SYSTEM, code }] },
      component: [{
        code: { coding: [{ system: `${DC}/CodeSystem/dental-component`, code: "tooth-presence" }] },
        valueCodeableConcept: { coding: [{ system: "https://fhir.cognovis.de/dental/CodeSystem/sws2-zahnstatus", code: "g" }] },
      }],
    };
  }

  it("rejects a tooth state whose FDI code is outside the value set", () => {
    const result = assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }, swsToothState("99")] });
    expect(result.report.parsed).toBe(false);
    expect(result.report.rejectedAt).toBe("Observation/tooth-state-99");
    expect(result.report.unsupported).toEqual([]);
  });

  it("still sets aside a conformant tooth state it cannot map", () => {
    const result = assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }, swsToothState("16")] });
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported.map((entry) => entry.reference)).toEqual(["Observation/tooth-state-16"]);
  });
});

// ---------------------------------------------------------------------------

const CARIES_KEY = "Observation/caries/16/occlusal";
const generatedCariesId = (): string => deterministicResourceId(PATIENT, CARIES_KEY);

function cariesDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: { "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } } },
  } as OdontogramDocument;
}

/** A conformant, text-coded finding the chart cannot map, at the id caries on 16 would use. */
function foreignFinding(): ResourceRecord {
  return {
    resourceType: "Observation",
    id: generatedCariesId(),
    meta: { profile: [`${DC}/StructureDefinition/dental-finding`] },
    status: "final",
    code: { text: "Restorative follow-up" },
    subject: { reference: `Patient/${PATIENT}` },
    effectiveDateTime: "2026-07-28",
    valueString: "Deep fissures, no cavitation.",
  };
}

/** An in-memory FHIR store that answers `_id` searches the way Aidbox does. */
function store(initial: ResourceRecord[]) {
  const resources = new Map<string, ResourceRecord>(initial.map((resource) => [`/${resource.resourceType}/${resource.id}`, resource]));
  const log: string[] = [];
  const searches: Array<{ resourceType: string; query: Record<string, string | string[]> }> = [];
  return {
    resources,
    log,
    searches,
    async readPatient() { return { resourceType: "Patient", id: PATIENT }; },
    async search(resourceType: string, query: Record<string, string | string[]>) {
      searches.push({ resourceType, query });
      const ids = typeof query._id === "string" ? query._id.split(",") : Array.isArray(query._id) ? query._id.flatMap((value) => value.split(",")) : undefined;
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
}

describe("gh-33 review 2.2: a save is safe without the host-carried sidecar", () => {
  it("the unguarded plan would PUT to the foreign finding's id (the reproduction)", () => {
    const plan = buildWritePlan({ document: cariesDocument(), patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(plan.ops.map((op) => op.path)).toContain(`/Observation/${generatedCariesId()}`);
  });

  it("asks the store and moves the write when the host dropped fhirIdentity", async () => {
    const server = store([foreignFinding()]);
    const session = createOdontogramSession(cariesDocument());
    const result = await session.saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(result.failure).toBeUndefined();
    expect(server.log).not.toContain(`PUT /Observation/${generatedCariesId()}`);
    expect(server.resources.get(`/Observation/${generatedCariesId()}`)).toEqual(foreignFinding());
    expect(server.searches.some((entry) => entry.resourceType === "Observation" && typeof entry.query._id === "string")).toBe(true);
    const cariesWrite = result.written.find((op) => op.identityKey === CARIES_KEY);
    expect(cariesWrite?.method).toBe("PUT");
    expect(cariesWrite?.id).not.toBe(generatedCariesId());
  });

  it("reads the moved caries back and leaves the foreign finding listed", async () => {
    const server = store([foreignFinding()]);
    await createOdontogramSession(cariesDocument()).saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    const reloaded = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...server.resources.values()],
    });
    expect(reloaded.report.parsed).toBe(true);
    expect(reloaded.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(reloaded.report.unsupported.map((entry) => entry.reference)).toEqual([`Observation/${generatedCariesId()}`]);
  });

  it("overwrites what the chart itself wrote, so a re-save stays in place", async () => {
    const server = store([]);
    const first = await createOdontogramSession(cariesDocument()).saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    const second = await createOdontogramSession(cariesDocument()).saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(first.written.find((op) => op.identityKey === CARIES_KEY)?.id).toBe(generatedCariesId());
    expect(second.written.find((op) => op.identityKey === CARIES_KEY)?.id).toBe(generatedCariesId());
  });

  it("never deletes a foreign resource a stale identity names", async () => {
    const server = store([foreignFinding()]);
    const document = {
      ...cariesDocument(),
      teeth: {},
      fhirIdentity: { resources: { [CARIES_KEY]: { id: generatedCariesId() } } },
    } as OdontogramDocument;
    await createOdontogramSession(document).saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(server.log).not.toContain(`DELETE /Observation/${generatedCariesId()}`);
    expect(server.resources.has(`/Observation/${generatedCariesId()}`)).toBe(true);
  });

  it("treats another patient's chart resource at the id as foreign", async () => {
    const other = { ...foreignFinding(), subject: { reference: "Patient/somebody-else" } };
    const server = store([other]);
    await createOdontogramSession(cariesDocument()).saveToAidbox(server, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(server.log).not.toContain(`PUT /Observation/${generatedCariesId()}`);
  });

  it("refuses before any write when the target cannot search and reservations are unknown", async () => {
    const log: string[] = [];
    const target = {
      async put(path: string) { log.push(`PUT ${path}`); return {}; },
      async delete(path: string) { log.push(`DELETE ${path}`); return {}; },
    };
    await expect(createOdontogramSession(cariesDocument()).saveToAidbox(target, { patientId: PATIENT, effectiveDateTime: "2026-09-25" }))
      .rejects.toBeInstanceOf(SaveReservationsUnknownError);
    expect(log).toEqual([]);
  });

  it("writes through a target that cannot search when the load's reservations are known", async () => {
    const loaded = assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }, foreignFinding()] });
    expect(loaded.document?.fhirIdentity?.reserved).toEqual([`Observation/${generatedCariesId()}`]);
    const log: string[] = [];
    const target = {
      async put(path: string) { log.push(`PUT ${path}`); return {}; },
      async delete(path: string) { log.push(`DELETE ${path}`); return {}; },
    };
    await createOdontogramSession({ ...cariesDocument(), fhirIdentity: loaded.document?.fhirIdentity })
      .saveToAidbox(target, { patientId: PATIENT, effectiveDateTime: "2026-09-25" });
    expect(log.length).toBeGreaterThan(0);
    expect(log).not.toContain(`PUT /Observation/${generatedCariesId()}`);
  });

  it("marks the reservations of every successful load as known, even an empty one", () => {
    const loaded = assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }] });
    expect(loaded.document?.fhirIdentity?.reserved).toEqual([]);
  });
});
