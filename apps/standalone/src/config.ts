// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-6fi: live-mode configuration.
//
// DOM-free and dependency-free on purpose — the resolution takes the
// environment record and the query string as ARGUMENTS rather than reading
// `import.meta.env` and `location.search` itself, so the precedence rule is
// testable without a browser and without a build-time environment.
//
// Bead odontogram-0w9: this file is THE ONLY place in the workspace that names
// a `VITE_*` key, and it lives in the app for that reason. `import.meta.env` is
// a build-time substitution — a library that reads it works in exactly one
// consumer, the one that was built with those variables. The published chart
// SDK and the published Aidbox transport both take their configuration as an
// argument; the app is what resolves it.

import type { AidboxConnection } from "@cognovis/odontogram-fhir";

/** The Vite environment keys the live mode reads. All are optional at the type level. */
export interface LiveEnv {
  VITE_AIDBOX_BASE_URL?: string;
  VITE_AIDBOX_CLIENT_ID?: string;
  VITE_AIDBOX_CLIENT_SECRET?: string;
  VITE_DEFAULT_PATIENT_ID?: string;
}

/**
 * A complete live-mode configuration: a server, a scoped machine client, a
 * patient.
 *
 * The first three ARE the transport's `AidboxConnection` — the type is extended
 * rather than restated, so a credential can never be described twice and drift.
 * The patient id is the app's own: it says what this chart is about, which is
 * not part of reaching a server.
 */
export interface LiveConfig extends AidboxConnection {
  patientId: string;
}

/**
 * Either a usable configuration, or the list of what has to be supplied first.
 *
 * Deliberately ONE shape with optional members rather than a discriminated
 * union: this repository compiles with `strict: false`, where a `ok: true` /
 * `ok: false` literal discriminant does not narrow.
 */
export interface LiveConfigResult {
  ok: boolean;
  config?: LiveConfig;
  /** Empty when `ok`. Names every missing key at once when not. */
  missing: string[];
  /** Present but unusable — a value that is there and still cannot be used. */
  invalid: string[];
}

/**
 * The FHIR id grammar, `[A-Za-z0-9-.]{1,64}`.
 *
 * Checked BEFORE anything is requested, because the patient id goes straight
 * into a request path: `../../admin/console` escapes `/fhir` altogether and
 * carries the Basic credential with it. A path is not the place to discover
 * that an id was never an id. Dot-only ids are refused too, since dot segments
 * normalize to a different URL.
 * Patient selection deliberately refuses every dot-only id (L3); the SDK's
 * resource-identity guard preserves legal ids such as `...` for existing writes.
 */
const FHIR_ID = /^[A-Za-z0-9.-]{1,64}$/;

/** The label used for the patient, which has two sources and therefore two names. */
export const PATIENT_CONFIG_LABEL = "VITE_DEFAULT_PATIENT_ID (or ?patient=<id>)";

/** A value that is only whitespace is not a value — it is a missing one. */
function cleaned(value: string | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * The patient the live mode charts. The URL wins over the environment: the
 * environment default is what a developer starts with, the URL is what they
 * asked for on this load.
 */
export function resolvePatientId(env: LiveEnv, search: string): string | undefined {
  const fromUrl = cleaned(new URLSearchParams(search).get("patient") ?? undefined);
  return fromUrl ?? cleaned(env.VITE_DEFAULT_PATIENT_ID);
}

/**
 * Resolve the whole configuration, naming every missing piece at once. A live
 * mode with half a configuration must not boot: the missing half is a server
 * URL or a credential, and guessing either writes patient data somewhere
 * nobody named.
 */
export function resolveLiveConfig(env: LiveEnv, search: string): LiveConfigResult {
  const baseUrl = cleaned(env.VITE_AIDBOX_BASE_URL)?.replace(/\/+$/, "");
  const clientId = cleaned(env.VITE_AIDBOX_CLIENT_ID);
  const clientSecret = cleaned(env.VITE_AIDBOX_CLIENT_SECRET);
  const patientId = resolvePatientId(env, search);
  const missing: string[] = [];
  const invalid: string[] = [];
  if (!baseUrl) missing.push("VITE_AIDBOX_BASE_URL");
  if (!clientId) missing.push("VITE_AIDBOX_CLIENT_ID");
  if (!clientSecret) missing.push("VITE_AIDBOX_CLIENT_SECRET");
  if (!patientId) missing.push(PATIENT_CONFIG_LABEL);
  else if (!FHIR_ID.test(patientId) || /^\.+$/.test(patientId)) {
    invalid.push(`The patient id "${patientId}" is not a path-safe FHIR id (${FHIR_ID.source}) and is refused before any request`);
  }
  if (missing.length || invalid.length) return { ok: false, missing, invalid };
  return { ok: true, missing: [], invalid: [], config: { baseUrl, clientId, clientSecret, patientId } };
}

/**
 * Which of the app's two faces to show — the fixture playground, or the live
 * chart against Aidbox.
 *
 * Bead odontogram-0w9 folded `live.html` into the one app, so the mode is a
 * decision rather than a URL. It is deliberately NOT `resolveLiveConfig().ok`:
 * a half-configured live mode would then fall back to the playground and hide
 * the very list of missing keys that says what to fix. So the question asked
 * here is whether live mode was ASKED FOR, and the answer is yes as soon as
 * any live environment key or `?live` / `?patient=` is present. What happens
 * when it was asked for but cannot be honoured is `LiveApp`'s setup hint.
 *
 * Nothing configured at all is the plain case: the fixture playground, exactly
 * what `index.html` served before.
 */
export function isLiveModeRequested(env: LiveEnv, search: string): boolean {
  const query = new URLSearchParams(search);
  if (query.has("live") || cleaned(query.get("patient") ?? undefined)) return true;
  return Boolean(
    cleaned(env.VITE_AIDBOX_BASE_URL) ||
    cleaned(env.VITE_AIDBOX_CLIENT_ID) ||
    cleaned(env.VITE_AIDBOX_CLIENT_SECRET) ||
    cleaned(env.VITE_DEFAULT_PATIENT_ID),
  );
}
