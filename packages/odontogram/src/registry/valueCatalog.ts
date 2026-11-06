// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

/**
 * The odontogram's value catalog: every enum value the chart stores, its
 * English display, and the Dental Core code it is exchanged as.
 *
 * The internal values (`LOCAL_VALUE_MAPS`) are the engine's state and UI
 * vocabulary; they never leave the process as FHIR codes. Every value that is
 * exchanged is written and read ONLY as its Dental Core code
 * (`dentalCoreCoding`), whose system URL and membership come from
 * `@cognovis/fhir-sdk/terminology` (cognovis/odontogram#35). There is no local
 * code system, fallback or alias.
 */
import {
  DENTAL_CORE_CODES,
  DENTAL_CORE_VALUE_SET_CODES,
  DENTAL_CORE_VALUE_SETS,
} from "@cognovis/fhir-sdk/terminology";

/** A stable renderer value and its display label. `code` is the internal
 *  engine value, not a FHIR code. */
export interface CodeEntry {
  code: string;
  display: string;
}

/**
 * Internal value maps, keyed by enum group then by enum value.
 * `display` strings are English (language-neutral data).
 */
export const LOCAL_VALUE_MAPS: Record<string, Record<string, CodeEntry>> = {
  toothSelection: {
    "none": { code: "none", display: "No tooth status" },
    "tooth-base": { code: "tooth-base", display: "Present tooth" },
    "milktooth": { code: "milktooth", display: "Primary (deciduous) tooth" },
    "implant": { code: "implant", display: "Dental implant" },
    "tooth-under-gum": { code: "tooth-under-gum", display: "Tooth under gum" },
    "no-tooth-after-extraction": { code: "no-tooth-after-extraction", display: "Missing after extraction" },
    // Distinct from "none". A position whose tooth has not erupted is not a
    // missing tooth: nothing was lost and nothing is absent that should be
    // there. Recording it as `none` made a healthy four-year-old's chart report
    // twelve missing teeth (odontogram-8vu).
    "not-erupted": { code: "not-erupted", display: "Tooth not erupted" },
  },
  endo: {
    "none": { code: "none", display: "No endodontic treatment" },
    "endo-medical-filling": { code: "endo-medical-filling", display: "Endodontic medical filling" },
    "endo-filling": { code: "endo-filling", display: "Root canal filling" },
    "endo-filling-incomplete": { code: "endo-filling-incomplete", display: "Incomplete root canal filling" },
    "endo-glass-pin": { code: "endo-glass-pin", display: "Glass fiber post" },
    "endo-metal-pin": { code: "endo-metal-pin", display: "Metal post" },
  },
  fillingMaterial: {
    "none": { code: "none", display: "No filling" },
    "amalgam": { code: "amalgam", display: "Amalgam filling" },
    "composite": { code: "composite", display: "Composite filling" },
    "gic": { code: "gic", display: "Glass ionomer cement filling" },
    "temporary": { code: "temporary", display: "Temporary filling" },
  },
  prosthesis: {
    "none":              { code: "none",              display: "No prosthesis" },
    "healing-abutment":  { code: "healing-abutment",  display: "Healing abutment" },
    "locator":           { code: "locator",           display: "Locator attachment" },
    "locator-denture":   { code: "locator-denture",   display: "Locator overdenture" },
    "bar":               { code: "bar",               display: "Bar attachment" },
    "bar-denture":       { code: "bar-denture",       display: "Bar overdenture" },
    "removable-partial": { code: "removable-partial", display: "Partial removable denture" },
    "removable-full":    { code: "removable-full",    display: "Full removable denture" },
  },
  mobility: {
    "none": { code: "none", display: "No mobility" },
    "m1": { code: "m1", display: "Mobility grade 1" },
    "m2": { code: "m2", display: "Mobility grade 2" },
    "m3": { code: "m3", display: "Mobility grade 3" },
  },
  mods: {
    "inflammation": { code: "inflammation", display: "Inflammation" },
    "parodontal": { code: "parodontal", display: "Periodontal involvement" },
    "mobility": { code: "mobility", display: "Mobility" },
  },
  periapicalType: {
    "none": { code: "none", display: "No periapical lesion" },
    "granuloma": { code: "granuloma", display: "Periapical granuloma" },
    "cyst": { code: "cyst", display: "Radicular cyst" },
    "abscess": { code: "abscess", display: "Periapical abscess" },
  },
  caries: {
    "caries-subcrown": { code: "caries-subcrown", display: "Subcrown caries" },
    "caries-buccal": { code: "caries-buccal", display: "Buccal caries" },
    "caries-lingual": { code: "caries-lingual", display: "Lingual caries" },
    "caries-mesial": { code: "caries-mesial", display: "Mesial caries" },
    "caries-distal": { code: "caries-distal", display: "Distal caries" },
    "caries-occlusal": { code: "caries-occlusal", display: "Occlusal caries" },
  },
  fillingSurfaces: {
    "buccal": { code: "buccal", display: "Buccal surface" },
    "lingual": { code: "lingual", display: "Lingual surface" },
    "mesial": { code: "mesial", display: "Mesial surface" },
    "distal": { code: "distal", display: "Distal surface" },
    "occlusal": { code: "occlusal", display: "Occlusal surface" },
  },
  toothSubstrate: {
    "natural": { code: "natural", display: "Natural substrate" },
    "radix": { code: "radix", display: "Root remnant (radix)" },
    "broken": { code: "broken", display: "Broken tooth" },
    "crownprep": { code: "crownprep", display: "Prepared for crown" },
  },
  restorationType: {
    "none": { code: "none", display: "No restoration" },
    "crown": { code: "crown", display: "Crown" },
    "inlay": { code: "inlay", display: "Inlay" },
    "onlay": { code: "onlay", display: "Onlay" },
    "veneer": { code: "veneer", display: "Veneer" },
    "bridge": { code: "bridge", display: "Bridge unit" },
  },
  restorationMaterial: {
    "none": { code: "none", display: "No material" },
    "emax": { code: "emax", display: "Lithium disilicate (e.max)" },
    "gold": { code: "gold", display: "Gold" },
    "gradia": { code: "gradia", display: "Indirect composite (Gradia)" },
    "zircon": { code: "zircon", display: "Zirconia" },
    "metal": { code: "metal", display: "Full-cast metal" },
    "metal-ceramic": { code: "metal-ceramic", display: "Metal-ceramic (PFM)" },
    "telescope": { code: "telescope", display: "Telescopic crown" },
    "temporary": { code: "temporary", display: "Temporary" },
  },
  // SP4 Task 1: pulp/apical/resorption diagnosis axes (additive; not yet
  // rendered). See docs/superpowers/specs/2026-07-13-odontogram-sp4-endo-pulp-diagnosis-design.md.
  pulpDx: {
    "normal": { code: "normal", display: "Normal pulp" },
    "reversible-pulpitis": { code: "reversible-pulpitis", display: "Reversible pulpitis" },
    "irreversible-pulpitis": { code: "irreversible-pulpitis", display: "Irreversible pulpitis" },
    "necrosis": { code: "necrosis", display: "Pulp necrosis" },
  },
  // Practical clinical Latin pulp subtypes (spec §3.2); `display` is the Latin
  // label itself (language-neutral, identical across UI languages).
  pulpLatin: {
    "none": { code: "none", display: "No Latin pulp subtype" },
    "pulpa-sana": { code: "pulpa-sana", display: "Pulpa sana" },
    "hyperaemia-pulpae": { code: "hyperaemia-pulpae", display: "Hyperaemia pulpae" },
    "pulpitis-acuta-serosa": { code: "pulpitis-acuta-serosa", display: "Pulpitis acuta serosa" },
    "pulpitis-acuta-purulenta": { code: "pulpitis-acuta-purulenta", display: "Pulpitis acuta purulenta" },
    "pulpitis-chronica-clausa": { code: "pulpitis-chronica-clausa", display: "Pulpitis chronica clausa" },
    "pulpitis-chronica-ulcerosa": { code: "pulpitis-chronica-ulcerosa", display: "Pulpitis chronica ulcerosa (aperta)" },
    "pulpitis-chronica-hyperplastica": { code: "pulpitis-chronica-hyperplastica", display: "Pulpitis chronica hyperplastica (pulpa-polyp)" },
    "necrosis-pulpae": { code: "necrosis-pulpae", display: "Necrosis pulpae" },
    "gangraena-pulpae": { code: "gangraena-pulpae", display: "Gangraena pulpae" },
  },
  apicalDx: {
    "normal": { code: "normal", display: "No apical pathology" },
    "symptomatic-apical-periodontitis": { code: "symptomatic-apical-periodontitis", display: "Symptomatic apical periodontitis" },
    "asymptomatic-apical-periodontitis": { code: "asymptomatic-apical-periodontitis", display: "Asymptomatic apical periodontitis" },
    "acute-apical-abscess": { code: "acute-apical-abscess", display: "Acute apical abscess" },
    "chronic-apical-abscess": { code: "chronic-apical-abscess", display: "Chronic apical abscess" },
    "condensing-osteitis": { code: "condensing-osteitis", display: "Condensing osteitis" },
  },
  resorptionType: {
    "none": { code: "none", display: "No root resorption" },
    "internal": { code: "internal", display: "Internal root resorption" },
    "external-cervical": { code: "external-cervical", display: "External cervical root resorption" },
  },
  wearEdge: {
    "none": { code: "none", display: "No incisal/occlusal wear" },
    "attrition": { code: "attrition", display: "Attrition (tooth-to-tooth wear)" },
    "erosion": { code: "erosion", display: "Erosion (chemical/acid wear)" },
  },
  wearCervical: {
    "none": { code: "none", display: "No cervical wear" },
    "abrasion": { code: "abrasion", display: "Abrasion (mechanical cervical wear)" },
    "abfraction": { code: "abfraction", display: "Abfraction (cervical stress lesion)" },
    "erosion": { code: "erosion", display: "Erosion (chemical/acid wear)" },
  },
  discoloration: {
    "none": { code: "none", display: "No discoloration" },
    "tetracycline": { code: "tetracycline", display: "Tetracycline staining" },
    "fluorosis": { code: "fluorosis", display: "Dental fluorosis" },
    "nonvital": { code: "nonvital", display: "Non-vital (pulp-death) darkening" },
    "extrinsic": { code: "extrinsic", display: "Extrinsic staining" },
    "other": { code: "other", display: "Other / unknown discoloration" },
  },
  // SP14 Task 1: orthodontic axes foundation (registry/FHIR/i18n only; render
  // lands in SP14 Task 2). `orthoRotation` is a boolean axis (no value map).
  orthoAppliance: {
    "none": { code: "none", display: "No orthodontic appliance" },
    "bracket": { code: "bracket", display: "Fixed bracket" },
    "band": { code: "band", display: "Orthodontic band" },
  },
  orthoDrift: {
    "none": { code: "none", display: "No drift" },
    "mesial": { code: "mesial", display: "Mesial drift" },
    "distal": { code: "distal", display: "Distal drift" },
  },
  orthoVertical: {
    "none": { code: "none", display: "No vertical malposition" },
    "extrusion": { code: "extrusion", display: "Extrusion" },
    "intrusion": { code: "intrusion", display: "Intrusion" },
  },
  // SP5 Task 1: caries fields foundation (additive; not yet rendered). `rootCaries`
  // is a normal enum axis (registered in axes.ts/fieldMappings.ts). `secondaryCaries`
  // (CARS 0-6) and `radiographicDepth` are per-surface scalar maps handled the same
  // way `cariesDepths` is (special-cased outside AXES) — `secondaryCaries` has no
  // value-map group (a raw integer score, like ICDAS), `radiographicDepth` does.
  rootCaries: {
    "none": { code: "none", display: "No root caries" },
    "active": { code: "active", display: "Active root caries" },
    "arrested": { code: "arrested", display: "Arrested root caries" },
    "active-cavitated": { code: "active-cavitated", display: "Active cavitated root caries" },
  },
  // SP-perio PG-C Task 2: two per-tooth categorical DATA axes (registry/FHIR/
  // payload only; the Dental Chart rows/UI land in PG-C Task 3). NO svgLayer —
  // neither renders. Exchanged as Dental Core codes (see DENTAL_CORE_VALUE_CODES).
  // Bead odontogram-fu1: was am Zahn GEPRUEFT wurde, nicht was daraus
  // geschlossen wurde.
  //
  // `pulpDx` und `apicalDx` fuehren die Benennung nach AAE - sie sagen, was man
  // geschlossen hat. Der Test dahinter stand nirgends. Am schaerfsten sichtbar
  // an einer Stelle: `apicalDx` unterscheidet symptomatische von
  // asymptomatischer apikaler Parodontitis, und was diese beiden trennt, IST
  // die Perkussionsempfindlichkeit.
  //
  // ZWEI Achsen, nicht eine: ein vitaler Zahn kann perkussionsempfindlich sein.
  //
  // `none` heisst NICHT GEPRUEFT, nicht "unauffaellig" - dieselbe Unterscheidung,
  // auf der der ganze parodontale Teil besteht. Deshalb traegt die Perkussion
  // einen eigenen Wert `negative`: geprueft und nicht klopfempfindlich ist ein
  // Befund, kein fehlender.
  //
  // Abgelesen von charlys Befundtastenfeld (`+`, `-`, `?`, `p`), siehe
  // docs/charly/01-befund-tastenfeld.md.
  //
  // DIE PRUEFMETHODE GEHOERT NICHT DAZU - entschieden von Dirk am 20.08.2026,
  // und das ist eine Entscheidung, keine Luecke. Kaelte, elektrisch oder
  // Testkavitaet werden NICHT als eigene Angabe gefuehrt. Wer sie spaeter
  // "hilfsbereit" ergaenzt, hebt diese Entscheidung auf; wer sie braucht, holt
  // sie vorher ein.
  //
  // UND `pulpDx` WIRD AUS DIESEN ACHSEN NICHT ABGELEITET - ebenfalls entschieden
  // am 20.08.2026. Dirk: "Kaelteprobe stuetzt eine Diagnose. Auch ein
  // gangraenoeser Zahn kann dabei falsch positiv reagieren."
  //
  // Damit ist die Frage nicht eine des Geschmacks, sondern der Sache: ein Test,
  // der falsch positiv ausfallen kann, darf eine Diagnose STUETZEN und nicht
  // STELLEN. Beim Parodont leiten wir ab (`getPerioClassification`, abgeleitet
  // mit Uebersteuerung je Achse) - dort sind die Eingangsgroessen Messwerte in
  // Millimetern und keine Reizantworten. Der Unterschied liegt in der Natur der
  // Messung, nicht in der Bauweise, und deshalb ist es kein Widerspruch, dass
  // die beiden Stellen es verschieden halten.
  //
  // Die Pruefung und die Benennung stehen also nebeneinander, jede fuer sich,
  // und der Zusammenhang wird gelesen statt gerechnet.
  orthoBracketSide: {
    "buccal": { code: "buccal", display: "Bracket on the buccal/labial surface" },
    "lingual": { code: "lingual", display: "Bracket on the lingual/palatal surface" },
  },
  sensibility: {
    "none": { code: "none", display: "Sensibility not tested" },
    "vital": { code: "vital", display: "Vital response" },
    "no-response": { code: "no-response", display: "No response" },
    "questionable": { code: "questionable", display: "Questionable response" },
  },
  percussion: {
    "none": { code: "none", display: "Percussion not tested" },
    "negative": { code: "negative", display: "Percussion negative" },
    "sensitive": { code: "sensitive", display: "Percussion sensitive" },
  },
  // Bead odontogram-t6y: die WURZEL, nicht die Krone.
  //
  // `brokenMesial`, `brokenIncisal` und `brokenDistal` meinen alle drei die
  // KRONE, und `toothSubstrate: broken` die zerstoerte Krone. Eine gebrochene
  // Wurzel stand nirgends - ein anderer Befund mit anderer Folge.
  //
  // LAENGS ODER QUER ist der Unterschied, der zaehlt, und deshalb sind es zwei
  // Werte und kein Schalter: die Laengsfraktur ist der Extraktionsgrund, die
  // Querfraktur kann je nach Hoehe erhalten werden.
  // Bead odontogram-0n8: wie weit ein sichtbarer Zahn durchgebrochen ist,
  // gemessen am KRONENANTEIL, der ueber dem Zahnfleisch steht. Nicht am Bezug
  // zur Kauebene - die braeuchte den Antagonisten, und ihre dritte Stufe waere
  // der Normalzustand.
  eruptionStage: {
    "none": { code: "none", display: "Fully erupted or not assessed" },
    "emerging": { code: "emerging", display: "Emerging: cusp tip or incisal edge just visible" },
    "half-crown": { code: "half-crown", display: "About half the crown erupted" },
    "full-crown": { code: "full-crown", display: "Crown fully erupted, not yet in occlusion" },
  },
  rootFracture: {
    "none": { code: "none", display: "No root fracture" },
    "vertical": { code: "vertical", display: "Vertical root fracture" },
    "horizontal": { code: "horizontal", display: "Horizontal root fracture" },
  },
  rootPostType: {
    "none": { code: "none", display: "No root post" },
    "glass-fiber": { code: "glass-fiber", display: "Glass fiber root post" },
    "metal": { code: "metal", display: "Metal root post" },
  },
  // Bead odontogram-ca0: die drei resektiven Verfahren am mehrwurzeligen Zahn.
  //
  // NICHT dasselbe wie `endoResection` - das ist die Wurzelspitzenresektion,
  // die Spitze wird gekappt und der Zahn bleibt ganz. Hier wird er GETEILT.
  //
  // Alle drei in EINER Achse, weil sie einander ausschliessen und weil die
  // Abgrenzung sonst nirgends stuende:
  //   Hemisektion       geteilt, eine Haelfte samt Wurzel entfernt
  //   Wurzelamputation  Wurzel entfernt, die Krone bleibt ganz
  //   Praemolarisierung geteilt, BEIDE Haelften bleiben stehen
  rootResection: {
    "none": { code: "none", display: "No root resection" },
    "hemisection": { code: "hemisection", display: "Hemisection" },
    "amputation": { code: "amputation", display: "Root amputation" },
    "premolarisation": { code: "premolarisation", display: "Premolarisation" },
  },
  cejVisibility: {
    "none": { code: "none", display: "CEJ visibility not assessed" },
    "detectable": { code: "detectable", display: "CEJ detectable" },
    "not-detectable": { code: "not-detectable", display: "CEJ not detectable" },
  },
  rootConcavity: {
    "none": { code: "none", display: "No root concavity" },
    "mild": { code: "mild", display: "Mild root concavity" },
    "deep": { code: "deep", display: "Deep root concavity" },
  },
  // Bead odontogram-dma: what holds a removable denture to a natural tooth.
  // ONE value per tooth, not a set (Dirk, 2026-08-11): "a bar abutment does
  // not normally carry a clasp, a telescope abutment neither, but a single
  // tooth - crowned or not - does." Modelled as a set it would invite
  // combinations that do not occur and then need a rule to forbid them; as an
  // enum the exclusion falls out of the model itself.
  retention: {
    "none": { code: "none", display: "No retention element" },
    "clasp": { code: "clasp", display: "Clasp (Klammer)" },
    "attachment": { code: "attachment", display: "Attachment (Geschiebe)" },
    "bar-abutment": { code: "bar-abutment", display: "Bar abutment (Steg)" },
  },
  // The side the element engages. charly writes it as `<Kl` / `Kl>` and
  // `( G` / `G )`, so it is part of the finding rather than decoration.
  retentionSide: {
    "none": { code: "none", display: "Engaged side not recorded" },
    "mesial": { code: "mesial", display: "Engages mesially" },
    "distal": { code: "distal", display: "Engages distally" },
    "both": { code: "both", display: "Engages mesially and distally" },
  },
  // SP-perio PG-D Task 3: two per-tooth categorical DATA axes (registry/FHIR/
  // payload only; the Dental Chart rows/UI land in later PG-D tasks). NO
  // svgLayer — neither renders. Exchanged as Dental Core codes (see DENTAL_CORE_VALUE_CODES).
  gingivalThickness: {
    "unknown": { code: "unknown", display: "Gingival thickness not assessed" },
    "thin": { code: "thin", display: "Thin gingival phenotype" },
    "medium": { code: "medium", display: "Medium gingival phenotype" },
    "thick": { code: "thick", display: "Thick gingival phenotype" },
  },
  millerClass: {
    "none": { code: "none", display: "No recession class assigned" },
    "i": { code: "i", display: "Miller Class I" },
    "ii": { code: "ii", display: "Miller Class II" },
    "iii": { code: "iii", display: "Miller Class III" },
    "iv": { code: "iv", display: "Miller Class IV" },
  },
  periImplant: {
    "none": { code: "none", display: "Peri-implant health" },
    "mucositis": { code: "mucositis", display: "Peri-implant mucositis" },
    "peri-implantitis-mild": { code: "peri-implantitis-mild", display: "Peri-implantitis, mild bone loss" },
    "peri-implantitis-moderate": { code: "peri-implantitis-moderate", display: "Peri-implantitis, moderate bone loss" },
    "peri-implantitis-severe": { code: "peri-implantitis-severe", display: "Peri-implantitis, severe bone loss" },
  },
  radiographicDepth: {
    "none": { code: "none", display: "No radiographic caries depth recorded" },
    "E1": { code: "E1", display: "Enamel, outer half (E1)" },
    "E2": { code: "E2", display: "Enamel, inner half (E2)" },
    "D1": { code: "D1", display: "Dentin, outer third (D1)" },
    "D2": { code: "D2", display: "Dentin, middle third (D2)" },
    "D3": { code: "D3", display: "Dentin, inner third (D3)" },
  },
  fillingDefect: {
    "none": { code: "none", display: "No filling defect" },
    "marginal": { code: "marginal", display: "Marginal defect (overhang / deficient margin)" },
    "fracture": { code: "fracture", display: "Fractured / chipped filling" },
    "wear": { code: "wear", display: "Worn / deficient filling material" },
  },
};

/** A Dental Core coding: a system URL and code, both from the SDK. */
export interface DentalCoreCoding {
  system: string;
  code: string;
}

/**
 * Dental Core ValueSets over an owned CodeSystem that the pinned SDK names but
 * does not enumerate at all (neither `DENTAL_CORE_VALUE_SET_CODES` nor
 * `DENTAL_CORE_CODES` lists its concepts). Their codes can only be tied to the
 * system the ValueSet includes; every other code must be listed by the SDK.
 */
const UNENUMERATED_VALUE_SETS = new Set(["miller-gingival-recession-1985", "icdas-caries-severity"]);

const valueSetUrl = (name: string): string => {
  const url = Object.keys(DENTAL_CORE_VALUE_SETS).find((candidate) => candidate.endsWith(`/ValueSet/${name}`));
  if (!url) throw new Error(`Dental Core ValueSet ${name} is not in the pinned @cognovis/fhir-sdk`);
  return url;
};

/**
 * Resolve a Dental Core code by its ValueSet name. The system URL is taken from
 * the SDK and the code must be a member of the ValueSet, so a typo fails at
 * module load instead of shipping.
 */
export function resolveDentalCoreCode(valueSet: string, code: string): DentalCoreCoding {
  const url = valueSetUrl(valueSet);
  const bySystem = DENTAL_CORE_VALUE_SET_CODES[url];
  if (bySystem) {
    const system = Object.keys(bySystem).find((candidate) => bySystem[candidate].includes(code));
    if (!system) throw new Error(`${code} is not a member of Dental Core ValueSet ${valueSet}`);
    return { system, code };
  }
  const systems = DENTAL_CORE_VALUE_SETS[url];
  const listed = systems.length === 1 ? DENTAL_CORE_CODES[systems[0]] : undefined;
  if (listed) {
    if (!listed.includes(code)) throw new Error(`${code} is not a member of Dental Core ValueSet ${valueSet}`);
  } else if (!UNENUMERATED_VALUE_SETS.has(valueSet) || systems.length !== 1) {
    throw new Error(`Dental Core ValueSet ${valueSet} does not enumerate its codes in the pinned @cognovis/fhir-sdk`);
  }
  return { system: systems[0], code };
}

type CoreRef = readonly [valueSet: string, code: string] | null;
const each = (valueSet: string, codes: Record<string, string>): Record<string, CoreRef> =>
  Object.fromEntries(Object.entries(codes).map(([value, code]) => [value, [valueSet, code] as const]));
const same = (valueSet: string, ...values: string[]): Record<string, CoreRef> =>
  each(valueSet, Object.fromEntries(values.map((value) => [value, value])));
const outOfScope = (...values: string[]): Record<string, CoreRef> =>
  Object.fromEntries(values.map((value) => [value, null]));

/**
 * Catalog value -> Dental Core code, per the fhir-dental-core coverage record
 * (docs/contracts/odontogram-value-coverage.json, ADR-002). `null` marks the
 * values that are deliberately not written as a Dental Core value: surfaces
 * are HL7 FDI-surface locations, `rootResection` stays text under ADR-001, and
 * the absence states of mobility, root caries, radiographic depth and Miller
 * class are not emitted at all.
 */
const DENTAL_CORE_VALUE_CODES: Record<string, Record<string, CoreRef>> = {
  toothSelection: each("tooth-presence", {
    "none": "tooth-absent", "tooth-base": "tooth-present", "milktooth": "primary-tooth-present",
    "implant": "implant-in-tooth-position", "tooth-under-gum": "tooth-retained-under-gingiva",
    "no-tooth-after-extraction": "tooth-absent-extracted", "not-erupted": "tooth-not-erupted",
  }),
  endo: each("root-endodontic-state", {
    "none": "none", "endo-medical-filling": "intracanal-medicament", "endo-filling": "root-canal-filling",
    "endo-filling-incomplete": "incomplete-root-canal-filling", "endo-glass-pin": "glass-fiber-post",
    "endo-metal-pin": "metal-post",
  }),
  fillingMaterial: each("restoration-material", {
    "none": "none", "amalgam": "amalgam", "composite": "composite-resin",
    "gic": "glass-ionomer-cement", "temporary": "temporary-material",
  }),
  prosthesis: each("prosthetic-state", {
    "none": "none", "healing-abutment": "healing-abutment", "locator": "locator-attachment",
    "locator-denture": "locator-retained-overdenture", "bar": "bar-attachment",
    "bar-denture": "bar-retained-overdenture", "removable-partial": "removable-partial-denture",
    "removable-full": "complete-removable-denture",
  }),
  mobility: {
    ...outOfScope("none"),
    ...each("tooth-mobility", { m1: "tooth-mobility-grade-1", m2: "tooth-mobility-grade-2", m3: "tooth-mobility-grade-3" }),
  },
  mods: each("dental-chart-value", { inflammation: "inflammation", parodontal: "periodontal-involvement", mobility: "mobility" }),
  periapicalType: each("dental-chart-value", { none: "none", granuloma: "granuloma", cyst: "radicular-cyst", abscess: "periapical-abscess" }),
  caries: each("caries-finding", {
    "caries-subcrown": "secondary-caries", "caries-buccal": "caries", "caries-lingual": "caries",
    "caries-mesial": "caries", "caries-distal": "caries", "caries-occlusal": "caries",
  }),
  fillingSurfaces: outOfScope("buccal", "lingual", "mesial", "distal", "occlusal"),
  toothSubstrate: each("tooth-substrate", {
    natural: "natural-tooth-structure", radix: "retained-root", broken: "crown-destroyed", crownprep: "prepared-for-crown",
  }),
  restorationType: each("restoration-type", {
    none: "none", crown: "crown", inlay: "inlay", onlay: "onlay", veneer: "veneer", bridge: "bridge-unit",
  }),
  restorationMaterial: {
    ...each("restoration-material", {
      "none": "none", "emax": "lithium-disilicate-ceramic", "gold": "gold-alloy", "gradia": "indirect-composite",
      "zircon": "zirconia", "metal": "cast-metal-alloy", "metal-ceramic": "metal-ceramic", "temporary": "temporary-material",
    }),
    // A telescope is a crown TYPE in Dental Core, not a material.
    ...each("restoration-type", { telescope: "telescopic-crown" }),
  },
  pulpDx: each("pulp-diagnosis", {
    "normal": "normal-pulp", "reversible-pulpitis": "reversible-pulpitis",
    "irreversible-pulpitis": "irreversible-pulpitis", "necrosis": "pulp-necrosis",
  }),
  pulpLatin: same("dental-chart-value", "none", "pulpa-sana", "hyperaemia-pulpae", "pulpitis-acuta-serosa",
    "pulpitis-acuta-purulenta", "pulpitis-chronica-clausa", "pulpitis-chronica-ulcerosa",
    "pulpitis-chronica-hyperplastica", "necrosis-pulpae", "gangraena-pulpae"),
  apicalDx: each("apical-diagnosis", {
    "normal": "normal-apical-tissues", "symptomatic-apical-periodontitis": "symptomatic-apical-periodontitis",
    "asymptomatic-apical-periodontitis": "asymptomatic-apical-periodontitis", "acute-apical-abscess": "acute-apical-abscess",
    "chronic-apical-abscess": "chronic-apical-abscess", "condensing-osteitis": "condensing-osteitis",
  }),
  resorptionType: same("dental-chart-value", "none", "internal", "external-cervical"),
  wearEdge: same("dental-chart-value", "none", "attrition", "erosion"),
  wearCervical: same("dental-chart-value", "none", "abrasion", "abfraction", "erosion"),
  discoloration: each("dental-chart-value", {
    none: "none", tetracycline: "tetracycline-staining", fluorosis: "fluorosis",
    nonvital: "nonvital-darkening", extrinsic: "extrinsic-staining", other: "other-discoloration",
  }),
  orthoAppliance: same("dental-chart-value", "none", "bracket", "band"),
  orthoDrift: same("dental-chart-value", "none", "mesial", "distal"),
  orthoVertical: same("dental-chart-value", "none", "extrusion", "intrusion"),
  rootCaries: {
    ...outOfScope("none"),
    // Active and arrested are one Core value; the caries-lesion-activity
    // component carries which of the two it is.
    ...each("caries-finding", { "active": "root-caries", "arrested": "root-caries", "active-cavitated": "cavitated-root-caries" }),
  },
  orthoBracketSide: outOfScope("buccal", "lingual"),
  sensibility: same("dental-chart-value", "none", "vital", "no-response", "questionable"),
  percussion: same("dental-chart-value", "none", "negative", "sensitive"),
  eruptionStage: same("dental-chart-value", "none", "emerging", "half-crown", "full-crown"),
  rootFracture: same("dental-chart-value", "none", "vertical", "horizontal"),
  rootPostType: each("dental-chart-value", { "none": "none", "glass-fiber": "glass-fiber-post", "metal": "metal-post" }),
  rootResection: outOfScope("none", "hemisection", "amputation", "premolarisation"),
  cejVisibility: same("dental-chart-value", "none", "detectable", "not-detectable"),
  rootConcavity: same("dental-chart-value", "none", "mild", "deep"),
  retention: same("dental-chart-value", "none", "clasp", "attachment", "bar-abutment"),
  retentionSide: same("dental-chart-value", "none", "mesial", "distal", "both"),
  gingivalThickness: each("dental-chart-value", { unknown: "none", thin: "thin", medium: "medium", thick: "thick" }),
  millerClass: {
    ...outOfScope("none"),
    ...each("miller-gingival-recession-1985", { i: "I", ii: "II", iii: "III", iv: "IV" }),
  },
  periImplant: each("peri-implant-status", {
    "none": "peri-implant-health", "mucositis": "peri-implant-mucositis",
    "peri-implantitis-mild": "peri-implantitis-mild-bone-loss",
    "peri-implantitis-moderate": "peri-implantitis-moderate-bone-loss",
    "peri-implantitis-severe": "peri-implantitis-severe-bone-loss",
  }),
  radiographicDepth: {
    ...outOfScope("none"),
    ...each("radiographic-caries-depth", {
      E1: "enamel-outer-half", E2: "enamel-inner-half", D1: "dentin-outer-third", D2: "dentin-middle-third", D3: "dentin-inner-third",
    }),
  },
  fillingDefect: each("restoration-status", {
    none: "none", marginal: "marginal-defect", fracture: "restoration-fracture", wear: "restoration-wear",
  }),
};

/** Every catalog value resolved against the pinned SDK once, at module load. */
const RESOLVED: Record<string, Record<string, DentalCoreCoding | null>> = Object.fromEntries(
  Object.entries(LOCAL_VALUE_MAPS).map(([group, values]) => [group, Object.fromEntries(Object.keys(values).map((value) => {
    const ref = DENTAL_CORE_VALUE_CODES[group]?.[value];
    if (ref === undefined) throw new Error(`Catalog value ${group}:${value} has no Dental Core decision`);
    return [value, ref ? resolveDentalCoreCode(ref[0], ref[1]) : null];
  }))]),
);
for (const [group, values] of Object.entries(DENTAL_CORE_VALUE_CODES)) {
  for (const value of Object.keys(values)) {
    if (!LOCAL_VALUE_MAPS[group]?.[value]) throw new Error(`Dental Core mapping names an unknown catalog value ${group}:${value}`);
  }
}

/**
 * The Dental Core coding of a catalog value, or `null` when the value is not
 * written as a Dental Core value (one of the fifteen out-of-scope values, or
 * not a catalog value at all).
 */
export function dentalCoreCoding(group: string, value: string): DentalCoreCoding | null {
  const coding = Object.prototype.hasOwnProperty.call(RESOLVED, group)
    && Object.prototype.hasOwnProperty.call(RESOLVED[group], value) ? RESOLVED[group][value] : null;
  return coding ? { ...coding } : null;
}

/** `value -> code` for every coded value of a group (one system per group). */
export function dentalCoreCodes(group: string): Record<string, string> {
  return Object.fromEntries(Object.entries(RESOLVED[group] ?? {})
    .flatMap(([value, coding]) => coding ? [[value, coding.code]] : []));
}

/**
 * The catalog value a Dental Core coding stands for in a group, or `undefined`.
 * Where several values share one code (the caries surfaces, active/arrested
 * root caries) the caller has to disambiguate from the carrier.
 */
export function catalogValue(group: string, coding: { system?: string; code?: string } | undefined): string | undefined {
  if (!coding?.system || !coding.code) return undefined;
  const matches = Object.entries(RESOLVED[group] ?? {})
    .filter(([, candidate]) => candidate?.system === coding.system && candidate.code === coding.code);
  return matches.length === 1 ? matches[0][0] : undefined;
}
