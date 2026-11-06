#!/usr/bin/env bun
// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// Bead odontogram-wt5: emit representative OBSERVED and PLANNED Dental Core
// collections to a caller-owned directory for the HL7 validator.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAYLOAD_VERSION } from "../src/document";
import { buildDentalCoreBundle } from "../src/fhir/toFhirDentalCore";
import type { OdontogramExportPayload } from "../src/fhir/types";

const options = { subject: "Patient/example", effectiveDateTime: "2026-08-14T17:00:31Z" };

function observed(): OdontogramExportPayload {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      // Dental Core 0.9.0 carriers written since cognovis/odontogram#35:
      // pulp/apical diagnosis and radiographic depth profiles, ICDAS severity
      // and lesion-activity components, coded mobility/furcation, the tooth
      // note, per-canal states, the telescopic crown type and the UDI carrier.
      "16": {
        caries: ["caries-occlusal"],
        cariesSeverity: { occlusal: 5 },
        pulpDx: "necrosis",
        apicalDx: "acute-apical-abscess",
        radiographicDepth: { occlusal: "D2" },
        rootCaries: "arrested",
        mobility: "m2",
        calculus: true,
        furcation: { mesial: 2 },
        endoCanals: { mesiobuccal: ["filling", "post"] },
        note: "Review occlusal surface",
      },
      "26": { restorationType: "crown", restorationMaterial: "zircon" },
      "27": { restorationType: "crown", restorationMaterial: "telescope" },
      "36": { endo: "endo-filling", fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" } },
      "46": {
        toothSelection: "implant",
        periImplant: "mucositis",
        implantProduct: { manufacturer: "Example", diameterMm: 4.1, lengthMm: 10, udi: "(01)07612345678901(10)LOT4711" },
      },
    },
  };
}

function planned(): OdontogramExportPayload {
  return {
    ...observed(),
    plan: { "36": { restorationType: "crown", restorationMaterial: "zircon" } },
  };
}

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error("Usage: bun tools/emit-hl7-validator-fixtures.ts <private-output-directory>");
const observedPath = join(outputDirectory, "observed-dental-core.json");
const plannedPath = join(outputDirectory, "planned-dental-core.json");
writeFileSync(observedPath, JSON.stringify(buildDentalCoreBundle(observed(), options), null, 2), { flag: "wx", mode: 0o600 });
writeFileSync(plannedPath, JSON.stringify(buildDentalCoreBundle(planned(), options), null, 2), { flag: "wx", mode: 0o600 });
process.stdout.write(`${observedPath}\n${plannedPath}\n`);
