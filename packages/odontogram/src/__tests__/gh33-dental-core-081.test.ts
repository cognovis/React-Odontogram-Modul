// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// cognovis/odontogram#33: the odontogram on @cognovis/fhir-sdk 0.15.5, which
// carries Dental Core 0.8.1.
//
// Pinned here: what the odontogram writes reads back through the same
// partition, and Dental Core 0.8.0 names the carriers of `extractionPlan`, `crownNeeded`
// and `crownReplace`: a DentalServiceRequest coded with SNOMED CT from
// `dental-tooth-order` (55162003 extraction, 426222000 crown fitting) and,
// for the crown, `restoration-renewal` saying whether an existing crown is
// replaced. The odontogram writes that carrier but does not read the local
// code it wrote before.

import { describe, expect, it } from "vitest";
import type { ServiceRequest } from "fhir/r4";
import { DentalServiceRequestProfile } from "@cognovis/fhir-sdk/dental-core";
import { DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS } from "@cognovis/fhir-sdk/canonicals";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import { buildDentalCoreBundle, parseDentalCoreBundle } from "../fhir";
import { assembleLoadResult } from "../live/load";
import { buildWritePlan, deterministicResourceId } from "../live/writePlan";

const SNOMED = "http://snomed.info/sct";
const FDI_SYSTEM = "https://fhir.cognovis.de/dental-core/CodeSystem/tooth-position-fdi";
const SERVICE_REQUEST_PROFILE = "https://fhir.cognovis.de/dental-core/StructureDefinition/dental-service-request";
const RENEWAL_URL = "https://fhir.cognovis.de/dental-core/StructureDefinition/restoration-renewal";

type ResourceRecord = Record<string, unknown> & { resourceType: string; id: string; meta?: { profile?: string[] } };

// ---------------------------------------------------------------------------
// What the odontogram writes must still read back through the same partition.
// ---------------------------------------------------------------------------

function clinicalDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      "16": {
        caries: ["caries-occlusal", "caries-mesial"],
        cariesSeverity: { occlusal: 5, mesial: 2 },
        rootCaries: "active",
        fillingSurfaces: ["distal", "buccal"],
        fillingSurfaceMaterials: { distal: "composite", buccal: "gic" },
        pulpDx: "necrosis",
        apicalDx: "acute-apical-abscess",
        radiographicDepth: { distal: "D2" },
        cervicalSurfaces: ["buccal"],
        note: "Monitor distal restoration",
        periapicalType: "cyst",
        wearEdge: "attrition",
      },
      "17": { toothSelection: "none", extractionPlan: true },
      "26": { restorationType: "crown", restorationMaterial: "zircon", crownReplace: true },
      "36": { endo: "endo-filling", crownNeeded: true },
      "46": {
        mobility: "m2",
        perio: { pd: { MB: 5, B: 4 }, gm: { MB: 1, B: 0 }, bop: ["MB"], sup: [] },
      },
    },
    plan: { "36": { restorationType: "crown", restorationMaterial: "zircon" } },
    case: { cigarettesPerDay: 12, toothLossPerio: 2, maxRblPercent: 24 },
  } as OdontogramDocument;
}

function savedResources(patientId: string, document: OdontogramDocument): ResourceRecord[] {
  const plan = buildWritePlan({ document, patientId, effectiveDateTime: "2026-09-25" });
  const byPath = new Map<string, ResourceRecord>();
  for (const op of plan.ops) {
    if (op.method === "DELETE") byPath.delete(op.path);
    else byPath.set(op.path, op.resource as unknown as ResourceRecord);
  }
  return [...byPath.values()];
}

describe("gh-33: the odontogram's own writes stay inside its dialect", () => {
  it("offers every resource it wrote to the codec and reads the chart back", () => {
    const patientId = "p-33";
    const resources = savedResources(patientId, clinicalDocument());
    const result = assembleLoadResult({ patientId, resources: [{ resourceType: "Patient", id: patientId }, ...resources] });

    expect(result.report.unsupported).toEqual([]);
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["16"]).toMatchObject({ caries: expect.arrayContaining(["caries-occlusal", "caries-mesial"]), pulpDx: "necrosis" });
    expect(result.document?.teeth["17"]).toMatchObject({ extractionPlan: true });
    expect(result.document?.teeth["26"]).toMatchObject({ crownReplace: true });
    expect(result.document?.teeth["36"]).toMatchObject({ crownNeeded: true });
  });
});

// ---------------------------------------------------------------------------
// Dental Core 0.8.0: tooth-level orders in SNOMED CT with a renewal flag.
// ---------------------------------------------------------------------------

const exportOptions = { subject: "Patient/example", effectiveDateTime: "2026-09-25" };

function orders(document: OdontogramDocument): ServiceRequest[] {
  const bundle = buildDentalCoreBundle(document, exportOptions);
  return (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter((resource): resource is ServiceRequest => resource?.resourceType === "ServiceRequest" && (resource as ServiceRequest).intent === "order");
}

function orderAt(requests: ServiceRequest[], fdi: string): ServiceRequest | undefined {
  return requests.find((request) => request.bodySite?.[0]?.coding?.[0]?.code === fdi);
}

const renewal = (request: ServiceRequest | undefined) =>
  request?.extension?.filter((extension) => extension.url === RENEWAL_URL);

describe("gh-33: Dental Core 0.8 tooth-level orders", () => {
  it("uses the SDK's canonical for restoration-renewal", () => {
    expect(DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS.RestorationRenewalExt).toBe(RENEWAL_URL);
  });

  it("writes a planned extraction as SNOMED CT 55162003 without a renewal flag", () => {
    const request = orderAt(orders({ version: PAYLOAD_VERSION, globals: {}, teeth: { "17": { extractionPlan: true } } } as OdontogramDocument), "17");
    expect(request?.code?.coding).toEqual([{ system: SNOMED, code: "55162003" }]);
    expect(renewal(request) ?? []).toEqual([]);
    expect(request?.bodySite).toEqual([{ coding: [{ system: FDI_SYSTEM, code: "17" }] }]);
    expect(() => DentalServiceRequestProfile.from(request as never)).not.toThrow();
  });

  it("writes crownReplace as a crown fitting (426222000) that renews the existing crown", () => {
    const request = orderAt(orders({ version: PAYLOAD_VERSION, globals: {}, teeth: { "26": { crownReplace: true } } } as OdontogramDocument), "26");
    expect(request?.code?.coding).toEqual([{ system: SNOMED, code: "426222000" }]);
    expect(renewal(request)).toEqual([{ url: RENEWAL_URL, valueBoolean: true }]);
    expect(() => DentalServiceRequestProfile.from(request as never)).not.toThrow();
  });

  it("writes crownNeeded as a crown fitting (426222000) that is a first provision", () => {
    const request = orderAt(orders({ version: PAYLOAD_VERSION, globals: {}, teeth: { "36": { crownNeeded: true } } } as OdontogramDocument), "36");
    expect(request?.code?.coding).toEqual([{ system: SNOMED, code: "426222000" }]);
    expect(renewal(request)).toEqual([{ url: RENEWAL_URL, valueBoolean: false }]);
  });

  it("writes both crown orders on one tooth as two distinct requests", () => {
    const requests = orders({ version: PAYLOAD_VERSION, globals: {}, teeth: { "26": { crownNeeded: true, crownReplace: true } } } as OdontogramDocument);
    expect(requests.map((request) => renewal(request)?.[0]?.valueBoolean).sort()).toEqual([false, true]);
  });

  it("round-trips all three orders through the codec", () => {
    const document = { version: PAYLOAD_VERSION, globals: {}, teeth: { "17": { extractionPlan: true }, "26": { crownReplace: true }, "36": { crownNeeded: true } } } as OdontogramDocument;
    const parsed = parseDentalCoreBundle(buildDentalCoreBundle(document, exportOptions));
    expect(parsed?.teeth["17"]).toMatchObject({ extractionPlan: true });
    expect(parsed?.teeth["26"]).toMatchObject({ crownReplace: true });
    expect(parsed?.teeth["36"]).toMatchObject({ crownNeeded: true });
    expect(parsed?.teeth["26"]?.crownNeeded).toBeUndefined();
    expect(parsed?.teeth["36"]?.crownReplace).toBeUndefined();
  });

  it("keeps the request ids of 4.0.0 so a save replaces the old order in place", () => {
    const patientId = "p-33";
    const document = { version: PAYLOAD_VERSION, globals: {}, teeth: { "26": { crownReplace: true } } } as OdontogramDocument;
    const paths = buildWritePlan({ document, patientId, effectiveDateTime: "2026-09-25" }).ops.map((op) => op.path);
    expect(paths).toContain(`/ServiceRequest/${deterministicResourceId(patientId, "ServiceRequest/change/26/crownReplace")}`);
  });

  it("does not chart an order written with the retired local code", () => {
    const patientId = "p-33";
    const legacy = (field: string, fdi: string): ResourceRecord => ({
      resourceType: "ServiceRequest",
      id: deterministicResourceId(patientId, `ServiceRequest/change/${fdi}/${field}`),
      meta: { profile: [SERVICE_REQUEST_PROFILE] },
      status: "active",
      intent: "order",
      code: { coding: [{ system: "https://github.com/ZoliQua/React-Odontogram-Modul/fhir/CodeSystem/odontogram", code: field }] },
      subject: { reference: `Patient/${patientId}` },
      bodySite: [{ coding: [{ system: FDI_SYSTEM, code: fdi }] }],
    });
    const result = assembleLoadResult({
      patientId,
      resources: [
        { resourceType: "Patient", id: patientId },
        legacy("extractionPlan", "17"),
        legacy("crownReplace", "26"),
        legacy("crownNeeded", "36"),
      ],
    });
    expect(result.document?.teeth["17"]?.extractionPlan).not.toBe(true);
    expect(result.document?.teeth["26"]?.crownReplace).not.toBe(true);
    expect(result.document?.teeth["36"]?.crownNeeded).not.toBe(true);
  });

  it("lists tooth-level orders the odontogram has no field for, and still charts the rest", () => {
    const patientId = "p-33";
    const order = (id: string, code: string, extension?: unknown[]): ResourceRecord => ({
      resourceType: "ServiceRequest",
      id,
      meta: { profile: [SERVICE_REQUEST_PROFILE] },
      status: "active",
      intent: "order",
      code: { coding: [{ system: SNOMED, code }] },
      subject: { reference: `Patient/${patientId}` },
      bodySite: [{ coding: [{ system: FDI_SYSTEM, code: "46" }] }],
      ...(extension ? { extension } : {}),
    });
    const result = assembleLoadResult({
      patientId,
      resources: [
        { resourceType: "Patient", id: patientId },
        ...savedResources(patientId, { version: PAYLOAD_VERSION, globals: {}, teeth: { "17": { extractionPlan: true } } } as OdontogramDocument),
        order("bridge-46", "1285005000", [{ url: RENEWAL_URL, valueBoolean: false }]),
        order("denture-46", "1269321004"),
        order("crown-without-renewal-46", "426222000"),
      ],
    });
    expect(result.report.parsed).toBe(true);
    expect(result.document?.teeth["17"]).toMatchObject({ extractionPlan: true });
    expect(result.document?.teeth["46"]).toBeUndefined();
    expect(result.report.unsupported.map((entry) => entry.reference).sort()).toEqual([
      "ServiceRequest/bridge-46",
      "ServiceRequest/crown-without-renewal-46",
      "ServiceRequest/denture-46",
    ]);
    for (const entry of result.report.unsupported) {
      expect(entry.reason).toMatch(/outside this odontogram's mappings/);
    }
  });
});
