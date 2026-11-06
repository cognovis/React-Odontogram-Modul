// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi, seam 5: the executor.
//
// The transport SPI carries no transaction bundle, so a save is a SEQUENCE of
// single-resource writes and a failure halfway through leaves the earlier ones
// on the server. That risk is real and named in the bead's pre-mortem; what is
// forbidden is hiding it. The executor stops at the first failure and reports
// WHICH write failed, with the HTTP status — never a silent partial success.

import { describe, it, expect } from "vitest";
import { executeWritePlan, isSaveAllowed } from "../live/save";
import type { WriteOp } from "../live/writePlan";

function op(id: string): WriteOp {
  return {
    method: "PUT",
    path: `/Observation/${id}`,
    resourceType: "Observation",
    id,
    identityKey: `Observation/tooth-state/${id}`,
    resource: { resourceType: "Observation", id } as WriteOp["resource"],
  };
}

function removal(id: string): WriteOp {
  return {
    method: "DELETE",
    path: `/Observation/${id}`,
    resourceType: "Observation",
    id,
    identityKey: `Observation/tooth-state/${id}`,
  };
}

describe("odontogram-6fi: executing a write plan", () => {
  it("writes every op in order and reports them all as written", async () => {
    const seen: string[] = [];
    const gateway = { async put(path: string) { seen.push(path); return {}; }, async delete() { return {}; } };
    const result = await executeWritePlan(gateway, { ops: [op("a"), op("b")], skipped: [] });
    expect(seen).toEqual(["/Observation/a", "/Observation/b"]);
    expect(result.written).toHaveLength(2);
    expect(result.failure).toBeUndefined();
  });

  it("sends a DELETE op to the delete verb, not to PUT", async () => {
    const seen: string[] = [];
    const gateway = {
      async put(path: string) { seen.push(`PUT ${path}`); return {}; },
      async delete(path: string) { seen.push(`DELETE ${path}`); return {}; },
    };
    const result = await executeWritePlan(gateway, { ops: [op("a"), removal("gone")], skipped: [] });
    expect(seen).toEqual(["PUT /Observation/a", "DELETE /Observation/gone"]);
    expect(result.written).toHaveLength(2);
  });

  it("stops at a failing DELETE with the same visibility as a failing PUT", async () => {
    const gateway = {
      async put() { return {}; },
      async delete() { throw Object.assign(new Error("Conflict"), { status: 409 }); },
    };
    const result = await executeWritePlan(gateway, { ops: [op("a"), removal("gone"), op("c")], skipped: [] });
    expect(result.written.map((written) => written.id)).toEqual(["a"]);
    expect(result.failure?.op.method).toBe("DELETE");
    expect(result.failure?.status).toBe(409);
  });

  it("stops at the first failure and names the op and the status", async () => {
    const seen: string[] = [];
    const gateway = {
      async put(path: string) {
        seen.push(path);
        if (path.endsWith("/b")) throw Object.assign(new Error("Forbidden"), { status: 403 });
        return {};
      },
      async delete() { return {}; },
    };
    const result = await executeWritePlan(gateway, { ops: [op("a"), op("b"), op("c")], skipped: [] });
    expect(seen).toEqual(["/Observation/a", "/Observation/b"]);
    expect(result.written.map((written) => written.id)).toEqual(["a"]);
    expect(result.failure?.op.id).toBe("b");
    expect(result.failure?.status).toBe(403);
    expect(result.failure?.message).toMatch(/Forbidden/);
  });

  it("survives an error carrying no status", async () => {
    const gateway = { async put() { throw new Error("network down"); }, async delete() { return {}; } };
    const result = await executeWritePlan(gateway, { ops: [op("a")], skipped: [] });
    expect(result.failure?.status).toBeUndefined();
    expect(result.failure?.message).toMatch(/network down/);
  });
});

// Saving overwrites what is on the server with what is on screen. So it may
// only be offered when what is on screen actually CAME from the server for
// THIS patient, whole and undamaged. A 403, a 500, a codec rejection or a
// truncated read all leave a blank or stale session behind — and saving from
// one of those would write that blankness over the authoritative chart.
describe("odontogram-6fi: when saving is allowed at all", () => {
  const clean = { patientId: "p-1", parsed: true };

  it("allows a save after one clean load of the patient on screen", () => {
    expect(isSaveAllowed({ busy: false, patientId: "p-1", load: clean })).toBe(true);
  });

  it("refuses before anything has been loaded", () => {
    expect(isSaveAllowed({ busy: false, patientId: "p-1", load: undefined })).toBe(false);
  });

  it("refuses while a request is in flight", () => {
    expect(isSaveAllowed({ busy: true, patientId: "p-1", load: clean })).toBe(false);
  });

  it("refuses when the load failed or the codec rejected it", () => {
    expect(isSaveAllowed({ busy: false, patientId: "p-1", load: { patientId: "p-1", parsed: false } })).toBe(false);
    expect(isSaveAllowed({ busy: false, patientId: "p-1", load: { patientId: "p-1", parsed: true, error: "HTTP 403" } })).toBe(false);
  });

  it("refuses when the load was only partial", () => {
    expect(isSaveAllowed({ busy: false, patientId: "p-1", load: { patientId: "p-1", parsed: true, truncated: ["Observation"] } })).toBe(false);
  });

  it("refuses when the clean load belongs to a DIFFERENT patient", () => {
    expect(isSaveAllowed({ busy: false, patientId: "p-2", load: clean })).toBe(false);
  });
});
