import type { Bundle, BundleEntry, CarePlan, Condition, Device, Goal, Observation, Procedure, Provenance, Resource, ServiceRequest } from "fhir/r4";
import type { DentalCoreResourceIdentity, FhirExportOptions, OdontogramExportPayload, ToothRecord } from "./types";
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
import { CANAL_STATE_CODES, CARIES_SEVERITY_CODES, CERVICAL_KIND_CODES, CARIES_SEVERITY_SYSTEM, CHART_MAPPINGS, coding, COMPONENT_SYSTEM, CROWN_LEAKAGE, DENTAL_CORE, DENTAL_CORE_BUNDLE_IDENTIFIER, DENTAL_CORE_PROFILES, DIRECT_FILLING, FDI_SYSTEM, FINDING_CODES, FURCATION_GRADE_CODES, isDentalCoreDiagnosis, isOdontogramFdi, isDentalCoreRiskValue, LESION_ACTIVITY, LESION_ACTIVITY_SYSTEM, LOINC_SYSTEM, normalizeLegacyRootPost, PROPERTY_SYSTEM, PROVENANCE_SYSTEM, RESTORATION_RENEWAL_URL, SNOMED_SYSTEM, TOOTH_ORDER_FIELDS, TOOTH_ORDER_SNOMED, type ToothOrderField, VALUE_SYSTEM } from "./dentalCoreContract";
import { resolveSmokingStatus } from "./smokingStatus";
import { dentalCoreCoding, LOCAL_VALUE_MAPS } from "../registry/valueCatalog";
import { isSourceRootIdentity, isValidEndodonticStates } from "./sourceStateValidation";

export class UnsupportedDentalCoreContentError extends Error {
  constructor(field: string) {
    super(`Dental Core cannot faithfully represent populated field: ${field}`);
    this.name = "UnsupportedDentalCoreContentError";
  }
}

export class MissingDentalCoreEffectiveDateError extends Error {
  constructor() {
    super("Dental Core export requires an effective date from the export options or examination context");
    this.name = "MissingDentalCoreEffectiveDateError";
  }
}

class DentalCoreIdentityResolver {
  private readonly resources: Record<string, DentalCoreResourceIdentity>;
  private readonly fullUrls = new Map<string, string>();
  private readonly usedFullUrls = new Set<string>();
  private generated = 0;

  constructor(payload: OdontogramExportPayload) {
    this.resources = payload.fhirIdentity?.resources ?? {};
    for (const identity of Object.values(this.resources)) {
      if (identity.fullUrl) this.usedFullUrls.add(identity.fullUrl);
    }
  }

  reference(key: string): string {
    const identity = this.resources[key];
    if (identity?.fullUrl) return identity.fullUrl;
    if (identity?.id) return `${key.split("/", 1)[0]}/${identity.id}`;
    return this.fullUrl(key);
  }

  entry<T extends Resource>(key: string, resource: T): BundleEntry {
    const identity = this.resources[key];
    const resolved = this.resource(key, resource);
    if (identity) return identity.fullUrl ? { fullUrl: identity.fullUrl, resource: resolved } : { resource: resolved };
    return { fullUrl: this.fullUrl(key), resource: resolved };
  }

  private resource<T extends Resource>(key: string, resource: T): T {
    const identity = this.resources[key];
    if (!identity) return resource;
    return {
      ...resource,
      ...(identity.id ? { id: identity.id } : {}),
      ...(identity.versionId ? { meta: { ...resource.meta, versionId: identity.versionId } } : {}),
    };
  }

  private fullUrl(key: string): string {
    const existing = this.fullUrls.get(key);
    if (existing) return existing;
    const imported = this.resources[key]?.fullUrl;
    if (imported) {
      this.fullUrls.set(key, imported);
      return imported;
    }
    let generated: string;
    do {
      this.generated += 1;
      generated = `urn:uuid:00000000-0000-4000-8000-${String(this.generated).padStart(12, "0")}`;
    } while (this.usedFullUrls.has(generated));
    this.usedFullUrls.add(generated);
    this.fullUrls.set(key, generated);
    return generated;
  }
}

const subjectReference = (options: FhirExportOptions, identity: DentalCoreIdentityResolver): string => options.subject ?? identity.reference("Patient/subject");
const effective = (payload: OdontogramExportPayload, options: FhirExportOptions): string => {
  const value = options.effectiveDateTime ?? payload.examination?.effectiveDateTime ?? payload.case?.examDate;
  if (!value) throw new MissingDentalCoreEffectiveDateError();
  return value;
};
const profile = (id: keyof typeof DENTAL_CORE_PROFILES) => [DENTAL_CORE_PROFILES[id]];
const generated = <T>(profileType: { apply(resource: never): { toResource(): unknown } }, resource: T): T =>
  profileType.apply(resource as never).toResource() as T;

const TOOTH_SURFACE_SYSTEM = "http://terminology.hl7.org/CodeSystem/FDI-surface";
const UCUM_SYSTEM = "http://unitsofmeasure.org";
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
const TOOTH_STATE_FIELDS = new Set<keyof ToothRecord>([
  "toothSelection", "endo", "fillingSurfaces", "fillingSurfaceMaterials", "fillingDefect",
  "prosthesis", "toothSubstrate", "restorationType", "restorationMaterial", "crownLeakage",
]);
const CARIES_FIELDS = new Set<keyof ToothRecord>(["caries", "cariesSeverity", "rootCaries"]);
const PERIODONTAL_FIELDS = new Set<keyof ToothRecord>(["calculus", "mobility", "perio", "furcation", "plaque", "pi", "gi", "kg"]);
const PERI_IMPLANT_FIELDS = new Set<keyof ToothRecord>(["periImplant", "mpi", "mbi"]);
const IMPLANT_FIELDS = new Set<keyof ToothRecord>(["implantProduct"]);
const RESTORATION_PRODUCT_FIELDS = new Set<keyof ToothRecord>(["restorationProduct", "fillingProducts"]);
const RECESSION_FIELDS = new Set<keyof ToothRecord>(["millerClass"]);
// `assessment` is examination workflow state, not a tooth-state or chart-finding
// value, and Dental Core has no carrier for it yet (cognovis/fhir-dental-core#20):
// a populated one is refused as unsupported content.
const ADDITIONAL_FINDING_FIELDS = new Set<keyof ToothRecord>(["pulpDx", "apicalDx", "radiographicDepth", "cervicalSurfaces", "cervicalSideUnknown", "note"]);
const SERVICE_REQUEST_FIELDS = new Set<keyof ToothRecord>(["extractionPlan", "crownReplace", "crownNeeded"]);
const SOURCE_PRESERVATION_FIELDS = new Set<keyof ToothRecord>([
  "implantPosition", "crownFractureType", "orthoProgressive", "rootResection", "papillaLoss",
  "orthoBracketSide", "cantilever", "endoCanals", "rootFractureRoot", "rootResectionRoot", "apicalRoot",
]);
const PROFILE_FIELDS = new Set<keyof ToothRecord>([
  ...TOOTH_STATE_FIELDS, ...CARIES_FIELDS, ...PERIODONTAL_FIELDS, ...PERI_IMPLANT_FIELDS, ...IMPLANT_FIELDS, ...RESTORATION_PRODUCT_FIELDS, ...RECESSION_FIELDS,
  ...ADDITIONAL_FINDING_FIELDS, ...SERVICE_REQUEST_FIELDS,
]);
const supportedToothFields = new Set<keyof ToothRecord>([
  ...CHART_MAPPINGS.map((mapping) => mapping.field),
  ...PROFILE_FIELDS,
  ...SOURCE_PRESERVATION_FIELDS,
]);
const supportedCaseFields = new Set([
  "cigarettesPerDay", "toothLossPerio", "maxRblPercent", "diagnosisOverride",
  "examDate", "diabetesStatus", "hba1c", "smokingStatus",
]);
const supportedExaminationFields = new Set(["subject", "effectiveDateTime", "recorder"]);
const nonClinicalToothFields = new Set(["cariesActiveDepth", "fillingMaterial"]);
const nonClinicalGlobalFields = new Set(["wisdomVisible", "showBase", "occlusalVisible", "showHealthyPulp"]);

/**
 * One HL7 FDI-surface code per chart surface. The writer only ever emits the
 * single-surface codes, so its output stays stable: the reader's V (vestibular)
 * is written back as B, I as O (the reader folds the incisal edge onto the
 * occlusal key), and a combined code (MO, DO, DI, MOD) as one extension per
 * surface (cognovis/odontogram#39).
 */
const SURFACE_CODES: Record<string, string> = {
  buccal: "B", lingual: "L", mesial: "M", distal: "D", occlusal: "O", incisal: "I", subcrown: "SC",
};
const SITE_CODES: Record<string, string> = {
  MB: "mesiobuccal-site", B: "buccal-site", DB: "distobuccal-site",
  ML: "mesiolingual-site", L: "lingual-site", DL: "distolingual-site",
};
const SURFACES = new Set(Object.keys(SURFACE_CODES));
const SITES = new Set(Object.keys(SITE_CODES));
const scalarMap = (value: unknown, validKey: (key: string) => boolean, validValue: (item: unknown) => boolean): boolean =>
  typeof value === "object" && value !== null && !Array.isArray(value)
  && Object.entries(value as Record<string, unknown>).every(([key, item]) => validKey(key) && validValue(item));

/** The Dental Core concept of a catalog value. A value without one cannot be written. */
const coreConcept = (group: string, value: string) => {
  const core = dentalCoreCoding(group, value);
  if (!core) throw new UnsupportedDentalCoreContentError(`${group}:${value}`);
  return { coding: [coding(core.system, core.code)] };
};
const valueConcept = (code: string) => ({ coding: [coding(VALUE_SYSTEM, code)] });
const bodySite = (fdi: string) => ({ coding: [coding(FDI_SYSTEM, fdi)] });
const surfaceExtension = (surface: string) => ({
  url: DENTAL_CORE_PROFILES["tooth-surface"],
  valueCoding: coding(TOOTH_SURFACE_SYSTEM, SURFACE_CODES[surface]),
});
const locationDetailExtension = (location: string) => ({ url: LOCATION_DETAIL_URL, valueString: location });
const siteExtension = (site: string) => ({
  url: DENTAL_CORE_PROFILES["periodontal-site"],
  valueCoding: coding(COMPONENT_SYSTEM, SITE_CODES[site] ?? site),
});
const component = (
  code: string,
  value: { coding: Array<{ system: string; code: string }>; text?: string },
  extensions: NonNullable<Observation["component"]>[number]["extension"] = [],
): NonNullable<Observation["component"]>[number] => ({
  code: { coding: [coding(COMPONENT_SYSTEM, code)] },
  valueCodeableConcept: value,
  ...(extensions.length ? { extension: extensions } : {}),
});

function hasOwn(record: ToothRecord, field: keyof ToothRecord): boolean {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function hasAnyField(record: ToothRecord, fields: Set<keyof ToothRecord>): boolean {
  return [...fields].some((field) => hasOwn(record, field) && hasClinicalValue(record[field], String(field)));
}

function hasClinicalValue(value: unknown, field?: string): boolean {
  if (value === undefined || value === null || value === false || value === "") return false;
  if (typeof value === "string") {
    const emptyValues = field === "toothSelection"
      ? ["tooth-base"]
      // Der Bracket-Seiten-Qualifier ist buccal per Vorgabe; buccal ist der
      // Leerwert, damit nicht jeder Standardzahn ueber die Positivliste
      // stolpert (Bracket buccal/lingual, KFO).
      : field === "orthoBracketSide"
        ? ["buccal"]
        : ["none", "unknown", "normal", "natural", "tooth-base"];
    return !emptyValues.includes(value);
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .some(([nestedField, nestedValue]) => hasClinicalValue(nestedValue, nestedField));
  return true;
}

function projectDentalCoreTooth(record: ToothRecord): ToothRecord {
  return normalizeLegacyRootPost(record);
}

function validProfileField(field: keyof ToothRecord, value: unknown): boolean {
  if (["orthoProgressive", "cantilever"].includes(field)) return typeof value === "boolean";
  if (field === "implantPosition") return typeof value === "string" && ["center", "mesial", "distal", "both"].includes(value);
  if (field === "crownFractureType") return typeof value === "string" && ["none", "crack", "split", "fracture"].includes(value);
  if (field === "orthoBracketSide") return typeof value === "string" && ["buccal", "lingual"].includes(value);
  if (field === "rootResection") return typeof value === "string" && ["none", "hemisection", "amputation", "premolarisation"].includes(value);
  if (["rootFractureRoot", "rootResectionRoot", "apicalRoot"].includes(field)) return typeof value === "string" && value.length > 0;
  if (field === "papillaLoss") return scalarMap(value, (key) => key === "mesial" || key === "distal", (item) => Number.isInteger(item) && (item as number) >= 1 && (item as number) <= 3);
  if (field === "endoCanals") return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value as Record<string, unknown>).length > 0
    && scalarMap(value, (key) => key.length > 0, isValidEndodonticStates);
  if (["calculus", "crownLeakage"].includes(field)) return typeof value === "boolean";
  if (["extractionPlan", "crownReplace", "crownNeeded"].includes(field)) return typeof value === "boolean";
  if (["kg"].includes(field)) return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 15;
  if (["caries", "fillingSurfaces", "plaque"].includes(field)) {
    const group = field === "plaque" ? "fillingSurfaces" : field;
    return Array.isArray(value) && value.every((item) => typeof item === "string" && Boolean(LOCAL_VALUE_MAPS[group]?.[item]));
  }
  if (field === "cariesSeverity") return scalarMap(value, (key) => SURFACES.has(key), (item) => Number.isInteger(item) && (item as number) >= 0 && (item as number) <= 6);
  if (field === "radiographicDepth") return scalarMap(value, (key) => Boolean(LOCAL_VALUE_MAPS.fillingSurfaces?.[key]), (item) => typeof item === "string" && Boolean(LOCAL_VALUE_MAPS.radiographicDepth?.[item]));
  // odontogram-d1b: mesial/distal too (charly mz/dz), and the side-unknown kinds.
  if (field === "cervicalSurfaces") return Array.isArray(value) && value.every((item) => ["buccal", "lingual", "mesial", "distal"].includes(String(item)));
  if (field === "cervicalSideUnknown") return Array.isArray(value) && value.every((item) => item === "filling" || item === "caries");
  if (field === "note") return typeof value === "string" && value.length > 0;
  if (field === "fillingSurfaceMaterials") return scalarMap(value, (key) => SURFACES.has(key) && key !== "subcrown", (item) => typeof item === "string" && Boolean(LOCAL_VALUE_MAPS.fillingMaterial?.[item]));
  if (field === "fillingDefect") return scalarMap(value, (key) => SURFACES.has(key) && key !== "subcrown", (item) => typeof item === "string" && Boolean(LOCAL_VALUE_MAPS.fillingDefect?.[item]));
  if (field === "furcation") return scalarMap(value, (key) => SURFACES.has(key) && key !== "subcrown", (item) => Number.isInteger(item) && (item as number) >= 1 && (item as number) <= 4);
  if (["pi", "gi", "mpi", "mbi"].includes(field)) return scalarMap(value, (key) => SURFACES.has(key) && key !== "subcrown", (item) => Number.isInteger(item) && (item as number) >= 0 && (item as number) <= 3);
  if (field === "perio") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const perio = value as { pd?: unknown; gm?: unknown; bop?: unknown; sup?: unknown };
    return scalarMap(perio.pd, (key) => SITES.has(key), (item) => typeof item === "number" && item >= 1 && item <= 15)
      && scalarMap(perio.gm, (key) => SITES.has(key), (item) => typeof item === "number" && item >= -10 && item <= 20)
      && [perio.bop, perio.sup].every((items) => Array.isArray(items) && items.every((item) => typeof item === "string" && SITES.has(item)));
  }
  if (field === "implantProduct") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const product = value as Record<string, unknown>;
    const allowed = new Set(["manufacturer", "system", "diameterMm", "lengthMm", "udi", "deviceIdentifier", "lot", "serial", "expiry"]);
    return Object.entries(product).every(([key, item]) => allowed.has(key) && (key === "diameterMm" || key === "lengthMm"
      ? typeof item === "number" && Number.isFinite(item) && item > 0
      : typeof item === "string"));
  }
  if (field === "fillingProducts") {
    // Je Material ein Satz, jeder wie `restorationProduct` gebaut. Der
    // SCHLUESSEL muss ein bekanntes Fuellmaterial sein - ein fremder wuerde im
    // Bundle als Device ohne Klasse landen.
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    return Object.entries(value as Record<string, unknown>).every(([mat, satz]) =>
      Boolean(LOCAL_VALUE_MAPS.fillingMaterial?.[mat]) && validProfileField("restorationProduct", satz));
  }
  if (field === "restorationProduct") {
    // Bead odontogram-99h, gebaut wie `implantProduct` daneben: JEDES Feld ist
    // eine Zeichenkette und jedes ist freiwillig - eine Krone ohne
    // Produktangabe ist ein vollstaendiger Befund. Geprueft wird deshalb nur,
    // dass kein FREMDER Schluessel mitfaehrt: was hier durchginge, kaeme im
    // Bundle nicht an, und ein stiller Verlust ist schlimmer als ein Abbruch.
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const allowed = new Set(["manufacturer", "product", "shade", "lab", "udi",
                             "deviceIdentifier", "lot", "serial", "expiry"]);
    return Object.entries(value as Record<string, unknown>)
      .every(([key, item]) => allowed.has(key) && typeof item === "string");
  }
  return typeof value === "string" && Boolean(LOCAL_VALUE_MAPS[String(field)]?.[value]);
}

function assertMappedTooth(record: ToothRecord, label: string): void {
  for (const [field, value] of Object.entries(record)) {
    if (nonClinicalToothFields.has(field)) continue;
    if (!supportedToothFields.has(field as keyof ToothRecord)) {
      if (hasClinicalValue(value, field)) throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
      continue;
    }
    if (PROFILE_FIELDS.has(field as keyof ToothRecord) || SOURCE_PRESERVATION_FIELDS.has(field as keyof ToothRecord)) {
      if (!validProfileField(field as keyof ToothRecord, value)) throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
      continue;
    }
    const mapping = CHART_MAPPINGS.find((candidate) => candidate.field === field);
    if (!mapping) throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
    if (mapping.kind === "boolean") {
      if (typeof value !== "boolean") throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
    } else if (mapping.kind === "set") {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !mapping.values?.[item])) {
        throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
      }
    } else if (typeof value !== "string" || !mapping.values?.[value]) {
      throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
    }
  }
  for (const surface of Object.keys(record.cariesSeverity ?? {})) {
    if (!(record.caries ?? []).includes(`caries-${surface}`)) throw new UnsupportedDentalCoreContentError(`${label}.cariesSeverity.${surface}`);
  }
  const fdi = label.replace(/^(?:teeth|plan)\./, "");
  for (const root of Object.keys(record.endoCanals ?? {})) {
    if (!isSourceRootIdentity(fdi, root)) throw new UnsupportedDentalCoreContentError(`${label}.endoCanals.${root}`);
  }
  for (const field of ["rootFractureRoot", "rootResectionRoot", "apicalRoot"] as const) {
    if (hasOwn(record, field) && !isSourceRootIdentity(fdi, record[field])) {
      throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
    }
  }
  if (hasAnyField(record, PERI_IMPLANT_FIELDS) && record.toothSelection !== "implant" && !record.implantProduct) {
    const field = [...PERI_IMPLANT_FIELDS].find((candidate) => hasOwn(record, candidate) && hasClinicalValue(record[candidate], String(candidate)));
    if (field) throw new UnsupportedDentalCoreContentError(`${label}.${field}`);
  }
  if (hasOwn(record, "rootFractureRoot") && (!record.rootFracture || record.rootFracture === "none")) {
    throw new UnsupportedDentalCoreContentError(`${label}.rootFractureRoot`);
  }
  if (hasOwn(record, "rootResectionRoot") && (!record.rootResection || record.rootResection === "none")) {
    throw new UnsupportedDentalCoreContentError(`${label}.rootResectionRoot`);
  }
  if (hasOwn(record, "apicalRoot") && !record.apicalDx) {
    throw new UnsupportedDentalCoreContentError(`${label}.apicalRoot`);
  }
}

const sharedReferenceFields = ["diabetesStatus", "hba1c", "smokingStatus", "edentulous"] as const;
type SharedField = typeof sharedReferenceFields[number];

const sharedReference = (options: FhirExportOptions, field: SharedField): string | undefined => {
  const entry = options.sharedResources?.[field];
  if (!entry) return undefined;
  if (entry.fullUrl) return entry.fullUrl;
  return entry.resource.id ? `${entry.resource.resourceType}/${entry.resource.id}` : undefined;
};

const codingCode = (target: unknown, system: string): string | undefined =>
  (target as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.find((item) => item.system === system)?.code;

const sharedFieldPopulated = (payload: OdontogramExportPayload, field: SharedField): boolean => {
  if (field === "edentulous") return payload.globals?.edentulous === true;
  if (!Object.prototype.hasOwnProperty.call(payload.case ?? {}, field)) return false;
  const value = payload.case?.[field];
  return value !== null && value !== undefined && value !== "unknown";
};

function sharedResourceMatches(payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, field: SharedField): boolean {
  const resource = options.sharedResources?.[field]?.resource as Resource & Record<string, unknown> | undefined;
  if (!resource || !sharedReference(options, field)) return false;
  const resourceSubject = (resource.subject as { reference?: unknown } | undefined)?.reference;
  if (resourceSubject !== subjectReference(options, identity)) return false;
  if (field === "hba1c") {
    const value = (resource.valueQuantity as { value?: unknown; system?: string; code?: string } | undefined);
    return resource.resourceType === "Observation" && codingCode(resource.code, LOINC_SYSTEM) === "4548-4"
      && value?.system === UCUM_SYSTEM && value.code === "%" && typeof value.value === "number"
      && value.value >= 3 && value.value <= 20 && value.value === payload.case?.hba1c;
  }
  if (field === "smokingStatus") {
    const status = payload.case?.smokingStatus;
    return resource.resourceType === "Observation" && codingCode(resource.code, LOINC_SYSTEM) === "72166-2"
      && typeof status === "string" && ["never", "former", "current"].includes(status)
      && resolveSmokingStatus(resource.valueCodeableConcept) === status;
  }
  if (field === "diabetesStatus") {
    const status = payload.case?.diabetesStatus;
    const refuted = codingCode(resource.verificationStatus, "http://terminology.hl7.org/CodeSystem/condition-ver-status") === "refuted";
    const coded = (resource.code as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.some((item) => item.system && item.code);
    return resource.resourceType === "Condition" && Boolean(coded) && (status === "none" ? refuted : status === "present" && !refuted);
  }
  const coded = (resource.code as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.some((item) => item.system && item.code);
  return resource.resourceType === "Condition" && Boolean(coded) && payload.globals?.edentulous === true;
}

function assertDentalCoreComplete(payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): void {
  for (const [fdi, record] of Object.entries(payload.teeth ?? {})) {
    if (!isOdontogramFdi(fdi) && hasClinicalValue(record)) throw new UnsupportedDentalCoreContentError(`teeth.${fdi}`);
    assertMappedTooth(record, `teeth.${fdi}`);
  }
  for (const [fdi, record] of Object.entries(payload.plan ?? {})) {
    if (!isOdontogramFdi(fdi) && hasClinicalValue(record)) throw new UnsupportedDentalCoreContentError(`plan.${fdi}`);
    assertMappedTooth(record, `plan.${fdi}`);
    const unsupportedPlanField = [...IMPLANT_FIELDS, ...PERI_IMPLANT_FIELDS, ...SERVICE_REQUEST_FIELDS]
      .find((field) => hasOwn(record, field) && hasClinicalValue(record[field], String(field)));
    if (unsupportedPlanField) throw new UnsupportedDentalCoreContentError(`plan.${fdi}.${unsupportedPlanField}`);
  }
  for (const [field, value] of Object.entries(payload.case ?? {})) {
    if (!supportedCaseFields.has(field) && hasClinicalValue(value)) throw new UnsupportedDentalCoreContentError(`case.${field}`);
  }
  for (const [field, value] of Object.entries(payload.globals ?? {})) {
    if (field !== "edentulous" && !nonClinicalGlobalFields.has(field) && hasClinicalValue(value)) throw new UnsupportedDentalCoreContentError(`globals.${field}`);
  }
  for (const field of sharedReferenceFields) {
    if (sharedFieldPopulated(payload, field) && !sharedResourceMatches(payload, options, identity, field)) {
      throw new UnsupportedDentalCoreContentError(field === "edentulous" ? "globals.edentulous" : `case.${field}`);
    }
  }
  for (const [field, value] of Object.entries(payload.examination ?? {})) {
    if (!supportedExaminationFields.has(field) && hasClinicalValue(value)) throw new UnsupportedDentalCoreContentError(`examination.${field}`);
  }
}

function chartComponents(record: ToothRecord): Observation["component"] {
  const components: NonNullable<Observation["component"]> = [];
  for (const mapping of CHART_MAPPINGS) {
    const present = Object.prototype.hasOwnProperty.call(record, mapping.field);
    if (!present) continue;
    const raw = record[mapping.field];
    if (mapping.omitDefault && raw === mapping.defaultValue) continue;
    if (mapping.kind === "boolean") {
      if (typeof raw !== "boolean") continue;
      const coded = mapping.values?.true;
      components.push({
        code: { coding: [coding(PROPERTY_SYSTEM, mapping.property)] },
        ...(coded && raw ? { valueCodeableConcept: { coding: [coding(VALUE_SYSTEM, coded)] } } : { valueBoolean: raw }),
      });
      continue;
    }
    if (mapping.kind === "set") {
      if (!Array.isArray(raw)) continue;
      for (const value of raw) {
        const code = mapping.values?.[String(value)];
        if (code) components.push({ code: { coding: [coding(PROPERTY_SYSTEM, mapping.property)] }, valueCodeableConcept: { coding: [coding(VALUE_SYSTEM, code)] } });
      }
      continue;
    }
    if (typeof raw !== "string") continue;
    const code = mapping.values?.[raw];
    if (code) components.push({
      code: { coding: [coding(PROPERTY_SYSTEM, mapping.property)] },
      valueCodeableConcept: { coding: [coding(VALUE_SYSTEM, code)] },
      ...(mapping.field === "rootFracture" && record.rootFractureRoot
        ? { extension: [locationDetailExtension(record.rootFractureRoot)] }
        : {}),
    });
  }
  return components;
}

function chartExtensions(record: ToothRecord, target = false): NonNullable<Observation["extension"]> {
  const extensions: NonNullable<Observation["extension"]> = [];
  if (hasOwn(record, "rootResection")) {
    extensions.push({
      url: RECORDED_ROOT_RESECTION_URL,
      extension: [
        { url: "description", valueString: record.rootResection },
        ...(record.rootResectionRoot ? [{ url: "root", valueString: record.rootResectionRoot }] : []),
      ],
    });
  }
  for (const [surface, grade] of Object.entries(record.papillaLoss ?? {})) {
    extensions.push({
      url: RECORDED_PAPILLA_LOSS_URL,
      extension: [
        { url: "surface", valueCoding: coding(TOOTH_SURFACE_SYSTEM, surface === "mesial" ? "M" : "D") },
        { url: "grade", valueInteger: grade },
        { url: "classification", valueString: "Nordland and Tarnow" },
      ],
    });
  }
  if (hasOwn(record, "orthoProgressive")) {
    extensions.push({ url: RECORDED_ORTHODONTIC_PROGRESSION_URL, valueBoolean: record.orthoProgressive });
  }
  if (hasOwn(record, "implantPosition") && (target || (record.toothSelection !== "implant" && !record.implantProduct))) extensions.push({ url: RECORDED_IMPLANT_POSITION_URL, valueString: record.implantPosition });
  if (hasOwn(record, "crownFractureType")) extensions.push({ url: RECORDED_CROWN_FRACTURE_TYPE_URL, valueString: record.crownFractureType });
  if (hasOwn(record, "orthoBracketSide") && (target || record.orthoAppliance !== "bracket")) extensions.push({
    url: RECORDED_BRACKET_SURFACE_URL,
    valueCoding: coding(TOOTH_SURFACE_SYSTEM, record.orthoBracketSide === "buccal" ? "B" : "L"),
  });
  if (hasOwn(record, "cantilever") && (target || !record.bridgePillar)) extensions.push({ url: RECORDED_CANTILEVER_ROLE_URL, valueBoolean: record.cantilever });
  if (!target && record.apicalRoot && record.apicalDx === "normal") extensions.push({
    url: RECORDED_APICAL_FINDING_URL,
    extension: [
      { url: "description", valueString: record.apicalDx },
      { url: "root", valueString: record.apicalRoot },
    ],
  });
  return extensions;
}

function chartState(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan: boolean): Observation | undefined {
  const chartRecord = plan && record.rootFracture ? { ...record, rootFracture: undefined } : record;
  const component = chartComponents(chartRecord);
  const extension = plan ? [] : chartExtensions(record);
  if (!component?.length && !extension.length) return undefined;
  return generated(DentalChartStateProfile, {
    resourceType: "Observation",
    meta: { profile: profile("dental-chart-state") },
    status: "final",
    code: { coding: [coding(COMPONENT_SYSTEM, "chart-state")] },
    subject: { reference: subjectReference(options, identity) },
    effectiveDateTime: effective(payload, options),
    bodySite: { coding: [coding(FDI_SYSTEM, fdi)] },
    ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
    ...(component?.length ? { component } : {}),
    ...(extension.length ? { extension } : {}),
  });
}

function targetChartState(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Goal | undefined {
  const extension = chartExtensions(record, true);
  for (const state of record.endo ? [record.endo] : []) extension.push({
    url: RECORDED_ROOT_ENDODONTIC_STATE_URL,
    extension: [{ url: "description", valueString: state }],
  });
  for (const [root, states] of Object.entries(record.endoCanals ?? {})) for (const state of states) extension.push({
    url: RECORDED_ROOT_ENDODONTIC_STATE_URL,
    extension: [{ url: "description", valueString: state }, { url: "root", valueString: root }],
  });
  if (record.rootFracture && record.rootFracture !== "none") extension.push({
    url: RECORDED_ROOT_FRACTURE_URL,
    extension: [
      { url: "description", valueString: record.rootFracture },
      ...(record.rootFractureRoot ? [{ url: "root", valueString: record.rootFractureRoot }] : []),
    ],
  });
  if (record.apicalDx && (record.apicalDx !== "normal" || Boolean(record.apicalRoot))) extension.push({
    url: RECORDED_APICAL_FINDING_URL,
    extension: [
      { url: "description", valueString: record.apicalDx },
      ...(record.apicalRoot ? [{ url: "root", valueString: record.apicalRoot }] : []),
    ],
  });
  if (!extension.length) return undefined;
  return generated(DentalTargetChartStateProfile, {
    resourceType: "Goal",
    meta: { profile: [DENTAL_CORE_PROFILES["dental-target-chart-state"]] },
    lifecycleStatus: "planned",
    description: { text: "Target dental chart state" },
    subject: { reference: subjectReference(options, identity) },
    addresses: [{ reference: identity.reference(`ServiceRequest/${fdi}`) }],
    extension: [{ url: DENTAL_CORE_PROFILES["tooth-position"], valueCoding: coding(FDI_SYSTEM, fdi) }, ...extension],
  });
}

function procedure(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Procedure]> {
  const result: Array<[string, Procedure]> = [];
  const procedures: Array<[boolean | undefined, string]> = [[record.endoResection, "Apicoectomy or root-end resection"], [record.fissureSealing, "Fissure sealing"]];
  for (const [index, [flag, text]] of procedures.entries()) {
    if (!flag) continue;
    const field = index === 0 ? "endoResection" : "fissureSealing";
    result.push([`Procedure/${fdi}/${field}`, generated(DentalProcedureProfile, { resourceType: "Procedure", meta: { profile: profile("dental-procedure") }, status: "completed", code: { text }, subject: { reference: subjectReference(options, identity) }, performedDateTime: effective(payload, options), bodySite: [{ coding: [coding(FDI_SYSTEM, fdi)] }] })]);
  }
  return result;
}

function devices(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Device]> {
  const types: Array<[string, string | undefined]> = [
    ["orthoAppliance", record.orthoAppliance && record.orthoAppliance !== "none" ? `Orthodontic ${record.orthoAppliance}` : undefined],
    ["parapulpalPin", record.parapulpalPin ? "Parapulpal pin" : undefined],
    ["bridgePillar", record.bridgePillar ? "Bridge abutment" : undefined],
    ["retention", record.retention && record.retention !== "none" ? `Prosthesis retention ${record.retention}` : undefined],
  ];
  return types.flatMap(([field, text]) => !text ? [] : [[`Device/${fdi}/${field}`, generated(DentalDeviceProfile, {
    resourceType: "Device", meta: { profile: profile("dental-device") }, status: "active",
    type: { text }, patient: { reference: subjectReference(options, identity) },
    extension: [
      { url: DENTAL_CORE_PROFILES["tooth-position"], valueCoding: coding(FDI_SYSTEM, fdi) },
      ...(field === "orthoAppliance" && hasOwn(record, "orthoBracketSide")
        ? [{ url: RECORDED_BRACKET_SURFACE_URL, valueCoding: coding(TOOTH_SURFACE_SYSTEM, record.orthoBracketSide === "buccal" ? "B" : "L") }]
        : []),
      ...(field === "bridgePillar" && hasOwn(record, "cantilever")
        ? [{ url: RECORDED_CANTILEVER_ROLE_URL, valueBoolean: record.cantilever }]
        : []),
    ],
  })] as [string, Device]]);
}

function observedFindings(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Observation]> {
  const excluded = new Set(["endoResection", "fissureSealing", "orthoAppliance", "parapulpalPin", "bridgePillar", "retention", "retentionSide", "mods", "pulpLatin"]);
  return CHART_MAPPINGS.flatMap((mapping) => {
    if (excluded.has(mapping.field) || !Object.prototype.hasOwnProperty.call(record, mapping.field)) return [];
    const raw = record[mapping.field];
    if (raw === false || raw === mapping.defaultValue || raw === "none" || raw === "unknown" || (Array.isArray(raw) && raw.length === 0)) return [];
    const finding: Observation = {
      resourceType: "Observation", meta: { profile: profile("dental-finding") }, status: "final",
      code: { coding: [coding(PROPERTY_SYSTEM, mapping.property)] }, subject: { reference: subjectReference(options, identity) },
      effectiveDateTime: effective(payload, options), bodySite: { coding: [coding(FDI_SYSTEM, fdi)] },
    };
    if (typeof raw === "boolean") finding.valueBoolean = raw;
    else if (typeof raw === "string") {
      const value = mapping.values?.[raw];
      if (value) finding.valueCodeableConcept = { coding: [coding(VALUE_SYSTEM, value)] };
    }
    return finding.valueBoolean !== undefined || finding.valueCodeableConcept ? [[`Observation/finding/${fdi}/${mapping.property}`, generated(DentalFindingProfile, finding)]] : [];
  });
}

function toothState(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Observation | undefined {
  const stateRecord = plan ? { ...record, endo: undefined, endoCanals: undefined } : record;
  if (!hasAnyField(stateRecord, TOOTH_STATE_FIELDS) && !hasOwn(stateRecord, "toothSelection") && !hasClinicalValue(stateRecord.endoCanals) && !stateRecord.note) return undefined;
  const components: NonNullable<Observation["component"]> = [
    component("tooth-presence", coreConcept("toothSelection", stateRecord.toothSelection ?? "tooth-base")),
  ];
  if (stateRecord.toothSubstrate) components.push(component("tooth-substrate", coreConcept("toothSubstrate", stateRecord.toothSubstrate)));
  if (stateRecord.endo) components.push(component("root-endodontic-state", coreConcept("endo", stateRecord.endo)));
  for (const [root, states] of Object.entries(stateRecord.endoCanals ?? {})) {
    // The Core code carries the state; the source state stays as its text.
    for (const state of states) components.push(component("root-endodontic-state", { ...valueConcept(CANAL_STATE_CODES[state]), text: state }, [locationDetailExtension(root)]));
  }
  if (stateRecord.restorationType) components.push(component("restoration-type", coreConcept("restorationType", stateRecord.restorationType)));
  // A telescope is a crown type in Dental Core, so it rides as a second
  // restoration-type component instead of a material.
  if (stateRecord.restorationMaterial) components.push(component(
    stateRecord.restorationMaterial === "telescope" ? "restoration-type" : "restoration-material",
    coreConcept("restorationMaterial", stateRecord.restorationMaterial),
  ));
  if (stateRecord.prosthesis) components.push(component("prosthetic-state", coreConcept("prosthesis", stateRecord.prosthesis)));
  for (const surface of stateRecord.fillingSurfaces ?? []) {
    components.push(component("restoration-type", valueConcept(DIRECT_FILLING.code), [surfaceExtension(surface)]));
  }
  for (const [surface, material] of Object.entries(stateRecord.fillingSurfaceMaterials ?? {})) {
    components.push(component("restoration-material", coreConcept("fillingMaterial", material), [surfaceExtension(surface)]));
  }
  for (const [surface, status] of Object.entries(stateRecord.fillingDefect ?? {})) {
    components.push(component("restoration-status", coreConcept("fillingDefect", status), [surfaceExtension(surface)]));
  }
  if (stateRecord.crownLeakage) components.push(component("restoration-status", valueConcept(CROWN_LEAKAGE.code)));
  return generated(DentalToothStateProfile, {
    resourceType: "Observation",
    meta: { profile: profile("dental-tooth-state") },
    status: "final",
    code: { coding: [coding(COMPONENT_SYSTEM, "tooth-presence")] },
    subject: { reference: subjectReference(options, identity) },
    effectiveDateTime: effective(payload, options),
    bodySite: bodySite(fdi),
    ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
    component: components,
    ...(stateRecord.note ? { note: [{ text: stateRecord.note }] } : {}),
  } as Observation);
}

function cariesFindings(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Array<[string, Observation]> {
  const findings = (record.caries ?? []).map((cariesCode): [string, Observation] => {
    const surface = cariesCode.replace(/^caries-/, "");
    const severity = record.cariesSeverity?.[surface];
    const finding = generated(DentalCariesFindingProfile, {
      resourceType: "Observation",
      meta: { profile: profile("dental-caries-finding") },
      status: "final",
      code: { coding: [coding(SNOMED_SYSTEM, "80967001")] },
      subject: { reference: subjectReference(options, identity) },
      effectiveDateTime: effective(payload, options),
      bodySite: { ...bodySite(fdi), extension: [surfaceExtension(surface)] },
      valueCodeableConcept: coreConcept("caries", cariesCode),
      ...(severity === undefined ? {} : { component: [{
        code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["caries-severity"])] },
        valueCodeableConcept: { coding: [coding(CARIES_SEVERITY_SYSTEM, CARIES_SEVERITY_CODES[severity])] },
      }] }),
      ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
    } as Observation);
    return [`Observation/caries/${plan ? "plan/" : ""}${fdi}/${surface}`, finding];
  });
  if (record.rootCaries && record.rootCaries !== "none") {
    findings.push([`Observation/caries/${plan ? "plan/" : ""}root/${fdi}`, generated(DentalCariesFindingProfile, {
      resourceType: "Observation", meta: { profile: profile("dental-caries-finding") }, status: "final",
      code: { coding: [coding(SNOMED_SYSTEM, "80967001")] }, subject: { reference: subjectReference(options, identity) },
      effectiveDateTime: effective(payload, options), bodySite: bodySite(fdi), valueCodeableConcept: coreConcept("rootCaries", record.rootCaries),
      // Active and arrested root caries share one Core value; the lesion
      // activity says which. Cavitated root caries is an active lesion.
      component: [{
        code: { coding: [coding(COMPONENT_SYSTEM, "caries-lesion-activity")] },
        valueCodeableConcept: { coding: [coding(LESION_ACTIVITY_SYSTEM, record.rootCaries === "arrested" ? LESION_ACTIVITY.arrested : LESION_ACTIVITY.active)] },
      }],
      ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
    } as Observation)]);
  }
  return findings;
}

function additionalFindings(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Array<[string, Observation]> {
  const common = (id: "dental-finding" | "dental-pulp-diagnosis" | "dental-apical-diagnosis" | "dental-radiographic-caries-depth") => ({
    resourceType: "Observation" as const, meta: { profile: profile(id) }, status: "final" as const,
    subject: { reference: subjectReference(options, identity) }, effectiveDateTime: effective(payload, options), bodySite: bodySite(fdi),
    ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
  });
  const result: Array<[string, Observation]> = [];
  if (record.pulpDx) result.push([`Observation/additional/${plan ? "plan/" : ""}${fdi}/pulpDx`, generated(DentalPulpDiagnosisProfile, {
    ...common("dental-pulp-diagnosis"), code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["pulp-diagnosis"])] },
    valueCodeableConcept: coreConcept("pulpDx", record.pulpDx),
  })]);
  if (record.apicalDx) result.push([`Observation/additional/${plan ? "plan/" : ""}${fdi}/apicalDx`, generated(DentalApicalDiagnosisProfile, {
    ...common("dental-apical-diagnosis"), code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["apical-diagnosis"])] },
    valueCodeableConcept: coreConcept("apicalDx", record.apicalDx),
    ...(record.apicalRoot && !plan
      ? { bodySite: { ...bodySite(fdi), extension: [locationDetailExtension(record.apicalRoot)] } }
      : {}),
  })]);
  for (const [surface, value] of Object.entries(record.radiographicDepth ?? {})) {
    if (value === "none") continue;
    result.push([
      `Observation/additional/${plan ? "plan/" : ""}${fdi}/radiographicDepth/${surface}`,
      generated(DentalRadiographicCariesDepthProfile, {
        ...common("dental-radiographic-caries-depth"), code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["radiographic-caries-depth"])] },
        bodySite: { ...bodySite(fdi), extension: [surfaceExtension(surface)] }, valueCodeableConcept: coreConcept("radiographicDepth", value),
      }),
    ]);
  }
  for (const surface of record.cervicalSurfaces ?? []) result.push([
    `Observation/additional/${plan ? "plan/" : ""}${fdi}/cervicalSurfaces/${surface}`,
    generated(DentalFindingProfile, { ...common("dental-finding"), code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["cervical-involvement"])] }, bodySite: { ...bodySite(fdi), extension: [surfaceExtension(surface)] }, valueBoolean: true }),
  ]);
  // fhir-dental-core fdc-w9z: the same code with NO surface is "cervical, side
  // not recorded"; the value names what reaches the neck (caries |
  // direct-filling). Never a surface, never root caries.
  for (const kind of (["filling", "caries"] as const).filter((k) => record.cervicalSideUnknown?.includes(k))) result.push([
    `Observation/additional/${plan ? "plan/" : ""}${fdi}/cervicalSideUnknown/${kind}`,
    generated(DentalFindingProfile, { ...common("dental-finding"), code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["cervical-involvement"])] }, bodySite: bodySite(fdi), valueCodeableConcept: { coding: [coding(CERVICAL_KIND_CODES[kind].system, CERVICAL_KIND_CODES[kind].code)] } }),
  ]);
  return result;
}

/**
 * Dental Core 0.8.0 tooth-level order carriers: extraction is SNOMED CT
 * 55162003; both crown fields are a crown fitting (426222000) whose
 * `restoration-renewal` says whether an existing crown is replaced. The
 * identity key is unchanged from 4.0.0, so a save replaces an order written
 * by 4.0.0 in place.
 */
function toothOrder(field: ToothOrderField): Pick<ServiceRequest, "code" | "extension"> {
  if (field === "extractionPlan") return { code: { coding: [coding(SNOMED_SYSTEM, TOOTH_ORDER_SNOMED.extraction)] } };
  return {
    extension: [{ url: RESTORATION_RENEWAL_URL, valueBoolean: field === "crownReplace" }],
    code: { coding: [coding(SNOMED_SYSTEM, TOOTH_ORDER_SNOMED.crownFitting)] },
  };
}

function requestedChanges(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, ServiceRequest]> {
  return TOOTH_ORDER_FIELDS.flatMap((field) => !record[field] ? [] : [[
    `ServiceRequest/change/${fdi}/${field}`,
    generated(DentalServiceRequestProfile, {
      resourceType: "ServiceRequest", meta: { profile: profile("dental-service-request") }, status: "active", intent: "order",
      ...toothOrder(field), subject: { reference: subjectReference(options, identity) }, bodySite: [{ coding: [coding(FDI_SYSTEM, fdi)] }],
    }),
  ] as [string, ServiceRequest]]);
}

function periodontalComponents(record: ToothRecord): NonNullable<Observation["component"]> {
  const components: NonNullable<Observation["component"]> = [];
  const quantity = (system: string, code: string, value: number, site: string) => ({
    code: { coding: [coding(system, code)] },
    extension: [siteExtension(site)],
    valueQuantity: { value, system: UCUM_SYSTEM, code: "mm", unit: "mm" },
  });
  for (const [site, value] of Object.entries(record.perio?.pd ?? {})) components.push(quantity(LOINC_SYSTEM, "32910-2", value, site));
  for (const [site, value] of Object.entries(record.perio?.gm ?? {})) components.push(quantity(LOINC_SYSTEM, "64043-3", value, site));
  for (const site of record.perio?.bop ?? []) components.push({ code: { coding: [coding(SNOMED_SYSTEM, "249420004")] }, extension: [siteExtension(site)], valueBoolean: true });
  for (const site of record.perio?.sup ?? []) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, "suppuration-on-probing")] }, extension: [siteExtension(site)], valueBoolean: true });
  if (record.mobility && record.mobility !== "none") components.push({ code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["tooth-mobility"])] }, valueCodeableConcept: coreConcept("mobility", record.mobility) });
  if (record.calculus) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES.calculus)] }, valueBoolean: true });
  for (const surface of record.plaque ?? []) components.push({ code: { coding: [coding(LOINC_SYSTEM, "34016-6")] }, extension: [surfaceExtension(surface)], valueBoolean: true });
  for (const [surface, value] of Object.entries(record.pi ?? {})) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, "plaque-index")] }, extension: [surfaceExtension(surface)], valueInteger: value });
  for (const [surface, value] of Object.entries(record.gi ?? {})) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, "gingival-index")] }, extension: [surfaceExtension(surface)], valueInteger: value });
  if (typeof record.kg === "number") components.push(quantity(COMPONENT_SYSTEM, "keratinized-gingiva-width", record.kg, "B"));
  for (const [entrance, value] of Object.entries(record.furcation ?? {})) components.push({ code: { coding: [coding(SNOMED_SYSTEM, "771311009")] }, extension: [surfaceExtension(entrance)], valueCodeableConcept: valueConcept(FURCATION_GRADE_CODES[value]) });
  return components;
}

function periodontalFinding(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Observation | undefined {
  const components = periodontalComponents(record);
  if (!components.length) return undefined;
  return generated(DentalPeriodontalFindingProfile, {
    resourceType: "Observation", meta: { profile: profile("dental-periodontal-finding") }, status: "final",
    code: { coding: [coding(LOINC_SYSTEM, "32910-2")] },
    subject: { reference: subjectReference(options, identity) }, effectiveDateTime: effective(payload, options),
    bodySite: bodySite(fdi), component: components,
    ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
  } as Observation);
}

/** Device property types and product values are free text: they are not
 *  tooth-state or chart-finding values and no terminology carries them. */
const textConcept = (text: string) => ({ text });
/** The UDI as printed on the label: Device.udiCarrier.carrierHRF. */
const udiCarrier = (udi: string | undefined): Pick<Device, "udiCarrier"> => udi ? { udiCarrier: [{ carrierHRF: udi }] } : {};

function implantDevice(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Device | undefined {
  if (record.toothSelection !== "implant" && !record.implantProduct) return undefined;
  const product = record.implantProduct ?? {};
  const identifiers = [
    product.deviceIdentifier ? { system: "urn:oid:2.51.1.1", value: product.deviceIdentifier } : undefined,
    !product.deviceIdentifier && !product.udi ? { system: "urn:ietf:rfc:3986", value: identity.reference(`Device/implant/${fdi}`) } : undefined,
  ].filter((value): value is { system: string; value: string } => Boolean(value));
  const properties = [
    typeof product.diameterMm === "number" ? {
      type: textConcept("implant-diameter"),
      valueQuantity: [{ value: product.diameterMm, system: UCUM_SYSTEM, code: "mm", unit: "mm" }],
    } : undefined,
    typeof product.lengthMm === "number" ? {
      type: textConcept("implant-length"),
      valueQuantity: [{ value: product.lengthMm, system: UCUM_SYSTEM, code: "mm", unit: "mm" }],
    } : undefined,
  ].filter(Boolean) as NonNullable<Device["property"]>;
  return generated(DentalImplantProfile, {
    resourceType: "Device", meta: { profile: profile("dental-implant") }, status: "active",
    identifier: identifiers, ...udiCarrier(product.udi), type: { coding: [coding(SNOMED_SYSTEM, "272159002")] },
    patient: { reference: subjectReference(options, identity) },
    extension: [
      { url: DENTAL_CORE_PROFILES["tooth-position"], valueCoding: coding(FDI_SYSTEM, fdi) },
      ...(hasOwn(record, "implantPosition") ? [{ url: RECORDED_IMPLANT_POSITION_URL, valueString: record.implantPosition }] : []),
    ],
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.system ? { deviceName: [{ name: product.system, type: "model-name" }] } : {}),
    ...(product.lot ? { lotNumber: product.lot } : {}),
    ...(product.serial ? { serialNumber: product.serial } : {}),
    ...(product.expiry ? { expirationDate: product.expiry } : {}),
    ...(properties.length ? { property: properties } : {}),
  } as Device);
}

/**
 * Bead odontogram-99h: WELCHES Produkt in der Restauration steckt.
 *
 * Ein eigenes `Device` und keine Erweiterung des Materialcodes - und das ist
 * keine Geschmacksfrage: der Materialkatalog, in den wir exportieren, fuehrt
 * KLASSEN und nennt Produkte nur als Beispiel INNERHALB einer Klasse
 * ("Lithiumdisilikat: z.B. IPS e.max"). Er hat damit genau Dirks Position
 * eingenommen und hat kein Feld fuer das Produkt. Was wir bauen, muss eine
 * Ergaenzung auf unserer Seite sein, abgebildet auf eine FHIR-Konstruktion, die
 * es gibt - nie eine Aufweitung des Materialcodes.
 *
 * Die CHARGE ist der Grund, warum es dieses Device gibt: ohne sie ist "welche
 * Patienten tragen Los X" nicht beantwortbar, und dann traegt das Feld nichts.
 * Sie steht deshalb in `lotNumber`, dort wo ein Rueckruf sie sucht.
 *
 * `type` bleibt die MATERIALKLASSE - dieselbe Aussage wie im Befund, damit ein
 * Empfaenger das Device auch dann einordnen kann, wenn er den Produktnamen
 * nicht kennt.
 */
function restorationDevice(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Device | undefined {
  const product = record.restorationProduct;
  if (!product) return undefined;
  const identifiers = [
    product.deviceIdentifier ? { system: "urn:oid:2.51.1.1", value: product.deviceIdentifier } : undefined,
    !product.deviceIdentifier && !product.udi
      ? { system: "urn:ietf:rfc:3986", value: identity.reference(`Device/restoration/${fdi}`) } : undefined,
  ].filter((value): value is { system: string; value: string } => Boolean(value));
  const properties = [
    product.shade ? { type: textConcept("restoration-shade"), valueCode: [textConcept(product.shade)] } : undefined,
    product.lab ? { type: textConcept("dental-laboratory"), valueCode: [textConcept(product.lab)] } : undefined,
  ].filter(Boolean) as NonNullable<Device["property"]>;
  // Die Klasse wird MIT DEMSELBEN Dental-Core-Code gefuehrt wie im Befund -
  // eine zweite Schreibweise derselben Aussage waere genau die Stelle, an der
  // ein Empfaenger beide fuer verschiedene Dinge haelt.
  const klasse = record.restorationMaterial && record.restorationMaterial !== "none"
    ? coreConcept("restorationMaterial", record.restorationMaterial) : undefined;
  return {
    resourceType: "Device", status: "active", identifier: identifiers, ...udiCarrier(product.udi),
    ...(klasse ? { type: klasse } : {}),
    patient: { reference: subjectReference(options, identity) },
    extension: [{ url: DENTAL_CORE_PROFILES["tooth-position"], valueCoding: coding(FDI_SYSTEM, fdi) }],
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.product ? { deviceName: [{ name: product.product, type: "model-name" }] } : {}),
    ...(product.lot ? { lotNumber: product.lot } : {}),
    ...(product.serial ? { serialNumber: product.serial } : {}),
    ...(product.expiry ? { expirationDate: product.expiry } : {}),
    ...(properties.length ? { property: properties } : {}),
  } as Device;
}

/** Bead odontogram-99h: je Fuellmaterial ein `Device`, aus denselben Gruenden
 *  wie bei der Laborarbeit. `type` ist das Fuellmaterial mit demselben
 *  Dental-Core-Code wie im Befund, die Charge steht in `lotNumber`. */
function fillingDevices(record: ToothRecord, fdi: string, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Device]> {
  const out: Array<[string, Device]> = [];
  for (const [material, product] of Object.entries(record.fillingProducts ?? {})) {
    const identifiers = [
      product.deviceIdentifier ? { system: "urn:oid:2.51.1.1", value: product.deviceIdentifier } : undefined,
      !product.deviceIdentifier && !product.udi
        ? { system: "urn:ietf:rfc:3986", value: identity.reference(`Device/filling/${fdi}/${material}`) } : undefined,
    ].filter((value): value is { system: string; value: string } => Boolean(value));
    const properties = [
      product.shade ? { type: textConcept("restoration-shade"), valueCode: [textConcept(product.shade)] } : undefined,
    ].filter(Boolean) as NonNullable<Device["property"]>;
    out.push([`Device/filling/${fdi}/${material}`, {
      resourceType: "Device", status: "active", identifier: identifiers, ...udiCarrier(product.udi),
      type: coreConcept("fillingMaterial", material),
      patient: { reference: subjectReference(options, identity) },
      extension: [{ url: DENTAL_CORE_PROFILES["tooth-position"], valueCoding: coding(FDI_SYSTEM, fdi) }],
      ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
      ...(product.product ? { deviceName: [{ name: product.product, type: "model-name" }] } : {}),
      ...(product.lot ? { lotNumber: product.lot } : {}),
      ...(product.serial ? { serialNumber: product.serial } : {}),
      ...(product.expiry ? { expirationDate: product.expiry } : {}),
      ...(properties.length ? { property: properties } : {}),
    } as Device]);
  }
  return out;
}

function periImplantFinding(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Observation | undefined {
  const components: NonNullable<Observation["component"]> = [];
  if (record.periImplant && record.periImplant !== "none") components.push({ code: { coding: [coding(COMPONENT_SYSTEM, FINDING_CODES["peri-implant-status"])] }, valueCodeableConcept: coreConcept("periImplant", record.periImplant) });
  for (const [surface, value] of Object.entries(record.mpi ?? {})) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, "modified-plaque-index")] }, extension: [surfaceExtension(surface)], valueInteger: value });
  for (const [surface, value] of Object.entries(record.mbi ?? {})) components.push({ code: { coding: [coding(COMPONENT_SYSTEM, "modified-sulcus-bleeding-index")] }, extension: [surfaceExtension(surface)], valueInteger: value });
  if (!components.length) return undefined;
  return generated(DentalPeriImplantFindingProfile, {
    resourceType: "Observation", meta: { profile: profile("dental-peri-implant-finding") }, status: "final",
    code: { coding: [coding(LOINC_SYSTEM, "32910-2")] }, subject: { reference: subjectReference(options, identity) },
    effectiveDateTime: effective(payload, options), bodySite: bodySite(fdi),
    focus: [{ reference: identity.reference(`Device/implant/${fdi}`) }], component: components,
  } as Observation);
}

function recessionAssessment(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Observation | undefined {
  if (!record.millerClass || record.millerClass === "none") return undefined;
  return generated(DentalGingivalRecessionAssessmentProfile, {
    resourceType: "Observation", meta: { profile: profile("dental-gingival-recession-assessment") }, status: "final",
    code: { coding: [coding(COMPONENT_SYSTEM, "gingival-recession-classification")] },
    subject: { reference: subjectReference(options, identity) }, effectiveDateTime: effective(payload, options),
    bodySite: { ...bodySite(fdi), extension: [surfaceExtension("buccal")] },
    component: [{ code: { coding: [coding(COMPONENT_SYSTEM, "miller-recession-classification")] }, valueCodeableConcept: coreConcept("millerClass", record.millerClass) }],
    ...(plan ? { basedOn: [{ reference: identity.reference("CarePlan/plan") }] } : {}),
  } as Observation);
}

function clinicalProfileResources(record: ToothRecord, fdi: string, payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, plan = false): Array<[string, Resource]> {
  const resources: Array<[string, Resource]> = [];
  const state = toothState(record, fdi, payload, options, identity, plan);
  if (state) resources.push([`Observation/tooth-state/${plan ? "plan/" : ""}${fdi}`, state]);
  resources.push(...cariesFindings(record, fdi, payload, options, identity, plan));
  const periodontal = periodontalFinding(record, fdi, payload, options, identity, plan);
  if (periodontal) resources.push([`Observation/periodontal/${plan ? "plan/" : ""}${fdi}`, periodontal]);
  const recession = recessionAssessment(record, fdi, payload, options, identity, plan);
  if (recession) resources.push([`Observation/recession/${plan ? "plan/" : ""}${fdi}`, recession]);
  resources.push(...additionalFindings(record, fdi, payload, options, identity, plan));
  if (!plan) {
    const implant = implantDevice(record, fdi, options, identity);
    if (implant) resources.push([`Device/implant/${fdi}`, implant]);
    const werkstueck = restorationDevice(record, fdi, options, identity);
    if (werkstueck) resources.push([`Device/restoration/${fdi}`, werkstueck]);
    resources.push(...fillingDevices(record, fdi, options, identity));
    const periImplant = periImplantFinding(record, fdi, payload, options, identity);
    if (periImplant) resources.push([`Observation/peri-implant/${fdi}`, periImplant]);
  }
  return resources;
}

function plannedRequest(fdi: string, record: ToothRecord, options: FhirExportOptions, identity: DentalCoreIdentityResolver): ServiceRequest | undefined {
  if (!Object.keys(record).length) return undefined;
  return generated(DentalServiceRequestProfile, {
    resourceType: "ServiceRequest", meta: { profile: profile("dental-service-request") },
    status: "active", intent: "plan", basedOn: [{ reference: identity.reference("CarePlan/plan") }],
    code: { text: "Requested dental state change" }, subject: { reference: subjectReference(options, identity) },
    bodySite: [{ coding: [coding(FDI_SYSTEM, fdi)] }],
  });
}

function riskEvidence(payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Observation]> {
  const values = [
    ["cigarettes-per-day", payload.case?.cigarettesPerDay, "integer"],
    ["periodontitis-attributed-tooth-loss", payload.case?.toothLossPerio, "integer"],
    ["maximum-radiographic-bone-loss", payload.case?.maxRblPercent, "percent"],
  ] as const;
  return values.flatMap(([code, value, kind]) => typeof value !== "number" || !isDentalCoreRiskValue(code, value) ? [] : [[`Observation/risk/${code}`, generated(DentalRiskEvidenceProfile, {
    resourceType: "Observation" as const, meta: { profile: profile("dental-risk-evidence") }, status: "final" as const,
    code: { coding: [coding(COMPONENT_SYSTEM, code)] }, subject: { reference: subjectReference(options, identity) }, effectiveDateTime: effective(payload, options),
    ...(kind === "integer" ? { valueInteger: value } : { valueQuantity: { value, system: "http://unitsofmeasure.org", code: "%", unit: "%" } }),
  })] as [string, Observation]]);
}

function diagnosis(payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver): Array<[string, Resource]> {
  const selected = payload.case?.diagnosisOverride;
  if (!selected || !isDentalCoreDiagnosis(selected)) return [];
  const condition: Condition = { resourceType: "Condition", meta: { tag: [coding(VALUE_SYSTEM, selected)] }, clinicalStatus: { coding: [coding("http://terminology.hl7.org/CodeSystem/condition-clinical", "active")] }, verificationStatus: { coding: [coding("http://terminology.hl7.org/CodeSystem/condition-ver-status", "confirmed")] }, code: { text: selected }, subject: { reference: subjectReference(options, identity) }, recordedDate: effective(payload, options) };
  return [["Condition/periodontal-diagnosis", condition]];
}

function clinicalProvenance(payload: OdontogramExportPayload, options: FhirExportOptions, identity: DentalCoreIdentityResolver, target: string | undefined): Provenance | undefined {
  const clinician = payload.examination?.recorder;
  if (!target) {
    if (clinician) throw new UnsupportedDentalCoreContentError("examination.recorder");
    return undefined;
  }
  if (!clinician && !payload.case?.diagnosisOverride) return undefined;
  return generated(DentalClinicalProvenanceProfile, {
    resourceType: "Provenance", meta: { profile: profile("dental-clinical-provenance") },
    target: [{ reference: target }], recorded: provenanceInstant(payload, options),
    activity: { coding: [coding(PROVENANCE_SYSTEM, "clinician-selected")] },
    agent: [{ who: clinician ? { reference: clinician } : { display: "Unspecified clinician" } }],
  });
}

const provenanceInstant = (payload: OdontogramExportPayload, options: FhirExportOptions): string => {
  const value = effective(payload, options);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
};

function sharedResourceProvenance(payload: OdontogramExportPayload, options: FhirExportOptions): Array<[string, Provenance]> {
  return sharedReferenceFields.flatMap((field) => {
    const reference = sharedReference(options, field);
    if (!sharedFieldPopulated(payload, field) || !reference) return [];
    return [[`Provenance/shared/${field}`, generated(DentalClinicalProvenanceProfile, {
      resourceType: "Provenance", meta: { profile: profile("dental-clinical-provenance") },
      target: [{ reference }], recorded: provenanceInstant(payload, options),
      // Why the host resource rides in the bundle: workflow text, not a
      // tooth-state or chart-finding value, so it carries no coding.
      reason: [{ text: `shared-resource-${field}` }],
      agent: [{ who: { display: "Host system" } }],
    })]];
  });
}

function sharedResourceEntries(payload: OdontogramExportPayload, options: FhirExportOptions): BundleEntry[] {
  return sharedReferenceFields.flatMap((field) => {
    const entry = options.sharedResources?.[field];
    if (!sharedFieldPopulated(payload, field) || !entry) return [];
    return [{ ...(entry.fullUrl ? { fullUrl: entry.fullUrl } : {}), resource: structuredClone(entry.resource) }];
  });
}

export function buildDentalCoreBundle(payload: OdontogramExportPayload, options: FhirExportOptions = {}): Bundle {
  const source = payload && typeof payload === "object" ? payload : ({ version: "", teeth: {} } as OdontogramExportPayload);
  const safe: OdontogramExportPayload = {
    ...source,
    teeth: Object.fromEntries(Object.entries(source.teeth ?? {}).map(([fdi, record]) => [fdi, projectDentalCoreTooth(record)])),
    ...(source.plan
      ? { plan: Object.fromEntries(Object.entries(source.plan).map(([fdi, record]) => [fdi, projectDentalCoreTooth(record)])) }
      : {}),
  };
  const identity = new DentalCoreIdentityResolver(safe);
  assertDentalCoreComplete(safe, options, identity);
  const entries: BundleEntry[] = [];
  if (!options.subject) entries.push(identity.entry("Patient/subject", { resourceType: "Patient" }));
  for (const [fdi, record] of Object.entries(safe.teeth ?? {}).filter(([fdi]) => isOdontogramFdi(fdi))) {
    const chart = chartState(record, fdi, safe, options, identity, false);
    if (chart) entries.push(identity.entry(`Observation/chart/status/${fdi}`, chart));
    for (const [key, resource] of [...procedure(record, fdi, safe, options, identity), ...devices(record, fdi, options, identity), ...observedFindings(record, fdi, safe, options, identity)]) entries.push(identity.entry(key, resource));
    for (const [key, resource] of clinicalProfileResources(record, fdi, safe, options, identity)) entries.push(identity.entry(key, resource));
    for (const [key, resource] of requestedChanges(record, fdi, options, identity)) entries.push(identity.entry(key, resource));
  }
  if (safe.plan && Object.keys(safe.plan).length) {
    const activity = Object.entries(safe.plan)
      .filter(([fdi, record]) => isOdontogramFdi(fdi) && Object.keys(record).length > 0)
      .map(([fdi]) => ({ reference: { reference: identity.reference(`ServiceRequest/${fdi}`) } }));
    const goals = Object.entries(safe.plan).flatMap(([fdi, record]) => targetChartState(record, fdi, options, identity)
      ? [{ reference: identity.reference(`Goal/target/${fdi}`) }] : []);
    const plan: CarePlan = {
      resourceType: "CarePlan", status: "active", intent: "plan",
      subject: { reference: subjectReference(options, identity) },
      ...(activity.length ? { activity } : {}),
      ...(goals.length ? { goal: goals } : {}),
    };
    entries.push(identity.entry("CarePlan/plan", plan));
  }
  for (const [fdi, record] of Object.entries(safe.plan ?? {}).filter(([fdi]) => isOdontogramFdi(fdi))) {
    const chart = chartState(record, fdi, safe, options, identity, true);
    if (chart) entries.push(identity.entry(`Observation/chart/plan/${fdi}`, chart));
    const request = plannedRequest(fdi, record, options, identity);
    if (request) entries.push(identity.entry(`ServiceRequest/${fdi}`, request));
    const target = targetChartState(record, fdi, options, identity);
    if (target) entries.push(identity.entry(`Goal/target/${fdi}`, target));
    for (const [key, resource] of clinicalProfileResources(record, fdi, safe, options, identity, true)) entries.push(identity.entry(key, resource));
  }
  for (const [key, resource] of [...riskEvidence(safe, options, identity), ...diagnosis(safe, options, identity)]) entries.push(identity.entry(key, resource));
  const diagnosisReference = safe.case?.diagnosisOverride ? identity.reference("Condition/periodontal-diagnosis") : undefined;
  const fallbackEntry = entries.find((entry) => entry.resource?.resourceType !== "Patient");
  const fallbackTarget = fallbackEntry?.fullUrl
    ?? (fallbackEntry?.resource?.id ? `${fallbackEntry.resource.resourceType}/${fallbackEntry.resource.id}` : undefined);
  const provenance = clinicalProvenance(safe, options, identity, diagnosisReference ?? fallbackTarget);
  if (provenance) entries.push(identity.entry("Provenance/clinical", provenance));
  entries.push(...sharedResourceEntries(safe, options));
  for (const [key, resource] of sharedResourceProvenance(safe, options)) entries.push(identity.entry(key, resource));
  return { resourceType: "Bundle", type: "collection", identifier: { system: DENTAL_CORE, value: DENTAL_CORE_BUNDLE_IDENTIFIER }, entry: entries };
}
