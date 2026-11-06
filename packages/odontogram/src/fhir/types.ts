// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import type { Bundle, Observation, Patient, Condition, CodeableConcept, Coding, Resource } from "fhir/r4";

export type { Bundle, Observation, Patient, Condition, CodeableConcept, Coding };
export type {
  ToothRecord,
  OdontogramExportPayload,
  ExaminationContextRecord,
  ExaminationSnapshotRecord,
  OdontogramDocument,
  DentalCoreIdentity,
  DentalCoreResourceIdentity,
} from "../document";
export { PAYLOAD_VERSION } from "../document";

/** Options for the internal Dental Core mapping (`buildDentalCoreBundle`). */
export interface FhirExportOptions {
  subject?: string;
  effectiveDateTime?: string;
  /** Host-owned patient-record resources carried and referenced, but never created by this codec. */
  sharedResources?: {
    diabetesStatus?: { resource: Resource; fullUrl?: string };
    hba1c?: { resource: Resource; fullUrl?: string };
    smokingStatus?: { resource: Resource; fullUrl?: string };
    edentulous?: { resource: Resource; fullUrl?: string };
  };
}
