// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi: running a write plan.
//
// Thin ON PURPOSE. Everything that decides what is written and under which id
// lives in `./writePlan.ts` and is pure; this module only performs the writes
// in the order the plan gives them and stops at the first failure.
//
// NO SILENT PARTIAL SUCCESS. The transport SPI has no transaction bundle and no
// PATCH, so the resources written before a failure stay written. That cannot be
// prevented here — it can only be REPORTED, which is why the failure carries
// the op and the HTTP status, and why the caller shows both.

import type { PagedSearchResult } from "./gateway";
import type { DentalCoreResourceIdentity } from "../document";
import { assembleLoadResult, patientSearchQuery, SEARCHED_RESOURCE_TYPES } from "./load";
import { buildWritePlan, WRITABLE_RESOURCE_TYPES, type SkippedResource, type StoredChart, type WriteOp, type WritePlan, type WritePlanInput } from "./writePlan";

export interface WriteFailure {
  op: WriteOp;
  message: string;
  status?: number;
}

export interface WriteResult {
  written: WriteOp[];
  failure?: WriteFailure;
  skipped?: SkippedResource[];
}

/** Only the write half of the gateway, so a test needs no server and no client. */
export interface WriteTarget {
  put(path: string, resource: unknown): Promise<unknown>;
  delete(path: string): Promise<unknown>;
  /**
   * Optional, and what an `AidboxGateway` already offers. When present, a save
   * reads every id it would PUT to or DELETE first and never touches a
   * resource the chart did not produce. When absent, a save runs only for a
   * document whose reservations came from a live load (`fhirIdentity.reserved`).
   */
  search?(resourceType: string, query: Record<string, string | string[]>): Promise<PagedSearchResult>;
}

/** What the last load attempt left behind, as far as saving is concerned. */
export interface LoadOutcome {
  /** The patient that load was for. */
  patientId: string;
  parsed: boolean;
  truncated?: string[];
  error?: string;
}

/**
 * Whether saving may be offered at all.
 *
 * A save overwrites what is on the server with what is on screen, so it is
 * allowed only when what is on screen actually CAME from the server, for THIS
 * patient, whole and undamaged. A 403, a 500, a codec rejection or a truncated
 * read each leave a blank or stale session behind, and saving from one of those
 * writes that blankness over the authoritative chart — the one failure mode in
 * this whole mode that destroys data rather than failing to record it.
 *
 * Pure, so the rule can be pinned by a test instead of by clicking.
 */
export function isSaveAllowed(input: { busy: boolean; patientId: string; load?: LoadOutcome }): boolean {
  const { busy, patientId, load } = input;
  if (busy || !load) return false;
  if (load.patientId !== patientId) return false;
  return load.parsed && !load.error && !(load.truncated?.length ?? 0);
}

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function executeWritePlan(target: WriteTarget, plan: WritePlan): Promise<WriteResult> {
  const written: WriteOp[] = [];
  for (const op of plan.ops) {
    try {
      // A removal is as much part of the save as a write, and fails as visibly.
      if (op.method === "DELETE") await target.delete(op.path);
      else await target.put(op.path, op.resource);
    } catch (error) {
      return { written, failure: { op, message: messageOf(error), status: statusOf(error) } };
    }
    written.push(op);
  }
  return { written };
}

// ---------------------------------------------------------------------------
// cognovis/odontogram#33 (second review of PR #34): a save must not overwrite
// or delete a resource the chart did not produce, and it must not depend on
// the host carrying `fhirIdentity.reserved` back to it.
//
// The live transport offers PUT and DELETE but no conditional update, so the
// guard is a READ BEFORE WRITE through the gateway's own `search`:
//
//   1. The patient's stored chart is read exactly as a live load reads it, so
//      every stored resource of it has the CHART IDENTITY the load derives
//      (tooth, surface, finding kind …; third review of PR #34). A write goes
//      to a stored id only for the identity that owns it; a key already on the
//      server is written back to its own id. A chart that cannot be read
//      completely refuses the save.
//   2. Every remaining id the plan would PUT to or DELETE is looked up by
//      `_id`. A resource there that is not part of that chart (another
//      patient's, anything unsupported) belongs to nobody the chart may touch.
//
// The plan is rebuilt until nothing new turns up: a write whose id another
// owner holds moves to another deterministic id, and a removal of it is
// dropped. A target that cannot search
// is written to only when a load's reservations are known (the document then
// carries `fhirIdentity.reserved`, possibly empty); otherwise the save refuses
// before its first write.
//
// Residual window: another writer can still create a resource at a checked id
// between the check and the PUT. Closing it needs a conditional update the
// transport SPI does not offer.

type Search = (resourceType: string, query: Record<string, string | string[]>) => Promise<PagedSearchResult>;

/** Raised before any write when nothing tells the save which ids it must not touch. */
export class SaveReservationsUnknownError extends Error {
  constructor() {
    super(
      "Save refused before any write: the write target cannot search the store, and the document carries no "
      + "reservations from a live load (fhirIdentity.reserved), so an unsupported resource at a generated id could be overwritten",
    );
    this.name = "SaveReservationsUnknownError";
  }
}

/**
 * Raised before any write when the chart no longer holds a stored resource this
 * client may read but never change or delete.
 *
 * A placed implant's Device is the case (cognovis/odontogram#28): a load reads
 * it, the write policy never writes it. Charted as missing, the tooth would
 * contradict the Device and the next load would refuse the whole chart; reset
 * to healthy, it would come back as an implant from the Device. Neither edit
 * can be saved, so neither is.
 */
export class SaveUndeletableResourceError extends Error {
  constructor(readonly references: string[]) {
    super(
      `Save refused before any write: the chart no longer holds ${references.join(", ")}, which this client may read `
      + "but not change or delete — the next load would bring it back or refuse the chart",
    );
    this.name = "SaveUndeletableResourceError";
  }
}

const READ_ONLY_TYPES: readonly string[] = SEARCHED_RESOURCE_TYPES
  .filter((resourceType) => !(WRITABLE_RESOURCE_TYPES as readonly string[]).includes(resourceType));

/** The plan, unless it drops a read-only resource the chart held (see `SaveUndeletableResourceError`). */
function keepingReadOnly(plan: WritePlan, held: Record<string, DentalCoreResourceIdentity> | undefined): WritePlan {
  const produced = new Set([...plan.ops, ...plan.skipped].map((entry) => entry.identityKey));
  const dropped: string[] = [];
  for (const [key, identity] of Object.entries(held ?? {})) {
    const resourceType = key.split("/", 1)[0];
    if (identity?.id && READ_ONLY_TYPES.includes(resourceType) && !produced.has(key)) dropped.push(`${resourceType}/${identity.id}`);
  }
  if (dropped.length) throw new SaveUndeletableResourceError(dropped.sort());
  return plan;
}

/** Raised when the store could not be read completely enough to prove a write safe. */
export class SaveStoreCheckError extends Error {
  constructor(detail: string) {
    super(`Save refused before any write: ${detail}`);
    this.name = "SaveStoreCheckError";
  }
}

const ID_BATCH = 50;
const MAX_ROUNDS = 8;

/**
 * The patient's chart as stored right now, read the way a live load reads it:
 * which chart identity key each stored `Type/id` holds, and which stored ids
 * of this patient the load sets aside as unsupported.
 */
async function readStoredChart(search: Search, patientId: string): Promise<StoredChart & { resources: Array<Record<string, unknown>> }> {
  const resources: Array<Record<string, unknown>> = [{ resourceType: "Patient", id: patientId }];
  for (const resourceType of SEARCHED_RESOURCE_TYPES) {
    const page = await search(resourceType, patientSearchQuery(resourceType, patientId));
    if (page.truncated || page.incomplete) {
      throw new SaveStoreCheckError(`the ${resourceType} resources stored for Patient/${patientId} came back partial`);
    }
    resources.push(...(page.resources as Array<Record<string, unknown>>));
  }
  const current = assembleLoadResult({ patientId, resources });
  if (!current.document) {
    throw new SaveStoreCheckError(
      `the chart stored for Patient/${patientId} cannot be read (${current.report.error ?? "rejected"}), so no write to it can be proven safe`,
    );
  }
  const identities = current.document.fhirIdentity?.resources ?? {};
  const owners = new Map<string, string | null>();
  for (const [key, identity] of Object.entries(identities)) {
    if (identity?.id && !key.startsWith("Patient/")) owners.set(`${key.split("/", 1)[0]}/${identity.id}`, key);
  }
  for (const entry of current.report.unsupported) owners.set(entry.reference, null);
  return { identities, owners, resources };
}

/** `Type/id` of every one of `references` that holds a stored resource. */
async function occupied(search: Search, references: string[]): Promise<Set<string>> {
  const idsByType = new Map<string, string[]>();
  for (const reference of references) {
    const [resourceType, id] = reference.split("/", 2);
    idsByType.set(resourceType, [...(idsByType.get(resourceType) ?? []), id]);
  }
  const found = new Set<string>();
  for (const [resourceType, ids] of idsByType) {
    for (let start = 0; start < ids.length; start += ID_BATCH) {
      const batch = ids.slice(start, start + ID_BATCH);
      const page = await search(resourceType, { _id: batch.join(",") });
      if (page.truncated || page.incomplete) {
        throw new SaveStoreCheckError(`the check of ${resourceType} ids before writing came back partial`);
      }
      for (const resource of page.resources as Array<Record<string, unknown>>) {
        const id = typeof resource?.id === "string" ? resource.id : undefined;
        if (id && batch.includes(id)) found.add(`${resourceType}/${id}`);
      }
    }
  }
  return found;
}

/**
 * The write plan for a save, proven not to touch a resource the chart did not
 * produce. See the module comment for the two paths.
 */
export async function planGuardedSave(target: { search?: Search }, input: WritePlanInput): Promise<WritePlan> {
  const search = typeof target.search === "function" ? target.search.bind(target) : undefined;
  if (!search) {
    if (!Array.isArray(input.document.fhirIdentity?.reserved)) throw new SaveReservationsUnknownError();
    return keepingReadOnly(buildWritePlan(input), input.document.fhirIdentity?.resources);
  }
  // With a store to search, the store says which read-only resources exist;
  // the document's own identities may name ones it never held (an import).
  const stored = await readStoredChart(search, input.patientId);
  const plan = keepingReadOnly(await planAgainstStore(search, input, stored), stored.identities);
  return readableAfterwards(input.patientId, stored.resources, plan);
}

/**
 * The plan, refused when the chart it leaves behind could not be loaded.
 *
 * What a save may not write stays as stored, and so does whatever only
 * travels with it: a peri-implant finding names its Device in `focus`, so it
 * is not rewritten and keeps its old examination date while every other
 * finding takes the new one — and the codec refuses a chart whose findings
 * disagree on that date. So the collection the save leaves behind is read the
 * way a load reads it, BEFORE anything is written.
 */
function readableAfterwards(patientId: string, stored: Array<Record<string, unknown>>, plan: WritePlan): WritePlan {
  const after = new Map(stored.map((resource) => [`${String(resource.resourceType)}/${String(resource.id)}`, resource]));
  for (const op of plan.ops) {
    const reference = `${op.resourceType}/${op.id}`;
    if (op.method === "DELETE") after.delete(reference);
    else after.set(reference, op.resource as unknown as Record<string, unknown>);
  }
  const result = assembleLoadResult({ patientId, resources: [...after.values()] });
  if (!result.document) {
    throw new SaveStoreCheckError(
      `the chart this save would leave for Patient/${patientId} could not be loaded again`
      + (result.report.rejectedAt ? ` — the first resource it would refuse is ${result.report.rejectedAt}` : ""),
    );
  }
  return plan;
}

async function planAgainstStore(search: Search, input: WritePlanInput, stored: StoredChart): Promise<WritePlan> {
  const owners = new Map(stored.owners);
  const checked = new Set<string>();
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const plan = buildWritePlan({ ...input, store: { identities: stored.identities, owners } });
    const unchecked = [...new Set(plan.ops.map((op) => `${op.resourceType}/${op.id}`))]
      .filter((reference) => !checked.has(reference) && !owners.has(reference));
    if (!unchecked.length) return plan;
    // Anything stored at one of these ids is not part of this patient's chart
    // (the chart read above would have claimed it), so nobody may touch it.
    const found = await occupied(search, unchecked);
    for (const reference of unchecked) {
      if (found.has(reference)) owners.set(reference, null);
      else checked.add(reference);
    }
    if (!found.size) return plan;
  }
  throw new SaveStoreCheckError("generated ids kept colliding with resources the chart does not own");
}
