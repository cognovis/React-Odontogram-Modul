import { PAYLOAD_VERSION } from "../document";
import { describe, expect, it, vi } from "vitest";
import {
  buildDentalCoreBundle,
  MissingDentalCoreEffectiveDateError,
  parseDentalCoreBundle,
  UnsupportedDentalCoreContentError,
  DENTAL_CORE_PACKAGE_VERSION as PUBLIC_DENTAL_CORE_PACKAGE_VERSION,
  DENTAL_CORE_PROFILES as PUBLIC_DENTAL_CORE_PROFILES,
} from "../fhir";
import {
  CHART_MAPPINGS,
  DENTAL_CORE,
  DENTAL_CORE_BUNDLE_IDENTIFIER,
  DENTAL_CORE_PACKAGE_VERSION,
  DENTAL_CORE_PROFILES,
  PROPERTY_SYSTEM,
  VALUE_SYSTEM,
} from "../fhir/dentalCoreContract";
import {
  DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS,
  DE_COGNOVIS_FHIR_DENTAL_CORE_PACKAGE,
  DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES,
} from "@cognovis/fhir-sdk/canonicals";
import { DENTAL_CORE_PACKAGE, RecordedApicalFindingExtProfile } from "@cognovis/fhir-sdk/dental-core";
import type { OdontogramExportPayload, ToothRecord } from "../fhir/types";
import { createOdontogramSession } from "../index";
import { __importStatusForTest, __resetChartStateForTest, __setToothStateForTest, getStatusChart } from "../odontogram";

const options = { subject: "Patient/example", effectiveDateTime: "2026-08-14T17:00:31Z" };

function importDentalCore(session: ReturnType<typeof createOdontogramSession>, bundle: unknown): boolean {
  const parsed = parseDentalCoreBundle(bundle);
  if (!parsed) return false;
  session.setDocument(parsed);
  return true;
}

function exportDentalCore(session: ReturnType<typeof createOdontogramSession>) {
  return buildDentalCoreBundle(session.getDocument(), options);
}

function fixture(): OdontogramExportPayload {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      "16": {
        endoResection: true,
        mods: ["inflammation", "mobility"],
        periapicalType: "cyst",
        fissureSealing: true,
        wearEdge: "attrition",
        discoloration: "fluorosis",
        orthoAppliance: "bracket",
        orthoRotation: true,
        parapulpalPin: true,
        retention: "attachment",
        retentionSide: "both",
      },
    },
    plan: { "16": { rootConcavity: "deep" } },
    case: { cigarettesPerDay: 12, toothLossPerio: 2, maxRblPercent: 24, diagnosisOverride: "periodontitis" },
  };
}

function clinicalFixture(): OdontogramExportPayload {
  return {
    version: PAYLOAD_VERSION,
    globals: { wisdomVisible: true, showBase: true, occlusalVisible: true, showHealthyPulp: true },
    teeth: {
      "16": {
        caries: ["caries-occlusal", "caries-mesial"],
        cariesSeverity: { occlusal: 5, mesial: 2 },
        rootCaries: "active",
        fillingSurfaces: ["distal", "buccal"],
        fillingSurfaceMaterials: { distal: "composite", buccal: "gic" },
        pulpDx: "necrosis",
        apicalDx: "acute-apical-abscess",
        radiographicDepth: { distal: "D2" },
        cervicalSurfaces: ["buccal"],
        note: "Monitor distal restoration",
      },
      "15": {
        toothSelection: "implant",
        periImplant: "peri-implantitis-moderate",
        mpi: { buccal: 2 },
        mbi: { mesial: 3 },
        millerClass: "ii",
        implantProduct: {
          manufacturer: "Example Implants",
          system: "Example Line",
          diameterMm: 4.1,
          lengthMm: 10,
          udi: "(01)07612345678901(17)300630(10)LOT4711",
          deviceIdentifier: "07612345678901",
          lot: "LOT4711",
          serial: "SERIAL-15",
          expiry: "2030-06-30",
        },
      },
      "17": { toothSelection: "none", extractionPlan: true },
      "26": { restorationType: "crown", restorationMaterial: "zircon", crownReplace: true },
      "36": { endo: "endo-filling", crownNeeded: true },
      "46": {
        mobility: "m2",
        perio: { pd: { MB: 5, B: 4 }, gm: { MB: 1, B: 0 }, bop: ["MB"], sup: [] },
      },
    },
  };
}

describe("Dental Core SDK contract", () => {
  it("keeps required complex-extension constructors required and validated", () => {
    expect(RecordedApicalFindingExtProfile.create({ description: "normal", root: "palatal" }).toResource()).toMatchObject({
      url: `${DENTAL_CORE}/StructureDefinition/recorded-apical-finding`,
      extension: expect.arrayContaining([{ url: "description", valueString: "normal" }]),
    });
    expect(() => RecordedApicalFindingExtProfile.from({ url: `${DENTAL_CORE}/StructureDefinition/recorded-apical-finding` } as never)).toThrow();
  });

  it("exposes Core package version and profiles from the SDK, not a local inventory", () => {
    expect(DENTAL_CORE_PACKAGE.id).toBe("de.cognovis.fhir.dental.core");
    expect(DENTAL_CORE_PACKAGE.version).toBe("0.10.0");
    expect(DE_COGNOVIS_FHIR_DENTAL_CORE_PACKAGE.version).toBe("0.10.0");
    expect(DENTAL_CORE_PACKAGE_VERSION).toBe("0.10.0");
    expect(PUBLIC_DENTAL_CORE_PACKAGE_VERSION).toBe("0.10.0");
    expect(DENTAL_CORE_PROFILES["dental-chart-state"]).toBe(DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES.DentalChartState);
    expect(PUBLIC_DENTAL_CORE_PROFILES["dental-chart-state"]).toBe(DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES.DentalChartState);
    expect(PROPERTY_SYSTEM).toBe(`${DENTAL_CORE}/CodeSystem/dental-chart-property`);
    expect(VALUE_SYSTEM).toBe(`${DENTAL_CORE}/CodeSystem/dental-chart-value`);
  });

  it("maps every odontogram chart property and 1sa extension onto an SDK Core carrier", () => {
    const canonicals = new Set<string>([
      ...Object.values(DE_COGNOVIS_FHIR_DENTAL_CORE_PROFILES),
      ...Object.values(DE_COGNOVIS_FHIR_DENTAL_CORE_EXTENSIONS),
    ]);
    expect(canonicals).toContain(DENTAL_CORE_PROFILES["dental-chart-state"]);
    expect(canonicals).toContain(DENTAL_CORE_PROFILES["dental-target-chart-state"]);
    for (const key of [
      "recorded-implant-position",
      "recorded-crown-fracture-type",
      "recorded-orthodontic-progression",
      "recorded-root-resection",
      "recorded-papilla-loss",
      "recorded-bracket-surface",
      "recorded-cantilever-pontic-role",
      "recorded-root-endodontic-state",
      "recorded-root-fracture",
      "recorded-apical-finding",
      "measurement-location-detail",
    ]) {
      expect(canonicals, key).toContain(DENTAL_CORE_PROFILES[key]);
    }
    for (const mapping of CHART_MAPPINGS) {
      expect(mapping.property).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("Dental Core FHIR seam", () => {
  it("logs only the resource type and a fixed reason when generated validation rejects server data", () => {
    const bundle = buildDentalCoreBundle(clinicalFixture(), options);
    const resource = bundle.entry!.find((entry) => entry.resource?.resourceType === "Observation")!.resource;
    resource.id = "odo-private-patient-123-sensitive";
    delete resource["status"];
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      expect(parseDentalCoreBundle(bundle)).toBeUndefined();
      expect(log).toHaveBeenCalledWith("Dental Core generated profile rejected resource", "Observation");
      expect(log.mock.calls.every((args) => args.length === 2 && args[1] === "Observation")).toBe(true);
    } finally {
      log.mockRestore();
    }
  });

  it.each(["__proto__", "constructor", "toString"])("rejects inherited periodontal site code %s", (code) => {
    const bundle = buildDentalCoreBundle(clinicalFixture(), options);
    const observation = bundle.entry!.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-periodontal-finding"]))!.resource as import("fhir/r4").Observation;
    const site = observation.component!.flatMap((component) => component.extension ?? [])
      .find((extension) => extension.url === DENTAL_CORE_PROFILES["periodontal-site"])!;
    site.valueCoding!.code = code;
    expect(parseDentalCoreBundle(bundle)).toBeUndefined();
  });

  it("preserves current root, papilla, device, relationship, fracture, and orthodontic source fields", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: {
        "16": {
          endo: "endo-filling",
          endoCanals: {
            mesiobuccal: ["filling", "post"],
            distobuccal: ["incomplete"],
            palatal: ["temporary"],
          },
          rootFracture: "vertical",
          rootFractureRoot: "palatal",
          rootResection: "amputation",
          rootResectionRoot: "distobuccal",
          apicalDx: "chronic-apical-abscess",
          apicalRoot: "mesiobuccal",
          papillaLoss: { mesial: 1, distal: 3 },
        },
        "15": {
          toothSelection: "implant",
          implantPosition: "both",
        },
        "14": {
          orthoAppliance: "bracket",
          orthoBracketSide: "lingual",
          orthoProgressive: true,
          crownFractureType: "split",
        },
        "13": { cantilever: true, endoCanals: { single: ["filling"] } },
        "18": { apicalDx: "normal", apicalRoot: "palatal" },
      },
      plan: {
        "26": {
          endo: "endo-filling-incomplete",
          endoCanals: { palatal: ["temporary"] },
          rootFracture: "horizontal",
          rootFractureRoot: "mesiobuccal",
          rootResection: "premolarisation",
          rootResectionRoot: "palatal",
          apicalDx: "asymptomatic-apical-periodontitis",
          apicalRoot: "palatal",
          papillaLoss: { mesial: 2, distal: 1 },
          crownFractureType: "crack",
          orthoProgressive: true,
          implantPosition: "mesial",
          orthoBracketSide: "buccal",
          cantilever: true,
        },
      },
    };

    const first = buildDentalCoreBundle(source, options);
    const targetGoals = first.entry?.filter((entry) => entry.resource?.resourceType === "Goal") ?? [];
    expect(targetGoals).toHaveLength(1);
    expect(first.entry?.some((entry) => entry.resource?.resourceType === "Procedure"
      && JSON.stringify(entry.resource).includes("premolarisation"))).toBe(false);
    expect(first.entry?.some((entry) => entry.resource?.resourceType === "Device"
      && JSON.stringify(entry.resource).includes('"26"'))).toBe(false);
    const parsed = parseDentalCoreBundle(first);
    expect(parsed.teeth).toEqual(source.teeth);
    expect(parsed.plan).toEqual(source.plan);
    expect(parsed.teeth["26"]).toBeUndefined();

    const reparsed = parseDentalCoreBundle(buildDentalCoreBundle(parsed, options));
    expect(reparsed.teeth).toEqual(source.teeth);
    expect(reparsed.plan).toEqual(source.plan);
  });

  it("preserves a stale root selection with a normal observed apical diagnosis", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { apicalDx: "normal", apicalRoot: "palatal" } },
    };
    const first = buildDentalCoreBundle(source, options);
    expect(parseDentalCoreBundle(first).teeth).toEqual(source.teeth);
    expect(parseDentalCoreBundle(buildDentalCoreBundle(parseDentalCoreBundle(first), options)).teeth).toEqual(source.teeth);
  });

  it("keeps the resource set of 32 explicit default teeth stable across parse and re-export", () => {
    const fdis = [1, 2, 3, 4].flatMap((quadrant) => [1, 2, 3, 4, 5, 6, 7, 8].map((tooth) => `${quadrant}${tooth}`));
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: Object.fromEntries(fdis.map((fdi) => [fdi, { toothSelection: "tooth-base" }])),
    };
    const identities = (bundle: ReturnType<typeof buildDentalCoreBundle>) =>
      (bundle.entry ?? []).map((entry) => entry.fullUrl).sort();

    const first = buildDentalCoreBundle(source, options);
    const parsed = parseDentalCoreBundle(first);
    expect(parsed.teeth).toEqual(source.teeth);
    const second = buildDentalCoreBundle(parsed, options);
    const toothStates = (first.entry ?? []).filter((entry) => entry.resource?.meta?.profile?.some((url) => url.endsWith("dental-tooth-state")));
    expect(toothStates).toHaveLength(32);
    expect(identities(second)).toEqual(identities(first));

    // A tooth with no chart-state Observation stays a present tooth by absence.
    expect(parseDentalCoreBundle(buildDentalCoreBundle({ ...source, teeth: {} }, options)).teeth).toEqual({});
  });

  it("preserves explicit default and false source fields while keeping absence distinct", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: {
        "15": { toothSelection: "implant", implantPosition: "center" },
        "14": { orthoAppliance: "bracket", orthoBracketSide: "buccal", orthoProgressive: false },
        "13": { cantilever: false, crownFractureType: "none", rootResection: "none" },
      },
      plan: {
        "24": { orthoProgressive: false },
      },
    };

    const parsed = parseDentalCoreBundle(buildDentalCoreBundle(source, options));
    expect(parsed.teeth["15"]).toHaveProperty("implantPosition", "center");
    expect(parsed.teeth["14"]).toMatchObject({ orthoBracketSide: "buccal", orthoProgressive: false });
    expect(parsed.teeth["13"]).toHaveProperty("cantilever", false);
    expect(parsed.teeth["13"]).toMatchObject({ crownFractureType: "none", rootResection: "none" });
    expect(parsed.plan?.["24"]).toHaveProperty("orthoProgressive", false);
    expect(parsed.teeth["16"]).toBeUndefined();
  });

  it("rejects duplicate or invalid recorded source assertions and ambiguous plan targets", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: {
        "16": { rootFracture: "vertical", rootFractureRoot: "palatal", cantilever: true },
      },
      plan: {
        "26": { papillaLoss: { mesial: 2 }, orthoProgressive: false },
      },
    };
    const valid = buildDentalCoreBundle(source, options);
    const recordedCantileverUrl = `${DENTAL_CORE}/StructureDefinition/recorded-cantilever-pontic-role`;
    const recordedPapillaUrl = `${DENTAL_CORE}/StructureDefinition/recorded-papilla-loss`;
    const targetProfile = `${DENTAL_CORE}/StructureDefinition/dental-target-chart-state`;

    const duplicate = structuredClone(valid);
    const chart = duplicate.entry?.find((entry) => {
      const resource = entry.resource as import("fhir/r4").Observation | undefined;
      return resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"])
        && resource.bodySite?.coding?.some((coding) => coding.code === "16");
    })?.resource as import("fhir/r4").Observation;
    const cantilever = chart.extension?.find((extension) => extension.url === recordedCantileverUrl);
    chart.extension?.push(structuredClone(cantilever!));
    expect(parseDentalCoreBundle(duplicate)).toBeUndefined();

    const duplicateApical = buildDentalCoreBundle({
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { apicalDx: "normal", apicalRoot: "palatal" } },
    }, options);
    const apicalChart = duplicateApical.entry?.find((entry) => {
      const resource = entry.resource as import("fhir/r4").Observation | undefined;
      return resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"])
        && resource.bodySite?.coding?.some((coding) => coding.code === "16");
    })?.resource as import("fhir/r4").Observation;
    const recordedApicalUrl = `${DENTAL_CORE}/StructureDefinition/recorded-apical-finding`;
    const apical = apicalChart.extension?.find((extension) => extension.url === recordedApicalUrl);
    apicalChart.extension?.push(structuredClone(apical!));
    expect(parseDentalCoreBundle(duplicateApical)).toBeUndefined();

    const missingApicalDescription = buildDentalCoreBundle({
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { apicalDx: "normal", apicalRoot: "palatal" } },
    }, options);
    const missingDescriptionChart = missingApicalDescription.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation;
    const missingDescription = missingDescriptionChart.extension?.find((extension) => extension.url === recordedApicalUrl);
    missingDescription!.extension = missingDescription?.extension?.filter((extension) => extension.url !== "description");
    expect(parseDentalCoreBundle(missingApicalDescription)).toBeUndefined();

    const invalidGrade = structuredClone(valid);
    const goal = invalidGrade.entry?.find((entry) => entry.resource?.meta?.profile?.includes(targetProfile))?.resource as import("fhir/r4").Goal;
    const papilla = goal.extension?.find((extension) => extension.url === recordedPapillaUrl);
    const grade = papilla?.extension?.find((extension) => extension.url === "grade");
    grade!.valueInteger = 4;
    expect(parseDentalCoreBundle(invalidGrade)).toBeUndefined();

    const duplicateGoal = structuredClone(valid);
    const copiedGoal = structuredClone(duplicateGoal.entry?.find((entry) => entry.resource?.meta?.profile?.includes(targetProfile))!);
    copiedGoal.fullUrl = "urn:uuid:00000000-0000-4000-8000-888888888888";
    if (copiedGoal.resource) copiedGoal.resource.id = "duplicate-target";
    duplicateGoal.entry?.push(copiedGoal);
    expect(parseDentalCoreBundle(duplicateGoal)).toBeUndefined();
  });

  it("rejects equal or conflicting singleton assertions copied across chart and device carriers", () => {
    const cases = [
      {
        record: { toothSelection: "implant", implantPosition: "center", orthoProgressive: false } satisfies ToothRecord,
        deviceProfile: DENTAL_CORE_PROFILES["dental-implant"],
        url: `${DENTAL_CORE}/StructureDefinition/recorded-implant-position`,
        conflict: (extension: import("fhir/r4").Extension) => { extension.valueString = "distal"; },
      },
      {
        record: { orthoAppliance: "bracket", orthoBracketSide: "buccal", orthoProgressive: false } satisfies ToothRecord,
        deviceProfile: DENTAL_CORE_PROFILES["dental-device"],
        url: `${DENTAL_CORE}/StructureDefinition/recorded-bracket-surface`,
        conflict: (extension: import("fhir/r4").Extension) => { extension.valueCoding!.code = "L"; },
      },
      {
        record: { bridgePillar: true, cantilever: false, orthoProgressive: false } satisfies ToothRecord,
        deviceProfile: DENTAL_CORE_PROFILES["dental-device"],
        url: `${DENTAL_CORE}/StructureDefinition/recorded-cantilever-pontic-role`,
        conflict: (extension: import("fhir/r4").Extension) => { extension.valueBoolean = true; },
      },
    ];

    for (const { record, deviceProfile, url, conflict } of cases) {
      for (const makeConflict of [false, true]) {
        const bundle = buildDentalCoreBundle({ version: PAYLOAD_VERSION, globals: {}, teeth: { "15": record } }, options);
        const device = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(deviceProfile))?.resource as import("fhir/r4").Device;
        const chart = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation;
        const copied = structuredClone(device.extension?.find((extension) => extension.url === url)!);
        expect(copied, url).toBeDefined();
        if (makeConflict) conflict(copied);
        (chart.extension ??= []).push(copied);

        expect(parseDentalCoreBundle(bundle), `${url} conflict=${makeConflict}`).toBeUndefined();
      }
    }
  });

  it("rejects duplicate optional roots in every observed and target complex carrier", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": {
        endoCanals: { palatal: ["filling"] },
        rootFracture: "vertical",
        rootFractureRoot: "palatal",
        rootResection: "amputation",
        rootResectionRoot: "palatal",
        apicalDx: "normal",
        apicalRoot: "palatal",
      } },
      plan: { "26": {
        endoCanals: { palatal: ["filling"] },
        rootFracture: "vertical",
        rootFractureRoot: "palatal",
        rootResection: "amputation",
        rootResectionRoot: "palatal",
        apicalDx: "normal",
        apicalRoot: "palatal",
      } },
    };
    const locationUrl = `${DENTAL_CORE}/StructureDefinition/measurement-location-detail`;
    const rootEndoUrl = `${DENTAL_CORE}/StructureDefinition/recorded-root-endodontic-state`;
    const rootFractureUrl = `${DENTAL_CORE}/StructureDefinition/recorded-root-fracture`;
    const rootResectionUrl = `${DENTAL_CORE}/StructureDefinition/recorded-root-resection`;
    const apicalUrl = `${DENTAL_CORE}/StructureDefinition/recorded-apical-finding`;
    type ExtensionParent = { extension?: import("fhir/r4").Extension[] };
    const paths: Array<[string, (bundle: ReturnType<typeof buildDentalCoreBundle>) => [ExtensionParent, string]]> = [
      ["observed endodontic root", (bundle) => {
        const toothState = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
        return [toothState.component!.find((component) => component.valueCodeableConcept?.text === "filling")!, locationUrl];
      }],
      ["observed fracture root", (bundle) => {
        const chart = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation;
        return [chart.component!.find((component) => component.code.coding?.some((coding) => coding.system === PROPERTY_SYSTEM && coding.code === "root-fracture"))!, locationUrl];
      }],
      ["observed resection root", (bundle) => {
        const chart = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation;
        return [chart.extension!.find((extension) => extension.url === rootResectionUrl)!, "root"];
      }],
      ["observed apical root", (bundle) => {
        const chart = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation;
        return [chart.extension!.find((extension) => extension.url === apicalUrl)!, "root"];
      }],
      ["target endodontic root", (bundle) => {
        const goal = bundle.entry?.find((entry) => entry.resource?.resourceType === "Goal")?.resource as import("fhir/r4").Goal;
        return [goal.extension!.find((extension) => extension.url === rootEndoUrl)!, "root"];
      }],
      ["target fracture root", (bundle) => {
        const goal = bundle.entry?.find((entry) => entry.resource?.resourceType === "Goal")?.resource as import("fhir/r4").Goal;
        return [goal.extension!.find((extension) => extension.url === rootFractureUrl)!, "root"];
      }],
      ["target resection root", (bundle) => {
        const goal = bundle.entry?.find((entry) => entry.resource?.resourceType === "Goal")?.resource as import("fhir/r4").Goal;
        return [goal.extension!.find((extension) => extension.url === rootResectionUrl)!, "root"];
      }],
      ["target apical root", (bundle) => {
        const goal = bundle.entry?.find((entry) => entry.resource?.resourceType === "Goal")?.resource as import("fhir/r4").Goal;
        return [goal.extension!.find((extension) => extension.url === apicalUrl)!, "root"];
      }],
    ];

    for (const [label, select] of paths) {
      for (const duplicateValue of ["palatal", "distobuccal"]) {
        const bundle = buildDentalCoreBundle(source, options);
        const [parent, rootUrl] = select(bundle);
        const root = parent.extension!.find((extension) => extension.url === rootUrl)!;
        expect(root, label).toBeDefined();
        parent.extension!.push({ ...structuredClone(root), valueString: duplicateValue });
        expect(parseDentalCoreBundle(bundle), `${label} duplicate=${duplicateValue}`).toBeUndefined();
      }
    }
  });

  it("rejects duplicate whole-tooth endodontic components while retaining rooted components", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { endo: "endo-filling", endoCanals: { palatal: ["temporary"] } } },
    };
    for (const duplicateCode of ["endo-filling", "endo-filling-incomplete"]) {
      const bundle = buildDentalCoreBundle(source, options);
      const toothState = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
      const wholeTooth = toothState.component!.find((component) => component.code.coding?.some((coding) => coding.code === "root-endodontic-state")
        && component.valueCodeableConcept?.coding?.length)!;
      const duplicate = structuredClone(wholeTooth);
      duplicate.valueCodeableConcept!.coding![0].code = duplicateCode;
      toothState.component!.push(duplicate);

      expect(parseDentalCoreBundle(bundle), duplicateCode).toBeUndefined();
    }

    for (const location of [
      { url: `${DENTAL_CORE}/StructureDefinition/measurement-location-detail`, valueString: "palatal" },
      { url: `${DENTAL_CORE}/StructureDefinition/measurement-location-detail`, valueBoolean: true },
    ] as import("fhir/r4").Extension[]) {
      const bundle = buildDentalCoreBundle(source, options);
      const toothState = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
      const wholeTooth = toothState.component!.find((component) => component.code.coding?.some((coding) => coding.code === "root-endodontic-state")
        && component.valueCodeableConcept?.coding?.length)!;
      (wholeTooth.extension ??= []).push(location);

      expect(parseDentalCoreBundle(bundle)).toBeUndefined();
    }
  });

  it("rejects cantilever assertions on non-bridge devices", () => {
    for (const record of [
      { orthoAppliance: "bracket" } satisfies ToothRecord,
      { retention: "clasp" } satisfies ToothRecord,
    ]) {
      const bundle = buildDentalCoreBundle({ version: PAYLOAD_VERSION, globals: {}, teeth: { "14": record } }, options);
      const device = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-device"]))?.resource as import("fhir/r4").Device;
      (device.extension ??= []).push({
        url: `${DENTAL_CORE}/StructureDefinition/recorded-cantilever-pontic-role`,
        valueBoolean: false,
      });

      expect(parseDentalCoreBundle(bundle)).toBeUndefined();
    }
  });

  it("rejects orphaned root qualifiers and explicit empty root maps instead of dropping them", () => {
    const base: OdontogramExportPayload = { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
    for (const [record, field] of [
      [{ rootFracture: "none", rootFractureRoot: "palatal" }, "rootFractureRoot"],
      [{ rootResection: "none", rootResectionRoot: "palatal" }, "rootResectionRoot"],
      [{ apicalRoot: "palatal" }, "apicalRoot"],
      [{ endoCanals: {} }, "endoCanals"],
    ] as const) {
      expect(() => buildDentalCoreBundle({ ...base, teeth: { "16": record } }, options)).toThrow(`teeth.16.${field}`);
    }
  });

  it("rejects unknown, numbered, or tooth-incompatible root identities and impossible canal states", () => {
    const base: OdontogramExportPayload = { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
    const invalidCases: Array<[string, ToothRecord, string]> = [
      ["16", { endoCanals: { MB1: ["filling"] } }, "endoCanals.MB1"],
      ["46", { endoCanals: { palatal: ["filling"] } }, "endoCanals.palatal"],
      ["13", { endoCanals: { mesial: ["filling"] } }, "endoCanals.mesial"],
      ["16", { rootFracture: "vertical", rootFractureRoot: "mesial" }, "rootFractureRoot"],
      ["16", { endoCanals: { mesiobuccal: ["filling", "temporary"] } }, "endoCanals"],
      ["16", { endoCanals: { mesiobuccal: ["incomplete", "temporary", "post"] } }, "endoCanals"],
    ];
    for (const [fdi, record, field] of invalidCases) {
      expect(() => buildDentalCoreBundle({ ...base, teeth: { [fdi]: record } }, options)).toThrow(`teeth.${fdi}.${field}`);
    }

    const valid = buildDentalCoreBundle({
      ...base,
      teeth: { "16": { endoCanals: { mesiobuccal: ["filling", "post"] } } },
    }, options);
    const toothState = valid.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
    const located = toothState.component?.find((component) => component.valueCodeableConcept?.text === "filling");
    const location = located?.extension?.find((extension) => extension.url.endsWith("measurement-location-detail"));
    location!.valueString = "MB1";
    expect(parseDentalCoreBundle(valid)).toBeUndefined();

    const impossible = buildDentalCoreBundle({
      ...base,
      teeth: { "16": { endoCanals: { mesiobuccal: ["filling", "post"] } } },
    }, options);
    const impossibleState = impossible.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
    const post = impossibleState.component?.find((component) => component.valueCodeableConcept?.text === "post");
    // The Dental Core code carries the state (text is narrative): recode the
    // post as an intracanal medicament, a second fill state on one canal.
    post!.valueCodeableConcept!.coding![0].code = "intracanal-medicament";
    expect(parseDentalCoreBundle(impossible)).toBeUndefined();
  });

  it("exports a clinically populated chart through the canonical carrier profiles and roundtrips source values", () => {
    const source = clinicalFixture();
    const bundle = buildDentalCoreBundle(source, options);
    const profiles = bundle.entry?.flatMap((entry) => entry.resource?.meta?.profile ?? []) ?? [];

    expect(profiles).toEqual(expect.arrayContaining([
      DENTAL_CORE_PROFILES["dental-tooth-state"],
      DENTAL_CORE_PROFILES["dental-caries-finding"],
      DENTAL_CORE_PROFILES["dental-periodontal-finding"],
      DENTAL_CORE_PROFILES["dental-implant"],
      DENTAL_CORE_PROFILES["dental-peri-implant-finding"],
      DENTAL_CORE_PROFILES["dental-gingival-recession-assessment"],
    ]));

    const parsed = parseDentalCoreBundle(bundle);
    expect(parsed).toBeDefined();
    expect(parsed?.teeth).toEqual(source.teeth);
  });

  it("uses recorder and case exam date while leaving shared patient resources host-owned", () => {
    const base: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: { edentulous: true },
      teeth: { "16": { endo: "endo-filling" } },
      case: {
        examDate: "2026-08-15",
        diabetesStatus: "none",
        hba1c: 6.4,
        smokingStatus: "former",
      },
      examination: { subject: "Patient/example", recorder: "Practitioner/recorder" },
    };
    const sharedResources = (diabetesStatus: "none" | "present") => ({
      diabetesStatus: { fullUrl: "https://aidbox.example/fhir/Condition/host-diabetes", resource: { resourceType: "Condition" as const, id: "host-diabetes", subject: { reference: "Patient/example" }, code: { coding: [{ system: "https://issuer.example/diagnosis", code: "diabetes" }] }, verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: diabetesStatus === "none" ? "refuted" : "confirmed" }] } } },
      hba1c: { fullUrl: "https://aidbox.example/fhir/Observation/host-hba1c", resource: { resourceType: "Observation" as const, id: "host-hba1c", status: "final" as const, code: { coding: [{ system: "http://loinc.org", code: "4548-4" }] }, subject: { reference: "Patient/example" }, valueQuantity: { value: 6.4, system: "http://unitsofmeasure.org", code: "%" } } },
      smokingStatus: { fullUrl: "https://aidbox.example/fhir/Observation/host-smoking", resource: { resourceType: "Observation" as const, id: "host-smoking", status: "final" as const, code: { coding: [{ system: "http://loinc.org", code: "72166-2" }] }, subject: { reference: "Patient/example" }, valueCodeableConcept: { coding: [{ system: "http://loinc.org", code: "LA15920-4" }] } } },
      edentulous: { fullUrl: "https://aidbox.example/fhir/Condition/host-edentulous", resource: { resourceType: "Condition" as const, id: "host-edentulous", subject: { reference: "Patient/example" }, code: { coding: [{ system: "https://issuer.example/diagnosis", code: "edentulous" }] } } },
    });

    const cases = (["none", "present"] as const).map((diabetesStatus) => {
      const resources = sharedResources(diabetesStatus);
      const bundle = buildDentalCoreBundle({ ...base, case: { ...base.case, diabetesStatus } }, { subject: "Patient/example", sharedResources: resources });
      return { bundle, diabetesStatus, resources };
    });
    for (const { bundle, diabetesStatus, resources } of cases) {
      const provenances = bundle.entry?.filter((entry) => entry.resource?.resourceType === "Provenance").map((entry) => entry.resource as import("fhir/r4").Provenance) ?? [];
      const provenance = provenances.find((resource) => resource.agent[0]?.who.reference === "Practitioner/recorder");
      const dated = bundle.entry?.find((entry) => "effectiveDateTime" in (entry.resource ?? {}))?.resource as import("fhir/r4").Observation | undefined;
      expect(provenance?.agent[0]?.who.reference).toBe("Practitioner/recorder");
      expect(provenance?.recorded).toBe("2026-08-15T00:00:00Z");
      expect(dated?.effectiveDateTime).toBe("2026-08-15");
      expect(provenances.flatMap((resource) => resource.target.map((target) => target.reference))).toEqual(expect.arrayContaining(Object.values(resources).map((entry) => entry.fullUrl)));
      const parsed = parseDentalCoreBundle(bundle);
      expect(parsed?.examination?.recorder).toBe("Practitioner/recorder");
      expect(parsed?.case).toMatchObject({ diabetesStatus, hba1c: 6.4, smokingStatus: "former" });
      expect(parsed?.globals.edentulous).toBe(true);
      const sharedProvenanceUrls = bundle.entry?.filter((entry) => entry.resource?.resourceType === "Provenance" && (entry.resource as import("fhir/r4").Provenance).agent[0]?.who.display === "Host system").map((entry) => entry.fullUrl);
      const rebuilt = buildDentalCoreBundle(parsed!, { subject: "Patient/example", sharedResources: resources });
      expect(rebuilt.entry?.filter((entry) => entry.resource?.resourceType === "Provenance" && (entry.resource as import("fhir/r4").Provenance).agent[0]?.who.display === "Host system").map((entry) => entry.fullUrl)).toEqual(sharedProvenanceUrls);
    }
    expect(cases[0].bundle.entry?.map((entry) => entry.resource?.resourceType)).toEqual(
      cases[1].bundle.entry?.map((entry) => entry.resource?.resourceType),
    );
  });

  it("accepts a shared smoking status coded with the LOINC LL2201-3 answer list", () => {
    const base: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { toothSelection: "tooth-base", endo: "endo-filling" } },
      case: {},
    };
    const exportOptions = { subject: "Patient/example", effectiveDateTime: "2026-08-16T00:00:00Z" };
    const smokingCoded = (coding: Array<{ system: string; code: string }>) => ({
      smokingStatus: {
        fullUrl: "https://praxis.example/fhir/Observation/host-smoking",
        resource: {
          resourceType: "Observation" as const,
          id: "host-smoking",
          status: "final" as const,
          meta: { profile: ["https://praxis.example/fhir/praxis/StructureDefinition/smoking-status-de"] },
          code: { coding: [{ system: "http://loinc.org", code: "72166-2" }] },
          subject: { reference: "Patient/example" },
          valueCodeableConcept: { coding },
        },
      },
    });
    const smokingResource = (answer: string, system = "http://loinc.org") => smokingCoded([{ system, code: answer }]);
    const localCoding = (code: string) => ({ system: "https://github.com/ZoliQua/React-Odontogram-Modul/fhir/CodeSystem/odontogram", code });

    const accepted: Array<[string, "never" | "former" | "current"]> = [
      ["LA18978-9", "never"],
      ["LA15920-4", "former"],
      ["LA18976-3", "current"],
      ["LA18977-1", "current"],
      ["LA18981-3", "current"],
      ["LA18982-1", "current"],
    ];
    for (const [answer, status] of accepted) {
      const payload = { ...base, case: { smokingStatus: status } };
      const sharedResources = smokingResource(answer);
      const bundle = buildDentalCoreBundle(payload, { ...exportOptions, sharedResources });
      expect(parseDentalCoreBundle(bundle)?.case?.smokingStatus).toBe(status);
    }

    // An answer in the retired local system is never a smoking finding.
    const localShared = smokingCoded([localCoding("former")]);
    expect(() => buildDentalCoreBundle({ ...base, case: { smokingStatus: "former" } }, { ...exportOptions, sharedResources: localShared }))
      .toThrow("case.smokingStatus");

    // Unmappable answers and payload/answer disagreements stay rejected.
    for (const answer of ["LA18979-7", "LA18980-5"]) {
      expect(() => buildDentalCoreBundle({ ...base, case: { smokingStatus: "current" } }, { ...exportOptions, sharedResources: smokingResource(answer) }))
        .toThrow("case.smokingStatus");
    }
    expect(() => buildDentalCoreBundle({ ...base, case: { smokingStatus: "current" } }, { ...exportOptions, sharedResources: smokingResource("LA15920-4") }))
      .toThrow("case.smokingStatus");
    expect(() => buildDentalCoreBundle({ ...base, case: { smokingStatus: "former" } }, { ...exportOptions, sharedResources: smokingResource("8517006", "http://snomed.info/sct") }))
      .toThrow("case.smokingStatus");

    // A local-code alias cannot rescue a contradictory LOINC answer.
    expect(() => buildDentalCoreBundle({ ...base, case: { smokingStatus: "former" } }, {
      ...exportOptions, sharedResources: smokingCoded([localCoding("former"), { system: "http://loinc.org", code: "LA18978-9" }]),
    })).toThrow("case.smokingStatus");
  });

  it("preserves identities for newly supported clinical profiles and assigns bundle-local identity to new ones", () => {
    const imported = buildDentalCoreBundle(clinicalFixture(), options);
    const replacement = new Map<string, string>();
    for (const [index, entry] of (imported.entry ?? []).entries()) {
      if (entry.resource?.resourceType === "Patient") continue;
      const previousFullUrl = entry.fullUrl;
      entry.resource!.id = `host-${index}`;
      entry.resource!.meta = { ...entry.resource!.meta, versionId: `v-${index}` };
      entry.fullUrl = `https://aidbox.example/fhir/${entry.resource!.resourceType}/host-${index}`;
      if (previousFullUrl) replacement.set(previousFullUrl, entry.fullUrl);
    }
    for (const entry of imported.entry ?? []) {
      const resource = entry.resource as { focus?: Array<{ reference?: string }> } | undefined;
      for (const focus of resource?.focus ?? []) {
        if (focus.reference) focus.reference = replacement.get(focus.reference) ?? focus.reference;
      }
    }

    const parsed = parseDentalCoreBundle(imported);
    expect(parsed).toBeDefined();
    const rebuilt = buildDentalCoreBundle(parsed!, options);
    for (const original of imported.entry ?? []) {
      if (original.resource?.resourceType === "Patient") continue;
      const matching = rebuilt.entry?.find((entry) => entry.fullUrl === original.fullUrl);
      expect(matching?.resource?.id, original.fullUrl).toBe(original.resource?.id);
      expect(matching?.resource?.meta?.versionId, original.fullUrl).toBe(original.resource?.meta?.versionId);
    }

    parsed!.teeth["14"] = { endo: "endo-filling" };
    const withNewResource = buildDentalCoreBundle(parsed!, options);
    const newEntries = withNewResource.entry?.filter((entry) => !entry.resource?.id) ?? [];
    expect(newEntries.length).toBeGreaterThan(0);
    expect(newEntries.every((entry) => /^urn:uuid:/.test(entry.fullUrl ?? ""))).toBe(true);
  });

  it("uses Dental Core by default and roundtrips every emitted companion resource", () => {
    const source = fixture();
    const bundle = buildDentalCoreBundle(source, options);

    expect(bundle.identifier).toEqual({ system: DENTAL_CORE, value: DENTAL_CORE_BUNDLE_IDENTIFIER });
    expect(bundle.entry?.map((entry) => entry.resource?.meta?.profile?.[0]).filter(Boolean)).toEqual(expect.arrayContaining([
      DENTAL_CORE_PROFILES["dental-chart-state"],
      DENTAL_CORE_PROFILES["dental-procedure"],
      DENTAL_CORE_PROFILES["dental-device"],
      DENTAL_CORE_PROFILES["dental-finding"],
      DENTAL_CORE_PROFILES["dental-risk-evidence"],
      DENTAL_CORE_PROFILES["dental-service-request"],
      DENTAL_CORE_PROFILES["dental-clinical-provenance"],
    ]));
    expect(parseDentalCoreBundle(bundle)).toMatchObject(source);
  });

  it("preserves explicit false and mapped defaults without inventing omitted state", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { endoResection: false, periapicalType: "none", retention: "none" } },
    };

    const parsed = parseDentalCoreBundle(buildDentalCoreBundle(source, options));
    expect(parsed.teeth["16"]).toMatchObject(source.teeth["16"]);
    expect(parsed.teeth["17"]).toBeUndefined();
  });

  it("roundtrips every admitted chart value and every explicit boolean state", () => {
    for (const mapping of CHART_MAPPINGS) {
      const values = mapping.kind === "boolean" ? [true, false] : Object.keys(mapping.values ?? {});
      for (const value of values) {
        const source: OdontogramExportPayload = {
          version: PAYLOAD_VERSION,
          globals: {},
          teeth: { "16": { [mapping.field]: mapping.kind === "set" ? [value] : value } },
        };
        const parsed = parseDentalCoreBundle(buildDentalCoreBundle(source, options));
        const expected = mapping.omitDefault && value === mapping.defaultValue ? undefined : source.teeth["16"]?.[mapping.field];
        expect(parsed.teeth["16"]?.[mapping.field], `${mapping.field}=${String(value)}`).toEqual(expected);
      }
    }
  });

  it("accepts empty Core collections and rejects ambiguous Core collections", () => {
    const empty = buildDentalCoreBundle({ version: PAYLOAD_VERSION, globals: {}, teeth: {} }, options);
    expect(parseDentalCoreBundle(empty)).toEqual({ version: PAYLOAD_VERSION, globals: {}, teeth: {} });

    const legacyEmpty = structuredClone(empty);
    legacyEmpty.identifier = { system: DENTAL_CORE, value: "odontogram-dental-core-0.6.0" };
    expect(parseDentalCoreBundle(legacyEmpty)).toEqual({ version: PAYLOAD_VERSION, globals: {}, teeth: {} });

    const invalidType = structuredClone(buildDentalCoreBundle(fixture(), options));
    invalidType.type = "transaction";
    const duplicateChart = structuredClone(buildDentalCoreBundle(fixture(), options));
    const chart = duplicateChart.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource;
    if (chart) duplicateChart.entry?.push({ resource: { ...chart, id: "another-chart-for-the-same-tooth" } });
    const contradictory = structuredClone(buildDentalCoreBundle(fixture(), options));
    const chartWithProcedure = contradictory.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation | undefined;
    const endoProperty = CHART_MAPPINGS.find((mapping) => mapping.field === "endoResection")?.property;
    const component = chartWithProcedure?.component?.find((entry) => entry.code.coding?.[0]?.code === endoProperty);
    if (component) {
      delete component.valueCodeableConcept;
      component.valueBoolean = false;
    }

    for (const candidate of [invalidType, duplicateChart, contradictory]) {
      expect(parseDentalCoreBundle(candidate)).toBeUndefined();
    }
  });

  it("keeps treatment-plan claims independent from the current chart", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { retention: "clasp" } },
      plan: { "16": {
        retention: "attachment",
        pulpDx: "reversible-pulpitis",
        rootCaries: "arrested",
        radiographicDepth: { mesial: "E2" },
        cervicalSurfaces: ["lingual"],
        note: "Review at next visit",
      } },
    };

    expect(parseDentalCoreBundle(buildDentalCoreBundle(source, options))).toMatchObject(source);
  });

  it("requires a truthful effective date for clinical content", () => {
    expect(() => buildDentalCoreBundle(fixture())).toThrow(MissingDentalCoreEffectiveDateError);
    expect(() => buildDentalCoreBundle(fixture())).toThrow("Dental Core export requires an effective date");
  });

  it("rejects malformed, duplicate, unsupported, and foreign-dialect bundles", () => {
    const valid = buildDentalCoreBundle(fixture(), options);
    const duplicate = structuredClone(valid);
    duplicate.entry?.push(structuredClone(duplicate.entry?.[0]));
    const unsupported = structuredClone(valid);
    unsupported.entry?.push({ resource: { resourceType: "MedicationRequest", id: "unsupported", status: "active", intent: "order" } as never });
    const wrongCoding = structuredClone(valid);
    const chart = wrongCoding.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource as import("fhir/r4").Observation | undefined;
    if (chart?.component?.[0]?.code.coding?.[0]) chart.component[0].code.coding[0].code = "not-admitted";
    const foreign = { resourceType: "Bundle", identifier: { system: DENTAL_CORE, value: "odontogram-dental-core-unsupported" }, entry: [] };

    for (const candidate of [duplicate, unsupported, wrongCoding, foreign]) {
      expect(parseDentalCoreBundle(candidate)).toBeUndefined();
    }
  });

  it("rejects a plan whose CarePlan activity does not resolve to a generated request", () => {
    const invalid = structuredClone(buildDentalCoreBundle(fixture(), options));
    const plan = invalid.entry?.find((entry) => entry.resource?.resourceType === "CarePlan")?.resource as import("fhir/r4").CarePlan | undefined;
    if (plan) plan.activity = [{ reference: { reference: "ServiceRequest/not-generated" } }];

    expect(parseDentalCoreBundle(invalid)).toBeUndefined();
  });

  it("rejects target-chart Goals addressed to another tooth's plan request", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: {},
      plan: {
        "16": { implantPosition: "mesial" },
        "26": { cantilever: true },
      },
    };
    const swapped = buildDentalCoreBundle(source, options);
    const goals = swapped.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is import("fhir/r4").Goal => resource?.resourceType === "Goal") ?? [];
    expect(goals).toHaveLength(2);
    [goals[0].addresses, goals[1].addresses] = [goals[1].addresses, goals[0].addresses];

    expect(parseDentalCoreBundle(swapped)).toBeUndefined();
  });

  it("does not replace the chart after a rejected import", () => {
    __resetChartStateForTest();
    __setToothStateForTest(16, { endoResection: true });
    const before = getStatusChart();
    const rejected = buildDentalCoreBundle(fixture(), options);
    rejected.entry?.push({ resource: { resourceType: "MedicationRequest", id: "unsupported", status: "active", intent: "order" } as never });

    expect(parseDentalCoreBundle(rejected)).toBeUndefined();
    expect(getStatusChart()).toEqual(before);
  });

  it("accepts an Aidbox-style collection that retains admitted profiles but replaces the bundle identifier", () => {
    const aidboxBundle = structuredClone(buildDentalCoreBundle(fixture(), options));
    aidboxBundle.identifier = { system: "https://example.test/bundles", value: "aidbox-assembled" };
    const chart = aidboxBundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource;
    chart?.meta?.profile?.push("http://hl7.org/fhir/StructureDefinition/Observation");

    expect(parseDentalCoreBundle(aidboxBundle)).toMatchObject({
      teeth: fixture().teeth,
      plan: fixture().plan,
      examination: { subject: options.subject, effectiveDateTime: options.effectiveDateTime },
    });
  });

  it("drives a host-style Aidbox Bundle through a Dental Core session and back to export", () => {
    const aidboxBundle = structuredClone(buildDentalCoreBundle(fixture(), options));
    aidboxBundle.identifier = { system: "https://example.test/bundles", value: "aidbox-assembled" };
    const chart = aidboxBundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-chart-state"]))?.resource;
    chart?.meta?.profile?.push("http://hl7.org/fhir/StructureDefinition/Observation");
    const session = createOdontogramSession();

    expect(importDentalCore(session, aidboxBundle)).toBe(true);
    expect(session.getDocument()).toMatchObject({
      teeth: fixture().teeth,
      plan: fixture().plan,
      case: fixture().case,
      examination: { subject: options.subject, effectiveDateTime: options.effectiveDateTime },
    });

    const exported = exportDentalCore(session);
    expect(exported.identifier).toEqual({ system: DENTAL_CORE, value: DENTAL_CORE_BUNDLE_IDENTIFIER });
    expect(exported.entry?.map((entry) => (entry.resource as { subject?: { reference?: string } } | undefined)?.subject?.reference).filter(Boolean)).toEqual(
      expect.arrayContaining([options.subject]),
    );
    expect(exported.entry?.map((entry) => (entry.resource as { effectiveDateTime?: string } | undefined)?.effectiveDateTime).filter(Boolean)).toEqual(
      expect.arrayContaining([options.effectiveDateTime]),
    );
  });

  it("preserves opaque Aidbox identity and resolves its internal relations through a configured Dental Core session", () => {
    const aidboxBundle = structuredClone(buildDentalCoreBundle(fixture(), options));
    const entries = aidboxBundle.entry ?? [];
    const replacement = new Map<string, string>();
    const expectedIdentity = new Map<string, { id: string; versionId: string; fullUrl: string }>();

    for (const [index, entry] of entries.entries()) {
      const resource = entry.resource as { resourceType: string; id?: string; meta?: { versionId?: string } };
      const original = `${resource.resourceType}/${resource.id}`;
      const originalFullUrl = entry.fullUrl;
      const id = `aidbox-${index + 1}`;
      const fullUrl = `https://aidbox.example/fhir/${resource.resourceType}/${id}`;
      const versionId = `version-${index + 1}`;
      replacement.set(original, fullUrl);
      if (originalFullUrl) replacement.set(originalFullUrl, fullUrl);
      expectedIdentity.set(fullUrl, { id, versionId, fullUrl });
      resource.id = id;
      resource.meta = { ...resource.meta, versionId };
      entry.fullUrl = fullUrl;
    }

    for (const entry of entries) {
      const resource = entry.resource as {
        basedOn?: Array<{ reference?: string }>;
        activity?: Array<{ reference?: { reference?: string } }>;
        target?: Array<{ reference?: string }>;
      };
      for (const reference of Array.isArray(resource.basedOn) ? resource.basedOn : []) {
        if (reference.reference) reference.reference = replacement.get(reference.reference) ?? reference.reference;
      }
      for (const activity of Array.isArray(resource.activity) ? resource.activity : []) {
        const reference = activity.reference?.reference;
        if (reference && activity.reference) activity.reference.reference = replacement.get(reference) ?? reference;
      }
      for (const target of Array.isArray(resource.target) ? resource.target : []) {
        if (target.reference) target.reference = replacement.get(target.reference) ?? target.reference;
      }
    }

    const session = createOdontogramSession();

    expect(importDentalCore(session, aidboxBundle)).toBe(true);
    const document = session.getDocument() as OdontogramExportPayload & {
      fhirIdentity?: { resources?: Record<string, { id?: string; versionId?: string; fullUrl?: string }> };
    };
    expect(Object.values(document.fhirIdentity?.resources ?? {})).toEqual(expect.arrayContaining([...expectedIdentity.values()]));
    expect(Object.keys(document.fhirIdentity?.resources ?? {})).toHaveLength(expectedIdentity.size);
    expect(JSON.parse(JSON.stringify(document))).toEqual(document);

    const exported = exportDentalCore(session);
    expect(Object.fromEntries((exported.entry ?? []).map((entry) => [entry.fullUrl, {
      id: entry.resource?.id,
      versionId: entry.resource?.meta?.versionId,
      fullUrl: entry.fullUrl,
    }]))).toEqual(Object.fromEntries(expectedIdentity));
    const exportedPlan = exported.entry?.find((entry) => entry.resource?.resourceType === "CarePlan")?.resource as import("fhir/r4").CarePlan | undefined;
    const exportedRequest = exported.entry?.find((entry) => entry.resource?.resourceType === "ServiceRequest")?.resource as import("fhir/r4").ServiceRequest | undefined;
    const exportedPlannedChart = exported.entry?.find((entry) => entry.resource?.resourceType === "Observation" && Array.isArray((entry.resource as import("fhir/r4").Observation | undefined)?.basedOn))?.resource as import("fhir/r4").Observation | undefined;
    const exportedCondition = exported.entry?.find((entry) => entry.resource?.resourceType === "Condition")?.resource as import("fhir/r4").Condition | undefined;
    const exportedProvenance = exported.entry?.find((entry) => entry.resource?.resourceType === "Provenance")?.resource as import("fhir/r4").Provenance | undefined;
    const exportedPlanFullUrl = exported.entry?.find((entry) => entry.resource === exportedPlan)?.fullUrl;
    const exportedRequestFullUrl = exported.entry?.find((entry) => entry.resource === exportedRequest)?.fullUrl;
    const exportedConditionFullUrl = exported.entry?.find((entry) => entry.resource === exportedCondition)?.fullUrl;
    expect(exportedPlan?.activity?.[0]?.reference?.reference).toBe(exportedRequestFullUrl);
    expect(exportedRequest?.basedOn?.[0]?.reference).toBe(exportedPlanFullUrl);
    expect(exportedPlannedChart?.basedOn?.[0]?.reference).toBe(exportedPlanFullUrl);
    expect(exportedProvenance?.target?.[0]?.reference).toBe(exportedConditionFullUrl);

    const changed = session.getDocument();
    changed.teeth["17"] = { endoResection: true };
    session.setDocument(changed);
    const withNewResource = exportDentalCore(session);
    const newEntries = (withNewResource.entry ?? []).filter((entry) => !expectedIdentity.has(entry.fullUrl ?? ""));
    expect(newEntries).not.toHaveLength(0);
    expect(newEntries.every((entry) => !entry.resource?.id && /^urn:uuid:/.test(entry.fullUrl ?? ""))).toBe(true);
    expect(new Set(newEntries.map((entry) => entry.fullUrl)).size).toBe(newEntries.length);
  });

  it("clears a live session's imported identity when a status import replaces its document", () => {
    const session = createOdontogramSession({
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { endoResection: true } },
      fhirIdentity: { resources: { "Observation/chart/status/16": { id: "host-a-chart", versionId: "17", fullUrl: "https://aidbox.example/fhir/Observation/host-a-chart" } } },
    });

    session.activate();
    try {
      __importStatusForTest({ version: PAYLOAD_VERSION, globals: {}, teeth: { "16": { fissureSealing: true } } });
      expect(session.getDocument().fhirIdentity).toBeUndefined();
    } finally {
      session.release();
    }
  });

  it("keeps relative references for imported persistent resources without entry fullUrls", () => {
    const relativeBundle = structuredClone(buildDentalCoreBundle(fixture(), options));
    const references = new Map<string, string>();
    for (const [index, entry] of (relativeBundle.entry ?? []).entries()) {
      const resource = entry.resource as { resourceType: string; id?: string; meta?: { versionId?: string } };
      const relative = `${resource.resourceType}/persistent-${index + 1}`;
      if (entry.fullUrl) references.set(entry.fullUrl, relative);
      resource.id = `persistent-${index + 1}`;
      resource.meta = { ...resource.meta, versionId: `version-${index + 1}` };
      delete entry.fullUrl;
    }
    for (const entry of relativeBundle.entry ?? []) {
      const resource = entry.resource as {
        basedOn?: Array<{ reference?: string }>;
        activity?: Array<{ reference?: { reference?: string } }>;
        target?: Array<{ reference?: string }>;
      };
      for (const reference of Array.isArray(resource.basedOn) ? resource.basedOn : []) {
        if (reference.reference) reference.reference = references.get(reference.reference) ?? reference.reference;
      }
      for (const activity of Array.isArray(resource.activity) ? resource.activity : []) {
        const reference = activity.reference?.reference;
        if (reference && activity.reference) activity.reference.reference = references.get(reference) ?? reference;
      }
      for (const target of Array.isArray(resource.target) ? resource.target : []) {
        if (target.reference) target.reference = references.get(target.reference) ?? target.reference;
      }
    }

    const session = createOdontogramSession();
    expect(importDentalCore(session, relativeBundle)).toBe(true);

    const exported = exportDentalCore(session);
    expect((exported.entry ?? []).every((entry) => entry.fullUrl === undefined)).toBe(true);
    const plan = exported.entry?.find((entry) => entry.resource?.resourceType === "CarePlan")?.resource as import("fhir/r4").CarePlan | undefined;
    const request = exported.entry?.find((entry) => entry.resource?.resourceType === "ServiceRequest")?.resource as import("fhir/r4").ServiceRequest | undefined;
    const plannedChart = exported.entry?.find((entry) => entry.resource?.resourceType === "Observation" && Array.isArray((entry.resource as import("fhir/r4").Observation | undefined)?.basedOn))?.resource as import("fhir/r4").Observation | undefined;
    const condition = exported.entry?.find((entry) => entry.resource?.resourceType === "Condition")?.resource as import("fhir/r4").Condition | undefined;
    const provenance = exported.entry?.find((entry) => entry.resource?.resourceType === "Provenance")?.resource as import("fhir/r4").Provenance | undefined;
    expect(plan?.activity?.[0]?.reference?.reference).toBe(`ServiceRequest/${request?.id}`);
    expect(request?.basedOn?.[0]?.reference).toBe(`CarePlan/${plan?.id}`);
    expect(plannedChart?.basedOn?.[0]?.reference).toBe(`CarePlan/${plan?.id}`);
    expect(provenance?.target?.[0]?.reference).toBe(`Condition/${condition?.id}`);
  });

  it("omits CarePlan.goal when the plan has no target-chart Goals", () => {
    const bundle = buildDentalCoreBundle({
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "36": { endo: "endo-filling" } },
      plan: { "36": { restorationType: "crown", restorationMaterial: "zircon" } },
    }, options);
    const plan = bundle.entry?.find((entry) => entry.resource?.resourceType === "CarePlan")?.resource as import("fhir/r4").CarePlan | undefined;
    expect(plan).toBeDefined();
    expect(plan?.goal).toBeUndefined();
  });

  it("fails closed instead of silently dropping unsupported populated Core state", () => {
    const unsupported: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { customStates: { "unsupported-clinical-state": true } } },
    };

    expect(() => buildDentalCoreBundle(unsupported, options)).toThrow(UnsupportedDentalCoreContentError);
    expect(() => buildDentalCoreBundle(unsupported, options)).toThrow("teeth.16.customStates");
  });

  it("rejects hostile clinical profile values and incomplete choice slices", () => {
    const bundle = buildDentalCoreBundle(clinicalFixture(), options);
    const toothState = bundle.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
    const presence = toothState.component?.find((component) => component.code.coding?.some((coding) => coding.code === "tooth-presence"));
    presence!.valueCodeableConcept!.coding![0].code = "not-an-editor-value";
    expect(parseDentalCoreBundle(bundle)).toBeUndefined();

    const missingValue = buildDentalCoreBundle(clinicalFixture(), options);
    const missingState = missingValue.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"]))?.resource as import("fhir/r4").Observation;
    const missingPresence = missingState.component?.find((component) => component.code.coding?.some((coding) => coding.code === "tooth-presence"));
    delete missingPresence!.valueCodeableConcept;
    expect(parseDentalCoreBundle(missingValue)).toBeUndefined();

    const invalidSurface = buildDentalCoreBundle(clinicalFixture(), options);
    const fillingState = invalidSurface.entry?.find((entry) => {
      const resource = entry.resource as import("fhir/r4").Observation | undefined;
      return resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-tooth-state"])
        && resource.bodySite?.coding?.some((coding) => coding.code === "16");
    })?.resource as import("fhir/r4").Observation;
    const surfaceComponent = fillingState.component?.find((component) => component.extension?.length);
    surfaceComponent!.extension![0].valueCoding!.system = "http://snomed.info/sct";
    expect(parseDentalCoreBundle(invalidSurface)).toBeUndefined();

    const invalidRange = buildDentalCoreBundle(clinicalFixture(), options);
    const periodontal = invalidRange.entry?.find((entry) => entry.resource?.meta?.profile?.includes(DENTAL_CORE_PROFILES["dental-periodontal-finding"]))?.resource as import("fhir/r4").Observation;
    const probingDepth = periodontal.component?.find((component) => component.code.coding?.some((coding) => coding.code === "32910-2"));
    probingDepth!.valueQuantity!.value = 9999;
    expect(parseDentalCoreBundle(invalidRange)).toBeUndefined();
  });

  it("roundtrips subcrown caries and refuses orphaned severity or peri-implant state", () => {
    const subcrown: OdontogramExportPayload = {
      version: PAYLOAD_VERSION, globals: {}, teeth: { "16": { caries: ["caries-subcrown"], cariesSeverity: { subcrown: 3 } } },
    };
    expect(parseDentalCoreBundle(buildDentalCoreBundle(subcrown, options))?.teeth).toEqual(subcrown.teeth);
    expect(() => buildDentalCoreBundle({ ...subcrown, teeth: { "16": { cariesSeverity: { occlusal: 4 } } } }, options)).toThrow("teeth.16.cariesSeverity.occlusal");
    expect(() => buildDentalCoreBundle({ ...subcrown, teeth: { "16": { periImplant: "mucositis" } } }, options)).toThrow("teeth.16.periImplant");
  });

  it("fails closed for plan-only implant fields, targetless recorder, performer, and invalid kg", () => {
    const empty: OdontogramExportPayload = { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
    expect(() => buildDentalCoreBundle({ ...empty, plan: { "15": { toothSelection: "implant", implantProduct: { system: "Line" } } } }, options)).toThrow("plan.15.implantProduct");
    expect(() => buildDentalCoreBundle({ ...empty, examination: { recorder: "Practitioner/recorder" } }, options)).toThrow("examination.recorder");
    expect(() => buildDentalCoreBundle({ ...empty, teeth: { "16": { endo: "endo-filling" } }, examination: { performer: "Practitioner/performer" } }, options)).toThrow("examination.performer");
    expect(() => buildDentalCoreBundle({ ...empty, teeth: { "16": { kg: 42 } } }, options)).toThrow("teeth.16.kg");
  });

  it("treats unknown or cleared shared fields as uncharted and rejects hostile shared carriers", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION, globals: {}, teeth: { "16": { endo: "endo-filling" } },
      case: { diabetesStatus: "unknown", hba1c: null as unknown as number, smokingStatus: "unknown" },
    };
    expect(() => buildDentalCoreBundle(source, options)).not.toThrow();

    const sharedBase: OdontogramExportPayload = {
      version: PAYLOAD_VERSION, globals: {}, teeth: { "16": { endo: "endo-filling" } }, case: { hba1c: 6.4 },
    };
    const hba1c = { fullUrl: "https://aidbox.example/fhir/Observation/hba1c", resource: {
      resourceType: "Observation" as const, id: "hba1c", status: "final" as const,
      code: { coding: [{ system: "http://loinc.org", code: "4548-4" }] }, subject: { reference: "Patient/example" },
      valueQuantity: { value: 6.4, system: "http://unitsofmeasure.org", code: "%" },
    } };
    const valid = buildDentalCoreBundle(sharedBase, { ...options, sharedResources: { hba1c } });
    const invalidRange = structuredClone(valid);
    const observation = invalidRange.entry?.find((entry) => entry.fullUrl === hba1c.fullUrl)?.resource as import("fhir/r4").Observation;
    observation.valueQuantity!.value = -5;
    expect(parseDentalCoreBundle(invalidRange)).toBeUndefined();

    const wrongPatientImport = structuredClone(valid);
    const importedObservation = wrongPatientImport.entry?.find((entry) => entry.fullUrl === hba1c.fullUrl)?.resource as import("fhir/r4").Observation;
    importedObservation.subject!.reference = "Patient/someone-else";
    expect(parseDentalCoreBundle(wrongPatientImport)).toBeUndefined();

    const wrongPatient = structuredClone(hba1c);
    wrongPatient.resource.subject.reference = "Patient/someone-else";
    expect(() => buildDentalCoreBundle(sharedBase, { ...options, sharedResources: { hba1c: wrongPatient } })).toThrow("case.hba1c");

    const diagnosisBundle = buildDentalCoreBundle(fixture(), options);
    const diagnosis = diagnosisBundle.entry?.find((entry) => entry.resource?.resourceType === "Condition");
    const sharedProvenance = structuredClone(valid.entry?.find((entry) => entry.resource?.resourceType === "Provenance" && (entry.resource as import("fhir/r4").Provenance).agent[0]?.who.display === "Host system"));
    sharedProvenance!.fullUrl = "urn:uuid:00000000-0000-4000-8000-999999999999";
    (sharedProvenance!.resource as import("fhir/r4").Provenance).reason = [{ coding: [{ system: "https://github.com/ZoliQua/React-Odontogram-Modul/fhir/CodeSystem/odontogram", code: "shared-resource-edentulous" }] }];
    (sharedProvenance!.resource as import("fhir/r4").Provenance).target = [{ reference: diagnosis!.fullUrl }];
    diagnosisBundle.entry?.push(sharedProvenance!);
    expect(parseDentalCoreBundle(diagnosisBundle)).toBeUndefined();
  });

});

describe("Dental Core sessions", () => {
  it("keeps export options immutable and makes a rejected foreign import non-destructive", () => {
    const source: OdontogramExportPayload = {
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: { "16": { retention: "attachment", endoResection: true } },
      plan: { "16": { retention: "clasp" } },
      examination: { effectiveDateTime: "2026-08-14T17:00:31Z" },
    };
    const session = createOdontogramSession(source);

    const coreBundle = buildDentalCoreBundle(session.getDocument(), {
      subject: "Patient/host",
      effectiveDateTime: "2026-08-14T17:00:31Z",
    });
    expect(coreBundle.identifier).toEqual({ system: DENTAL_CORE, value: DENTAL_CORE_BUNDLE_IDENTIFIER });
    expect(importDentalCore(session, coreBundle)).toBe(true);
    expect(session.getDocument()).toMatchObject({
      version: source.version,
      globals: source.globals,
      teeth: source.teeth,
      plan: source.plan,
    });
    const beforeRejectedImport = session.getDocument();
    expect(importDentalCore(session, { resourceType: "Bundle", type: "collection", entry: [] })).toBe(false);
    expect(session.getDocument()).toEqual(beforeRejectedImport);
  });
});
