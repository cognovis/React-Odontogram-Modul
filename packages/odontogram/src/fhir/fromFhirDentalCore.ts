import type { Bundle, Observation, Resource } from "fhir/r4";
import { PAYLOAD_VERSION } from "../document";
import {
  DentalChartStateProfile,
  DentalTargetChartStateProfile,
  DentalToothStateProfile,
  DentalCariesFindingProfile,
  DentalClinicalProvenanceProfile,
  DentalDeviceProfile,
  DentalFindingProfile,
  DentalGingivalRecessionAssessmentProfile,
  DentalImplantProfile,
  DentalPeriImplantFindingProfile,
  DentalPeriodontalFindingProfile,
  DentalProcedureProfile,
  DentalRiskEvidenceProfile,
  DentalServiceRequestProfile,
  DentalPulpDiagnosisProfile,
  DentalApicalDiagnosisProfile,
  DentalRadiographicCariesDepthProfile,
} from "@cognovis/fhir-sdk/dental-core";
import { resolveSmokingStatus } from "./smokingStatus";
import { catalogValue, dentalCoreCoding, LOCAL_VALUE_MAPS } from "../registry/valueCatalog";
import type { DentalCoreResourceIdentity, OdontogramExportPayload, ToothRecord } from "./types";
import { isSourceRootIdentity, isValidEndodonticStates } from "./sourceStateValidation";
import {
  COMPONENT_SYSTEM,
  DENTAL_CORE,
  DENTAL_CORE_BUNDLE_IDENTIFIER,
  DENTAL_CORE_PROFILES,
  FDI_SYSTEM,
  CANAL_STATE_CODES,
  CARIES_SEVERITY_CODES,
  CARIES_SEVERITY_SYSTEM,
  CROWN_LEAKAGE,
  CERVICAL_KIND_CODES,
  DIRECT_FILLING,
  FINDING_CODES,
  FURCATION_GRADE_CODES,
  LESION_ACTIVITY,
  LESION_ACTIVITY_SYSTEM,
  LOINC_SYSTEM,
  isDentalCoreDiagnosis,
  isOdontogramFdi,
  isMappedChartProperty,
  isDentalCoreRiskValue,
  isMappedChartValue,
  mappingsByProperty,
  normalizeLegacyRootPost,
  PROPERTY_SYSTEM,
  PROVENANCE_SYSTEM,
  SNOMED_SYSTEM,
  toothOrderField,
  VALUE_SYSTEM,
} from "./dentalCoreContract";

const dentalCoreProfileValues = new Set<string>(Object.values(DENTAL_CORE_PROFILES));
const supportedBundleIdentifiers = new Set([
  DENTAL_CORE_BUNDLE_IDENTIFIER,
  "odontogram-dental-core-0.6.0",
]);

type ResourceRecord = Resource & Record<string, unknown>;
type GeneratedProfile = { from(resource: never): unknown };
type ResourceEntry = { resource: ResourceRecord; fullUrl?: string };

const codeAt = (resource: { coding?: Array<{ system?: string; code?: string }> } | undefined, system: string) =>
  resource?.coding?.find((coding) => coding.system === system)?.code;
const inverse = (values: Record<string, string> | undefined, code: string) =>
  Object.entries(values ?? {}).find(([, mapped]) => mapped === code)?.[0];
const hasAdmittedProfileResource = (resource: ResourceRecord, expected: string): boolean =>
  Array.isArray(resource.meta?.profile)
  && resource.meta.profile.includes(expected)
  && resource.meta.profile.every((profile) => typeof profile !== "string" || profile === expected || !dentalCoreProfileValues.has(profile));
const validGeneratedProfile = (profile: GeneratedProfile, resource: ResourceRecord): boolean => {
  try {
    profile.from(resource as never);
    return true;
  } catch {
    console.log("Dental Core generated profile rejected resource", resource.resourceType);
    return false;
  }
};
const validGeneratedChoiceSliceProfile = (profile: GeneratedProfile, resource: ResourceRecord): boolean => {
  // Atomic EHR codegen currently validates sliced value[x] fields through a synthetic
  // `value` alias even though generated setters emit the proper valueCodeableConcept.
  // Normalize only the validation clone; the FHIR resource itself is never changed.
  const normalized = structuredClone(resource);
  const components = Array.isArray(normalized.component) ? normalized.component as Array<Record<string, unknown>> : [];
  for (const item of components) {
    if (item.valueCodeableConcept !== undefined && item.value === undefined) item.value = item.valueCodeableConcept;
  }
  return validGeneratedProfile(profile, normalized);
};
const subjectReference = (resource: ResourceRecord): string | undefined => {
  const reference = resource.subject ?? resource.patient;
  return typeof (reference as { reference?: unknown } | undefined)?.reference === "string"
    ? (reference as { reference: string }).reference
    : undefined;
};
const bodySiteFdi = (resource: ResourceRecord): string | undefined =>
  codeAt(resource.bodySite as { coding?: Array<{ system?: string; code?: string }> } | undefined, FDI_SYSTEM);
const isIsoDateTime = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value);
const clinicalDate = (resource: ResourceRecord): boolean =>
  isIsoDateTime(resource.effectiveDateTime) || isIsoDateTime(resource.performedDateTime) || isIsoDateTime(resource.recorded);

const TOOTH_SURFACE_SYSTEM = "http://terminology.hl7.org/CodeSystem/FDI-surface";
const LOCATION_DETAIL_URL = DENTAL_CORE_PROFILES["measurement-location-detail"];
const RECORDED_ROOT_RESECTION_URL = DENTAL_CORE_PROFILES["recorded-root-resection"];
const RECORDED_PAPILLA_LOSS_URL = DENTAL_CORE_PROFILES["recorded-papilla-loss"];
const RECORDED_ORTHODONTIC_PROGRESSION_URL = DENTAL_CORE_PROFILES["recorded-orthodontic-progression"];
const RECORDED_IMPLANT_POSITION_URL = DENTAL_CORE_PROFILES["recorded-implant-position"];
const RECORDED_CROWN_FRACTURE_TYPE_URL = DENTAL_CORE_PROFILES["recorded-crown-fracture-type"];
const RECORDED_BRACKET_SURFACE_URL = DENTAL_CORE_PROFILES["recorded-bracket-surface"];
const RECORDED_CANTILEVER_ROLE_URL = DENTAL_CORE_PROFILES["recorded-cantilever-pontic-role"];
const RECORDED_ROOT_ENDODONTIC_STATE_URL = DENTAL_CORE_PROFILES["recorded-root-endodontic-state"];
const RECORDED_ROOT_FRACTURE_URL = DENTAL_CORE_PROFILES["recorded-root-fracture"];
const RECORDED_APICAL_FINDING_URL = DENTAL_CORE_PROFILES["recorded-apical-finding"];
const TARGET_CHART_STATE_PROFILE_URL = DENTAL_CORE_PROFILES["dental-target-chart-state"];
/** One chart surface named by an FDI-surface code; `incisal` marks the I edge. */
type SurfaceClaim = { surface: string; incisal: boolean };
const plain = (surface: string): SurfaceClaim => ({ surface, incisal: false });
/** I names the incisal edge, which the chart stores as its `occlusal` surface. */
const INCISAL_EDGE: SurfaceClaim = { surface: "occlusal", incisal: true };
/**
 * The chart surfaces of an HL7 FDI-surface code (cognovis/odontogram#39).
 * Dental Core's `tooth-surface` ValueSet includes the WHOLE HL7 system, so every
 * code in it is read: V (vestibular, the labial face of an anterior) is the
 * chart's buccal surface, and a combined code names several surfaces at once.
 * I is folded onto `occlusal` HERE, at the codec boundary: the chart has no
 * incisal surface, the occlusal key of an anterior IS its incisal edge (shown
 * as "incisal"), so every surface-keyed field reads and writes back as one
 * key. Where both name the same surface, an explicit O wins over I.
 * SC is not an HL7 code; it is the chart's subcrown key and is kept as it was.
 */
const SURFACE_VALUES: Readonly<Record<string, readonly SurfaceClaim[]>> = {
  M: [plain("mesial")], O: [plain("occlusal")], I: [INCISAL_EDGE], D: [plain("distal")],
  B: [plain("buccal")], V: [plain("buccal")], L: [plain("lingual")],
  MO: [plain("mesial"), plain("occlusal")], DO: [plain("distal"), plain("occlusal")],
  DI: [plain("distal"), INCISAL_EDGE], MOD: [plain("mesial"), plain("occlusal"), plain("distal")],
  SC: [plain("subcrown")],
};
/**
 * Precedence of two claims on one surface: a claim from I yields to an
 * explicit one; two claims of the same origin are compared by the caller.
 */
type SurfaceOutcome = "claim" | "same-origin" | "override" | "skip";
const surfaceOutcome = (prior: boolean | undefined, incisal: boolean): SurfaceOutcome =>
  prior === undefined ? "claim" : prior === incisal ? "same-origin" : prior ? "override" : "skip";
const SITE_VALUES: Record<string, string> = {
  "mesiobuccal-site": "MB", "buccal-site": "B", "distobuccal-site": "DB",
  "mesiolingual-site": "ML", "lingual-site": "L", "distolingual-site": "DL",
};

const extensionCoding = (target: unknown, url: string): { system?: string; code?: string } | undefined => {
  const extensions = (target as { extension?: Array<{ url?: string; valueCoding?: { system?: string; code?: string } }> } | undefined)?.extension;
  return extensions?.find((extension) => extension.url === url)?.valueCoding;
};
const extensionsAt = (target: unknown, url: string): Array<Record<string, unknown>> => {
  const extensions = (target as { extension?: unknown } | undefined)?.extension;
  return Array.isArray(extensions)
    ? extensions.filter((extension): extension is Record<string, unknown> => typeof extension === "object" && extension !== null && extension.url === url)
    : [];
};
const uniqueExtension = (target: unknown, url: string): Record<string, unknown> | undefined => {
  const matches = extensionsAt(target, url);
  return matches.length === 1 ? matches[0] : undefined;
};
const extensionString = (target: unknown, url: string): string | undefined => {
  const extension = uniqueExtension(target, url);
  return typeof extension?.valueString === "string" && extension.valueString ? extension.valueString : undefined;
};
const optionalExtensionString = (target: unknown, url: string): { valid: boolean; value?: string } => {
  const extensions = extensionsAt(target, url);
  if (extensions.length === 0) return { valid: true };
  if (extensions.length !== 1 || typeof extensions[0].valueString !== "string" || !extensions[0].valueString) return { valid: false };
  return { valid: true, value: extensions[0].valueString };
};
/** The surface claims of an FDI-surface coding; empty when it is not one. */
const claimsOfCoding = (value: { system?: unknown; code?: unknown } | undefined): readonly SurfaceClaim[] =>
  value?.system === TOOTH_SURFACE_SYSTEM && typeof value.code === "string" && Object.prototype.hasOwnProperty.call(SURFACE_VALUES, value.code)
    ? SURFACE_VALUES[value.code] : [];
/** The single chart surface of an FDI-surface coding, or `undefined`. */
const singleSurfaceOfCoding = (value: { system?: unknown; code?: unknown } | undefined): string | undefined => {
  const claims = claimsOfCoding(value);
  return claims.length === 1 ? claims[0].surface : undefined;
};
/**
 * The surface claims a `tooth-surface` extension names — one for a single
 * code, several for a combined one (MO, DO, DI, MOD). Empty when the target
 * carries no such extension or an unknown code.
 */
const componentSurfaceClaims = (target: unknown): readonly SurfaceClaim[] =>
  claimsOfCoding(extensionCoding(target, DENTAL_CORE_PROFILES["tooth-surface"]));
/** The chart surfaces a `tooth-surface` extension names. */
const componentSurfaces = (target: unknown): readonly string[] =>
  componentSurfaceClaims(target).map(({ surface }) => surface);
const componentSite = (target: unknown): string | undefined => {
  const value = extensionCoding(target, DENTAL_CORE_PROFILES["periodontal-site"]);
  return value?.system === COMPONENT_SYSTEM && Object.prototype.hasOwnProperty.call(SITE_VALUES, value.code ?? "")
    ? SITE_VALUES[value.code!] : undefined;
};
type Concept = { coding?: Array<{ system?: string; code?: string }> } | undefined;
/**
 * The catalog value of a Dental Core concept in a value group. Only a Dental
 * Core coding is read; a concept carrying none (or an ambiguous one) yields
 * nothing (cognovis/odontogram#35).
 */
const coreValue = (group: string, target: unknown): string | undefined => {
  const values = ((target as Concept)?.coding ?? []).map((item) => catalogValue(group, item)).filter((value): value is string => Boolean(value));
  return values.length && values.every((value) => value === values[0]) ? values[0] : undefined;
};
/** The Dental Core code of a catalog value. */
const dentalCoreCodingOf = (group: string, value: string): string | undefined => dentalCoreCoding(group, value)?.code;
/** The Dental Core chart-value code of a concept, for tokens outside the catalog. */
const chartValueCode = (target: unknown): string | undefined => codeAt(target as Concept, VALUE_SYSTEM);
const inverseCode = <K extends string | number>(codes: Readonly<Record<K, string>>, code: string | undefined): K | undefined =>
  code === undefined ? undefined : (Object.entries(codes) as Array<[K, string]>).find(([, candidate]) => candidate === code)?.[0];
const hasExtension = (target: unknown, url: string): boolean =>
  Array.isArray((target as { extension?: unknown } | undefined)?.extension)
  && ((target as { extension: Array<{ url?: unknown }> }).extension).some((extension) => extension.url === url);
/** An internal catalog value carried as text (ADR-001 recorded-* extensions). */
const isCatalogValue = (group: string, value: string | undefined): value is string =>
  Boolean(value && Object.prototype.hasOwnProperty.call(LOCAL_VALUE_MAPS[group] ?? {}, value));

function applySharedResource(payload: OdontogramExportPayload, field: string, resource: ResourceRecord): boolean {
  if (field === "hba1c") {
    const quantity = resource.valueQuantity as { value?: unknown; system?: string; code?: string } | undefined;
    if (resource.resourceType !== "Observation" || codeAt(resource.code as { coding?: Array<{ system?: string; code?: string }> }, LOINC_SYSTEM) !== "4548-4"
      || quantity?.system !== "http://unitsofmeasure.org" || quantity.code !== "%" || typeof quantity.value !== "number" || !Number.isFinite(quantity.value)
      || quantity.value < 3 || quantity.value > 20) return false;
    payload.case = { ...payload.case, hba1c: quantity.value };
    return true;
  }
  if (field === "smokingStatus") {
    const value = resolveSmokingStatus(resource.valueCodeableConcept);
    if (resource.resourceType !== "Observation" || codeAt(resource.code as { coding?: Array<{ system?: string; code?: string }> }, LOINC_SYSTEM) !== "72166-2"
      || !value) return false;
    payload.case = { ...payload.case, smokingStatus: value };
    return true;
  }
  if (field === "diabetesStatus") {
    const coded = (resource.code as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.some((item) => item.system && item.code);
    if (resource.resourceType !== "Condition" || !coded || resource.meta?.tag?.some((tag) => tag.system === VALUE_SYSTEM)) return false;
    const refuted = codeAt(resource.verificationStatus as { coding?: Array<{ system?: string; code?: string }> }, "http://terminology.hl7.org/CodeSystem/condition-ver-status") === "refuted";
    payload.case = { ...payload.case, diabetesStatus: refuted ? "none" : "present" };
    return true;
  }
  if (field === "edentulous" && resource.resourceType === "Condition") {
    const coded = (resource.code as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.some((item) => item.system && item.code);
    if (!coded || resource.meta?.tag?.some((tag) => tag.system === VALUE_SYSTEM)) return false;
    payload.globals = { ...payload.globals, edentulous: true };
    return true;
  }
  return false;
}

const dentalCoreTelescope = dentalCoreCodingOf("restorationMaterial", "telescope");

function applyToothState(record: ToothRecord, resource: ResourceRecord): boolean {
  const seenSingletons = new Set<string>();
  // Per `kind:surface`: the claimed value and whether it came from I. One
  // surface may be named twice (MO beside O): the same value is the same
  // claim, a different value is a conflict, and an explicit claim wins over
  // one folded from I. The record is written from these once all are read.
  const surfaceValues = new Map<string, { kind: string; surface: string; value: string; incisal: boolean }>();
  const claimSurfaces = (kind: string, claims: readonly SurfaceClaim[], value: string): boolean => {
    for (const { surface, incisal } of claims) {
      const key = `${kind}:${surface}`;
      const prior = surfaceValues.get(key);
      const outcome = surfaceOutcome(prior?.incisal, incisal);
      if (outcome === "same-origin" && prior!.value !== value) return false;
      if (outcome === "claim" || outcome === "override") surfaceValues.set(key, { kind, surface, value, incisal });
    }
    return true;
  };
  for (const item of (resource as unknown as Observation).component ?? []) {
    const kind = codeAt(item.code, COMPONENT_SYSTEM);
    const claims = componentSurfaceClaims(item);
    const surface = claims.length > 0;
    if (!kind) return false;
    if (hasExtension(item, DENTAL_CORE_PROFILES["tooth-surface"]) && !surface) return false;
    if (claims.some((claim) => !LOCAL_VALUE_MAPS.fillingSurfaces?.[claim.surface])) return false;
    const singleton = (key: string): boolean => {
      if (seenSingletons.has(key)) return false;
      seenSingletons.add(key);
      return true;
    };
    if (kind === "root-endodontic-state" && extensionsAt(item, LOCATION_DETAIL_URL).length) {
      const state = inverseCode(CANAL_STATE_CODES, chartValueCode(item.valueCodeableConcept));
      const root = optionalExtensionString(item, LOCATION_DETAIL_URL);
      // The Dental Core coding alone carries the state; any text is narrative.
      if (!state || !root.valid || !root.value || surface) return false;
      const states = (record.endoCanals ??= {})[root.value] ??= [];
      if (states.includes(state)) return false;
      states.push(state);
      continue;
    }
    const code = chartValueCode(item.valueCodeableConcept);
    if (kind === "tooth-presence") {
      const value = coreValue("toothSelection", item.valueCodeableConcept);
      if (!value || !singleton(kind)) return false;
      if (value !== "tooth-base") record.toothSelection = value;
    } else if (kind === "tooth-substrate") {
      const value = coreValue("toothSubstrate", item.valueCodeableConcept);
      if (!value || !singleton(kind)) return false;
      record.toothSubstrate = value;
    } else if (kind === "root-endodontic-state" && !surface) {
      const value = coreValue("endo", item.valueCodeableConcept);
      if (!value || !singleton(kind)) return false;
      record.endo = value;
    } else if (kind === "restoration-type" && surface) {
      if (code !== DIRECT_FILLING.code || !claimSurfaces(kind, claims, code)) return false;
    } else if (kind === "restoration-type" && code === dentalCoreTelescope) {
      if (!singleton("telescope") || seenSingletons.has("restoration-material")) return false;
      record.restorationMaterial = "telescope";
    } else if (kind === "restoration-type") {
      const value = coreValue("restorationType", item.valueCodeableConcept);
      if (!value || !singleton(kind)) return false;
      record.restorationType = value;
    } else if (kind === "restoration-material" && surface) {
      const value = coreValue("fillingMaterial", item.valueCodeableConcept);
      if (!value || !claimSurfaces(kind, claims, value)) return false;
    } else if (kind === "restoration-material") {
      const value = coreValue("restorationMaterial", item.valueCodeableConcept);
      if (!value || value === "telescope" || !singleton(kind) || seenSingletons.has("telescope")) return false;
      record.restorationMaterial = value;
    } else if (kind === "restoration-status" && surface) {
      const value = coreValue("fillingDefect", item.valueCodeableConcept);
      if (!value || !claimSurfaces(kind, claims, value)) return false;
    } else if (kind === "restoration-status" && code === CROWN_LEAKAGE.code) {
      if (!singleton("crown-leakage")) return false;
      record.crownLeakage = true;
    } else if (kind === "prosthetic-state" && !surface) {
      const value = coreValue("prosthesis", item.valueCodeableConcept);
      if (!value || !singleton(kind)) return false;
      record.prosthesis = value;
    } else return false;
  }
  for (const { kind, surface, value } of surfaceValues.values()) {
    if (kind === "restoration-type") (record.fillingSurfaces ??= []).push(surface);
    else if (kind === "restoration-material") (record.fillingSurfaceMaterials ??= {})[surface] = value;
    else (record.fillingDefect ??= {})[surface] = value;
  }
  const notes = Array.isArray(resource.note) ? resource.note as Array<{ text?: unknown }> : [];
  if (notes.length > 1 || (notes.length === 1 && (typeof notes[0].text !== "string" || !notes[0].text))) return false;
  if (notes.length === 1) record.note = notes[0].text as string;
  // An Observation carrying nothing but a present tooth exists only because
  // the source stated `toothSelection: "tooth-base"`; restoring it keeps the
  // next export emitting the same resource. Beside other content the default
  // stays implied, since that content re-emits the Observation anyway.
  const components = (resource as unknown as Observation).component ?? [];
  if (components.length === 1 && notes.length === 0 && seenSingletons.has("tooth-presence")) record.toothSelection ??= "tooth-base";
  return seenSingletons.has("tooth-presence");
}

function applyCaries(record: ToothRecord, resource: ResourceRecord): boolean {
  // A combined code (MO, DO, DI, MOD) is one lesion over several surfaces;
  // each surface is charted, and a severity grades every one of them.
  const surfaces = componentSurfaces(resource.bodySite);
  if (!surfaces.length) return false;
  const coded = chartValueCode(resource.valueCodeableConcept);
  for (const surface of surfaces) {
    const caries = `caries-${surface}`;
    if (!LOCAL_VALUE_MAPS.caries?.[caries]) return false;
    // Several surfaces share the value `caries`; the surface decides which one.
    if (!coded || coded !== dentalCoreCodingOf("caries", caries)) return false;
    if ((record.caries ??= []).includes(caries)) return false;
    record.caries.push(caries);
  }
  const components = (resource as unknown as Observation).component ?? [];
  for (const item of components) {
    if (codeAt(item.code, COMPONENT_SYSTEM) !== FINDING_CODES["caries-severity"]) return false;
    const severity = inverseCode(CARIES_SEVERITY_CODES, codeAt(item.valueCodeableConcept, CARIES_SEVERITY_SYSTEM));
    if (severity === undefined) return false;
    for (const surface of surfaces) {
      if (record.cariesSeverity?.[surface] !== undefined) return false;
      (record.cariesSeverity ??= {})[surface] = Number(severity);
    }
  }
  return true;
}

/** The root-caries value of a caries finding without a surface, or `undefined`. */
function rootCariesValue(resource: ResourceRecord): string | undefined {
  const coded = chartValueCode(resource.valueCodeableConcept);
  const components = (resource as unknown as Observation).component ?? [];
  const activities = components.filter((item) => codeAt(item.code, COMPONENT_SYSTEM) === "caries-lesion-activity");
  if (activities.length !== components.length || activities.length > 1) return undefined;
  const activity = activities.length ? codeAt(activities[0].valueCodeableConcept, LESION_ACTIVITY_SYSTEM) : undefined;
  if (coded === dentalCoreCodingOf("rootCaries", "active-cavitated")) {
    return activity === undefined || activity === LESION_ACTIVITY.active ? "active-cavitated" : undefined;
  }
  if (coded !== dentalCoreCodingOf("rootCaries", "active")) return undefined;
  return activity === LESION_ACTIVITY.active ? "active" : activity === LESION_ACTIVITY.arrested ? "arrested" : undefined;
}

function applyPeriodontal(record: ToothRecord, resource: ResourceRecord): boolean {
  for (const item of (resource as unknown as Observation).component ?? []) {
    const loinc = codeAt(item.code, LOINC_SYSTEM);
    const snomed = codeAt(item.code, SNOMED_SYSTEM);
    const dental = codeAt(item.code, COMPONENT_SYSTEM);
    const site = componentSite(item);
    const surfaces = componentSurfaces(item);
    const surface = surfaces.length > 0;
    if (hasExtension(item, DENTAL_CORE_PROFILES["periodontal-site"]) && !site) return false;
    if (hasExtension(item, DENTAL_CORE_PROFILES["tooth-surface"]) && !surface) return false;
    if (loinc === "32910-2" && site && typeof item.valueQuantity?.value === "number" && item.valueQuantity.value >= 1 && item.valueQuantity.value <= 15) ((record.perio ??= { pd: {}, gm: {}, bop: [], sup: [] }).pd)[site] = item.valueQuantity.value;
    else if (loinc === "64043-3" && site && typeof item.valueQuantity?.value === "number" && item.valueQuantity.value >= -10 && item.valueQuantity.value <= 20) ((record.perio ??= { pd: {}, gm: {}, bop: [], sup: [] }).gm)[site] = item.valueQuantity.value;
    else if (snomed === "249420004" && site && item.valueBoolean === true) (record.perio ??= { pd: {}, gm: {}, bop: [], sup: [] }).bop.push(site);
    else if (dental === "suppuration-on-probing" && site && item.valueBoolean === true) (record.perio ??= { pd: {}, gm: {}, bop: [], sup: [] }).sup.push(site);
    else if (dental === FINDING_CODES["tooth-mobility"]) {
      const value = coreValue("mobility", item.valueCodeableConcept);
      if (!value || record.mobility !== undefined) return false;
      record.mobility = value;
    } else if (dental === FINDING_CODES.calculus && item.valueBoolean === true) record.calculus = true;
    else if (loinc === "34016-6" && surface && item.valueBoolean === true) (record.plaque ??= []).push(...surfaces);
    else if (dental === "plaque-index" && surface && Number.isInteger(item.valueInteger) && item.valueInteger! >= 0 && item.valueInteger! <= 3) for (const each of surfaces) (record.pi ??= {})[each] = item.valueInteger!;
    else if (dental === "gingival-index" && surface && Number.isInteger(item.valueInteger) && item.valueInteger! >= 0 && item.valueInteger! <= 3) for (const each of surfaces) (record.gi ??= {})[each] = item.valueInteger!;
    else if (dental === "keratinized-gingiva-width" && typeof item.valueQuantity?.value === "number" && item.valueQuantity.value >= 0 && item.valueQuantity.value <= 15) record.kg = item.valueQuantity.value;
    else if (snomed === "771311009" && surface) {
      const grade = inverseCode(FURCATION_GRADE_CODES, chartValueCode(item.valueCodeableConcept));
      if (grade === undefined) return false;
      for (const each of surfaces) (record.furcation ??= {})[each] = Number(grade);
    } else return false;
  }
  return true;
}

function applyPeriImplant(record: ToothRecord, resource: ResourceRecord): boolean {
  for (const item of (resource as unknown as Observation).component ?? []) {
    const dental = codeAt(item.code, COMPONENT_SYSTEM);
    const surfaces = componentSurfaces(item);
    const surface = surfaces.length > 0;
    if (hasExtension(item, DENTAL_CORE_PROFILES["tooth-surface"]) && !surface) return false;
    if (dental === FINDING_CODES["peri-implant-status"]) {
      const value = coreValue("periImplant", item.valueCodeableConcept);
      if (!value || record.periImplant !== undefined) return false;
      record.periImplant = value;
    } else if (dental === "modified-plaque-index" && surface && Number.isInteger(item.valueInteger) && item.valueInteger! >= 0 && item.valueInteger! <= 3) for (const each of surfaces) (record.mpi ??= {})[each] = item.valueInteger!;
    else if (dental === "modified-sulcus-bleeding-index" && surface && Number.isInteger(item.valueInteger) && item.valueInteger! >= 0 && item.valueInteger! <= 3) for (const each of surfaces) (record.mbi ??= {})[each] = item.valueInteger!;
    else return false;
  }
  return true;
}

function applyImplant(record: ToothRecord, resource: ResourceRecord): boolean {
  record.toothSelection = "implant";
  const positionExtensions = extensionsAt(resource, RECORDED_IMPLANT_POSITION_URL);
  if (positionExtensions.length > 1) return false;
  if (positionExtensions.length === 1) {
    const value = positionExtensions[0].valueString;
    if (typeof value !== "string" || !["center", "mesial", "distal", "both"].includes(value)) return false;
    record.implantPosition = value;
  }
  const product: NonNullable<ToothRecord["implantProduct"]> = {};
  if (typeof resource.manufacturer === "string") product.manufacturer = resource.manufacturer;
  const name = Array.isArray(resource.deviceName) ? (resource.deviceName[0] as { name?: unknown } | undefined)?.name : undefined;
  if (typeof name === "string") product.system = name;
  if (typeof resource.lotNumber === "string") product.lot = resource.lotNumber;
  if (typeof resource.serialNumber === "string") product.serial = resource.serialNumber;
  if (typeof resource.expirationDate === "string") product.expiry = resource.expirationDate;
  const identifiers = Array.isArray(resource.identifier) ? resource.identifier as Array<{ system?: string; value?: string }> : [];
  const deviceIdentifier = identifiers.find((identifier) => identifier.system === "urn:oid:2.51.1.1")?.value;
  const carriers = Array.isArray(resource.udiCarrier) ? resource.udiCarrier as Array<{ carrierHRF?: unknown }> : [];
  if (carriers.length > 1 || (carriers.length === 1 && (typeof carriers[0].carrierHRF !== "string" || !carriers[0].carrierHRF))) return false;
  const udi = carriers.length === 1 ? carriers[0].carrierHRF as string : undefined;
  if (deviceIdentifier) product.deviceIdentifier = deviceIdentifier;
  if (udi) product.udi = udi;
  const properties = Array.isArray(resource.property) ? resource.property as Array<{
    type?: { text?: unknown; coding?: unknown };
    valueQuantity?: Array<{ value?: unknown; system?: string; code?: string }>;
  }> : [];
  const seenProperties = new Set<string>();
  for (const property of properties) {
    // Property types are text only: no terminology carries them.
    const kind = property.type?.coding === undefined && typeof property.type?.text === "string" ? property.type.text : undefined;
    const quantity = property.valueQuantity?.[0];
    if (!kind || seenProperties.has(kind) || quantity?.system !== "http://unitsofmeasure.org" || quantity.code !== "mm" || typeof quantity.value !== "number" || !Number.isFinite(quantity.value) || quantity.value <= 0) return false;
    seenProperties.add(kind);
    if (kind === "implant-diameter") product.diameterMm = quantity.value;
    else if (kind === "implant-length") product.lengthMm = quantity.value;
    else return false;
  }
  if (Object.keys(product).length) record.implantProduct = product;
  return true;
}

function applyRecession(record: ToothRecord, resource: ResourceRecord): boolean {
  if (hasExtension(resource.bodySite, DENTAL_CORE_PROFILES["tooth-surface"]) && !componentSurfaces(resource.bodySite).length) return false;
  const item = ((resource as unknown as Observation).component ?? []).find((candidate) => codeAt(candidate.code, COMPONENT_SYSTEM) === "miller-recession-classification");
  const value = coreValue("millerClass", item?.valueCodeableConcept);
  if (!value) return false;
  record.millerClass = value;
  return true;
}

function applyChart(record: ToothRecord, observation: Observation): boolean {
  const seen = new Set<string>();
  for (const component of observation.component ?? []) {
    const property = codeAt(component.code, PROPERTY_SYSTEM);
    if (!property || !isMappedChartProperty(property)) return false;
    const candidates = mappingsByProperty.get(property);
    if (!candidates?.length) return false;
    const coded = codeAt(component.valueCodeableConcept, VALUE_SYSTEM);
    if (coded && !isMappedChartValue(coded)) return false;
    const mapping = candidates.find((candidate) => candidate.kind !== "boolean" || !candidate.values?.true || candidate.values.true === coded) ?? candidates[0];
    const duplicateKey = mapping.kind === "set" ? `${property}:${coded ?? ""}` : property;
    if (seen.has(duplicateKey)) return false;
    seen.add(duplicateKey);
    if (mapping.kind === "boolean") {
      if (coded && mapping.values?.true === coded) (record as Record<string, unknown>)[mapping.field] = true;
      else if (typeof component.valueBoolean === "boolean") (record as Record<string, unknown>)[mapping.field] = component.valueBoolean;
      else return false;
      continue;
    }
    if (!coded) return false;
    const source = inverse(mapping.values, coded);
    if (!source) return false;
    if (mapping.kind === "set") {
      const values = ((record as Record<string, unknown>)[mapping.field] as string[] | undefined) ?? [];
      values.push(source);
      (record as Record<string, unknown>)[mapping.field] = values;
    } else {
      (record as Record<string, unknown>)[mapping.field] = source;
      if (mapping.field === "rootFracture") {
        const root = optionalExtensionString(component, LOCATION_DETAIL_URL);
        if (!root.valid) return false;
        if (root.value) record.rootFractureRoot = root.value;
      }
    }
  }
  const resection = uniqueExtension(observation, RECORDED_ROOT_RESECTION_URL);
  if (extensionsAt(observation, RECORDED_ROOT_RESECTION_URL).length > 1) return false;
  if (resection) {
    const description = extensionString(resection, "description");
    const root = optionalExtensionString(resection, "root");
    if (!description || !root.valid || !["none", "hemisection", "amputation", "premolarisation"].includes(description)) return false;
    record.rootResection = description;
    if (root.value) record.rootResectionRoot = root.value;
  }
  const progression = uniqueExtension(observation, RECORDED_ORTHODONTIC_PROGRESSION_URL);
  if (extensionsAt(observation, RECORDED_ORTHODONTIC_PROGRESSION_URL).length > 1) return false;
  if (progression) {
    if (typeof progression.valueBoolean !== "boolean") return false;
    record.orthoProgressive = progression.valueBoolean;
  }
  const implantPosition = uniqueExtension(observation, RECORDED_IMPLANT_POSITION_URL);
  if (extensionsAt(observation, RECORDED_IMPLANT_POSITION_URL).length > 1) return false;
  if (implantPosition) {
    if (typeof implantPosition.valueString !== "string" || !["center", "mesial", "distal", "both"].includes(implantPosition.valueString)) return false;
    record.implantPosition = implantPosition.valueString;
  }
  const crownFracture = uniqueExtension(observation, RECORDED_CROWN_FRACTURE_TYPE_URL);
  if (extensionsAt(observation, RECORDED_CROWN_FRACTURE_TYPE_URL).length > 1) return false;
  if (crownFracture) {
    if (typeof crownFracture.valueString !== "string" || !["none", "crack", "split", "fracture"].includes(crownFracture.valueString)) return false;
    record.crownFractureType = crownFracture.valueString;
  }
  const bracket = uniqueExtension(observation, RECORDED_BRACKET_SURFACE_URL);
  if (extensionsAt(observation, RECORDED_BRACKET_SURFACE_URL).length > 1) return false;
  if (bracket) {
    const surface = bracket.valueCoding as { system?: unknown; code?: unknown } | undefined;
    const side = singleSurfaceOfCoding(surface);
    if (side !== "buccal" && side !== "lingual") return false;
    record.orthoBracketSide = side;
  }
  const cantilever = uniqueExtension(observation, RECORDED_CANTILEVER_ROLE_URL);
  if (extensionsAt(observation, RECORDED_CANTILEVER_ROLE_URL).length > 1) return false;
  if (cantilever) {
    if (typeof cantilever.valueBoolean !== "boolean") return false;
    record.cantilever = cantilever.valueBoolean;
  }
  const papillae = extensionsAt(observation, RECORDED_PAPILLA_LOSS_URL);
  const seenPapilla = new Set<string>();
  for (const papilla of papillae) {
    const surfaceCoding = uniqueExtension(papilla, "surface")?.valueCoding as { system?: unknown; code?: unknown } | undefined;
    const grade = uniqueExtension(papilla, "grade")?.valueInteger;
    const classification = uniqueExtension(papilla, "classification")?.valueString;
    const single = singleSurfaceOfCoding(surfaceCoding);
    const surface = single === "mesial" || single === "distal" ? single : undefined;
    if (!surface || seenPapilla.has(surface) || !Number.isInteger(grade) || (grade as number) < 1 || (grade as number) > 3 || classification !== "Nordland and Tarnow") return false;
    seenPapilla.add(surface);
    (record.papillaLoss ??= {})[surface] = grade as number;
  }
  const apical = extensionsAt(observation, RECORDED_APICAL_FINDING_URL);
  if (apical.length > 1) return false;
  if (apical.length === 1) {
    const description = extensionString(apical[0], "description");
    const root = optionalExtensionString(apical[0], "root");
    if (!description || !root.valid || !root.value || !isCatalogValue("apicalDx", description)) return false;
    record.apicalDx = description;
    record.apicalRoot = root.value;
  }
  return true;
}

function applyTargetChartState(record: ToothRecord, resource: ResourceRecord): boolean {
  if (!applyChart(record, { resourceType: "Observation", status: "final", code: {}, extension: resource.extension } as Observation)) return false;
  const endodontic = extensionsAt(resource, RECORDED_ROOT_ENDODONTIC_STATE_URL);
  let wholeTooth = false;
  for (const assertion of endodontic) {
    const description = extensionString(assertion, "description");
    const root = optionalExtensionString(assertion, "root");
    if (!description || !root.valid) return false;
    if (!root.value) {
      if (wholeTooth || !isCatalogValue("endo", description)) return false;
      wholeTooth = true;
      record.endo = description;
    } else {
      if (!["filling", "post", "incomplete", "temporary"].includes(description)) return false;
      const states = (record.endoCanals ??= {})[root.value] ??= [];
      if (states.includes(description)) return false;
      states.push(description);
    }
  }
  const fractures = extensionsAt(resource, RECORDED_ROOT_FRACTURE_URL);
  if (fractures.length > 1) return false;
  if (fractures.length === 1) {
    const description = extensionString(fractures[0], "description");
    const root = optionalExtensionString(fractures[0], "root");
    if (!description || !root.valid || !["vertical", "horizontal"].includes(description)) return false;
    record.rootFracture = description;
    if (root.value) record.rootFractureRoot = root.value;
  }
  const apical = extensionsAt(resource, RECORDED_APICAL_FINDING_URL);
  if (apical.length > 1) return false;
  if (apical.length === 1) {
    const description = extensionString(apical[0], "description");
    const root = optionalExtensionString(apical[0], "root");
    if (!description || !root.valid || !isCatalogValue("apicalDx", description)) return false;
    record.apicalDx = description;
    if (root.value) record.apicalRoot = root.value;
  }
  return true;
}

function applyProcedure(record: ToothRecord, resource: ResourceRecord): boolean {
  const fdi = bodySiteFdi({ ...resource, bodySite: Array.isArray(resource.bodySite) ? resource.bodySite[0] : undefined });
  if (!fdi || !isOdontogramFdi(fdi) || !clinicalDate(resource)) return false;
  const text = (resource.code as { text?: unknown } | undefined)?.text;
  if (text === "Apicoectomy or root-end resection") record.endoResection = true;
  else if (text === "Fissure sealing") record.fissureSealing = true;
  else return false;
  return true;
}

function applyDevice(record: ToothRecord, resource: ResourceRecord): boolean {
  const extension = Array.isArray(resource.extension) ? resource.extension : [];
  const position = extension.find((entry) => (
    entry as { url?: unknown }
  ).url === DENTAL_CORE_PROFILES["tooth-position"]) as { valueCoding?: { system?: string; code?: string } } | undefined;
  const fdi = position?.valueCoding?.system === FDI_SYSTEM ? position.valueCoding.code : undefined;
  if (!fdi || !isOdontogramFdi(fdi)) return false;
  const text = (resource.type as { text?: unknown } | undefined)?.text;
  if (text === "Orthodontic bracket") record.orthoAppliance = "bracket";
  else if (text === "Orthodontic band") record.orthoAppliance = "band";
  else if (text === "Parapulpal pin") record.parapulpalPin = true;
  else if (text === "Bridge abutment") record.bridgePillar = true;
  else if (text === "Prosthesis retention clasp") record.retention = "clasp";
  else if (text === "Prosthesis retention attachment") record.retention = "attachment";
  else if (text === "Prosthesis retention bar-abutment") record.retention = "bar-abutment";
  else return false;
  const bracket = extensionsAt(resource, RECORDED_BRACKET_SURFACE_URL);
  if (bracket.length > 1) return false;
  if (bracket.length === 1) {
    const value = bracket[0].valueCoding as { system?: unknown; code?: unknown } | undefined;
    const side = singleSurfaceOfCoding(value);
    if (text !== "Orthodontic bracket" || (side !== "buccal" && side !== "lingual")) return false;
    record.orthoBracketSide = side;
  }
  const cantilever = extensionsAt(resource, RECORDED_CANTILEVER_ROLE_URL);
  if (cantilever.length > 1) return false;
  if (cantilever.length === 1) {
    if (text !== "Bridge abutment" || typeof cantilever[0].valueBoolean !== "boolean") return false;
    record.cantilever = cantilever[0].valueBoolean;
  }
  return true;
}

function applyFinding(record: ToothRecord, resource: ResourceRecord): boolean {
  const fdi = bodySiteFdi(resource);
  const property = codeAt((resource.code as { coding?: Array<{ system?: string; code?: string }> } | undefined), PROPERTY_SYSTEM);
  const value = codeAt((resource.valueCodeableConcept as { coding?: Array<{ system?: string; code?: string }> } | undefined), VALUE_SYSTEM);
  if (!fdi || !isOdontogramFdi(fdi) || !property || !isMappedChartProperty(property) || !clinicalDate(resource)) return false;
  const booleanMapping = mappingsByProperty.get(property)?.find((candidate) => candidate.kind === "boolean");
  if (booleanMapping && typeof resource.valueBoolean === "boolean") {
    (record as Record<string, unknown>)[booleanMapping.field] = resource.valueBoolean;
    return true;
  }
  if (!value || !isMappedChartValue(value)) return false;
  const mapping = mappingsByProperty.get(property)?.find((candidate) => candidate.kind === "enum" && candidate.values?.[inverse(candidate.values, value) ?? ""] === value);
  if (!mapping) return false;
  const source = inverse(mapping.values, value);
  if (!source) return false;
  (record as Record<string, unknown>)[mapping.field] = source;
  return true;
}

export function parseDentalCoreBundle(input: unknown): OdontogramExportPayload | undefined {
  const bundle = input as Bundle;
  if (bundle?.resourceType !== "Bundle" || bundle.type !== "collection" || !Array.isArray(bundle.entry)) return undefined;
  const hasBundleMarker = bundle.identifier?.system === DENTAL_CORE
    && typeof bundle.identifier?.value === "string"
    && supportedBundleIdentifiers.has(bundle.identifier.value);
  const hasAdmittedProfile = bundle.entry.some((entry) => {
    const profiles = (entry.resource as ResourceRecord | undefined)?.meta?.profile;
    return Array.isArray(profiles) && profiles.some((profile) => typeof profile === "string" && dentalCoreProfileValues.has(profile));
  });
  if (!hasBundleMarker && !hasAdmittedProfile) return undefined;
  // PAYLOAD_VERSION statt einer Zahl: hier stand "2.25" fest verdrahtet und
  // waere bei jedem Bump veraltet - ein importiertes Dokument haette dann eine
  // andere Version getragen als ein exportiertes, ohne dass sich am Inhalt
  // etwas unterscheidet (odontogram-fu1, 20.08.2026).
  const payload: OdontogramExportPayload = { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
  const entriesByReference = new Map<string, ResourceEntry>();
  for (const entry of bundle.entry) {
    const resource = entry?.resource as ResourceRecord | undefined;
    if (!resource || typeof resource.resourceType !== "string") return undefined;
    const resolved = { resource, ...(typeof entry.fullUrl === "string" ? { fullUrl: entry.fullUrl } : {}) };
    if (typeof resource.id === "string" && resource.id) {
      const relative = `${resource.resourceType}/${resource.id}`;
      if (entriesByReference.has(relative)) return undefined;
      entriesByReference.set(relative, resolved);
    } else if (!resolved.fullUrl) return undefined;
    if (resolved.fullUrl) {
      if (entriesByReference.has(resolved.fullUrl)) return undefined;
      entriesByReference.set(resolved.fullUrl, resolved);
    }
  }
  const resolveReference = (reference: unknown): ResourceEntry | undefined =>
    typeof reference === "string" ? entriesByReference.get(reference) : undefined;
  const referencesResource = (reference: unknown, resource: ResourceRecord | undefined): boolean =>
    !!resource && resolveReference(reference)?.resource === resource;
  const identities: Record<string, DentalCoreResourceIdentity> = {};
  const captureIdentity = (key: string, entry: ResourceEntry, resource: ResourceRecord): void => {
    identities[key] = {
      ...(typeof resource.id === "string" && resource.id ? { id: resource.id } : {}),
      ...(typeof resource.meta?.versionId === "string" ? { versionId: resource.meta.versionId } : {}),
      ...(entry.fullUrl ? { fullUrl: entry.fullUrl } : {}),
    };
  };
  const sharedResourceFields = new Map<ResourceRecord, string>();
  const sharedProvenanceFields = new Map<ResourceRecord, string>();
  for (const entry of bundle.entry) {
    const resource = entry.resource as ResourceRecord;
    if (resource.resourceType !== "Provenance") continue;
    // The shared-resource reason is text only (workflow, not a chart value).
    const reason = Array.isArray(resource.reason) ? resource.reason[0] as { text?: unknown; coding?: unknown } | undefined : undefined;
    const sharedCode = reason?.coding === undefined && typeof reason?.text === "string" ? reason.text : undefined;
    const field = sharedCode?.startsWith("shared-resource-") ? sharedCode.slice("shared-resource-".length) : undefined;
    if (!field || !["diabetesStatus", "hba1c", "smokingStatus", "edentulous"].includes(field)) continue;
    if (!hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-clinical-provenance"]) || !validGeneratedProfile(DentalClinicalProvenanceProfile, resource) || !clinicalDate(resource)) return undefined;
    const targets = Array.isArray(resource.target) ? resource.target as Array<{ reference?: unknown }> : [];
    const target = targets.length === 1 ? resolveReference(targets[0].reference)?.resource : undefined;
    if (!target || [...sharedResourceFields.values()].includes(field) || sharedResourceFields.has(target)) return undefined;
    sharedResourceFields.set(target, field);
    sharedProvenanceFields.set(resource, field);
  }
  const identifiers = new Set<string>();
  const patientEntries = [...new Set(entriesByReference.values())].filter((entry) => entry.resource.resourceType === "Patient");
  if (patientEntries.length > 1) return undefined;
  let expectedSubject: string | undefined;
  const effectiveDates = new Set<string>();
  let hasPlan = false;
  let planActivities: Set<ResourceRecord> | undefined;
  let carePlanGoals: Set<ResourceRecord> | undefined;
  const planRequests = new Set<ResourceRecord>();
  const planGoals = new Set<ResourceRecord>();
  const planRequestFdi = new Set<string>();
  const changeRequestIds = new Set<string>();
  const plannedFdi = new Set<string>();
  const chartIds = new Set<string>();
  const findingIds = new Set<string>();
  const procedureIds = new Set<string>();
  const deviceIds = new Set<string>();
  const profileIds = new Set<string>();
  const riskCodes = new Set<string>();
  const sharedFields = new Set<string>();
  const claims = new Map<string, string>();
  // Per `chart:fdi:field:surface` of a surface-level finding: whether its
  // claim came from I (folded onto occlusal). An explicit claim replaces it.
  const surfaceOrigins = new Map<string, boolean>();
  const exclusiveCarrierClaims = new Map<string, ResourceRecord>();
  const exclusiveCarrierFields = new Set(["implantPosition", "orthoBracketSide", "cantilever"]);
  let carePlan: ResourceRecord | undefined;
  let diagnosis: ResourceRecord | undefined;
  let provenance: ResourceRecord | undefined;

  const claim = (fdi: string, field: string, value: unknown, chart: "status" | "plan" = "status"): boolean => {
    const key = `${chart}:${fdi}:${field}`;
    const encoded = JSON.stringify(value);
    const previous = claims.get(key);
    if (previous !== undefined && previous !== encoded) return false;
    claims.set(key, encoded);
    return true;
  };
  const mergeDecoded = (fdi: string, decoded: ToothRecord, planned: boolean, carrier: ResourceRecord): boolean => {
    const target = planned ? ((payload.plan ??= {})[fdi] ??= {}) : (payload.teeth[fdi] ??= {});
    for (const [field, value] of Object.entries(decoded)) {
      if (exclusiveCarrierFields.has(field)) {
        const carrierKey = `${planned ? "plan" : "status"}:${fdi}:${field}`;
        const previousCarrier = exclusiveCarrierClaims.get(carrierKey);
        if (previousCarrier && previousCarrier !== carrier) return false;
        exclusiveCarrierClaims.set(carrierKey, carrier);
      }
      if (!claim(fdi, field, value, planned ? "plan" : "status")) return false;
      (target as Record<string, unknown>)[field] = value;
    }
    return true;
  };
  const isPlannedObservation = (resource: ResourceRecord): boolean | undefined => {
    const basedOn = Array.isArray(resource.basedOn) ? resource.basedOn as Array<{ reference?: unknown }> : [];
    if (!basedOn.length) return false;
    return carePlan && basedOn.some((reference) => referencesResource(reference.reference, carePlan)) ? true : undefined;
  };

  for (const entry of bundle.entry) {
    const resource = entry?.resource as ResourceRecord | undefined;
    if (!resource || resource.resourceType === "Patient" || resource.resourceType === "Provenance" || sharedResourceFields.has(resource)) continue;
    const subject = subjectReference(resource);
    if (!subject || (expectedSubject && expectedSubject !== subject && resolveReference(expectedSubject)?.resource !== resolveReference(subject)?.resource)) return undefined;
    expectedSubject = subject;
    const date = resource.effectiveDateTime ?? resource.performedDateTime ?? resource.recordedDate;
    if (isIsoDateTime(date)) effectiveDates.add(date);
  }

  for (const entry of bundle.entry) {
    const resource = entry?.resource as ResourceRecord | undefined;
    if (!resource || typeof resource.resourceType !== "string") return undefined;
    const resolvedEntry = (typeof resource.id === "string" && resource.id ? entriesByReference.get(`${resource.resourceType}/${resource.id}`) : undefined)
      ?? (typeof entry.fullUrl === "string" ? entriesByReference.get(entry.fullUrl) : undefined);
    if (!resolvedEntry) return undefined;
    const key = `${resource.resourceType}/${resource.id ?? entry.fullUrl}`;
    if (identifiers.has(key)) return undefined;
    identifiers.add(key);
    if (resource.resourceType === "Patient") {
      captureIdentity("Patient/subject", resolvedEntry, resource);
      continue;
    }
    const sharedField = sharedResourceFields.get(resource);
    if (sharedField) {
      const sharedSubject = subjectReference(resource);
      const expectedResource = expectedSubject ? resolveReference(expectedSubject)?.resource : undefined;
      const aliased = expectedResource !== undefined && expectedResource === resolveReference(sharedSubject)?.resource;
      if (!sharedSubject || (expectedSubject && expectedSubject !== sharedSubject && !aliased)) return undefined;
      expectedSubject ??= sharedSubject;
      if (!applySharedResource(payload, sharedField, resource)) return undefined;
      captureIdentity(`SharedResource/${sharedField}`, resolvedEntry, resource);
      continue;
    }
    const subject = subjectReference(resource);
    if (resource.resourceType !== "Provenance" && (!subject || subject !== expectedSubject)) return undefined;
    if (resource.resourceType === "CarePlan") {
      if (carePlan || resource.status !== "active" || resource.intent !== "plan" || !subject) return undefined;
      if (!Array.isArray(resource.activity)) return undefined;
      const activities = resource.activity.map((activity) => (activity as { reference?: { reference?: unknown } }).reference?.reference);
      const targets = activities.map(resolveReference);
      if (targets.some((target) => target?.resource.resourceType !== "ServiceRequest")) return undefined;
      planActivities = new Set(targets.map((target) => target?.resource as ResourceRecord));
      if (planActivities.size !== activities.length) return undefined;
      const goals = Array.isArray(resource.goal) ? resource.goal as Array<{ reference?: unknown }> : [];
      const resolvedGoals = goals.map((goal) => resolveReference(goal.reference));
      if (resolvedGoals.some((goal) => goal?.resource.resourceType !== "Goal")) return undefined;
      carePlanGoals = new Set(resolvedGoals.map((goal) => goal?.resource as ResourceRecord));
      if (carePlanGoals.size !== goals.length) return undefined;
      carePlan = resource;
      hasPlan = true;
      captureIdentity("CarePlan/plan", resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Condition") {
      if (diagnosis || !subject || !isIsoDateTime(resource.recordedDate)) return undefined;
      diagnosis = resource;
      captureIdentity("Condition/periodontal-diagnosis", resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Goal" && Array.isArray(resource.meta?.profile) && resource.meta.profile.includes(TARGET_CHART_STATE_PROFILE_URL)) {
      const description = (resource.description as { text?: unknown } | undefined)?.text;
      if (!hasAdmittedProfileResource(resource, TARGET_CHART_STATE_PROFILE_URL)
        || !validGeneratedProfile(DentalTargetChartStateProfile, resource)
        || !carePlan || !carePlanGoals?.has(resource) || !["planned", "active"].includes(String(resource.lifecycleStatus))
        || typeof description !== "string" || !description) return undefined;
      const positions = extensionsAt(resource, DENTAL_CORE_PROFILES["tooth-position"]);
      const position = positions.length === 1 ? positions[0].valueCoding as { system?: unknown; code?: unknown } | undefined : undefined;
      const fdi = position?.system === FDI_SYSTEM && typeof position.code === "string" ? position.code : undefined;
      const addresses = Array.isArray(resource.addresses) ? resource.addresses as Array<{ reference?: unknown }> : [];
      const request = addresses.length === 1 ? resolveReference(addresses[0].reference)?.resource : undefined;
      const requestFdi = request?.resourceType === "ServiceRequest" && Array.isArray(request.bodySite)
        ? codeAt(request.bodySite[0] as { coding?: Array<{ system?: string; code?: string }> }, FDI_SYSTEM)
        : undefined;
      if (!fdi || !isOdontogramFdi(fdi) || !request || request.resourceType !== "ServiceRequest"
        || !planActivities?.has(request) || requestFdi !== fdi || planGoals.has(resource)) return undefined;
      const decoded: ToothRecord = {};
      if (!applyTargetChartState(decoded, resource) || !mergeDecoded(fdi, decoded, true, resource)) return undefined;
      planGoals.add(resource);
      plannedFdi.add(fdi);
      captureIdentity(`Goal/target/${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Provenance") {
      if (!hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-clinical-provenance"]) || !validGeneratedProfile(DentalClinicalProvenanceProfile, resource) || !clinicalDate(resource)) return undefined;
      const shared = sharedProvenanceFields.get(resource);
      if (shared) {
        if (sharedFields.has(shared)) return undefined;
        sharedFields.add(shared);
        captureIdentity(`Provenance/shared/${shared}`, resolvedEntry, resource);
        continue;
      }
      if (provenance) return undefined;
      provenance = resource;
      captureIdentity("Provenance/clinical", resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-tooth-state"])) {
      if (!validGeneratedChoiceSliceProfile(DentalToothStateProfile, resource) || resource.status !== "final" || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const planned = isPlannedObservation(resource);
      if (!fdi || !isOdontogramFdi(fdi) || planned === undefined || profileIds.has(`tooth-state:${planned}:${fdi}`)) return undefined;
      const decoded: ToothRecord = {};
      if (!applyToothState(decoded, resource) || !mergeDecoded(fdi, decoded, planned, resource)) return undefined;
      profileIds.add(`tooth-state:${planned}:${fdi}`);
      if (planned) plannedFdi.add(fdi);
      captureIdentity(`Observation/tooth-state/${planned ? "plan/" : ""}${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-caries-finding"])) {
      if (!validGeneratedChoiceSliceProfile(DentalCariesFindingProfile, resource) || resource.status !== "final" || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const surfaceClaims = componentSurfaceClaims(resource.bodySite);
      const planned = isPlannedObservation(resource);
      const rootValue = !surfaceClaims.length ? rootCariesValue(resource) : undefined;
      if (!surfaceClaims.length && !rootValue) return undefined;
      if (rootValue) {
        if (!fdi || !isOdontogramFdi(fdi) || planned === undefined || !LOCAL_VALUE_MAPS.rootCaries?.[rootValue] || profileIds.has(`root-caries:${planned}:${fdi}`)) return undefined;
        if (!mergeDecoded(fdi, { rootCaries: rootValue }, planned, resource)) return undefined;
        profileIds.add(`root-caries:${planned}:${fdi}`);
        if (planned) plannedFdi.add(fdi);
        captureIdentity(`Observation/caries/${planned ? "plan/" : ""}root/${fdi}`, resolvedEntry, resource);
        continue;
      }
      if (!fdi || !isOdontogramFdi(fdi) || planned === undefined) return undefined;
      const decoded: ToothRecord = {};
      if (!applyCaries(decoded, resource)) return undefined;
      const target = planned ? ((payload.plan ??= {})[fdi] ??= {}) : (payload.teeth[fdi] ??= {});
      const scope = planned ? "plan" : "status";
      let identitySurface: string | undefined;
      for (const [index, { surface, incisal }] of surfaceClaims.entries()) {
        const caries = decoded.caries?.[index];
        const severity = decoded.cariesSeverity?.[surface];
        if (!caries) return undefined;
        const origin = `${scope}:${fdi}:caries:${surface}`;
        const outcome = surfaceOutcome(surfaceOrigins.get(origin), incisal);
        // One caries finding per surface, as before; only a claim folded from
        // I yields to an explicit one on the same (occlusal) surface.
        if (outcome === "same-origin") return undefined;
        if (outcome === "skip") continue;
        surfaceOrigins.set(origin, incisal);
        if (outcome === "override") {
          claims.delete(`${scope}:${fdi}:cariesSeverity:${surface}`);
          if (target.cariesSeverity) {
            delete target.cariesSeverity[surface];
            if (!Object.keys(target.cariesSeverity).length) delete target.cariesSeverity;
          }
        } else {
          if (!claim(fdi, `caries:${surface}`, caries, scope)) return undefined;
          (target.caries ??= []).push(caries);
        }
        if (severity !== undefined) {
          if (!claim(fdi, `cariesSeverity:${surface}`, severity, scope)) return undefined;
          (target.cariesSeverity ??= {})[surface] = severity;
        }
        identitySurface ??= surface;
      }
      if (planned) plannedFdi.add(fdi);
      // One resource keeps ONE identity, filed under its first charted surface;
      // the writer charts one resource per surface, so the others get their
      // own ids on the next save.
      if (identitySurface) captureIdentity(`Observation/caries/${planned ? "plan/" : ""}${fdi}/${identitySurface}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-peri-implant-finding"])) {
      if (!validGeneratedProfile(DentalPeriImplantFindingProfile, resource) || resource.status !== "final" || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const focus = Array.isArray(resource.focus) ? resource.focus as Array<{ reference?: unknown }> : [];
      const focused = focus.length === 1 ? resolveReference(focus[0].reference)?.resource : undefined;
      if (!fdi || !isOdontogramFdi(fdi) || profileIds.has(`peri-implant:${fdi}`) || !focused || !hasAdmittedProfileResource(focused, DENTAL_CORE_PROFILES["dental-implant"])) return undefined;
      const decoded: ToothRecord = {};
      if (!applyPeriImplant(decoded, resource) || !mergeDecoded(fdi, decoded, false, resource)) return undefined;
      profileIds.add(`peri-implant:${fdi}`);
      captureIdentity(`Observation/peri-implant/${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-periodontal-finding"])) {
      if (!validGeneratedChoiceSliceProfile(DentalPeriodontalFindingProfile, resource) || resource.status !== "final" || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const planned = isPlannedObservation(resource);
      if (!fdi || !isOdontogramFdi(fdi) || planned === undefined || profileIds.has(`periodontal:${planned}:${fdi}`)) return undefined;
      const decoded: ToothRecord = {};
      if (!applyPeriodontal(decoded, resource) || !mergeDecoded(fdi, decoded, planned, resource)) return undefined;
      profileIds.add(`periodontal:${planned}:${fdi}`);
      if (planned) plannedFdi.add(fdi);
      captureIdentity(`Observation/periodontal/${planned ? "plan/" : ""}${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-gingival-recession-assessment"])) {
      if (!validGeneratedChoiceSliceProfile(DentalGingivalRecessionAssessmentProfile, resource) || resource.status !== "final" || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const planned = isPlannedObservation(resource);
      if (!fdi || !isOdontogramFdi(fdi) || planned === undefined || profileIds.has(`recession:${planned}:${fdi}`)) return undefined;
      const decoded: ToothRecord = {};
      if (!applyRecession(decoded, resource) || !mergeDecoded(fdi, decoded, planned, resource)) return undefined;
      profileIds.add(`recession:${planned}:${fdi}`);
      if (planned) plannedFdi.add(fdi);
      captureIdentity(`Observation/recession/${planned ? "plan/" : ""}${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-chart-state"])) {
      if (!validGeneratedProfile(DentalChartStateProfile, resource) || resource.status !== "final" || codeAt(resource.code as { coding?: Array<{ system?: string; code?: string }> }, COMPONENT_SYSTEM) !== "chart-state" || !subject || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      if (!fdi || !isOdontogramFdi(fdi)) return undefined;
      const planned = Array.isArray(resource.basedOn) && resource.basedOn.some((reference) => referencesResource((reference as { reference?: unknown }).reference, carePlan));
      if (Array.isArray(resource.basedOn) && resource.basedOn.length && !planned) return undefined;
      const chartKey = `${planned ? "plan" : "status"}:${fdi}`;
      if (chartIds.has(chartKey)) return undefined;
      chartIds.add(chartKey);
      for (const component of (resource as unknown as Observation).component ?? []) {
        const property = codeAt(component.code, PROPERTY_SYSTEM);
        const mappings = property ? mappingsByProperty.get(property) : undefined;
        const coded = codeAt(component.valueCodeableConcept, VALUE_SYSTEM);
        const mapping = mappings?.find((candidate) => candidate.kind !== "boolean" || !candidate.values?.true || candidate.values.true === coded) ?? mappings?.[0];
        if (!mapping) return undefined;
        const value = mapping.kind === "boolean"
          ? (coded ? true : component.valueBoolean)
          : inverse(mapping.values, coded ?? "");
        if (value === undefined || (mapping.kind !== "set" && !claim(fdi, mapping.field, value, planned ? "plan" : "status"))) return undefined;
      }
      const decoded: ToothRecord = {};
      if (!applyChart(decoded, resource as unknown as Observation) || !mergeDecoded(fdi, decoded, planned, resource)) return undefined;
      if (planned) plannedFdi.add(fdi);
      captureIdentity(`Observation/chart/${planned ? "plan" : "status"}/${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-risk-evidence"])) {
      if (!validGeneratedProfile(DentalRiskEvidenceProfile, resource) || resource.status !== "final" || !subject || !clinicalDate(resource)) return undefined;
      const code = codeAt(resource.code as { coding?: Array<{ system?: string; code?: string }> }, COMPONENT_SYSTEM);
      const value = code === "maximum-radiographic-bone-loss" ? (resource.valueQuantity as { value?: unknown } | undefined)?.value : resource.valueInteger;
      if (!code || riskCodes.has(code) || typeof value !== "number" || !isDentalCoreRiskValue(code, value)) return undefined;
      riskCodes.add(code);
      payload.case ??= {};
      if (code === "cigarettes-per-day") payload.case.cigarettesPerDay = value;
      if (code === "periodontitis-attributed-tooth-loss") payload.case.toothLossPerio = value;
      if (code === "maximum-radiographic-bone-loss") payload.case.maxRblPercent = value;
      captureIdentity(`Observation/risk/${code}`, resolvedEntry, resource);
      continue;
    }
    const diagnosisProfile = resource.resourceType !== "Observation" ? undefined
      : hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-pulp-diagnosis"]) ? { field: "pulpDx" as const, profile: DentalPulpDiagnosisProfile }
        : hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-apical-diagnosis"]) ? { field: "apicalDx" as const, profile: DentalApicalDiagnosisProfile }
          : hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-radiographic-caries-depth"]) ? { field: "radiographicDepth" as const, profile: DentalRadiographicCariesDepthProfile }
            : undefined;
    if (diagnosisProfile) {
      if (!validGeneratedProfile(diagnosisProfile.profile, resource) || resource.status !== "final" || !subject || !clinicalDate(resource)) return undefined;
      const fdi = bodySiteFdi(resource);
      const planned = isPlannedObservation(resource);
      const surfaceClaims = componentSurfaceClaims(resource.bodySite);
      const surface = surfaceClaims.length > 0;
      if (!fdi || !isOdontogramFdi(fdi) || planned === undefined || (hasExtension(resource.bodySite, DENTAL_CORE_PROFILES["tooth-surface"]) && !surface)) return undefined;
      const target = planned ? ((payload.plan ??= {})[fdi] ??= {}) : (payload.teeth[fdi] ??= {});
      const scope = planned ? "plan" : "status";
      const value = coreValue(diagnosisProfile.field, resource.valueCodeableConcept);
      if (!value) return undefined;
      const keys: string[] = [];
      if (diagnosisProfile.field === "radiographicDepth") {
        if (!surface) return undefined;
        // A combined code gives every one of its surfaces the same depth; a
        // depth folded from I yields to an explicit one on the occlusal key.
        for (const { surface: each, incisal } of surfaceClaims) {
          const key = `radiographicDepth:${each}`;
          const origin = `${scope}:${fdi}:${key}`;
          const outcome = surfaceOutcome(surfaceOrigins.get(origin), incisal);
          if (outcome === "same-origin") return undefined;
          if (outcome === "skip") continue;
          surfaceOrigins.set(origin, incisal);
          if (outcome === "override") claims.delete(`${scope}:${fdi}:${key}`);
          if (!claim(fdi, key, value, scope)) return undefined;
          (target.radiographicDepth ??= {})[each] = value;
          keys.push(key);
        }
        if (!keys.length) continue;
      } else {
        if (surface) return undefined;
        const key = diagnosisProfile.field;
        keys.push(key);
        if (!claim(fdi, key, value, scope)) return undefined;
        target[diagnosisProfile.field] = value;
        const roots = extensionsAt(resource.bodySite, LOCATION_DETAIL_URL);
        if (roots.length && diagnosisProfile.field !== "apicalDx") return undefined;
        if (roots.length > 1) return undefined;
        const root = roots.length === 1 && typeof roots[0].valueString === "string" && roots[0].valueString
          ? roots[0].valueString : undefined;
        if (roots.length && !root) return undefined;
        if (root) {
          if (!claim(fdi, "apicalRoot", root, scope)) return undefined;
          target.apicalRoot = root;
        }
      }
      const identityKeys = keys.map((key) => `Observation/additional/${planned ? "plan/" : ""}${fdi}/${key.replace(":", "/")}`);
      // A surface depth's duplicates are settled above by its origin; an
      // explicit depth replacing one folded from I takes over its identity.
      const surfaceKeyed = diagnosisProfile.field === "radiographicDepth";
      if (!surfaceKeyed && identityKeys.some((identityKey) => profileIds.has(identityKey))) return undefined;
      for (const identityKey of identityKeys) profileIds.add(identityKey);
      if (planned) plannedFdi.add(fdi);
      // One resource keeps ONE identity, filed under its first surface.
      captureIdentity(identityKeys[0], resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Observation" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-finding"])) {
      if (!validGeneratedProfile(DentalFindingProfile, resource) || resource.status !== "final" || !subject) return undefined;
      const fdi = bodySiteFdi(resource);
      const property = codeAt(resource.code as { coding?: Array<{ system?: string; code?: string }> }, PROPERTY_SYSTEM);
      const findingCode = codeAt(resource.code as Concept, COMPONENT_SYSTEM);
      if (!property && findingCode === FINDING_CODES["cervical-involvement"]) {
        const planned = isPlannedObservation(resource);
        const surfaceCoding = extensionCoding(resource.bodySite, DENTAL_CORE_PROFILES["tooth-surface"]);
        const surface = singleSurfaceOfCoding(surfaceCoding);
        if (!fdi || !isOdontogramFdi(fdi) || planned === undefined) return undefined;
        const target = planned ? ((payload.plan ??= {})[fdi] ??= {}) : (payload.teeth[fdi] ??= {});
        let key: string;
        if (surfaceCoding) {
          // odontogram-d1b: mesial/distal accepted (charly mz/dz) - before,
          // one such marker made the decoder reject the whole bundle.
          if (!surface || !["buccal", "lingual", "mesial", "distal"].includes(surface) || resource.valueBoolean !== true) return undefined;
          key = `cervicalSurfaces:${surface}`;
          if (!claim(fdi, key, true, planned ? "plan" : "status")) return undefined;
          (target.cervicalSurfaces ??= []).push(surface);
        } else {
          // fhir-dental-core fdc-w9z: no surface = cervical, side not recorded;
          // the value names what reaches the neck. Never a surface, never root caries.
          const valueCoding = (resource.valueCodeableConcept as Concept | undefined)?.coding ?? [];
          const kind = (["filling", "caries"] as const).find((k) => valueCoding.some((c) => c.system === CERVICAL_KIND_CODES[k].system && c.code === CERVICAL_KIND_CODES[k].code));
          if (!kind) return undefined;
          key = `cervicalSideUnknown:${kind}`;
          if (!claim(fdi, key, true, planned ? "plan" : "status")) return undefined;
          const kinds = new Set([...(target.cervicalSideUnknown ?? []), kind]);
          target.cervicalSideUnknown = (["filling", "caries"] as const).filter((k) => kinds.has(k));
        }
        const identityKey = `Observation/additional/${planned ? "plan/" : ""}${fdi}/${key.replace(":", "/")}`;
        if (profileIds.has(identityKey)) return undefined;
        profileIds.add(identityKey);
        if (planned) plannedFdi.add(fdi);
        captureIdentity(identityKey, resolvedEntry, resource);
        continue;
      }
      if (!fdi || !property || findingIds.has(`${fdi}:${property}`) || !isOdontogramFdi(fdi)) return undefined;
      findingIds.add(`${fdi}:${property}`);
      const mapping = mappingsByProperty.get(property)?.find((candidate) => candidate.kind === "boolean" || candidate.kind === "enum");
      const coded = codeAt(resource.valueCodeableConcept as { coding?: Array<{ system?: string; code?: string }> }, VALUE_SYSTEM);
      const value = mapping?.kind === "boolean" ? (coded ? true : resource.valueBoolean) : inverse(mapping?.values, coded ?? "");
      if (!mapping || value === undefined || !claim(fdi, mapping.field, value) || !applyFinding((payload.teeth[fdi] ??= {}), resource)) return undefined;
      captureIdentity(`Observation/finding/${fdi}/${property}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Procedure" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-procedure"])) {
      if (!validGeneratedProfile(DentalProcedureProfile, resource) || resource.status !== "completed" || !subject) return undefined;
      const bodySite = Array.isArray(resource.bodySite) ? resource.bodySite[0] as { coding?: Array<{ system?: string; code?: string }> } | undefined : undefined;
      const fdi = codeAt(bodySite, FDI_SYSTEM);
      const text = (resource.code as { text?: unknown } | undefined)?.text;
      const field = text === "Apicoectomy or root-end resection" ? "endoResection" : text === "Fissure sealing" ? "fissureSealing" : undefined;
      if (!fdi || !field || procedureIds.has(`${fdi}:${field}`) || !isOdontogramFdi(fdi) || !claim(fdi, field, true) || !applyProcedure((payload.teeth[fdi] ??= {}), resource)) return undefined;
      procedureIds.add(`${fdi}:${field}`);
      captureIdentity(`Procedure/${fdi}/${field}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Device" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-implant"])) {
      if (!validGeneratedProfile(DentalImplantProfile, resource) || resource.status !== "active") return undefined;
      const extension = Array.isArray(resource.extension) ? resource.extension : [];
      const position = extension.find((candidate) => (candidate as { url?: unknown }).url === DENTAL_CORE_PROFILES["tooth-position"]) as { valueCoding?: { system?: string; code?: string } } | undefined;
      const fdi = position?.valueCoding?.system === FDI_SYSTEM ? position.valueCoding.code : undefined;
      if (!fdi || !isOdontogramFdi(fdi) || profileIds.has(`implant:${fdi}`)) return undefined;
      const decoded: ToothRecord = {};
      if (!applyImplant(decoded, resource) || !mergeDecoded(fdi, decoded, false, resource)) return undefined;
      profileIds.add(`implant:${fdi}`);
      captureIdentity(`Device/implant/${fdi}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "Device" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-device"])) {
      if (!validGeneratedProfile(DentalDeviceProfile, resource) || resource.status !== "active" || !subject) return undefined;
      const extension = Array.isArray(resource.extension) ? resource.extension : [];
      const position = extension.find((entry) => (entry as { url?: unknown }).url === DENTAL_CORE_PROFILES["tooth-position"]) as { valueCoding?: { system?: string; code?: string } } | undefined;
      const fdi = position?.valueCoding?.system === FDI_SYSTEM ? position.valueCoding.code : undefined;
      const text = (resource.type as { text?: unknown } | undefined)?.text;
      if (typeof text !== "string") return undefined;
      const field = text === "Orthodontic bracket" || text === "Orthodontic band" ? "orthoAppliance" : text === "Parapulpal pin" ? "parapulpalPin" : text === "Bridge abutment" ? "bridgePillar" : text?.startsWith("Prosthesis retention ") ? "retention" : undefined;
      const value = text === "Orthodontic bracket" ? "bracket" : text === "Orthodontic band" ? "band" : text === "Parapulpal pin" || text === "Bridge abutment" ? true : text?.replace("Prosthesis retention ", "");
      const decoded: ToothRecord = {};
      if (!fdi || !field || value === undefined || deviceIds.has(`${fdi}:${field}`) || !isOdontogramFdi(fdi) || !applyDevice(decoded, resource) || !mergeDecoded(fdi, decoded, false, resource)) return undefined;
      deviceIds.add(`${fdi}:${field}`);
      captureIdentity(`Device/${fdi}/${field}`, resolvedEntry, resource);
      continue;
    }
    if (resource.resourceType === "ServiceRequest" && hasAdmittedProfileResource(resource, DENTAL_CORE_PROFILES["dental-service-request"])) {
      if (!validGeneratedProfile(DentalServiceRequestProfile, resource) || resource.status !== "active" || !subject) return undefined;
      const fdi = Array.isArray(resource.bodySite) ? codeAt(resource.bodySite[0] as { coding?: Array<{ system?: string; code?: string }> }, FDI_SYSTEM) : undefined;
      const change = resource.intent === "order" ? toothOrderField(resource) : undefined;
      if (change) {
        if (!fdi || !isOdontogramFdi(fdi) || changeRequestIds.has(`${fdi}:${change}`) || !claim(fdi, change, true)) return undefined;
        (payload.teeth[fdi] ??= {})[change] = true;
        changeRequestIds.add(`${fdi}:${change}`);
        captureIdentity(`ServiceRequest/change/${fdi}/${change}`, resolvedEntry, resource);
        continue;
      }
      if (resource.intent !== "plan" || !hasPlan) return undefined;
      if (!fdi || !isOdontogramFdi(fdi) || !Array.isArray(resource.basedOn) || !(resource.basedOn as Array<{ reference?: unknown }>).some((reference) => referencesResource(reference.reference, carePlan))) return undefined;
      if (planRequestFdi.has(fdi)) return undefined;
      planRequests.add(resource);
      planRequestFdi.add(fdi);
      (payload.plan ??= {})[fdi] ??= {};
      captureIdentity(`ServiceRequest/${fdi}`, resolvedEntry, resource);
      continue;
    }
    return undefined;
  }
  if (hasPlan) {
    if (!planActivities || planActivities.size !== planRequests.size || [...planActivities].some((request) => !planRequests.has(request))) return undefined;
    if ([...plannedFdi].some((fdi) => !planRequestFdi.has(fdi))) return undefined;
    if (!carePlanGoals || carePlanGoals.size !== planGoals.size || [...carePlanGoals].some((goal) => !planGoals.has(goal))) return undefined;
  }
  if (diagnosis || provenance) {
    const selected = diagnosis?.meta?.tag?.find((tag) => tag.system === VALUE_SYSTEM)?.code;
    const activity = codeAt(provenance?.activity, PROVENANCE_SYSTEM);
    const targets = provenance?.target as Array<{ reference?: unknown }> | undefined;
    const target = diagnosis
      ? targets?.some((reference) => referencesResource(reference.reference, diagnosis))
      : targets?.some((reference) => resolveReference(reference.reference) !== undefined);
    if (!provenance || !target || activity !== "clinician-selected") return undefined;
    if (diagnosis) {
      if (!selected || !isDentalCoreDiagnosis(selected)) return undefined;
      payload.case = { ...payload.case, diagnosisOverride: selected };
    }
    const recorder = (Array.isArray(provenance.agent) ? provenance.agent[0] as { who?: { reference?: unknown } } : undefined)?.who?.reference;
    if (typeof recorder === "string") payload.examination = { ...payload.examination, recorder };
  }
  if (effectiveDates.size > 1) return undefined;
  if (expectedSubject && effectiveDates.size === 1) {
    payload.examination = { ...payload.examination, subject: expectedSubject, effectiveDateTime: [...effectiveDates][0] };
  }
  if (Object.keys(identities).length) payload.fhirIdentity = { resources: identities };
  for (const [fdi, record] of [...Object.entries(payload.teeth), ...Object.entries(payload.plan ?? {})]) {
    for (const [root, states] of Object.entries(record.endoCanals ?? {})) {
      if (!isSourceRootIdentity(fdi, root) || !isValidEndodonticStates(states)) return undefined;
    }
    for (const root of [record.rootFractureRoot, record.rootResectionRoot, record.apicalRoot]) {
      if (root !== undefined && !isSourceRootIdentity(fdi, root)) return undefined;
    }
  }
  for (const [fdi, record] of Object.entries(payload.teeth)) payload.teeth[fdi] = normalizeLegacyRootPost(record);
  if (payload.plan) {
    for (const [fdi, record] of Object.entries(payload.plan)) payload.plan[fdi] = normalizeLegacyRootPost(record);
  }
  return payload;
}
