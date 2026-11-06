import type { ToothRecord } from "../document";
import { DENTAL_CORE_PACKAGE } from "@cognovis/fhir-sdk/dental-core";
import {
  DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS,
  DE_COGNOVIS_FHIR_DENTAL_CORE_PACKAGE,
  DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES,
} from "@cognovis/fhir-sdk/canonicals";
import {
  DENTAL_CORE_CODES,
  SYSTEM_DENTAL_CORE_CARIES_LESION_ACTIVITY,
  SYSTEM_DENTAL_CORE_DENTAL_CHART_PROPERTY,
  SYSTEM_DENTAL_CORE_DENTAL_CHART_VALUE,
  SYSTEM_DENTAL_CORE_DENTAL_COMPONENT,
  SYSTEM_DENTAL_CORE_DENTAL_PROVENANCE_ACTIVITY,
  SYSTEM_DENTAL_CORE_TOOTH_POSITION_FDI,
  SYSTEM_LOINC_ORG,
  SYSTEM_SCT,
} from "@cognovis/fhir-sdk/terminology";
import { isFdiTooth } from "../utils/numbering";
import { dentalCoreCodes, resolveDentalCoreCode, type DentalCoreCoding } from "../registry/valueCatalog";

export const DENTAL_CORE = DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES.DentalChartState.replace(
  /\/StructureDefinition\/dental-chart-state$/,
  "",
);
export const DENTAL_CORE_PACKAGE_VERSION = DENTAL_CORE_PACKAGE.version;
export const DENTAL_CORE_PACKAGE_ID = DENTAL_CORE_PACKAGE.id;
export const DENTAL_CORE_CANONICAL_PACKAGE_VERSION = DE_COGNOVIS_FHIR_DENTAL_CORE_PACKAGE.version;
export const DENTAL_CORE_BUNDLE_IDENTIFIER = `odontogram-dental-core-${DENTAL_CORE_PACKAGE_VERSION}`;

function kebabFromSdkName(name: string): string {
  return name.replace(/Ext$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export const DENTAL_CORE_PROFILES = {
  ...Object.fromEntries(
    Object.entries(DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES).map(([name, url]) => [kebabFromSdkName(name), url]),
  ),
  ...Object.fromEntries(
    Object.entries(DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS).map(([name, url]) => [kebabFromSdkName(name), url]),
  ),
} as Record<string, string>;

export const PROPERTY_SYSTEM = SYSTEM_DENTAL_CORE_DENTAL_CHART_PROPERTY;
export const VALUE_SYSTEM = SYSTEM_DENTAL_CORE_DENTAL_CHART_VALUE;
export const COMPONENT_SYSTEM = SYSTEM_DENTAL_CORE_DENTAL_COMPONENT;
export const PROVENANCE_SYSTEM = SYSTEM_DENTAL_CORE_DENTAL_PROVENANCE_ACTIVITY;
export const FDI_SYSTEM = SYSTEM_DENTAL_CORE_TOOTH_POSITION_FDI;
export const LESION_ACTIVITY_SYSTEM = SYSTEM_DENTAL_CORE_CARIES_LESION_ACTIVITY;
export const SNOMED_SYSTEM = SYSTEM_SCT;
export const LOINC_SYSTEM = SYSTEM_LOINC_ORG;

/**
 * A coding the odontogram writes. A code in a Dental Core CodeSystem the SDK
 * enumerates must be one of its concepts; a typo throws instead of shipping.
 */
export function coding(system: string, code: string): { system: string; code: string } {
  const listed = DENTAL_CORE_CODES[system];
  if (listed && !listed.includes(code)) throw new Error(`${code} is not a concept of Dental Core ${system}`);
  return { system, code };
}

/**
 * Dental Core codes the odontogram writes beyond the catalog values
 * (the coverage record's `additionalWrittenTokens`), each resolved against its
 * ValueSet in the pinned SDK at module load.
 */
export const DIRECT_FILLING = resolveDentalCoreCode("restoration-type", "direct-filling");
export const CROWN_LEAKAGE = resolveDentalCoreCode("restoration-status", "crown-leakage");
/** Bead odontogram-d1b / fhir-dental-core fdc-w9z: a cervical-involvement
 *  finding WITHOUT a tooth surface is "cervical, side not recorded" and names
 *  what reaches the neck. Dental Core's ValueSet cervical-involvement-kind
 *  holds exactly these two dental-chart-value codes; until the SDK carries it,
 *  they resolve through the ValueSets they already belong to. */
export const CERVICAL_KIND_CODES: Readonly<Record<"filling" | "caries", DentalCoreCoding>> = {
  filling: DIRECT_FILLING,
  caries: resolveDentalCoreCode("caries-finding", "caries"),
};
/** Per-canal endodontic states (`endoCanals`) -> root-endodontic-state. */
export const CANAL_STATE_CODES: Readonly<Record<string, string>> = Object.fromEntries(Object.entries({
  filling: "root-canal-filling", post: "root-post", incomplete: "incomplete-root-canal-filling", temporary: "intracanal-medicament",
}).map(([state, code]) => [state, resolveDentalCoreCode("root-endodontic-state", code).code]));
/** Glickman grade 1-4 -> furcation-grade. */
export const FURCATION_GRADE_CODES: Readonly<Record<number, string>> = Object.fromEntries([1, 2, 3, 4]
  .map((grade) => [grade, resolveDentalCoreCode("furcation-grade", `furcation-grade-${grade}`).code]));
/** ICDAS 0-6 -> icdas-caries-severity. */
export const CARIES_SEVERITY_SYSTEM = resolveDentalCoreCode("icdas-caries-severity", "0").system;
export const CARIES_SEVERITY_CODES: Readonly<Record<number, string>> = Object.fromEntries([0, 1, 2, 3, 4, 5, 6]
  .map((score) => [score, resolveDentalCoreCode("icdas-caries-severity", String(score)).code]));
/** Finding and component codes of `dental-finding-code`. */
export const FINDING_CODES = Object.freeze(Object.fromEntries(([
  "pulp-diagnosis", "apical-diagnosis", "radiographic-caries-depth", "cervical-involvement",
  "tooth-mobility", "calculus", "peri-implant-status", "caries-severity",
] as const).map((code) => [code, resolveDentalCoreCode("dental-finding-code", code).code]))) as Readonly<Record<
  "pulp-diagnosis" | "apical-diagnosis" | "radiographic-caries-depth" | "cervical-involvement"
  | "tooth-mobility" | "calculus" | "peri-implant-status" | "caries-severity", string>>;
export const LESION_ACTIVITY = {
  active: coding(LESION_ACTIVITY_SYSTEM, "active").code,
  arrested: coding(LESION_ACTIVITY_SYSTEM, "arrested").code,
} as const;
export const MILLER_SYSTEM = resolveDentalCoreCode("miller-gingival-recession-1985", "I").system;

/**
 * Dental Core 0.8.0 `dental-tooth-order`: the SNOMED CT concepts a
 * DentalServiceRequest uses for a tooth-level order, and the extension that
 * says whether a fitting renews an existing restoration. The odontogram has a
 * field for two of the four orders (extraction, crown fitting).
 */
export const TOOTH_ORDER_SNOMED = {
  extraction: "55162003",
  crownFitting: "426222000",
} as const;
export const RESTORATION_RENEWAL_URL = DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS.RestorationRenewalExt;

export type ToothOrderField = "extractionPlan" | "crownReplace" | "crownNeeded";
export const TOOTH_ORDER_FIELDS: readonly ToothOrderField[] = ["extractionPlan", "crownReplace", "crownNeeded"];

export const isOdontogramFdi = (value: string): boolean => isFdiTooth(value);

export const isDentalCoreDiagnosis = (value: string): boolean =>
  ["health", "gingivitis", "periodontitis"].includes(value);

export function isDentalCoreRiskValue(code: string, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (code === "cigarettes-per-day") return Number.isInteger(value) && value >= 0 && value <= 99;
  if (code === "periodontitis-attributed-tooth-loss") return Number.isInteger(value) && value >= 0 && value <= 32;
  if (code === "maximum-radiographic-bone-loss") return value >= 0 && value <= 100;
  return false;
}

type SupportedField = keyof ToothRecord;
export interface ChartMapping {
  field: SupportedField;
  property: string;
  kind: "boolean" | "enum" | "set";
  defaultValue?: string;
  omitDefault?: boolean;
  values?: Record<string, string>;
}

/** Validate a chart property against `dental-chart-property`. */
const property = (code: string): string => resolveDentalCoreCode("dental-chart-property", code).code;
/** The catalog's Dental Core codes for a value group. */
const codes = (group: string): Record<string, string> => dentalCoreCodes(group);

export const CHART_MAPPINGS: readonly ChartMapping[] = [
  { field: "endoResection", property: property("apicoectomy-performed"), kind: "boolean" },
  { field: "mods", property: property("legacy-tooth-modifier"), kind: "set", values: codes("mods") },
  { field: "periapicalType", property: property("periapical-lesion-type"), kind: "enum", defaultValue: "none", values: codes("periapicalType") },
  { field: "fissureSealing", property: property("fissure-sealant-state"), kind: "boolean" },
  { field: "contactMesial", property: property("mesial-contact-defect"), kind: "boolean" },
  { field: "contactDistal", property: property("distal-contact-defect"), kind: "boolean" },
  { field: "wearEdge", property: property("incisal-occlusal-wear-type"), kind: "enum", defaultValue: "none", values: codes("wearEdge") },
  { field: "wearCervical", property: property("cervical-wear-type"), kind: "enum", defaultValue: "none", values: codes("wearCervical") },
  { field: "discoloration", property: property("tooth-discoloration-type"), kind: "enum", defaultValue: "none", values: codes("discoloration") },
  { field: "cejVisibility", property: property("cej-identifiability"), kind: "enum", defaultValue: "none", values: codes("cejVisibility") },
  { field: "rootConcavity", property: property("root-concavity-category"), kind: "enum", defaultValue: "none", values: codes("rootConcavity") },
  { field: "gingivalThickness", property: property("unqualified-gingival-phenotype"), kind: "enum", defaultValue: "unknown", values: codes("gingivalThickness") },
  { field: "orthoAppliance", property: property("orthodontic-appliance-type"), kind: "enum", defaultValue: "none", values: codes("orthoAppliance") },
  { field: "orthoDrift", property: property("horizontal-tooth-displacement"), kind: "enum", defaultValue: "none", values: codes("orthoDrift") },
  { field: "orthoVertical", property: property("vertical-tooth-displacement"), kind: "enum", defaultValue: "none", values: codes("orthoVertical") },
  { field: "orthoRotation", property: property("tooth-rotation-present"), kind: "boolean" },
  { field: "brokenMesial", property: property("mesial-tooth-fracture-present"), kind: "boolean" },
  { field: "brokenIncisal", property: property("incisal-tooth-fracture-present"), kind: "boolean" },
  { field: "brokenDistal", property: property("distal-tooth-fracture-present"), kind: "boolean" },
  { field: "extractionWound", property: property("extraction-wound-present"), kind: "boolean" },
  { field: "parapulpalPin", property: property("parapulpal-pin-present"), kind: "boolean" },
  { field: "missingClosed", property: property("edentulous-space-closed"), kind: "boolean" },
  { field: "bridgePillar", property: property("bridge-abutment-role"), kind: "boolean" },
  { field: "pulpLatin", property: property("legacy-latin-pulp-diagnosis"), kind: "enum", defaultValue: "none", values: codes("pulpLatin") },
  { field: "resorptionType", property: property("root-resorption-type"), kind: "enum", defaultValue: "none", values: codes("resorptionType") },
  { field: "retention", property: property("prosthesis-retention-element"), kind: "enum", defaultValue: "none", values: codes("retention") },
  { field: "retentionSide", property: property("retention-engaged-side"), kind: "enum", defaultValue: "none", values: codes("retentionSide") },
  { field: "sensibility", property: property("pulp-sensibility-test"), kind: "enum", defaultValue: "none", omitDefault: true, values: codes("sensibility") },
  { field: "percussion", property: property("percussion-test"), kind: "enum", defaultValue: "none", omitDefault: true, values: codes("percussion") },
  { field: "eruptionStage", property: property("tooth-eruption-stage"), kind: "enum", defaultValue: "none", omitDefault: true, values: codes("eruptionStage") },
  { field: "rootFracture", property: property("root-fracture"), kind: "enum", defaultValue: "none", omitDefault: true, values: codes("rootFracture") },
  { field: "rootPostType", property: property("root-post-type"), kind: "enum", defaultValue: "none", omitDefault: true, values: codes("rootPostType") },
] as const;

export const mappingsByProperty = new Map<string, ChartMapping[]>();
for (const mapping of CHART_MAPPINGS) {
  const mappings = mappingsByProperty.get(mapping.property) ?? [];
  mappings.push(mapping);
  mappingsByProperty.set(mapping.property, mappings);
}

const mappedValueCodes = new Set<string>(
  CHART_MAPPINGS.flatMap((mapping) => Object.values(mapping.values ?? {})),
);

export function isMappedChartProperty(code: string): boolean {
  return mappingsByProperty.has(code);
}

export function isMappedChartValue(code: string): boolean {
  return mappedValueCodes.has(code);
}

const ADMITTED_CORE_PROFILES = new Set<string>([
  DENTAL_CORE_PROFILES["dental-apical-diagnosis"],
  DENTAL_CORE_PROFILES["dental-caries-finding"],
  DENTAL_CORE_PROFILES["dental-chart-state"],
  DENTAL_CORE_PROFILES["dental-clinical-provenance"],
  DENTAL_CORE_PROFILES["dental-device"],
  DENTAL_CORE_PROFILES["dental-finding"],
  DENTAL_CORE_PROFILES["dental-gingival-recession-assessment"],
  DENTAL_CORE_PROFILES["dental-implant"],
  DENTAL_CORE_PROFILES["dental-peri-implant-finding"],
  DENTAL_CORE_PROFILES["dental-periodontal-finding"],
  DENTAL_CORE_PROFILES["dental-procedure"],
  DENTAL_CORE_PROFILES["dental-pulp-diagnosis"],
  DENTAL_CORE_PROFILES["dental-radiographic-caries-depth"],
  DENTAL_CORE_PROFILES["dental-risk-evidence"],
  DENTAL_CORE_PROFILES["dental-service-request"],
  DENTAL_CORE_PROFILES["dental-target-chart-state"],
  DENTAL_CORE_PROFILES["dental-tooth-state"],
]);

type Concept = { coding?: Array<{ system?: string; code?: string }>; text?: string };

/**
 * The `Device.type.text` of every `dental-device` this odontogram writes, and
 * the only ones it reads back. A conformant `dental-device` of any other type —
 * a prosthesis a practice system stores, say — is reported, not offered to the
 * codec, which would refuse the whole chart over it (cognovis/odontogram#28).
 */
const MAPPED_DEVICE_TYPES = new Set<string>([
  "Orthodontic bracket",
  "Orthodontic band",
  "Parapulpal pin",
  "Bridge abutment",
  "Prosthesis retention clasp",
  "Prosthesis retention attachment",
  "Prosthesis retention bar-abutment",
]);

const codeAt = (
  concept: Concept | undefined,
  system: string,
): string | undefined => concept?.coding?.find((coding) => coding.system === system)?.code;

/**
 * Which odontogram field a tooth-level order carries, or `undefined` when it
 * carries none.
 *
 * Dental Core 0.8.0 carriers: SNOMED CT 55162003 without a renewal flag is
 * `extractionPlan`; SNOMED CT 426222000 with exactly one boolean
 * `restoration-renewal` is `crownReplace` (true) or `crownNeeded` (false). A
 * crown fitting without the flag asserts neither, so it maps to nothing. No
 * other order code is read (cognovis/odontogram#35).
 */
export function toothOrderField(resource: object): ToothOrderField | undefined {
  const { code: rawCode, extension } = resource as { code?: unknown; extension?: unknown };
  const code = rawCode as Concept | undefined;
  const extensions = Array.isArray(extension) ? extension as Array<{ url?: unknown; valueBoolean?: unknown }> : [];
  const renewals = extensions.filter((extension) => extension?.url === RESTORATION_RENEWAL_URL);
  const snomed = codeAt(code, SNOMED_SYSTEM);
  if (snomed === TOOTH_ORDER_SNOMED.extraction) return renewals.length === 0 ? "extractionPlan" : undefined;
  if (snomed === TOOTH_ORDER_SNOMED.crownFitting && renewals.length === 1 && typeof renewals[0].valueBoolean === "boolean") {
    return renewals[0].valueBoolean ? "crownReplace" : "crownNeeded";
  }
  return undefined;
}

/**
 * Code systems this odontogram reads in an Observation's `code`, `value[x]`
 * and component codes and values. A coded element with codings, none of them
 * from one of these systems, is another issuer's dialect.
 */
const READ_SYSTEMS = new Set<string>([
  PROPERTY_SYSTEM,
  VALUE_SYSTEM,
  COMPONENT_SYSTEM,
  FDI_SYSTEM,
  LESION_ACTIVITY_SYSTEM,
  CARIES_SEVERITY_SYSTEM,
  MILLER_SYSTEM,
  LOINC_SYSTEM,
  SNOMED_SYSTEM,
]);

function foreignSystem(concept: unknown): string | undefined {
  const coding = (concept as Concept | undefined)?.coding;
  if (!Array.isArray(coding) || coding.length === 0) return undefined;
  if (coding.some((item) => typeof item?.system === "string" && READ_SYSTEMS.has(item.system))) return undefined;
  const system = coding.find((item) => typeof item?.system === "string")?.system;
  return system ?? "(no system)";
}

const hasCoding = (concept: unknown): boolean => {
  const coding = (concept as Concept | undefined)?.coding;
  return Array.isArray(coding) && coding.length > 0;
};

type OpenElement = "code" | "value" | "component";

/**
 * Where each admitted Observation profile leaves the terminology OPEN in
 * Dental Core 0.9.0 — an extensible binding or an open component slicing. Only
 * there is a code outside the odontogram's systems another issuer's dialect;
 * everywhere else the element is fixed or bound as required, so a foreign code
 * is a conformance breach and is left to the codec to refuse.
 */
const OPEN_ELEMENTS = new Map<string, ReadonlySet<OpenElement>>([
  [DENTAL_CORE_PROFILES["dental-finding"], new Set<OpenElement>(["code", "value", "component"])],
  [DENTAL_CORE_PROFILES["dental-periodontal-finding"], new Set<OpenElement>(["code", "component"])],
  [DENTAL_CORE_PROFILES["dental-peri-implant-finding"], new Set<OpenElement>(["code", "component"])],
  [DENTAL_CORE_PROFILES["dental-tooth-state"], new Set<OpenElement>(["component"])],
  [DENTAL_CORE_PROFILES["dental-caries-finding"], new Set<OpenElement>(["value"])],
]);

/**
 * Why a Dental Core Observation is written in a dialect this odontogram does
 * not read. The codec reads an Observation by its coded `code` (findings) or
 * by its components (tooth state, periodontal, peri-implant, recession, chart
 * state), so one with an open code that offers neither carries nothing to
 * chart; and an open code, value or component coded exclusively in a system
 * outside {@link READ_SYSTEMS} belongs to another issuer's terminology.
 */
function foreignObservationReason(
  resource: { code?: unknown; valueCodeableConcept?: unknown; component?: unknown },
  open: ReadonlySet<OpenElement>,
): string | undefined {
  const components = Array.isArray(resource.component) ? resource.component : [];
  if (open.has("code") && !hasCoding(resource.code) && components.length === 0) {
    return "The Observation has a text-only code and no components, which is outside this odontogram's mappings";
  }
  const located: Array<[string, unknown]> = [];
  if (open.has("code")) located.push(["code", resource.code]);
  if (open.has("value")) located.push(["value", resource.valueCodeableConcept]);
  if (open.has("component")) {
    for (const component of components) {
      const item = component as { code?: unknown; valueCodeableConcept?: unknown } | null;
      if (!item || typeof item !== "object") continue;
      located.push(["component code", item.code], ["component value", item.valueCodeableConcept]);
    }
  }
  for (const [where, concept] of located) {
    const system = foreignSystem(concept);
    if (system) return `The ${where} is coded in ${system}, which is outside this odontogram's mappings`;
  }
  return undefined;
}

/**
 * A Dental Core resource whose profile, dialect, or chart property/value codes
 * sit outside this odontogram's mappings. Live load lists those as unsupported
 * instead of rejecting the rest of the collection. It answers only for a
 * resource that CONFORMS to its profile: the live-load partition asks
 * `dentalCoreConformanceError` first and hands a broken resource to the
 * all-or-nothing codec instead. Everything this returns `undefined` for meets
 * the codec too.
 */
export function unmappedDentalCoreReason(resource: {
  resourceType?: unknown;
  meta?: { profile?: unknown };
  component?: unknown;
  code?: Concept;
  valueCodeableConcept?: unknown;
  intent?: unknown;
  extension?: unknown;
  type?: Concept;
  status?: unknown;
}): string | undefined {
  const profiles = Array.isArray(resource.meta?.profile)
    ? resource.meta.profile.filter((value): value is string => typeof value === "string")
    : [];
  const coreProfiles = profiles.filter((profile) => Object.values(DENTAL_CORE_PROFILES).includes(profile));
  if (!coreProfiles.length) return undefined;
  if (!coreProfiles.some((profile) => ADMITTED_CORE_PROFILES.has(profile))) {
    return `Dental Core profile ${coreProfiles[0]} is outside this odontogram's mappings`;
  }
  if (resource.resourceType === "ServiceRequest" && resource.intent === "order") {
    if (toothOrderField(resource)) return undefined;
    const coded = resource.code?.coding?.find((coding) => typeof coding?.code === "string");
    const label = coded ? `${coded.system ?? "(no system)"}#${coded.code}` : "carrying only text";
    return `The tooth-level order ${label} is outside this odontogram's mappings`;
  }
  // A patient keeps the Devices no longer in the mouth (an explanted implant),
  // and the codec charts only an active one (cognovis/odontogram#28).
  if (resource.resourceType === "Device" && resource.status !== "active") {
    return `A Device with status ${JSON.stringify(resource.status ?? "(none)")} is not part of the current chart`;
  }
  if (resource.resourceType === "Device"
    && coreProfiles.includes(DENTAL_CORE_PROFILES["dental-device"])
    && !coreProfiles.includes(DENTAL_CORE_PROFILES["dental-implant"])
    && !MAPPED_DEVICE_TYPES.has(resource.type?.text ?? "")) {
    return `The device type ${JSON.stringify(resource.type?.text ?? "(no text)")} is outside this odontogram's mappings`;
  }
  if (resource.resourceType !== "Observation") return undefined;
  const open = new Set<OpenElement>(coreProfiles.flatMap((profile) => [...(OPEN_ELEMENTS.get(profile) ?? [])]));
  const foreign = foreignObservationReason(resource, open);
  if (foreign) return foreign;
  if (coreProfiles.includes(DENTAL_CORE_PROFILES["dental-chart-state"])) {
    const components = Array.isArray(resource.component) ? resource.component : [];
    for (const component of components) {
      if (!component || typeof component !== "object") continue;
      const item = component as {
        code?: { coding?: Array<{ system?: string; code?: string }> };
        valueCodeableConcept?: { coding?: Array<{ system?: string; code?: string }> };
      };
      const property = codeAt(item.code, PROPERTY_SYSTEM);
      if (property && !isMappedChartProperty(property)) {
        return `Chart property ${property} is outside this odontogram's mappings`;
      }
      const coded = codeAt(item.valueCodeableConcept, VALUE_SYSTEM);
      if (property && coded) {
        const mappingValues = (mappingsByProperty.get(property) ?? []).flatMap((mapping) => Object.values(mapping.values ?? {}));
        if (mappingValues.length && !mappingValues.includes(coded)) {
          return `Chart value ${coded} is outside this odontogram's mappings`;
        }
      }
    }
  }
  if (coreProfiles.includes(DENTAL_CORE_PROFILES["dental-finding"])) {
    const property = codeAt(resource.code, PROPERTY_SYSTEM);
    if (property && !isMappedChartProperty(property)) {
      return `Finding property ${property} is outside this odontogram's mappings`;
    }
    if (!property && codeAt(resource.code, COMPONENT_SYSTEM) !== FINDING_CODES["cervical-involvement"]) {
      return "The finding code carries no chart property, which is outside this odontogram's mappings";
    }
  }
  return undefined;
}

/** Split the former combined endodontic post values into two orthogonal axes. */
export function normalizeLegacyRootPost(record: ToothRecord): ToothRecord {
  if (record.endo !== "endo-glass-pin" && record.endo !== "endo-metal-pin") return record;
  const inferredPost = record.endo === "endo-glass-pin" ? "glass-fiber" : "metal";
  return {
    ...record,
    endo: "endo-filling",
    rootPostType: record.rootPostType && record.rootPostType !== "none"
      ? record.rootPostType
      : inferredPost,
  };
}
