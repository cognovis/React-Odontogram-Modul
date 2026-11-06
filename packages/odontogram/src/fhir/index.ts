// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Internal Dental Core mapping. Not a package export: hosts talk to Aidbox
// through session.loadFromAidbox / session.saveToAidbox with an injected
// gateway, never a JSON bundle.

export {
  buildDentalCoreBundle,
  MissingDentalCoreEffectiveDateError,
  UnsupportedDentalCoreContentError,
} from "./toFhirDentalCore";
export { parseDentalCoreBundle } from "./fromFhirDentalCore";
export {
  DENTAL_CORE,
  DENTAL_CORE_BUNDLE_IDENTIFIER,
  DENTAL_CORE_PACKAGE_VERSION,
  DENTAL_CORE_PROFILES,
  PROPERTY_SYSTEM,
  VALUE_SYSTEM,
  COMPONENT_SYSTEM,
  PROVENANCE_SYSTEM,
  FDI_SYSTEM,
} from "./dentalCoreContract";
export type {
  FhirExportOptions,
  OdontogramExportPayload,
  ToothRecord,
} from "./types";
