// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi, seam 2: deriving the write plan is a PURE function.
//
// The whole round-trip hangs on the ids: a save that mints a fresh id every
// time duplicates the patient's chart on the server instead of updating it.
// The ids are therefore DERIVED from the codec's own resource-identity keys,
// never minted, and a document that already carries server ids keeps them.

import { describe, it, expect } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import type { OdontogramDocument } from "../document";
import {
  WRITABLE_RESOURCE_TYPES,
  buildWritePlan,
  deterministicResourceId,
  liveIdPrefix,
} from "../live/writePlan";

const EFFECTIVE = "2026-08-23";

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

describe("odontogram-6fi: deterministic resource ids", () => {
  it("derives the same id for the same patient and identity key every time", () => {
    expect(deterministicResourceId("p-1", "Observation/tooth-state/16"))
      .toBe(deterministicResourceId("p-1", "Observation/tooth-state/16"));
  });

  it("carries the live-mode prefix so the loader recognises its own resources", () => {
    expect(deterministicResourceId("p-1", "CarePlan/plan").startsWith(liveIdPrefix("p-1"))).toBe(true);
  });

  it("separates patients and keys", () => {
    expect(deterministicResourceId("p-1", "CarePlan/plan")).not.toBe(deterministicResourceId("p-2", "CarePlan/plan"));
    expect(deterministicResourceId("p-1", "Observation/tooth-state/16")).not.toBe(deterministicResourceId("p-1", "Observation/tooth-state/17"));
  });

  // The patient's share of an id must be INJECTIVE over the FHIR id space, or
  // two patients share a write path and one silently overwrites the other's
  // chart. `p.1` and `p-1` are BOTH valid FHIR ids, and so are `ABC` and `abc`
  // — sanitising them to the same token is not a charset problem that
  // validation could catch, it is a collision.
  it("never lets two different patient ids share one token", () => {
    const collisions: Array<[string, string]> = [["p.1", "p-1"], ["ABC", "abc"], ["a.b", "a-b"], ["x..y", "x-y"]];
    for (const [left, right] of collisions) {
      expect(liveIdPrefix(left), `${left} vs ${right}`).not.toBe(liveIdPrefix(right));
      expect(deterministicResourceId(left, "CarePlan/plan")).not.toBe(deterministicResourceId(right, "CarePlan/plan"));
    }
  });

  it("leaves an already-clean patient id untouched, so existing ids stay stable", () => {
    for (const clean of ["odontogram-6fi-demo", "p-1", "patient42"]) {
      expect(liveIdPrefix(clean)).toBe(`odo-${clean}-`);
    }
  });

  it("keeps a long patient id inside a legal FHIR id and still separates two of them", () => {
    const long = "a-very-long-patient-identifier-from-the-practice-system";
    const other = `${long}-2`;
    expect(deterministicResourceId(long, "CarePlan/plan")).toMatch(/^[A-Za-z0-9\-.]{1,64}$/);
    expect(deterministicResourceId(long, "CarePlan/plan")).not.toBe(deterministicResourceId(other, "CarePlan/plan"));
  });

  it("stays a legal FHIR id even for a long key, and stays unique when truncated", () => {
    const long = `Observation/finding/16/${"a".repeat(120)}`;
    const other = `Observation/finding/17/${"a".repeat(120)}`;
    for (const key of [long, other, "CarePlan/plan"]) {
      const id = deterministicResourceId("a-very-long-patient-identifier-from-the-practice-system", key);
      expect(id).toMatch(/^[A-Za-z0-9\-.]{1,64}$/);
    }
    expect(deterministicResourceId("p-1", long)).not.toBe(deterministicResourceId("p-1", other));
  });
});

describe("odontogram-6fi: the write plan", () => {
  it("turns every writable resource into a PUT at its own deterministic id", () => {
    const plan = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops.length).toBeGreaterThan(0);
    for (const op of plan.ops) {
      expect(op.method).toBe("PUT");
      expect(op.path).toBe(`/${op.resourceType}/${op.id}`);
      expect(op.id).toBe(deterministicResourceId("p-1", op.identityKey));
      expect((op.resource as { id?: string }).id).toBe(op.id);
      expect(WRITABLE_RESOURCE_TYPES).toContain(op.resourceType);
    }
  });

  it("references the patient it was asked for and never writes the Patient itself", () => {
    const plan = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops.some((op) => op.resourceType === "Patient")).toBe(false);
    const subjects = plan.ops.map((op) => (op.resource as { subject?: { reference?: string } }).subject?.reference);
    expect(new Set(subjects.filter(Boolean))).toEqual(new Set(["Patient/p-1"]));
  });

  it("produces an identical plan for an identical document (idempotent re-save)", () => {
    const first = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    const second = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(second).toEqual(first);
  });

  it("keeps server-assigned ids a load already brought back", () => {
    const document = chartedDocument();
    document.fhirIdentity = { resources: { "Observation/tooth-state/26": { id: "server-owned-26", versionId: "7" } } };
    const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    const op = plan.ops.find((candidate) => candidate.identityKey === "Observation/tooth-state/26");
    expect(op?.id).toBe("server-owned-26");
    expect(op?.path).toBe("/Observation/server-owned-26");
    // The server owns the version; a stale versionId must not ride back in.
    expect((op?.resource as { meta?: { versionId?: string } }).meta?.versionId).toBeUndefined();
  });

  // A server that enforces referential integrity (Aidbox does) rejects a PUT
  // naming a resource that is not there yet — and the codec's plan resources
  // reference each other in a CYCLE: the CarePlan lists its ServiceRequests,
  // and each planned ServiceRequest is `basedOn` that same CarePlan. With no
  // transaction bundle and no PATCH in the transport SPI, the only way through
  // is to write the CarePlan TWICE: once bare to break the cycle, once
  // complete once its activities exist.
  it("breaks the CarePlan/ServiceRequest reference cycle with a bare first write", () => {
    const plan = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    const carePlanOps = plan.ops.filter((op) => op.resourceType === "CarePlan");
    expect(carePlanOps).toHaveLength(2);
    expect(carePlanOps[0].bootstrap).toBe(true);
    expect((carePlanOps[0].resource as { activity?: unknown[] }).activity).toBeUndefined();
    expect((carePlanOps[1].resource as { activity?: unknown[] }).activity?.length).toBeGreaterThan(0);
    expect(carePlanOps[0].id).toBe(carePlanOps[1].id);
  });

  it("orders every write after the resources it references", () => {
    const plan = buildWritePlan({ document: chartedDocument(), patientId: "p-1", effectiveDateTime: EFFECTIVE });
    const types = plan.ops.map((op) => op.resourceType);
    const firstCarePlan = types.indexOf("CarePlan");
    const lastCarePlan = types.lastIndexOf("CarePlan");
    const firstRequest = types.indexOf("ServiceRequest");
    const lastRequest = types.lastIndexOf("ServiceRequest");
    // The bare CarePlan precedes the ServiceRequests that point back at it,
    // the complete one follows them, and any Observation naming the CarePlan
    // follows that.
    expect(firstCarePlan).toBeLessThan(firstRequest);
    expect(lastCarePlan).toBeGreaterThan(lastRequest);
    for (const [index, op] of plan.ops.entries()) {
      const basedOn = (op.resource as { basedOn?: Array<{ reference?: string }> }).basedOn ?? [];
      if (basedOn.some((reference) => reference.reference?.startsWith("CarePlan/"))) {
        // After the BARE CarePlan — that is what the bare write is for.
        expect(index, `${op.path} references the CarePlan and must be written after it`).toBeGreaterThan(firstCarePlan);
      }
    }
  });

  it("reports a resource outside the scoped client's write policy instead of dropping it", () => {
    const document = chartedDocument();
    document.teeth["15"] = { toothSelection: "implant", implantProduct: { manufacturer: "Example", lot: "L1" } };
    const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops.some((op) => op.resourceType === "Device")).toBe(false);
    expect(plan.skipped).toContainEqual(expect.objectContaining({
      resourceType: "Device",
      identityKey: "Device/implant/15",
    }));
    expect(plan.skipped[0].reason).toMatch(/write policy/i);
  });

  // A write that names a resource nobody writes is a write the server rejects
  // (Aidbox answers `422 non-existent-resource`), and it does so IN THE MIDDLE
  // of the sequence — after earlier resources are already on the server. The
  // peri-implant finding is the real case: the codec gives it an unconditional
  // `focus` on the tooth's implant Device, and a Device is outside this
  // client's write policy. So the finding follows the Device into `skipped`
  // rather than being planned and failing.
  it("skips a write whose reference points at a resource that is not written", () => {
    const document = chartedDocument();
    document.teeth["15"] = {
      toothSelection: "implant",
      periImplant: "peri-implantitis-moderate",
      mpi: { buccal: 2 },
      implantProduct: { manufacturer: "Example", lot: "L1" },
    };
    const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops.some((op) => op.identityKey === "Observation/peri-implant/15")).toBe(false);
    expect(plan.skipped).toContainEqual(expect.objectContaining({ identityKey: "Device/implant/15" }));
    const carried = plan.skipped.find((entry) => entry.identityKey === "Observation/peri-implant/15");
    expect(carried?.resourceType).toBe("Observation");
    expect(carried?.reason).toMatch(/Device\/|not written/i);
  });

  it("skips a peri-implant finding even when no implant Device is charted at all", () => {
    // With no `implantProduct` the codec emits NO Device, yet still references
    // one — an unresolvable reference rather than a policy-skipped one. Both
    // end the same way: not planned.
    const document = chartedDocument();
    document.teeth["15"] = { toothSelection: "implant", periImplant: "mucositis" };
    const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops.some((op) => op.identityKey === "Observation/peri-implant/15")).toBe(false);
    expect(plan.skipped.some((entry) => entry.identityKey === "Observation/peri-implant/15")).toBe(true);
  });

  it("leaves no planned write naming a resource the plan does not write", () => {
    const document = chartedDocument();
    document.teeth["15"] = { toothSelection: "implant", periImplant: "peri-implantitis-severe", implantProduct: { lot: "L1" } };
    const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    const written = new Set(plan.ops.map((op) => `${op.resourceType}/${op.id}`));
    const references = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(references);
      if (!value || typeof value !== "object") return [];
      const record = value as Record<string, unknown>;
      const own = typeof record.reference === "string" ? [record.reference] : [];
      return [...own, ...Object.values(record).flatMap(references)];
    };
    for (const op of plan.ops) {
      for (const reference of references(op.resource)) {
        expect([...written, "Patient/p-1"], `${op.path} references ${reference}`).toContain(reference);
      }
    }
  });

  // A chart is edited SUBTRACTIVELY too. Clearing a finding removes its
  // resource from the bundle — and a plan that only ever PUTs leaves the old
  // resource on the server, where the next load reads it straight back in. The
  // finding would be un-deletable through live mode.
  describe("removals", () => {
    /** The identity a load brings back after this document was saved once. */
    function identityOf(document: OdontogramDocument): OdontogramDocument["fhirIdentity"] {
      const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const resources: Record<string, { id: string }> = {};
      for (const op of plan.ops) resources[op.identityKey] = { id: op.id };
      return { resources };
    }

    it("deletes the resource of a finding that was cleared", () => {
      const loaded = chartedDocument();
      const identity = identityOf(loaded);
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: identity };
      delete edited.teeth["16"];
      const plan = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const removal = plan.ops.find((op) => op.identityKey === "Observation/caries/16/occlusal");
      expect(removal?.method).toBe("DELETE");
      expect(removal?.path).toBe(`/Observation/${identity!.resources!["Observation/caries/16/occlusal"].id}`);
      expect(plan.ops.some((op) => op.method === "PUT" && op.identityKey === "Observation/caries/16/occlusal")).toBe(false);
    });

    it("runs every delete after every write", () => {
      const identity = identityOf(chartedDocument());
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: identity };
      delete edited.teeth["16"];
      delete edited.plan;
      const plan = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const methods = plan.ops.map((op) => op.method);
      expect(methods).toContain("DELETE");
      expect(methods.lastIndexOf("PUT")).toBeLessThan(methods.indexOf("DELETE"));
    });

    it("deletes a referencing resource before the resource it references", () => {
      const identity = identityOf(chartedDocument());
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: identity };
      delete edited.plan;
      const plan = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const deletes = plan.ops.filter((op) => op.method === "DELETE").map((op) => op.resourceType);
      expect(deletes).toContain("CarePlan");
      expect(deletes).toContain("ServiceRequest");
      expect(deletes.indexOf("ServiceRequest")).toBeLessThan(deletes.indexOf("CarePlan"));
    });

    // cognovis/odontogram#62: `fhirIdentity` arrives with an imported chart
    // file, and its ids become request paths. An id that is not a FHIR id
    // (`x/../../Condition/v`) is normalised by URL parsing into a request on
    // ANOTHER resource; a plan never writes or deletes under such an id.
    it("never plans a request under an id that is not a FHIR id", () => {
      const identity = identityOf(chartedDocument())!;
      const hostile = "x/../../Condition/victim";
      const resources = {
        ...identity.resources,
        "Observation/caries/16/occlusal": { id: hostile },
        "Observation/tooth-state/26": { id: ".." },
      };
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: { resources } };
      delete edited.teeth["16"];
      const plan = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      for (const op of plan.ops) {
        expect(op.id, op.path).toMatch(/^[A-Za-z0-9.-]{1,64}$/);
        expect([".", ".."], op.path).not.toContain(op.id);
        expect(op.path).toBe(`/${op.resourceType}/${op.id}`);
      }
      expect(plan.ops.some((op) => op.identityKey === "Observation/caries/16/occlusal")).toBe(false);
      const toothState = plan.ops.find((op) => op.identityKey === "Observation/tooth-state/26");
      expect(toothState?.id).toBe("odo-p-1-observation-tooth-state-26");
    });

    // `...` is a legal FHIR id and no dot segment: URL parsing leaves it alone,
    // so a resource stored under it is updated and deleted like any other.
    it("keeps a stored id made of three or more dots", () => {
      const identity = identityOf(chartedDocument())!;
      const resources = {
        ...identity.resources,
        "Observation/caries/16/occlusal": { id: "..." },
        "Observation/tooth-state/26": { id: "...." },
      };
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: { resources } };
      delete edited.teeth["16"];
      const plan = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const removal = plan.ops.find((op) => op.identityKey === "Observation/caries/16/occlusal");
      expect(removal?.method).toBe("DELETE");
      expect(removal?.path).toBe("/Observation/...");
      const toothState = plan.ops.find((op) => op.identityKey === "Observation/tooth-state/26");
      expect(toothState?.path).toBe("/Observation/....");
    });

    // A JSON file can name a key `__proto__`. Assigned into a plain object it
    // swaps that object's prototype, and an id inherited from it was never
    // validated.
    it("ignores an id smuggled in through a __proto__ key", () => {
      const identity = identityOf(chartedDocument())!;
      const resources = JSON.parse(JSON.stringify(identity.resources));
      delete resources["Observation/tooth-state/26"];
      const hostile = JSON.parse(
        '{"__proto__": {"id": "valid", "Observation/tooth-state/26": {"id": "x/../../Observation/victim"}}}',
      );
      const edited: OdontogramDocument = {
        ...chartedDocument(),
        fhirIdentity: { resources: { ...resources, ...hostile } },
      };
      const store = { identities: hostile, owners: new Map<string, string | null>() };
      for (const document of [edited, { ...chartedDocument(), fhirIdentity: { resources } }]) {
        const plan = buildWritePlan({ document, patientId: "p-1", effectiveDateTime: EFFECTIVE, store });
        for (const op of plan.ops) expect(op.path, op.path).not.toContain("..");
        const toothState = plan.ops.find((op) => op.identityKey === "Observation/tooth-state/26");
        expect(toothState?.path).toBe("/Observation/odo-p-1-observation-tooth-state-26");
      }
    });

    it("clears the whole mouth rather than planning nothing for a blank chart", () => {
      const identity = identityOf(chartedDocument());
      const blank: OdontogramDocument = { version: PAYLOAD_VERSION, globals: {}, teeth: {}, fhirIdentity: identity };
      const plan = buildWritePlan({ document: blank, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      expect(plan.ops.length).toBeGreaterThan(0);
      expect(plan.ops.every((op) => op.method === "DELETE")).toBe(true);
    });

    it("never deletes the patient, whatever else goes", () => {
      const identity = identityOf(chartedDocument())!;
      identity.resources!["Patient/subject"] = { id: "p-1" };
      const blank: OdontogramDocument = { version: PAYLOAD_VERSION, globals: {}, teeth: {}, fhirIdentity: identity };
      const plan = buildWritePlan({ document: blank, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      expect(plan.ops.some((op) => op.resourceType === "Patient")).toBe(false);
    });

    it("plans the same removals twice for the same input", () => {
      const identity = identityOf(chartedDocument());
      const edited: OdontogramDocument = { ...chartedDocument(), fhirIdentity: identity };
      delete edited.teeth["16"];
      const first = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      const second = buildWritePlan({ document: edited, patientId: "p-1", effectiveDateTime: EFFECTIVE });
      expect(second.ops).toEqual(first.ops);
    });
  });

  it("plans nothing for a chart that was never loaded and holds nothing", () => {
    const blank: OdontogramDocument = { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
    const plan = buildWritePlan({ document: blank, patientId: "p-1", effectiveDateTime: EFFECTIVE });
    expect(plan.ops).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });
});
