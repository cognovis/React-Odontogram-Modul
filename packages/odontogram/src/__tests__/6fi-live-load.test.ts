// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi, seam 3: the read path.
//
// The property this file is about: the Dental Core codec is ALL-OR-NOTHING —
// one resource it does not know makes `parseDentalCoreBundle` reject the whole
// bundle. A practice server carries foreign dental resources — the charly
// adapter's `ze-befund` Observations are the case this bead names — so they are
// partitioned out and REPORTED (id + profile), never silently dropped and never
// fed to the codec, where they would take the rest of the chart down with them.
//
// Bead odontogram-0w9 moved the PAGING half of this suite out. Those cases
// drove `searchAllPages` against a fake transport, i.e. they were about how a
// server answers rather than about what a chart is, and they now live with the
// transport in `@cognovis/react-odontogram-fhir`. Everything here drives
// `loadPatientChart` / `assembleLoadResult` through a fake GATEWAY, which is
// the SDK's own HTTP-free seam — including the one CHART-level consequence of
// unstable pagination (a load that fails rather than showing a mouth with a
// tooth missing), because whether a chart may be shown is decided here.

import { describe, it, expect } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import { buildWritePlan } from "../live/writePlan";
import { assembleLoadResult, loadPatientChart } from "../live/load";

const PATIENT = "p-1";
const EFFECTIVE = "2026-08-23";

const CHARLY_PROFILE = "https://fhir.cognovis.de/dental/StructureDefinition/dental-finding";

/** A tooth finding exactly as the charly adapter emits it (bead odontogram-6fi recon). */
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

function chartedDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      "16": { caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } },
      "26": { restorationType: "crown", restorationMaterial: "zircon", crownReplace: true },
      "36": { endo: "endo-filling" },
    },
    plan: { "36": { restorationType: "crown", restorationMaterial: "zircon" } },
  } as OdontogramDocument;
}

/**
 * The resources a server would hold after this document was saved once — the
 * LAST write per path, since the CarePlan is written twice (bare, then
 * complete) to break the plan's reference cycle.
 */
function savedResources(): Record<string, unknown>[] {
  const byPath = new Map<string, Record<string, unknown>>();
  for (const op of buildWritePlan({ document: chartedDocument(), patientId: PATIENT, effectiveDateTime: EFFECTIVE }).ops) {
    byPath.set(op.path, op.resource as unknown as Record<string, unknown>);
  }
  return [...byPath.values()];
}

// Reviewer 2's claim, checked rather than assumed: the codec pairs a
// `diagnosisOverride` Condition with a clinical Provenance and REQUIRES both on
// read (`if (diagnosis || provenance) ... if (!provenance) return undefined`).
// A Provenance is outside the write policy, while the Condition has no
// unresolved outgoing reference of its own — so without a companion rule the
// Condition is written alone and the next load rejects the WHOLE chart.
describe("odontogram-6fi: a resource whose required companion is not written", () => {
  function diagnosisDocument(): OdontogramDocument {
    return { ...chartedDocument(), case: { diagnosisOverride: "periodontitis" } } as OdontogramDocument;
  }

  it("does not write the periodontal-diagnosis Condition without its Provenance", () => {
    const plan = buildWritePlan({ document: diagnosisDocument(), patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(plan.ops.some((op) => op.identityKey === "Condition/periodontal-diagnosis")).toBe(false);
    const skipped = plan.skipped.find((entry) => entry.identityKey === "Condition/periodontal-diagnosis");
    expect(skipped?.reason).toMatch(/Provenance/i);
  });

  it("keeps the rest of that chart loadable — the whole point of not writing it", () => {
    const plan = buildWritePlan({ document: diagnosisDocument(), patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    const byPath = new Map<string, Record<string, unknown>>();
    for (const op of plan.ops) byPath.set(op.path, op.resource as unknown as Record<string, unknown>);
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...byPath.values()],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
  });
});

describe("odontogram-6fi: a truncated search reaches the load report", () => {
  const gateway = {
    async readPatient() { return { resourceType: "Patient", id: PATIENT }; },
    async search(resourceType: string) {
      return {
        resources: resourceType === "Observation" ? (savedResources() as unknown[]) : [],
        truncated: resourceType === "Observation",
        incomplete: false,
      };
    },
    async put() { return {}; },
    async delete() { return {}; },
  };

  it("names the resource type whose search was cut short", async () => {
    const result = await loadPatientChart(gateway, PATIENT);
    expect(result.report.truncated).toEqual(["Observation"]);
    expect(result.report.error).toMatch(/partial|truncat/i);
  });
});

describe("odontogram-6fi: assembling a load", () => {
  it("hydrates the charted document back out of the saved resources", () => {
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...savedResources()],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"], cariesSeverity: { occlusal: 5 } });
    expect(result.document?.teeth["26"]).toMatchObject({ restorationType: "crown", restorationMaterial: "zircon" });
    expect(result.document?.plan?.["36"]).toMatchObject({ restorationType: "crown" });
  });

  it("carries the server ids back, so the next save updates instead of duplicating", () => {
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...savedResources()],
    });
    const identities = result.document?.fhirIdentity?.resources ?? {};
    expect(Object.keys(identities).length).toBeGreaterThan(0);
    const replan = buildWritePlan({ document: result.document!, patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    const original = buildWritePlan({ document: chartedDocument(), patientId: PATIENT, effectiveDateTime: EFFECTIVE });
    expect(replan.ops.map((op) => op.path).sort()).toEqual(original.ops.map((op) => op.path).sort());
  });

  it("lists a charly-dialect Observation as unsupported instead of dropping it", () => {
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...savedResources(), charlyObservation()],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported).toEqual([
      expect.objectContaining({
        reference: "Observation/charly-tooth-11",
        profile: CHARLY_PROFILE,
      }),
    ]);
    expect(result.report.unsupported[0].reason).toMatch(/not part of the Dental Core contract/i);
  });

  it("lists a Dental Core chart-state with an unmapped property as unsupported without rejecting the chart", () => {
    // Conformant to DentalChartState (fixed code, effective[x]) since
    // cognovis/odontogram#33: only a conformant resource may be set aside as
    // unsupported; a broken one goes to the codec and is refused.
    const foreign: Record<string, unknown> = {
      resourceType: "Observation",
      id: "foreign-chart-16",
      meta: { profile: ["https://fhir.cognovis.de/dental-core/StructureDefinition/dental-chart-state"] },
      status: "final",
      code: { coding: [{ system: "https://fhir.cognovis.de/dental-core/CodeSystem/dental-component", code: "chart-state" }] },
      subject: { reference: `Patient/${PATIENT}` },
      effectiveDateTime: EFFECTIVE,
      bodySite: { coding: [{ system: "https://fhir.cognovis.de/dental-core/CodeSystem/tooth-position-fdi", code: "16" }] },
      component: [{
        code: {
          coding: [{
            system: "https://fhir.cognovis.de/dental-core/CodeSystem/dental-chart-property",
            code: "not-an-odontogram-property",
          }],
        },
        valueCodeableConcept: {
          coding: [{
            system: "https://fhir.cognovis.de/dental-core/CodeSystem/dental-chart-value",
            code: "not-an-odontogram-value",
          }],
        },
      }],
    };
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...savedResources(), foreign],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(result.report.unsupported).toEqual([
      expect.objectContaining({
        reference: "Observation/foreign-chart-16",
        profile: "https://fhir.cognovis.de/dental-core/StructureDefinition/dental-chart-state",
        reason: expect.stringMatching(/outside this odontogram's mappings/),
      }),
    ]);
  });

  it("still charts the supported findings when a foreign resource sits beside them", () => {
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...savedResources(), charlyObservation()],
    });
    expect(result.document?.teeth["16"]).toMatchObject({ caries: ["caries-occlusal"] });
    expect(result.report.dentalCore).toBe(savedResources().length + 1);
  });

  it("reports a chart with nothing in it as an empty load, not as a failure", () => {
    const result = assembleLoadResult({ patientId: PATIENT, resources: [{ resourceType: "Patient", id: PATIENT }] });
    expect(result.report.parsed).toBe(true);
    expect(result.report.unsupported).toEqual([]);
    expect(result.document?.teeth).toEqual({});
  });

  it("says so visibly when the codec rejects the supported resources", () => {
    const broken = savedResources().map((resource, index) =>
      index === 0 ? { ...resource, subject: { reference: "Patient/someone-else" } } : resource);
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...broken],
    });
    expect(result.report.parsed).toBe(false);
    expect(result.document).toBeUndefined();
    expect(result.report.error).toMatch(/reject/i);
  });
});

// ---------------------------------------------------------------------------
// The whole-mouth round trip, and the silent partial that broke it.
//
// The failure the acceptance run hit is invisible at session scale: a mouth
// with four findings is 8 resources and fits in one page, while the app's own
// save of a normalised mouth is 128 — TWO pages at Aidbox's default page size
// of 100. Measured on the live fixture, `Observation/...tooth-state-16` was
// entry number 100, the first entry of page two: a load that lost that page
// PARSED CLEANLY and showed tooth 16 with no filling. A partial read that
// reads as a whole chart is the worst outcome available here, because the next
// save writes it back.
// ---------------------------------------------------------------------------

import { normalizeOdontogramDocument } from "../odontogram";

/** A normalised whole mouth (32 teeth) carrying ONE composite filling on 16. */
function wholeMouthDocument(): OdontogramDocument {
  const document = normalizeOdontogramDocument({ version: PAYLOAD_VERSION, globals: {}, teeth: {} } as OdontogramDocument);
  document.teeth["16"] = {
    ...document.teeth["16"],
    fillingSurfaces: ["occlusal"],
    fillingSurfaceMaterials: { occlusal: "composite" },
  };
  return document;
}

/** What the server holds after that document is saved once. */
function wholeMouthResources(): Record<string, unknown>[] {
  const plan = buildWritePlan({ document: wholeMouthDocument(), patientId: PATIENT, effectiveDateTime: EFFECTIVE });
  const byPath = new Map<string, Record<string, unknown>>();
  for (const op of plan.ops) {
    if (op.method === "DELETE") byPath.delete(op.path);
    else byPath.set(op.path, op.resource as unknown as Record<string, unknown>);
  }
  return [...byPath.values()];
}

describe("odontogram-6fi: the whole-mouth round trip", () => {
  it("saves and reads back a normalised mouth of more than one page", () => {
    const resources = wholeMouthResources();
    expect(resources.length).toBeGreaterThan(100);
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...resources],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({
      fillingSurfaces: ["occlusal"],
      fillingSurfaceMaterials: { occlusal: "composite" },
    });
  });

  it("says WHY the codec rejected a collection instead of only that it did", () => {
    const resources = wholeMouthResources();
    // One resource that belongs to somebody else is enough to make the codec
    // refuse the whole collection. The report has to name it.
    const poisoned = resources.map((resource, index) =>
      index === 40 ? { ...resource, subject: { reference: "Patient/somebody-else" } } : resource);
    const result = assembleLoadResult({
      patientId: PATIENT,
      resources: [{ resourceType: "Patient", id: PATIENT }, ...poisoned],
    });
    expect(result.report.parsed).toBe(false);
    expect(result.report.rejectedAt).toBe(`Observation/${poisoned[40].id as string}`);
    expect(result.report.error).toContain(poisoned[40].id as string);
  });
});

describe("odontogram-6fi: a page that never arrives", () => {
  const patient = { resourceType: "Patient", id: PATIENT };

  it("fails the load when the server says there are more resources than arrived", async () => {
    const gateway = {
      async readPatient() { return patient; },
      async search(resourceType: string) {
        const resources = resourceType === "Observation" ? (wholeMouthResources().slice(0, 100) as unknown[]) : [];
        return { resources, truncated: false, expected: resourceType === "Observation" ? 128 : 0, incomplete: resourceType === "Observation" };
      },
      async put() { return {}; },
      async delete() { return {}; },
    };
    const result = await loadPatientChart(gateway, PATIENT);
    // It would otherwise PARSE — that is the whole danger.
    expect(result.report.parsed).toBe(false);
    expect(result.document).toBeUndefined();
    expect(result.report.error).toMatch(/incomplete|partial/i);
    expect(result.report.incomplete).toEqual(["Observation"]);
  });

  it("lets a mid-search transport failure fail the load instead of returning a partial", async () => {
    const gateway = {
      async readPatient() { return patient; },
      async search() { throw Object.assign(new Error("Active Storage for 'null' not found"), { status: 500 }); },
      async put() { return {}; },
      async delete() { return {}; },
    };
    await expect(loadPatientChart(gateway, PATIENT)).rejects.toThrow(/Active Storage/);
  });
});

// ---------------------------------------------------------------------------
// Pagination without a stable sort — the CHART-level consequence.
//
// Aidbox paginates without a stable sort, so two pages of a 128-resource search
// return 128 resources of which only 100 to 118 are DISTINCT: some come twice,
// and just as many never come at all. The transport's own suite
// (`@cognovis/react-odontogram-fhir`, `0w9-aidbox-paging`) holds the measurements and
// the fix — a requested `_sort=_id` and a DISTINCT count, since 128 arrived
// against a total of 128 and a plain count could not see it.
//
// What belongs HERE is the decision the chart takes when that happens: the load
// FAILS. A mouth shown with a tooth silently missing is worse than no mouth at
// all, and only this layer knows that.
// ---------------------------------------------------------------------------

describe("odontogram-6fi: pagination without a stable sort", () => {
  it("fails the load when a duplicate means a resource is missing", async () => {
    const resources = wholeMouthResources();
    const gateway = {
      async readPatient() { return { resourceType: "Patient", id: PATIENT }; },
      async search(resourceType: string) {
        if (resourceType !== "Observation") return { resources: [], truncated: false, incomplete: false };
        // One resource duplicated in place of another, exactly as the unstable
        // pagination produced it.
        const served = [...resources.slice(0, resources.length - 1), resources[0]];
        const distinct = [...new Map(served.map((r) => [`${r.resourceType}/${r.id}`, r])).values()];
        return { resources: distinct as unknown[], truncated: false, expected: resources.length, incomplete: distinct.length < resources.length };
      },
      async put() { return {}; },
      async delete() { return {}; },
    };
    const result = await loadPatientChart(gateway, PATIENT);
    expect(result.report.parsed).toBe(false);
    expect(result.document).toBeUndefined();
    expect(result.report.incomplete).toEqual(["Observation"]);
  });
});

describe("odontogram-6fi: the codec is not order-sensitive", () => {
  // Recorded because it was suspected and disproved: the fix belongs at the
  // pagination, not at a canonical sort before the parse.
  function shuffled<T>(items: T[], seed: number): T[] {
    let state = seed;
    const random = () => {
      state |= 0; state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  it("reads a whole mouth back from any order the server returns it in", () => {
    const resources = wholeMouthResources();
    for (let seed = 1; seed <= 12; seed += 1) {
      const result = assembleLoadResult({
        patientId: PATIENT,
        resources: [{ resourceType: "Patient", id: PATIENT }, ...shuffled(resources, seed)],
      });
      expect(result.report.parsed, `seed ${seed}: ${result.report.error ?? ""}`).toBe(true);
      expect(result.document?.teeth["16"], `seed ${seed}`).toMatchObject({ fillingSurfaces: ["occlusal"] });
    }
  });
});
