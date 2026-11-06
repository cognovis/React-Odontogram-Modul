// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul

import { SYSTEM_LOINC_ORG as LOINC_SYSTEM } from "@cognovis/fhir-sdk/terminology";

/**
 * The host-owned smoking Observation (LOINC 72166-2) is read and checked only
 * through its LOINC answer list (LL2201-3). Smoking status is patient-level
 * context outside Dental Core terminology, and no other answer coding is read
 * (cognovis/odontogram#35).
 */
type SmokingStatusValue = "never" | "former" | "current";

const SMOKING_ANSWER_CODES: ReadonlyMap<string, SmokingStatusValue> = new Map([
  ["LA18978-9", "never"],
  ["LA15920-4", "former"],
  ["LA18976-3", "current"],
  ["LA18977-1", "current"],
  ["LA18981-3", "current"],
  ["LA18982-1", "current"],
]);

/** Resolve the smoking answer without consulting display text; contradicting answers resolve to nothing. */
export function resolveSmokingStatus(concept: unknown): SmokingStatusValue | undefined {
  const coding = (concept as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding;
  if (!Array.isArray(coding)) return undefined;
  let resolved: SmokingStatusValue | undefined;
  for (const item of coding) {
    const value = item?.system === LOINC_SYSTEM && typeof item.code === "string"
      ? SMOKING_ANSWER_CODES.get(item.code)
      : undefined;
    if (!value) continue;
    if (resolved && resolved !== value) return undefined;
    resolved = value;
  }
  return resolved;
}
