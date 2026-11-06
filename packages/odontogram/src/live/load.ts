// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi: turning what a server holds for one patient into a
// charted document, plus an honest account of what could not be charted.
//
// `assembleLoadResult` is PURE — it takes resources that have already been
// fetched. `loadPatientChart` is the thin I/O shell around it.
//
// THE PARTITION IS THE POINT. `parseDentalCoreBundle` is all-or-nothing: it
// returns `undefined` for a bundle carrying one resource it does not recognise.
// A practice server carries dental resources in other dialects — the charly
// adapter's `ze-befund` Observations under the full dental IG are this bead's
// named case — so those are separated out BEFORE the codec sees them and are
// listed in the load report with their id and profile. Neither the codec nor
// this module learns to read them: the delta is documented in
// docs/aidbox-live-mode.md, and widening the codec is bead odontogram-wl8.

import type { Bundle } from "fhir/r4";
import type { OdontogramDocument } from "../document";
import { DENTAL_CORE, DENTAL_CORE_BUNDLE_IDENTIFIER, DENTAL_CORE_PROFILES, unmappedDentalCoreReason } from "../fhir/dentalCoreContract";
import { dentalCoreConformanceError } from "../fhir/dentalCoreConformance";
import { parseDentalCoreBundle } from "../fhir/fromFhirDentalCore";
import type { AidboxGateway } from "./gateway";
import { liveIdPrefix } from "./writePlan";

/**
 * The resource types the scoped machine client may read for a patient's chart,
 * each with the search parameter that names the patient. A Device names its
 * patient in `patient`, not `subject` (cognovis/odontogram#28): never searched,
 * a placed implant never reached the codec and lost its position.
 *
 * Procedure is NOT read yet, although the codec writes and reads one. The
 * synthetic seed data stores `dental-procedure` Procedures with a text-only bodySite;
 * the conformance floor calls that broken, and broken data refuses the whole
 * chart — so searching Procedure would stop four seed patients loading at all.
 */
const PATIENT_SEARCH_PARAMETER = {
  Observation: "subject",
  Condition: "subject",
  ServiceRequest: "subject",
  CarePlan: "subject",
  Device: "patient",
} as const;

export const SEARCHED_RESOURCE_TYPES = Object.keys(PATIENT_SEARCH_PARAMETER) as Array<keyof typeof PATIENT_SEARCH_PARAMETER>;

/** The search that finds one patient's resources of `resourceType`. */
export function patientSearchQuery(resourceType: (typeof SEARCHED_RESOURCE_TYPES)[number], patientId: string): Record<string, string> {
  return { [PATIENT_SEARCH_PARAMETER[resourceType]]: `Patient/${patientId}` };
}

export interface UnsupportedResource {
  reference: string;
  profile?: string;
  reason: string;
}

export interface LoadReport {
  /** Everything the server handed over, including the patient. */
  fetched: number;
  /** How many of those the Dental Core codec was offered. */
  dentalCore: number;
  /** What was left over, named rather than dropped. */
  unsupported: UnsupportedResource[];
  /** Resource types whose search hit the page budget — their result is PARTIAL. */
  truncated?: string[];
  /** Resource types where fewer resources arrived than the server counted. */
  incomplete?: string[];
  /**
   * The first resource whose inclusion makes the codec refuse the collection.
   *
   * `parseDentalCoreBundle` answers `undefined` and nothing else, which is the
   * single hardest thing about diagnosing a rejected load — the acceptance run
   * had "nothing was charted" and no way to ask why. This is computed by
   * bisecting the collection on the failure path only.
   */
  rejectedAt?: string;
  parsed: boolean;
  error?: string;
}

export interface LoadResult {
  document?: OdontogramDocument;
  bundle: Bundle;
  report: LoadReport;
}

type ResourceRecord = Record<string, unknown> & {
  resourceType?: unknown;
  id?: unknown;
  meta?: { profile?: unknown };
};

const dentalCoreProfiles = new Set<string>(Object.values(DENTAL_CORE_PROFILES));

function profilesOf(resource: ResourceRecord): string[] {
  const profiles = resource.meta?.profile;
  return Array.isArray(profiles) ? profiles.filter((value): value is string => typeof value === "string") : [];
}

/**
 * Which resources the codec is offered.
 *
 * Three admissions, in this order:
 *   1. the patient itself, as the subject anchor every resource is checked against;
 *   2. anything carrying a Dental Core profile;
 *   3. anything carrying NO profile at all whose id this mode minted — the
 *      codec emits its CarePlan and its Condition without a `meta.profile`, and
 *      the deterministic id prefix is what still identifies them as ours.
 *
 * Everything else is foreign. A foreign resource is never guessed at: it is
 * reported with its id and its profile so a reader can see what is missing.
 */
export function partitionResources(patientId: string, resources: ResourceRecord[]): {
  core: ResourceRecord[];
  unsupported: UnsupportedResource[];
} {
  const prefix = liveIdPrefix(patientId);
  const core: ResourceRecord[] = [];
  const unsupported: UnsupportedResource[] = [];
  for (const resource of resources) {
    const resourceType = typeof resource?.resourceType === "string" ? resource.resourceType : "";
    const id = typeof resource?.id === "string" ? resource.id : "";
    const reference = id ? `${resourceType}/${id}` : resourceType || "(unknown resource)";
    const profiles = profilesOf(resource);
    if (!resourceType || !id) {
      unsupported.push({ reference, reason: "The server returned a resource with no type or no id" });
      continue;
    }
    if (resourceType === "Patient") {
      if (id === patientId) core.push(resource);
      else unsupported.push({ reference, reason: "A Patient other than the one being charted" });
      continue;
    }
    if (profiles.some((profile) => dentalCoreProfiles.has(profile))) {
      // Only a resource that CONFORMS to its Dental Core profile may be listed
      // as unsupported. A broken one goes to the codec, which refuses the
      // collection and names it — broken data is never quietly set aside.
      const broken = dentalCoreConformanceError(resource, profiles.filter((profile) => dentalCoreProfiles.has(profile)));
      const reason = broken ? undefined : unmappedDentalCoreReason(resource);
      if (reason) {
        unsupported.push({ reference, ...(profiles.length ? { profile: profiles[0] } : {}), reason });
        continue;
      }
      core.push(resource);
      continue;
    }
    if (profiles.length === 0 && id.startsWith(prefix)) {
      core.push(resource);
      continue;
    }
    unsupported.push({
      reference,
      ...(profiles.length ? { profile: profiles[0] } : {}),
      reason: profiles.length
        ? "The profile is not part of the Dental Core contract this odontogram reads"
        : "No profile, and not a resource this live mode wrote — not part of the Dental Core contract",
    });
  }
  return { core, unsupported };
}

/** Read order for the assembled collection — see the comment in `assembleLoadResult`. */
function loadRank(resource: ResourceRecord): number {
  if (resource.resourceType === "Patient") return 0;
  if (resource.resourceType === "Device") return 1;
  if (resource.resourceType === "CarePlan") return 2;
  if (resource.resourceType === "ServiceRequest") return 3;
  return 4;
}

/**
 * Which resource the codec first refuses.
 *
 * `parseDentalCoreBundle` returns `undefined` and carries no reason, so the
 * reason is MEASURED instead of asked for: grow the collection one resource at
 * a time and report the one that flips it. Runs only when a load has already
 * failed, so the cost buys a diagnosis nobody had before — a rejected load used
 * to say "nothing was charted" and stop there.
 *
 * The answer is "the first resource that cannot stand with the ones before it",
 * which is not always the guilty party (two resources can contradict each
 * other) — the message says "refuses", not "is wrong".
 */
function firstRejectingResource(ordered: ResourceRecord[]): string | undefined {
  const anchor = ordered.filter((resource) => resource.resourceType === "Patient");
  const rest = ordered.filter((resource) => resource.resourceType !== "Patient");
  for (let count = 1; count <= rest.length; count += 1) {
    const probe = collectionOf([...anchor, ...rest.slice(0, count)]);
    if (parseDentalCoreBundle(probe) === undefined) {
      const culprit = rest[count - 1];
      return `${culprit.resourceType}/${culprit.id}`;
    }
  }
  return undefined;
}

function collectionOf(resources: ResourceRecord[]): Bundle {
  return {
    resourceType: "Bundle",
    type: "collection",
    identifier: { system: DENTAL_CORE, value: DENTAL_CORE_BUNDLE_IDENTIFIER },
    entry: resources.map((resource) => ({ resource: resource as never })),
  };
}

export interface AssembleInput {
  patientId: string;
  resources: ResourceRecord[];
}

/**
 * Keep the ids a save must not touch.
 *
 * An unsupported resource is left alone on load, so a save must leave it alone
 * too. Only an id carrying this mode's prefix can collide with a write — every
 * id the write plan generates carries it — so only those are retained; the
 * thousands of foreign-dialect resources a practice server may hold do not
 * ride along in the document. `buildWritePlan` moves a generated write off
 * these ids and never deletes one.
 */
function withReservedIds(document: OdontogramDocument, patientId: string, unsupported: UnsupportedResource[]): OdontogramDocument {
  const prefix = liveIdPrefix(patientId);
  const reserved = unsupported
    .map((entry) => entry.reference)
    .filter((reference) => reference.split("/", 2)[1]?.startsWith(prefix))
    .sort();
  // Always present after a load, even empty: an array says "the reservations
  // of this chart are KNOWN", which is what lets a save through a target that
  // cannot search the store (see `planGuardedSave` in `live/save.ts`).
  return { ...document, fhirIdentity: { ...document.fhirIdentity, reserved } };
}

/** Assemble, parse, and report — without touching a network. */
export function assembleLoadResult({ patientId, resources }: AssembleInput): LoadResult {
  const { core, unsupported } = partitionResources(patientId, resources);
  // ORDER MATTERS, and in exactly two places. The codec reads a collection in
  // ONE pass: the patient has to stand before the findings that reference it,
  // and the CarePlan before the plan-chart Observations, because an Observation
  // is recognised as PLANNED by resolving its `basedOn` against a CarePlan the
  // parser has already seen. A server hands its search results back in whatever
  // order it likes, so the order is restored here.
  const ordered = [...core].sort((left, right) => loadRank(left) - loadRank(right));
  // The marker says what this collection IS. Without it a chart holding no
  // finding yet carries no admitted profile either, and the codec would
  // decline to read an empty mouth.
  const bundle = collectionOf(ordered);
  const parsed = parseDentalCoreBundle(bundle) as OdontogramDocument | undefined;
  const document = parsed ? withReservedIds(parsed, patientId, unsupported) : undefined;
  const rejectedAt = document === undefined ? firstRejectingResource(ordered) : undefined;
  const report: LoadReport = {
    fetched: resources.length,
    dentalCore: core.length,
    unsupported,
    parsed: document !== undefined,
    ...(rejectedAt ? { rejectedAt } : {}),
    ...(document === undefined
      ? {
        error: "The Dental Core codec rejected the assembled collection, so nothing was charted"
          + (rejectedAt ? ` — the first resource it refuses is ${rejectedAt}` : ""),
      }
      : {}),
  };
  return { ...(document ? { document } : {}), bundle, report };
}

/**
 * Read one patient's chart off the server. The patient is read by id first: a
 * patient that is not there is a configuration mistake worth naming, not an
 * empty chart.
 */
export async function loadPatientChart(gateway: AidboxGateway, patientId: string): Promise<LoadResult> {
  const patient = await gateway.readPatient(patientId);
  // No patient, no chart: every search below would be answered against a
  // subject that does not exist. Stop here instead of making five requests
  // whose result is discarded.
  if (!patient) {
    const empty = assembleLoadResult({ patientId, resources: [] });
    return {
      ...empty,
      report: { ...empty.report, parsed: false, error: `No Patient/${patientId} on this server` },
      document: undefined,
    };
  }
  const found: ResourceRecord[] = [patient as ResourceRecord];
  const truncated: string[] = [];
  const incomplete: string[] = [];
  for (const resourceType of SEARCHED_RESOURCE_TYPES) {
    // A page that fails THROWS, and is meant to: the caller turns it into a
    // failed load. What must never happen is that it turns into fewer teeth.
    const page = await gateway.search(resourceType, patientSearchQuery(resourceType, patientId));
    found.push(...(page.resources as ResourceRecord[]));
    if (page.truncated) truncated.push(resourceType);
    if (page.incomplete) incomplete.push(resourceType);
  }
  const result = assembleLoadResult({ patientId, resources: found });
  if (!truncated.length && !incomplete.length) return result;
  // A PARTIAL READ IS A FAILED READ. It is not enough to mark it: a short read
  // of a Dental Core chart parses perfectly well and simply comes back missing
  // findings, so it would render as a chart, and the next save would write that
  // gap back over the real one. The document is therefore withheld.
  const reason = incomplete.length
    ? `Fewer ${incomplete.join(", ")} resources arrived than the server counted`
    : `The search for ${truncated.join(", ")} hit the page budget`;
  return {
    bundle: result.bundle,
    document: undefined,
    report: {
      ...result.report,
      parsed: false,
      ...(truncated.length ? { truncated } : {}),
      ...(incomplete.length ? { incomplete } : {}),
      error: `${reason} — this read is PARTIAL, so nothing was charted and nothing may be saved back`,
    },
  };
}
