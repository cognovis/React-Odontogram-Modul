// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// cognovis/odontogram#33 (review of PR #34): the gate in front of the
// "unsupported, not rejected" partition. Only a resource that CONFORMS to its
// Dental Core profile may be listed as unsupported and kept away from the
// codec; a broken one has to reach the all-or-nothing codec, which refuses the
// collection and names it. This is a floor, not a validator: Aidbox and the
// release-time HL7 validator own full conformance.

import * as DentalCore from "@cognovis/fhir-sdk/dental-core";
import { DENTAL_CORE_PROFILES, FDI_SYSTEM } from "./dentalCoreContract";

type GeneratedProfile = { canonicalUrl: string; from(resource: never): unknown };

/** Every generated Dental Core profile class of the pinned SDK, by canonical. */
const GENERATED_BY_URL = new Map<string, GeneratedProfile>();
for (const value of Object.values(DentalCore) as unknown[]) {
  if (typeof value !== "function") continue;
  const candidate = value as unknown as Partial<GeneratedProfile>;
  if (typeof candidate.canonicalUrl === "string" && typeof candidate.from === "function") {
    GENERATED_BY_URL.set(candidate.canonicalUrl, candidate as GeneratedProfile);
  }
}

/**
 * Profiles whose sliced `value[x]` the generated validator reads through a
 * synthetic `value` alias — the same normalisation the codec applies, on a
 * clone only.
 */
const CHOICE_SLICE_PROFILES = new Set<string>([
  DENTAL_CORE_PROFILES["dental-tooth-state"],
  DENTAL_CORE_PROFILES["dental-gingival-recession-assessment"],
  DENTAL_CORE_PROFILES["dental-caries-finding"],
  DENTAL_CORE_PROFILES["dental-periodontal-finding"],
]);

/**
 * Profiles that bind `bodySite` to the FDI tooth positions as REQUIRED
 * (Dental Core). The generated classes check cardinality, not bindings,
 * so this one is checked here: a text-only tooth is broken data, not a dialect.
 */
const REQUIRED_FDI_BODY_SITE = new Set<string>([
  "dental-tooth-state",
  "dental-caries-finding",
  "dental-periodontal-finding",
  "dental-peri-implant-finding",
  "dental-gingival-recession-assessment",
  "dental-gingival-assessment",
  "dental-service-request",
  "dental-procedure",
  "dental-mesiodistal-tooth-width",
  "dental-restoration-evaluation",
  "dental-periapical-index",
  "dental-pulp-diagnosis",
  "dental-apical-diagnosis",
  "dental-radiographic-caries-depth",
].map((id) => DENTAL_CORE_PROFILES[id]).filter((url): url is string => typeof url === "string"));

/**
 * `DentalFinding` and every profile derived from it require `effective[x]`
 * (1..1). The generated classes do not check a choice element's cardinality.
 */
const REQUIRED_EFFECTIVE = new Set<string>([
  "dental-finding",
  "dental-chart-state",
  "dental-tooth-state",
  "dental-caries-finding",
  "dental-gingival-assessment",
  "dental-gingival-recession-assessment",
  "dental-orthodontic-finding",
  "dental-periodontal-finding",
  "dental-peri-implant-finding",
  "dental-mesiodistal-tooth-width",
  "dental-restoration-evaluation",
  "dental-periapical-index",
  "dental-pulp-diagnosis",
  "dental-apical-diagnosis",
  "dental-radiographic-caries-depth",
].map((id) => DENTAL_CORE_PROFILES[id]).filter((url): url is string => typeof url === "string"));

const EFFECTIVE_CHOICES = ["effectiveDateTime", "effectivePeriod", "effectiveTiming", "effectiveInstant"];

/**
 * `ToothPositionFdiVS` of Dental Core 0.8.1 (unchanged in 0.9.0). It includes the whole
 * `tooth-position-fdi` CodeSystem (content `complete`): the 32 permanent
 * positions 11–48 and the 20 primary positions 51–85. Neither the SDK nor the
 * release ships concept lists, so the membership is pinned here and checked
 * against the package's own CodeSystem and ValueSet by
 * `gh33-review2-fdi-store-guard.test.ts`.
 */
export const FDI_TOOTH_POSITIONS: ReadonlySet<string> = new Set<string>(
  [[1, 8], [2, 8], [3, 8], [4, 8], [5, 5], [6, 5], [7, 5], [8, 5]]
    .flatMap(([quadrant, count]) => Array.from({ length: count }, (_, index) => `${quadrant}${index + 1}`)),
);

function generatedProfileError(profile: GeneratedProfile, url: string, resource: Record<string, unknown>): string | undefined {
  const candidate = CHOICE_SLICE_PROFILES.has(url) ? structuredClone(resource) : resource;
  if (candidate !== resource && Array.isArray(candidate.component)) {
    for (const item of candidate.component as Array<Record<string, unknown>>) {
      if (item && item.valueCodeableConcept !== undefined && item.value === undefined) item.value = item.valueCodeableConcept;
    }
  }
  try {
    profile.from(candidate as never);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function fdiBodySiteError(resource: Record<string, unknown>): string | undefined {
  const sites = resource.bodySite === undefined ? [] : Array.isArray(resource.bodySite) ? resource.bodySite : [resource.bodySite];
  for (const site of sites) {
    const coding = (site as { coding?: Array<{ system?: unknown; code?: unknown }> } | null)?.coding;
    const fdi = Array.isArray(coding)
      && coding.some((item) => item?.system === FDI_SYSTEM && typeof item.code === "string" && FDI_TOOTH_POSITIONS.has(item.code));
    if (!fdi) return `bodySite carries no code from the required FDI tooth-position value set (${FDI_SYSTEM})`;
  }
  return undefined;
}

/**
 * Why a resource fails one of its Dental Core profiles, or `undefined` when it
 * passes this floor: the pinned SDK's generated profile class (required
 * elements, fixed values, cardinalities), the required `effective[x]` of
 * the finding profiles, and the required FDI `bodySite` binding.
 */
export function dentalCoreConformanceError(resource: Record<string, unknown>, profiles: readonly string[]): string | undefined {
  for (const url of profiles) {
    const generated = GENERATED_BY_URL.get(url);
    const generatedError = generated ? generatedProfileError(generated, url, resource) : undefined;
    if (generatedError) return generatedError;
    if (REQUIRED_EFFECTIVE.has(url) && !EFFECTIVE_CHOICES.some((choice) => resource[choice] !== undefined)) {
      return "effective[x] is required and missing";
    }
    if (REQUIRED_FDI_BODY_SITE.has(url)) {
      const siteError = fdiBodySiteError(resource);
      if (siteError) return siteError;
    }
  }
  return undefined;
}
