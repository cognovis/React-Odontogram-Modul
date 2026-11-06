// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi / odontogram-wt5: the ONLY module that talks to a
// server. The published chart library may import the gateway SPI and the
// load/save delegates; it must not import this file. `@cognovis/fhir-sdk/client`
// stays here.
//
// Bead odontogram-0w9 made "here" a package rather than a directory. Nothing
// about the transport changed — it moved out of the chart SDK's dev app so
// that the standalone app and every host application reach Aidbox through
// this one factory instead of a copy each.
//
// WHICH FACTORY, AND WHY. The `odontogram-live` machine client is scoped by
// AccessPolicy to Patient/Observation/Condition/ServiceRequest/CarePlan, so the
// factory must not read anything at boot that the scope does not cover —
// widening the client to admin scope is exactly what this mode forbids.
// `@cognovis/fhir-sdk/client` `createFhirClient` performs no boot call; the
// deprecated `createFhirDeClient` alias is the same factory. The transport
// SPI, `createFetchTransport` and `extractNextPageUrl` are used unchanged.
// `createAidboxFhirClient` is not used: it is a client-credentials factory and
// is not the HTTP Basic scoped browser client.

import { createFetchTransport, createFhirClient, extractNextPageUrl } from "@cognovis/fhir-sdk/client";
import type { FhirTransport } from "@cognovis/fhir-sdk/client";
import type { AidboxConnection } from "./connection";
import type { AidboxGateway, PagedSearchResult } from "@cognovis/odontogram";

/** Aidbox's FHIR endpoint sits under `/fhir` on the configured base URL. */
export function fhirBaseUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/fhir`;
}

/**
 * HTTP Basic, from the scoped machine client's id and secret. The credentials
 * come from the developer's `.env` (git-ignored) — never from a checked-in
 * file, and never from an admin account.
 */
export function basicAuthorization(clientId: string, clientSecret: string): string {
  // UTF-8 FIRST, then base64. `btoa` takes Latin-1 and throws an opaque
  // InvalidCharacterError on anything else — a secret with one non-Latin-1
  // character would fail as "live mode is broken" rather than as "this
  // credential needs encoding".
  const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const encode = typeof btoa === "function"
    ? btoa
    : (value: string) => Buffer.from(value, "binary").toString("base64");
  return `Basic ${encode(binary)}`;
}

export function createAidboxTransport(config: AidboxConnection): FhirTransport {
  return createFetchTransport({
    baseUrl: fhirBaseUrl(config.baseUrl),
    headers: { Authorization: basicAuthorization(config.clientId, config.clientSecret) },
  });
}

/** How many pages a single search will follow before giving up. */
export const DEFAULT_MAX_PAGES = 50;

/**
 * The sort every paged search asks for.
 *
 * A paged search WITHOUT a total order is not a search, it is a lottery. The
 * server picks page one, and if two rows are equally ranked it may order them
 * differently when it picks page two — so a resource comes twice and another
 * never comes at all. Measured against Aidbox on 2026-08-23: six consecutive
 * two-page fetches of the same unchanged 128-resource chart returned 128
 * resources every time, of which 101, 100, 118, 116, 118 and 110 were DISTINCT
 * — 10 to 28 duplicates per read, and as many resources silently absent. With
 * `_sort=_id` the same six fetches returned 128 distinct resources every time.
 *
 * `_id` and not `_lastUpdated`: both were measured stable, but two resources
 * written in the same save can share a timestamp, and ids cannot collide.
 */
export const STABLE_SORT = "_id";

interface SearchPage {
  total?: number;
  entry?: Array<{ resource?: unknown }>;
  link?: Array<{ relation?: string; url?: string }>;
}

/**
 * Read EVERY page of a search. A loader that stops after the first page shows a
 * partial mouth and says nothing about it, which reads as a chart rather than
 * as a truncated one. The page budget guards against a server whose next link
 * points at itself.
 *
 * Hitting that budget is REPORTED, not swallowed: the caller carries
 * `truncated` into the load report, so a partial read is never displayed as a
 * whole chart. The same silence this function exists to prevent must not come
 * back in through its own guard.
 *
 * AND THE ASSEMBLY IS COUNTED. Following links is not proof of completeness: a
 * dropped connection, a lost page, a link the server stops offering all end the
 * loop quietly, and a short read of a Dental Core chart PARSES — it simply
 * comes back missing findings. Measured on the live fixture: the app's own
 * whole-mouth save is 128 Observations against a default page size of 100, and
 * `Observation/...tooth-state-16` was entry number 100 — the first entry of
 * page two. Losing that page produced a chart that loaded cleanly and showed
 * tooth 16 with no filling. So the count the server reports in `Bundle.total`
 * is checked against what actually arrived, and a short read is a FAILED read.
 *
 * A server that reports no `total` cannot be checked this way, and this does
 * not pretend otherwise: `expected` stays undefined and `incomplete` stays
 * false. A page that FAILS still throws, and must — the caller turns that into
 * a failed load rather than a partial chart.
 */
export async function searchAllPages(
  transport: FhirTransport,
  resourceType: string,
  query: Record<string, string | string[]>,
  maxPages: number = DEFAULT_MAX_PAGES,
): Promise<PagedSearchResult> {
  // DISTINCT, keyed by identity: an unstable sort hands the same resource out
  // twice, and the codec refuses a collection carrying a duplicate id. Keeping
  // the first occurrence is not a repair — the count below is what decides
  // whether the read was whole.
  const distinct = new Map<string, unknown>();
  let anonymous = 0;
  const collect = (resource: unknown): void => {
    const record = resource as { resourceType?: unknown; id?: unknown };
    const key = typeof record?.resourceType === "string" && typeof record?.id === "string"
      ? `${record.resourceType}/${record.id}`
      : `anonymous:${anonymous += 1}`;
    if (!distinct.has(key)) distinct.set(key, resource);
  };

  let path = `/${resourceType}`;
  let pageQuery: Record<string, string | string[]> | undefined = { ...query, _sort: STABLE_SORT };
  let expected: number | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const bundle = (await transport.request("GET", path, pageQuery ? { query: pageQuery } : undefined)) as SearchPage | null;
    if (typeof bundle?.total === "number") expected = bundle.total;
    for (const entry of bundle?.entry ?? []) {
      if (entry?.resource) collect(entry.resource);
    }
    const next = extractNextPageUrl(bundle ?? undefined);
    if (!next) return { resources: [...distinct.values()], truncated: false, ...completeness(distinct.size, expected) };
    // The next link carries the sort with it, so it is not re-applied.
    path = next.startsWith("/") ? next : `/${next}`;
    pageQuery = undefined;
  }
  return { resources: [...distinct.values()], truncated: true, ...completeness(distinct.size, expected) };
}

/**
 * Completeness is counted in DISTINCT resources against the server's own total.
 *
 * Counting arrivals instead would have missed the whole defect: an unstable
 * paged search delivers exactly `total` resources while a tenth of them are
 * repeats and the rest of that tenth never arrived.
 */
function completeness(distinct: number, expected: number | undefined): { expected?: number; incomplete: boolean } {
  if (typeof expected !== "number") return { incomplete: false };
  return { expected, incomplete: distinct < expected };
}

/**
 * A pass-through "profile" so the typed `ResourceClient` can be used for the
 * one resource this mode reads by id. The Dental Core resources have their own
 * SDK Dental Core profile classes, which are not used as the live client's
 * `ProfileClass` here — mapping them would be a second codec, so the raw
 * resource is what travels and `src/fhir` stays the only interpreter.
 */
const PassThroughPatient = {
  canonicalUrl: "http://hl7.org/fhir/StructureDefinition/Patient",
  from: (resource: { resourceType: string; id?: string }) => resource,
  createResource: () => ({ resourceType: "Patient" }),
};

export function createAidboxGateway(config: AidboxConnection, transport: FhirTransport = createAidboxTransport(config)): AidboxGateway {
  const client = createFhirClient({ baseUrl: fhirBaseUrl(config.baseUrl), transport });
  const patients = client.forProfile(PassThroughPatient, "Patient");
  return {
    // `read` answers null on 404 — a patient id that does not exist is a
    // configuration mistake to report, not an exception to crash on.
    readPatient: async (patientId) => (await patients.read(patientId)) as Record<string, unknown> | null,
    search: (resourceType, query) => searchAllPages(transport, resourceType, query),
    put: (path, resource) => transport.request("PUT", path, { body: resource }),
    delete: (path) => transport.request("DELETE", path),
  };
}
