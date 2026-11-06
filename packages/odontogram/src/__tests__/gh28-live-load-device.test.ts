// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// cognovis/odontogram#28: the codec writes a placed implant as a
// `dental-implant` Device and reads it back — but only when it is in the
// collection. A live load that never searches Device loses the implant's
// position. A Device names its patient in `patient`, not `subject`, so it has
// to be searched by that parameter.

import { describe, it, expect } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import { buildDentalCoreBundle } from "../fhir/toFhirDentalCore";
import { loadPatientChart } from "../live/load";
import { planGuardedSave, SaveStoreCheckError, SaveUndeletableResourceError } from "../live/save";

const PATIENT = "p-28";
const SUBJECT = `Patient/${PATIENT}`;

type Resource = Record<string, unknown> & { resourceType: string };

/** Which reference a resource type is searched by on a FHIR R4 server. */
const PATIENT_PARAM: Record<string, string> = {
  Observation: "subject",
  Condition: "subject",
  ServiceRequest: "subject",
  CarePlan: "subject",
  Device: "patient",
};

function storedResources(teeth: Record<string, unknown> = { "36": { toothSelection: "implant", implantPosition: "mesial" } }, effectiveDateTime = "2026-10-25"): Resource[] {
  const document = { version: PAYLOAD_VERSION, globals: {}, teeth } as unknown as OdontogramDocument;
  const bundle = buildDentalCoreBundle(document, { subject: SUBJECT, effectiveDateTime });
  // A store hands resources back under ids, and a reference between two of
  // them as `Type/id`, never as the bundle's `urn:uuid` full URL.
  const ids = new Map((bundle.entry ?? []).map((entry, index) => [entry.fullUrl!, `${entry.resource!.resourceType}/stored-${index}`]));
  let json = JSON.stringify((bundle.entry ?? []).map((entry) => ({ ...entry.resource, id: ids.get(entry.fullUrl!)!.split("/")[1] })));
  for (const [fullUrl, reference] of ids) json = json.split(`"${fullUrl}"`).join(`"${reference}"`);
  return JSON.parse(json) as Resource[];
}

/** A store that answers a search only by the parameter its resource type supports. */
function gatewayOver(resources: Resource[]) {
  const searches: Array<[string, Record<string, string | string[]>]> = [];
  return {
    searches,
    async readPatient() { return { resourceType: "Patient", id: PATIENT }; },
    async search(resourceType: string, query: Record<string, string | string[]>) {
      searches.push([resourceType, query]);
      if (typeof query._id === "string") {
        const ids = query._id.split(",");
        return { resources: resources.filter((resource) => resource.resourceType === resourceType && ids.includes(resource.id as string)), truncated: false, incomplete: false };
      }
      const param = PATIENT_PARAM[resourceType];
      if (!param || Object.keys(query).join() !== param) {
        throw Object.assign(new Error(`${resourceType} has no search parameter ${Object.keys(query).join()}`), { status: 400 });
      }
      const matches = resources.filter((resource) => resource.resourceType === resourceType
        && (resource[param] as { reference?: string } | undefined)?.reference === query[param]);
      return { resources: matches, truncated: false, incomplete: false };
    },
    async put() { return {}; },
    async delete() { return {}; },
  };
}

describe("cognovis/odontogram#28: a live load reads the implant Device", () => {
  it("reads back a placed implant's position", async () => {
    const result = await loadPatientChart(gatewayOver(storedResources()), PATIENT);
    expect(result.report).toMatchObject({ parsed: true, unsupported: [] });
    expect(result.document?.teeth["36"]).toMatchObject({ toothSelection: "implant", implantPosition: "mesial" });
  });

  it("searches a Device by patient and a finding by subject", async () => {
    const gateway = gatewayOver(storedResources());
    await loadPatientChart(gateway, PATIENT);
    expect(gateway.searches).toContainEqual(["Device", { patient: SUBJECT }]);
    expect(gateway.searches).toContainEqual(["Observation", { subject: SUBJECT }]);
  });

  it("reads the stored chart for a guarded save by the same parameters", async () => {
    const gateway = gatewayOver(storedResources());
    const loaded = await loadPatientChart(gateway, PATIENT);
    gateway.searches.length = 0;
    await planGuardedSave(gateway, { document: loaded.document!, patientId: PATIENT, effectiveDateTime: "2026-10-25" });
    expect(gateway.searches).toContainEqual(["Device", { patient: SUBJECT }]);
    expect(gateway.searches).toContainEqual(["Observation", { subject: SUBJECT }]);
  });

  it("still reads every device type it writes", async () => {
    const teeth = {
      "11": { orthoAppliance: "bracket" },
      "12": { orthoAppliance: "band" },
      "14": { parapulpalPin: true },
      "15": { restorationType: "crown", restorationMaterial: "zircon", bridgePillar: true },
      "24": { retention: "clasp" },
      "25": { restorationType: "crown", restorationMaterial: "zircon", retention: "attachment" },
      "26": { restorationType: "crown", restorationMaterial: "zircon", retention: "bar-abutment" },
    };
    const result = await loadPatientChart(gatewayOver(storedResources(teeth)), PATIENT);
    expect(result.report).toMatchObject({ parsed: true, unsupported: [] });
    expect(result.document?.teeth).toMatchObject(teeth);
  });

  it("reports a Dental Core device of a type it does not map, and charts the rest", async () => {
    const prosthesis: Resource = {
      resourceType: "Device",
      id: "practice-prosthesis",
      meta: { profile: ["https://fhir.cognovis.de/dental-core/StructureDefinition/dental-device"] },
      status: "active",
      type: { text: "Erweiterte herausnehmbare Teilprothese" },
      patient: { reference: SUBJECT },
      extension: [{
        url: "https://fhir.cognovis.de/dental-core/StructureDefinition/tooth-position",
        valueCoding: { system: "https://fhir.cognovis.de/dental-core/CodeSystem/tooth-position-fdi", code: "17" },
      }],
    };
    const result = await loadPatientChart(gatewayOver([...storedResources(), prosthesis]), PATIENT);
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported).toEqual([{
      reference: "Device/practice-prosthesis",
      profile: "https://fhir.cognovis.de/dental-core/StructureDefinition/dental-device",
      reason: "The device type \"Erweiterte herausnehmbare Teilprothese\" is outside this odontogram's mappings",
    }]);
    expect(result.document?.teeth["36"]).toMatchObject({ implantPosition: "mesial" });
  });

  // The patient's Devices include ones no longer in the mouth — an explanted
  // implant stays associated with its patient. The codec charts only an active
  // Device, so an inactive one is reported, not offered.
  it("reports an inactive implant Device, and charts the rest", async () => {
    const [explanted] = storedResources().filter((resource) => resource.resourceType === "Device");
    const inactive = { ...explanted, id: "explanted-46", status: "inactive" };
    const result = await loadPatientChart(gatewayOver([...storedResources({ "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } } }), inactive]), PATIENT);
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported).toEqual([{
      reference: "Device/explanted-46",
      profile: "https://fhir.cognovis.de/dental-core/StructureDefinition/dental-implant",
      reason: "A Device with status \"inactive\" is not part of the current chart",
    }]);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
  });

  // The Device is outside the write policy, so a save can neither change nor
  // remove it. Charted as missing, tooth 36 would contradict its Device and the
  // next load would refuse the whole chart; reset to healthy, it would come
  // back as an implant from the Device. Either way the edit cannot be saved.
  for (const [edit, tooth] of [["missing", { toothSelection: "none" }], ["healthy", {}]] as const) {
    for (const route of ["a searchable store", "a write-only target"]) {
      it(`refuses to save the implant at 36 as ${edit} through ${route}`, async () => {
        const gateway = gatewayOver(storedResources());
        const loaded = await loadPatientChart(gateway, PATIENT);
        const edited = { ...loaded.document!, teeth: { ...loaded.document!.teeth, "36": tooth } } as OdontogramDocument;
        const target: Parameters<typeof planGuardedSave>[0] = route === "a searchable store" ? gateway : {};
        await expect(planGuardedSave(target, { document: edited, patientId: PATIENT, effectiveDateTime: "2026-10-25" }))
          .rejects.toThrow(SaveUndeletableResourceError);
      });
    }
  }

  it("lets an ordinary edit beside a stored Device through", async () => {
    const gateway = gatewayOver(storedResources());
    const loaded = await loadPatientChart(gateway, PATIENT);
    const edited = {
      ...loaded.document!,
      teeth: { ...loaded.document!.teeth, "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } } },
    } as OdontogramDocument;
    const plan = await planGuardedSave(gateway, { document: edited, patientId: PATIENT, effectiveDateTime: "2026-10-25" });
    expect(plan.ops.some((op) => op.resourceType === "Observation")).toBe(true);
  });

  // A peri-implant finding names the Device in `focus`, and a Device is not
  // written, so the finding is not rewritten either and keeps its date. Every
  // other finding takes the new one — and the codec refuses a chart whose
  // findings disagree on the examination date.
  it("refuses a save that would leave the stored chart unreadable", async () => {
    const gateway = gatewayOver(storedResources({ "36": { toothSelection: "implant", periImplant: "mucositis" } }, "2026-10-24"));
    const loaded = await loadPatientChart(gateway, PATIENT);
    expect(loaded.report.parsed).toBe(true);
    const edited = {
      ...loaded.document!,
      teeth: { ...loaded.document!.teeth, "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } } },
    } as OdontogramDocument;
    await expect(planGuardedSave(gateway, { document: edited, patientId: PATIENT, effectiveDateTime: "2026-10-25" }))
      .rejects.toThrow(SaveStoreCheckError);
  });

  // With a store to search, the store says which Devices exist. A Device the
  // document only names — an imported file's identities — is nothing a save
  // could leave behind.
  it("does not refuse over a Device the searchable store does not hold", async () => {
    const loaded = await loadPatientChart(gatewayOver(storedResources()), PATIENT);
    const edited = {
      ...loaded.document!,
      teeth: { "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 3 } } },
    } as OdontogramDocument;
    const plan = await planGuardedSave(gatewayOver([]), { document: edited, patientId: PATIENT, effectiveDateTime: "2026-10-25" });
    expect(plan.ops.some((op) => op.resourceType === "Observation")).toBe(true);
  });
});
