// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi: turning the charted document into an ordered list of
// single-resource writes.
//
// PURE — no transport, no clock, no randomness. The executor in `./save.ts`
// runs what this returns; everything that decides WHAT is written and under
// WHICH id is decided here, so a re-save can be proved idempotent by a test
// instead of by watching a server.
//
// THE IDS ARE DERIVED, NEVER MINTED. `buildDentalCoreBundle` already owns a
// resource-identity mechanism: `payload.fhirIdentity.resources[key]` keyed by a
// stable key such as `Observation/tooth-state/16`, and `parseDentalCoreBundle`
// captures exactly those keys back off a bundle. So the plan builds the bundle
// once to LEARN its keys through the codec's own parser, derives one
// deterministic id per key, and builds again with those ids in place. No second
// copy of the codec's key scheme lives here — the codec tells us its keys.
//
// The transport SPI carries no transaction bundle and no PATCH, which is why
// this is a list of single-resource PUTs rather than one bundle POST. The
// consequence is honest and documented in docs/aidbox-live-mode.md: a failure
// halfway through leaves the earlier resources written.

import type { Bundle, BundleEntry, Resource } from "fhir/r4";
import type { DentalCoreResourceIdentity, OdontogramDocument } from "../document";
import { buildDentalCoreBundle } from "../fhir/toFhirDentalCore";
import { parseDentalCoreBundle } from "../fhir/fromFhirDentalCore";

/**
 * The resource types the scoped machine client may write. It mirrors the
 * Aidbox AccessPolicy for `odontogram-live` exactly — Patient is readable but
 * deliberately never written here, since the odontogram does not own the
 * patient record.
 */
export const WRITABLE_RESOURCE_TYPES = ["Observation", "Condition", "ServiceRequest", "CarePlan"] as const;

export type WritableResourceType = (typeof WRITABLE_RESOURCE_TYPES)[number];

/**
 * One single-resource operation. `path` is relative to the FHIR base URL.
 *
 * `DELETE` carries no resource: it removes what a cleared finding left behind.
 * A plan that only ever PUT would make a finding un-deletable through live
 * mode — the resource would stay on the server and the next load would read it
 * straight back in.
 */
export interface WriteOp {
  method: "PUT" | "DELETE";
  path: string;
  resourceType: string;
  id: string;
  identityKey: string;
  resource?: Resource;
  /** A first, deliberately incomplete write that exists only to break a reference cycle. */
  bootstrap?: true;
}

/** A resource the codec emitted that this client is not allowed (or able) to write. */
export interface SkippedResource {
  resourceType: string;
  identityKey: string;
  reason: string;
}

export interface WritePlan {
  ops: WriteOp[];
  skipped: SkippedResource[];
}

export interface WritePlanInput {
  document: OdontogramDocument;
  patientId: string;
  /** The examination date the whole write is stamped with. Passed IN — a plan that reads the clock is untestable. */
  effectiveDateTime: string;
  /**
   * What the store holds right now, read just before the save (see
   * `planGuardedSave`). `owners` maps a stored `Type/id` to the chart identity
   * key the load derives for it, or to `null` when the resource there is not
   * this patient's chart content. `identities` is the stored chart's own key →
   * id map; a key already on the server is written back to its id.
   */
  store?: StoredChart;
}

export interface StoredChart {
  identities: Record<string, DentalCoreResourceIdentity>;
  owners: ReadonlyMap<string, string | null>;
}

/** Raised when the codec cannot read back the bundle it just wrote, so no key scheme can be learned. */
export class WritePlanIdentityError extends Error {
  constructor() {
    super("Dental Core resource identities could not be resolved for this chart, so no stable write plan exists");
    this.name = "WritePlanIdentityError";
  }
}

/**
 * Write order. A resource is written after everything it REFERENCES, because a
 * server that enforces referential integrity (Aidbox does) rejects a PUT naming
 * a resource that is not there yet.
 *
 * The plan resources reference each other in a CYCLE: the CarePlan lists its
 * ServiceRequests in `activity`, and each planned ServiceRequest is `basedOn`
 * that same CarePlan. No ordering resolves a cycle, and the transport SPI
 * offers neither a transaction bundle nor PATCH — so the CarePlan is written
 * TWICE: once bare (it then references only the patient), and once complete
 * after its activities exist. See `bootstrapCarePlan` below.
 */
const WRITE_ORDER = ["Patient", "Device", "Procedure", "ServiceRequest", "CarePlan", "Observation", "Condition", "Provenance"];

/**
 * Delete order — a resource goes before the one it REFERENCES, so nothing is
 * removed while something still points at it.
 *
 * Deliberately NOT the reverse of `WRITE_ORDER`. Reversing it would put the
 * CarePlan before its ServiceRequests, and the CarePlan is the one thing two of
 * the three plan relationships point AT (`Observation.basedOn` and
 * `ServiceRequest.basedOn`); only `CarePlan.activity` points the other way.
 * That last one is the same cycle the bare first write exists for and no order
 * can satisfy it — so the order chosen is the one that leaves the fewest
 * dangling references, with the CarePlan last.
 */
const DELETE_ORDER = ["Provenance", "Observation", "Condition", "ServiceRequest", "CarePlan", "Procedure", "Device", "Patient"];

const FHIR_ID_MAX = 64;

/**
 * A FHIR id, and not a dot segment. A document's ids become request PATHS, and
 * an imported chart file carries them: `x/../../Condition/v` or `..` would be
 * normalised by URL parsing into a request on a resource this chart does not
 * own (cognovis/odontogram#62).
 */
const FHIR_ID = /^[A-Za-z0-9.-]{1,64}$/;
/** The two URL dot segments. `...` is a legal FHIR id and no dot segment. */
const DOT_SEGMENTS = new Set([".", ".."]);

function isPathSafeFhirId(id: unknown): id is string {
  return typeof id === "string" && FHIR_ID.test(id) && !DOT_SEGMENTS.has(id);
}

/**
 * Only the identities whose id may stand in a request path, in a dictionary
 * with NO prototype: the keys come from a JSON file, and `__proto__` assigned
 * into a plain object swaps its prototype, through which an unvalidated id
 * would be inherited.
 */
function pathSafeIdentities(
  identities: Record<string, DentalCoreResourceIdentity> | undefined,
): Record<string, DentalCoreResourceIdentity> {
  const safe: Record<string, DentalCoreResourceIdentity> = Object.create(null);
  for (const [key, identity] of Object.entries(identities ?? {})) {
    if (isPathSafeFhirId(identity?.id)) safe[key] = { id: identity.id };
  }
  return safe;
}

/** The prefix every id this mode mints carries, so a loader can recognise its own profile-less resources. */
export function liveIdPrefix(patientId: string): string {
  return `odo-${patientToken(patientId)}-`;
}

/** A patient id this mode can carry verbatim: already a slug, and short enough. */
const CLEAN_PATIENT_ID = /^[a-z0-9-]{1,24}$/;

/**
 * The patient's share of an id — BOUNDED, and INJECTIVE over the FHIR id space.
 *
 * Injectivity is the whole point and was missing at first. Sanitising alone
 * maps `p.1` and `p-1` onto the same token, and `ABC` onto `abc`; all four are
 * valid FHIR ids, so no charset validation catches it, and the consequence is
 * that two patients share one set of write paths and one silently overwrites
 * the other's chart.
 *
 * So there are exactly two forms, and they cannot collide with each other:
 *
 *   - a patient id that is ALREADY a short slug passes through unchanged (which
 *     keeps every id in use stable, and keeps a path readable);
 *   - anything else becomes `<sanitised head>.<hash of the RAW id>`.
 *
 * The separator is the DOT. A pass-through token can never contain one — its
 * charset excludes it — while a hashed token always does, so the two forms are
 * disjoint by construction rather than by luck. A dot is legal in a FHIR id
 * (`[A-Za-z0-9-.]{1,64}`), so the result is still a legal id.
 *
 * Two DIFFERENT raw ids in the hashed form are separated by a 32-bit hash of
 * the raw id, which is collision-RESISTANT rather than strictly injective. That
 * is a deliberate, bounded residue: a FHIR id has 64 characters to spend and
 * the key has to fit beside the patient in them.
 */
function patientToken(patientId: string): string {
  if (CLEAN_PATIENT_ID.test(patientId)) return patientId;
  return `${slug(patientId).slice(0, 15)}.${shortHash(patientId)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** FNV-1a, 32 bit — a short, stable discriminator for a key too long to spell out. */
function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * One id per patient and identity key, readable where it fits and hashed where
 * it does not. A FHIR id is at most 64 characters, so a long key is truncated
 * and discriminated by a hash of the WHOLE key — two keys sharing a truncated
 * head still differ.
 */
export function deterministicResourceId(patientId: string, identityKey: string): string {
  const prefix = liveIdPrefix(patientId);
  const body = slug(identityKey);
  const plain = `${prefix}${body}`;
  if (plain.length <= FHIR_ID_MAX) return plain;
  const suffix = `-${shortHash(identityKey)}`;
  const room = Math.max(0, FHIR_ID_MAX - prefix.length - suffix.length);
  return `${prefix}${body.slice(0, room).replace(/-+$/, "")}${suffix}`;
}

/** The codec's own key scheme, learned by parsing the bundle it just produced. */
function identityKeysOf(bundle: Bundle): Map<string, string> {
  const parsed = parseDentalCoreBundle(bundle);
  const resources = parsed?.fhirIdentity?.resources;
  if (!resources) throw new WritePlanIdentityError();
  const byFullUrl = new Map<string, string>();
  for (const [key, identity] of Object.entries(resources)) {
    if (identity.fullUrl) byFullUrl.set(identity.fullUrl, key);
  }
  return byFullUrl;
}

function entryResourceType(entry: BundleEntry): string {
  return entry.resource?.resourceType ?? "";
}

function rank(resourceType: string): number {
  const index = WRITE_ORDER.indexOf(resourceType);
  return index === -1 ? WRITE_ORDER.length : index;
}

function deleteRank(resourceType: string): number {
  const index = DELETE_ORDER.indexOf(resourceType);
  return index === -1 ? DELETE_ORDER.length : index;
}

/**
 * Derive the ordered writes for a document.
 *
 * The bundle is built TWICE on purpose: once to learn the codec's identity
 * keys, once with a deterministic id resolved for every one of them. The second
 * build is what is written — its cross-resource references are then plain
 * `Type/id`, which is what a reader on the server can follow.
 */
export function buildWritePlan({ document, patientId, effectiveDateTime, store }: WritePlanInput): WritePlan {
  const options = { subject: `Patient/${patientId}`, effectiveDateTime };
  // The probe is built WITHOUT the document's own identities on purpose: an
  // entry that already carries a server id carries no generated fullUrl, and
  // the key map is read off those fullUrls. Stripping them first makes every
  // key visible; the known ids are merged back in below.
  const anonymous: OdontogramDocument = { ...document };
  delete anonymous.fhirIdentity;
  const probe = buildDentalCoreBundle(anonymous, options);
  // Existing ids win: they came off the server on the last load, and a live
  // mode that renamed them would orphan the resources it read a moment ago.
  const known = pathSafeIdentities(document.fhirIdentity?.resources);
  const stored = pathSafeIdentities(store?.identities);
  // WHO OWNS AN ID. A stored resource belongs to the chart identity the load
  // derives for it (tooth, surface, finding kind …), or to nobody the chart
  // may touch (`null`). A write goes to an id only when its own key owns it or
  // nobody has claimed it; a removal only when its own key owns it. Evidence
  // in order of authority: the store as read just before this save, the
  // reservations of the last load (unsupported resources), the document's
  // own identities.
  const owners = new Map<string, string | null>(store?.owners ?? []);
  for (const reference of document.fhirIdentity?.reserved ?? []) {
    if (!owners.has(reference)) owners.set(reference, null);
  }
  for (const [key, identity] of Object.entries(known)) {
    const reference = identity?.id ? `${key.split("/", 1)[0]}/${identity.id}` : undefined;
    if (reference && !owners.has(reference)) owners.set(reference, key);
  }
  const taken = new Map<string, string>();
  // NOT an early return on `{ops: [], skipped: []}`: a chart that now holds
  // nothing but was loaded with findings has to have those findings DELETED.
  // Returning early here is how "clear the mouth and save" would silently do
  // nothing at all.
  if (!probe.entry?.length) return { ops: removals(known, new Set(), patientId, owners, taken), skipped: [] };
  const keysByFullUrl = identityKeysOf(probe);
  const resources: Record<string, DentalCoreResourceIdentity> = {};
  const keyById = new Map<string, string>();
  for (const key of keysByFullUrl.values()) {
    // Only the id travels. The server owns `versionId`, and echoing a stale one
    // back into a PUT body asserts a version this client cannot vouch for.
    const preferred = known[key]?.id ?? stored[key]?.id ?? deterministicResourceId(patientId, key);
    const id = assignedId(key, preferred, patientId, owners, taken);
    taken.set(`${key.split("/", 1)[0]}/${id}`, key);
    resources[key] = { id };
    keyById.set(`${key.split("/", 1)[0]}/${id}`, key);
  }

  const bundle = buildDentalCoreBundle({ ...document, fhirIdentity: { resources } }, options);
  const entries = [...(bundle.entry ?? [])].sort((left, right) => {
    const byRank = rank(entryResourceType(left)) - rank(entryResourceType(right));
    return byRank !== 0 ? byRank : String(left.resource?.id ?? "").localeCompare(String(right.resource?.id ?? ""));
  });

  const ops: WriteOp[] = [];
  const skipped: SkippedResource[] = [];
  // A resource whose REQUIRED companion is not written cannot be written
  // either. The codec pairs a periodontal-diagnosis `Condition` with a clinical
  // `Provenance` and demands both when reading back — so writing the Condition
  // alone does not lose one finding, it makes the NEXT LOAD REJECT THE WHOLE
  // CHART. A Provenance is outside this client's write policy, and the
  // Condition has no unresolved outgoing reference of its own, so nothing else
  // in this plan would have caught it. Collected from the Provenance's own
  // `target`, never from a hand-kept list of pairs.
  const orphanedByProvenance = new Map<string, string>();
  for (const entry of entries) {
    const resource = entry.resource;
    if (!resource) continue;
    const resourceType = resource.resourceType;
    const id = resource.id;
    const identityKey = id ? keyById.get(`${resourceType}/${id}`) ?? "" : "";
    if (!id || !identityKey) {
      skipped.push({
        resourceType,
        identityKey,
        reason: "The Dental Core codec assigned this resource no stable identity, so it cannot be written under a repeatable id",
      });
      continue;
    }
    if (!(WRITABLE_RESOURCE_TYPES as readonly string[]).includes(resourceType)) {
      skipped.push({
        resourceType,
        identityKey,
        reason: `${resourceType} is outside the scoped machine client's write policy (${WRITABLE_RESOURCE_TYPES.join(", ")})`,
      });
      if (resourceType === "Provenance") {
        for (const target of referencesOf((resource as { target?: unknown }).target)) {
          orphanedByProvenance.set(target, identityKey);
        }
      }
      continue;
    }
    ops.push({ method: "PUT", path: `/${resourceType}/${id}`, resourceType, id, identityKey, resource });
  }
  const resolved = withResolvableReferences(ops, skipped, patientId, orphanedByProvenance);
  const bootstrap = bootstrapCarePlan(resolved.ops);
  const writes = bootstrap ? [bootstrap, ...resolved.ops] : resolved.ops;
  // Deletes go LAST, after the writes. By then the surviving resources have
  // already been rewritten without their references to what is about to go —
  // a CarePlan that keeps one of two ServiceRequests carries the new activity
  // list before the other one is deleted.
  return { ops: [...writes, ...removals(known, new Set(keysByFullUrl.values()), patientId, owners, taken)], skipped: resolved.skipped };
}

/**
 * The id a key is written under, moved off every id another owner holds.
 *
 * An id owned by another chart identity, or by a resource the chart must leave
 * alone (`null`), or already given to another key in this plan, would be
 * overwritten. The move is deterministic — the same key and ownership give the
 * same id on every save — so a re-save writes the moved resource again instead
 * of adding one.
 */
function assignedId(
  key: string,
  preferred: string,
  patientId: string,
  owners: ReadonlyMap<string, string | null>,
  taken: ReadonlyMap<string, string>,
): string {
  const resourceType = key.split("/", 1)[0];
  const blocked = (id: string): boolean => {
    const reference = `${resourceType}/${id}`;
    return (owners.has(reference) && owners.get(reference) !== key) || (taken.has(reference) && taken.get(reference) !== key);
  };
  let id = preferred;
  for (let attempt = 1; blocked(id); attempt += 1) {
    id = deterministicResourceId(patientId, `${key}/moved-${attempt}`);
  }
  return id;
}

/**
 * What the last load brought back and this chart no longer holds.
 *
 * The set of identity keys IS the comparison: a key the codec emitted then and
 * does not emit now belongs to a finding that was cleared. Only ids can be
 * deleted, so an identity captured without one is left alone; the patient never
 * is (this odontogram does not own the patient record, and the write policy
 * makes Patient read-only besides).
 *
 * Delete order is the REVERSE of the write order — a resource goes before the
 * one it references. Measured against Aidbox on 2026-08-23, that server does
 * not actually check incoming references on delete (deleting a ServiceRequest
 * still named by a CarePlan's `activity` answered 200), but a delete order that
 * only works because the server is lenient is one server away from being wrong.
 */
function removals(
  known: Record<string, DentalCoreResourceIdentity>,
  currentKeys: Set<string>,
  patientId: string,
  owners: ReadonlyMap<string, string | null> = new Map(),
  taken: ReadonlyMap<string, string> = new Map(),
): WriteOp[] {
  return Object.entries(known)
    .filter(([key, identity]) => {
      if (currentKeys.has(key) || !identity?.id) return false;
      const resourceType = key.split("/", 1)[0];
      // Only the identity that owns an id may remove it: never a resource the
      // chart must leave alone, another finding stored there, or an id this
      // very plan writes for another key.
      const reference = `${resourceType}/${identity.id}`;
      if (owners.has(reference) && owners.get(reference) !== key) return false;
      if (taken.has(reference)) return false;
      if (resourceType === "Patient" || identity.id === patientId) return false;
      return (WRITABLE_RESOURCE_TYPES as readonly string[]).includes(resourceType);
    })
    .map(([key, identity]) => {
      const resourceType = key.split("/", 1)[0];
      return {
        method: "DELETE" as const,
        path: `/${resourceType}/${identity.id}`,
        resourceType,
        id: identity.id!,
        identityKey: key,
      };
    })
    .sort((left, right) => {
      const byRank = deleteRank(left.resourceType) - deleteRank(right.resourceType);
      return byRank !== 0 ? byRank : left.id.localeCompare(right.id);
    });
}

/** Every `reference` string anywhere inside a resource, at any depth. */
function referencesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(referencesOf);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const own = typeof record.reference === "string" ? [record.reference] : [];
  return [...own, ...Object.values(record).flatMap(referencesOf)];
}

/**
 * Drop every op that names a resource nobody writes.
 *
 * Aidbox enforces referential integrity, so such an op is rejected — and it is
 * rejected IN THE MIDDLE of the sequence, after earlier resources are already
 * on the server. Planning it means every save of that chart half-fails.
 *
 * The real case is the peri-implant finding: `toFhirDentalCore` gives it an
 * unconditional `focus` on the tooth's implant `Device`, and a Device is
 * outside this client's write policy — so the finding must follow the Device
 * into `skipped`. It also covers the reference the codec mints for a Device it
 * never emits (a peri-implant finding on an implant with no charted product),
 * which resolves to nothing at all.
 *
 * Dropping one op can strand another, so this runs to a fixpoint. The patient
 * is the one reference that needs no op: it lives on the server already and
 * this odontogram does not own it.
 *
 * NOT a codec change. The bundle `src/fhir` produces is untouched; what this
 * decides is only which of its resources this scoped client can carry.
 */
function withResolvableReferences(
  ops: WriteOp[],
  skipped: SkippedResource[],
  patientId: string,
  orphanedByProvenance: Map<string, string> = new Map(),
): WritePlan {
  const carried = [...ops];
  const dropped = [...skipped];
  for (;;) {
    const written = new Set([`Patient/${patientId}`, ...carried.map((op) => `${op.resourceType}/${op.id}`)]);
    const orphaned = carried.findIndex((op) => orphanedByProvenance.has(`${op.resourceType}/${op.id}`));
    if (orphaned !== -1) {
      const [op] = carried.splice(orphaned, 1);
      dropped.push({
        resourceType: op.resourceType,
        identityKey: op.identityKey,
        reason: `Its required clinical Provenance (${orphanedByProvenance.get(`${op.resourceType}/${op.id}`)}) is not written, and the codec refuses to read one without the other — writing it alone would make the next load reject the whole chart`,
      });
      continue;
    }
    const index = carried.findIndex((op) =>
      referencesOf(op.resource).some((reference) => !written.has(reference)));
    if (index === -1) return { ops: carried, skipped: dropped };
    const [op] = carried.splice(index, 1);
    const unresolved = referencesOf(op.resource).filter((reference) => !written.has(reference));
    dropped.push({
      resourceType: op.resourceType,
      identityKey: op.identityKey,
      reason: `References ${unresolved.join(", ")}, which this client does not write — the server would reject the write`,
    });
  }
}

/**
 * The bare first write of a CarePlan that carries activities.
 *
 * It goes FIRST of everything, which it can: without `activity` a CarePlan
 * references nothing but the patient. Its ServiceRequests then have something
 * to be `basedOn`, and the complete CarePlan follows them.
 *
 * A re-save repeats both writes, so the end state is the same one every time —
 * the plan stays idempotent. What it is NOT is atomic: between the two writes
 * the CarePlan on the server briefly lists no activity. That is the same
 * partial-state window every single-resource write in this plan has, and it is
 * documented rather than hidden (docs/aidbox-live-mode.md).
 */
function bootstrapCarePlan(ops: WriteOp[]): WriteOp | undefined {
  const carePlan = ops.find((op) => op.resourceType === "CarePlan");
  if (!carePlan) return undefined;
  const { activity, ...bare } = carePlan.resource as Resource & { activity?: unknown[] };
  if (!Array.isArray(activity) || activity.length === 0) return undefined;
  return { ...carePlan, resource: bare as Resource, bootstrap: true };
}
