# 🦷 React Advanced Odontogram

[![Version](https://img.shields.io/badge/version-5.2.6-green?style=for-the-badge)](https://github.com/ZoliQua/React-Odontogram-Modul/releases)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](https://github.com/ZoliQua/React-Odontogram-Modul/blob/main/LICENSE)
[![DOI](https://raw.githubusercontent.com/ZoliQua/React-Odontogram-Modul/main/src/assets/zenodo.21156787.svg)](https://doi.org/10.5281/zenodo.21156787)

[![React](https://img.shields.io/badge/React-18%20%7C%2019-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**📖 Full documentation is available per language:**

🇬🇧 [English](lang/README-en.md) · 🇩🇪 [Deutsch](lang/README-de.md) · 🇪🇸 [Español](lang/README-es.md) · 🇫🇷 [Français](lang/README-fr.md) · 🇮🇹 [Italiano](lang/README-it.md) · 🇭🇺 [Magyar](lang/README-hu.md) · 🇵🇱 [Polski](lang/README-pl.md) · 🇧🇷 [Português (BR)](lang/README-pt-br.md) · 🇸🇰 [Slovenčina](lang/README-sk.md) · 🇷🇺 [Русский](lang/README-ru.md) · 🇸🇦 [العربية](lang/README-ar.md) · 🇨🇳 [简体中文](lang/README-zh.md)

An interactive, SVG-based **dental odontogram (dental chart) editor** for **React + TypeScript** — with a full **periodontal charting module**, multi-surface caries/restorations, endodontic/prosthetic states, FDI/Universal/Palmer numbering, **Aidbox** Dental Core via `@cognovis/fhir-sdk` (hosts inject a gateway; the session loads and saves; no public FHIR JSON-bundle export), optional ICDAS scoring, and a 12-language UI.

🔗 **Live demo:** https://react-odontogram-modul.vercel.app/ \
📚 **API docs:** https://zoliqua.github.io/React-Odontogram-Modul/

![Odontogram editor preview](https://raw.githubusercontent.com/ZoliQua/React-Odontogram-Modul/main/lang/screenshot_en_odontogram.png)

---

## 📦 Installation

```bash
bun add @cognovis/odontogram react react-dom
```

**Requirements:** React **18 or 19** (peer dependency); a bundler that supports the `exports` field and ESM (Vite, webpack 5, Next.js, Rollup, esbuild, Parcel). The package is **ESM-only**.

## 🚀 Quick start

Render `OdontogramShell` and import the stylesheet **once**:

```tsx
import { OdontogramShell } from "@cognovis/odontogram";
import "@cognovis/odontogram/style.css";

export function Chart() {
  return <OdontogramShell language="en" numberingSystem="FDI" darkMode={false} />;
}
```

The imperative state API, the standalone `PerioChart` component, the guided tour, and all public types are named exports from the same entry point (`OdontogramShell` is also the default export):

```ts
import {
  OdontogramShell,        // also the default export
  PerioChart,             // standalone periodontal chart
  getOdontogramSummary,
  exportStatus, importStatus,   // JSON state serialization / hydration
  exportSvg, exportImage,
  createOdontogramSession, // FHIR: session.loadFromAidbox / saveToAidbox
  setReadOnly, startIntroTour,
} from "@cognovis/odontogram";
```

> **SSR:** the component is client-only (reads the DOM on mount). In Next.js render it in a Client Component (`"use client"`) or via a client-only dynamic import.
> **The stylesheet styles only the chart** — tokens on `.odontogram-root`, driven by `--odon-*` CSS variables. In the unreleased version it sets nothing on `:root`, `html` or `body`, so your page background, font and own tokens stay yours; surfaces the chart appends to `<body>` (tour, popovers, context menu) carry `.odontogram-portal`.
> **Assets are self-contained** — tooth/icon SVGs are inlined into the bundle; there is no runtime asset fetch to configure.

## 🔌 Host integration: the UI-domain document

The component's clinical state is a **UI-domain document** — the same versioned
JSON `exportStatus()` writes and `importStatus()` reads. That document, not FHIR,
is what React state holds and what a host owns.

Bind an instance to an isolated **session** to initialize and observe it, and to
keep two mounted odontograms independent:

```tsx
import {
  OdontogramShell, createOdontogramSession,
  type OdontogramDocument, type OdontogramSession,
} from "@cognovis/odontogram";

const upper: OdontogramSession = createOdontogramSession(savedUpperDocument);
const lower: OdontogramSession = createOdontogramSession(savedLowerDocument);

<OdontogramShell session={upper} onDocumentChange={(doc) => save("upper", doc)} />
<OdontogramShell session={lower} onDocumentChange={(doc) => save("lower", doc)} />
```

`session.getDocument()` / `setDocument()` / `subscribe()` remain the document
contract. Hosts that need **treatment intent** read it from that same session:

```ts
const changes = session.getPlanChanges(); // [] until a plan exists
const plan = session.getPlanChart();
session.getChartMode();
session.setChartMode("plan");
```

Those four methods are bound to **this** session's document, whether or not the
session currently owns the engine. Host applications should
use them. Module-level `getPlanChanges` / `getPlanChart` / `getChartMode` /
`setChartMode` are shell-internal: they delegate to whichever session currently
owns the engine and must not be used to derive another patient's plan.

Passing a plain `document` prop instead makes the instance create and own a
private session seeded from it. Passing **neither** keeps the historical
standalone behaviour: the component runs on the process-wide default session and
every module-level entry point (`exportStatus`, `importStatus`, `getStatusChart`,
…) applies to it exactly as before — no migration is required.

> **One live editor at a time.** The interactive DOM editor is a single global
> engine bound to one tooth grid, so exactly one mounted instance drives it:
> that instance renders the chart and its session is the live one. The others
> render an inactive placeholder instead of a second copy of the engine's global
> element ids, and keep their own document — still fully readable and writable
> through their session API. Ownership passes to a waiting instance when the
> current one unmounts.

### FHIR is a Dental Core mapping over `@cognovis/fhir-sdk`

FHIR conversion is a pure adapter over the UI-domain document: it performs no DOM access, network I/O, wall-clock reads, randomness, transport, persistence, or authentication. Dental Core `de.cognovis.fhir.dental.core#0.10.0` (through the tested `@cognovis/fhir-sdk` peer) is the sole FHIR contract. Every tooth-state and chart-finding value is written and read only as its Dental Core code: system URLs come from `@cognovis/fhir-sdk/terminology`, each code is checked against its ValueSet when the module loads, and there is no local code system, fallback or alias (`dentalCoreCoding(group, value)` in `registry/valueCatalog.ts` gives the code of each catalog value, or `null` for the fifteen values that are not written as a Dental Core value). Version 4.0.0 removes the public `./fhir` JSON-bundle API (`buildFhirBundle` / `parseFhirBundle`, `exportFhir`, `session.exportFhirBundle` / `importFhirBundle`) and local codegen. Hosts talk to Aidbox through `session.loadFromAidbox` / `session.saveToAidbox` with an injected gateway; mapping classes and canonicals come from `@cognovis/fhir-sdk` only. Foreign or unmapped Dental Core codes are listed as unsupported on live load rather than rejecting the rest of the chart. The current source-preservation contract retains eleven target axes: `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot`, and `apicalRoot`. These are structural source assertions: the adapter does not turn them into new diagnoses, numbered canals, implant products, or bridge relationships. Root posts use the orthogonal `rootPostType` axis (`none`, `glass-fiber`, `metal`) and therefore remain representable beside every `endo` filling state, including `endo-filling-incomplete`. Legacy JSON `endo-glass-pin` / `endo-metal-pin` values, and a whole-tooth Dental Core `glass-fiber-post` / `metal-post` endodontic state, remain readable and migrate to `endo-filling` plus the corresponding post material. Since 5.0.0, `extractionPlan`, `crownNeeded` and `crownReplace` are written as Dental Core 0.8 tooth-level orders (SNOMED CT 55162003 / 426222000, with `restoration-renewal` on the crown fitting); orders written with the former local code are not read.

The adapter accepts only the root identities offered by the current tooth position, including `single` for a single-rooted tooth. It rejects empty `endoCanals` maps, mutually exclusive canal fill states, and root-fracture or root-resection qualifiers without their parent finding. The ordinary document serializer omits or clears those malformed shapes.

A clinical Dental Core write requires an effective date supplied by the caller, the examination context, or `case.examDate`. The codec projects the IG carrier contract across tooth and root caries, restorations, endodontic and diagnostic findings (pulp and apical diagnosis and radiographic caries depth on their own Dental Core profiles), periodontal and peri-implant findings, implant identity (UDI in `udiCarrier.carrierHRF`), treatment requests, and the tooth note (as `Observation.note` on the tooth's `DentalToothState`) while retaining host resource identity. A populated `assessment` has no Dental Core carrier yet and is refused with `UnsupportedDentalCoreContentError`.

When the document carries a `plan` section, Dental Core emit includes `CarePlan/plan` and one `ServiceRequest/{fdi}` per planned tooth. The eleven source-preservation axes above use a referenced target-chart `Goal`; established plan fields continue to use their profiled planned Observations. The Goal keeps desired state separate from observed resources: a planned removed root, implant position, bracket side, or cantilever flag does not claim that a procedure was performed or that a device exists. Hosts derive the intent from `session.getPlanChanges()`.

Diabetes, HbA1c, smoking, and edentulous resources remain owned by the host patient record and are never minted by this codec. When those document fields are populated, pass their existing Condition or Observation entries through the mapping's `sharedResources`; the collection carries them unchanged, records their references in Provenance, and fails closed if a required host resource is absent or inconsistent. The smoking-status Observation (LOINC 72166-2) is read through its LOINC LL2201-3 / IPS Current Smoking Status answer codes only, and the Provenance reason that references a host resource is text only.

### Aidbox live mode (development)

The standalone app (`apps/standalone`) has **one** entry page and chooses its mode at runtime: it boots in live mode on `?live`, on `?patient=<id>`, or whenever an Aidbox configuration is present in its environment, and otherwise serves the fixture playground. In live mode it loads one patient's chart straight from an Aidbox server, renders it in the ordinary shell through the session API above, and writes changes back as Dental Core resources under deterministic ids, so a re-save updates instead of duplicating.

Copy `apps/standalone/.env.example` to `apps/standalone/.env` and fill in a scoped machine client (see [`docs/aidbox-live-mode.md`](../../docs/aidbox-live-mode.md)), then, from the workspace root:

```bash
bun install
bun run dev                                 # then open http://localhost:5173/?live
```

Never put an admin credential in `VITE_*`.

The HTTP half is its own package, [`@cognovis/odontogram-fhir`](../odontogram-fhir), which holds the Aidbox transport and gateway factory and depends on `@cognovis/fhir-sdk/client`. This package ships the Aidbox gateway **SPI** and the session load/save/write-plan delegates — the HTTP-free half — and still does **not** include `@cognovis/fhir-sdk/client`. `@cognovis/fhir-sdk` is a required peer here, for the Dental Core mapping classes; the executable host owns its exact version. Setup and the load/save mechanics are in [`docs/aidbox-live-mode.md`](../../docs/aidbox-live-mode.md). Odontogram 5.2.6 supports SDK `^0.22.0 || ^0.23.0` and is built and tested with exact dev pin `0.23.0` (Dental Core 0.10.0). Consumers pin that SDK themselves, without an override. The paired transport release `@cognovis/odontogram-fhir@5.2.6` uses the same SDK peer range and dev pin, so chart and transport share the host SDK.

## 🦷 Periodontal charting

![Full-mouth periodontal chart](https://raw.githubusercontent.com/ZoliQua/React-Odontogram-Modul/main/lang/screenshot_en_perio.png)

Per-site probing depth, gingival margin, bleeding **and suppuration** on probing at the six standard sites, with derived CAL, recession and whole-mouth %BOP; a graphical full-mouth perio chart (CEJ line, mm guide grid, pocket/margin curve, anatomical diamond index tiles), and 2017 staging/grading. Available as an `Odontogram | Periodontal Status` view toggle and as a separately-invocable `PerioChart` component.

An implant column supports the **peri-implant examination**: six-site probing depth, bleeding, suppuration, implant mobility and keratinized-tissue width, alongside the Mombelli mPI/mBI indices. Only the axes that need a CEJ — the gingival margin and the CAL derived from it — and the natural-tooth plaque indices stay inactive there.

### 🗓️ Dated examinations

A periodontal case is re-examined over years, so a document carries the examination's own
identity and an archive of earlier examinations:

```ts
setExaminationContext({
  id: "exam-2026-06-30", subject: "Patient/123", effectiveDateTime: "2026-06-30",
  performer: "Practitioner/dr-mueller", encounter: "Encounter/9912",
});

captureExamination({ effectiveDateTime: "2026-06-30" }); // archive today's findings
listExaminations();                                      // identities, oldest first
getExamination(id);                                      // one archived examination, detached
loadExamination(id);                                     // review it; the archive keeps it
startExamination({ effectiveDateTime: "2027-01-15" });   // links to the previous one
```

Each archived examination is an **independent snapshot** of the whole-mouth findings and case
context at capture time: later edits never reach into it, and capturing again files a follow-up
instead of overwriting the baseline a trend depends on. Status and plan keep meaning **current
versus proposed within one examination** — the plan chart is never history and is never part of
a snapshot. Every identity field is an opaque, host-owned string the component stores and
round-trips but never interprets; documents written before payload 2.21 carry none of this and
hydrate unchanged.

### 🔎 Assessed, not assessed, unmeasurable, not applicable

Periodontal charting stores findings, not the act of looking, so "probed, did not bleed" and
"nobody probed" used to look identical. Every axis in scope (PD, GM, BOP, suppuration, mobility,
furcation, plaque, PI, GI, mPI, mBI, KG) can say which it is:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");    // assessed-normal
setAssessmentStatus(16, "pd", "DB", "unmeasurable"); // the point exists, it could not be read
getAssessmentStatus(16, "mpi", "buccal");            // "not-applicable" on a natural tooth
perioAxisApplies(16, "gm");                          // true  — a natural tooth has a CEJ
perioAxisApplies(11, "gm");                          // false — once tooth 11 is an implant
```

Not-applicable is derived from what the tooth actually is, and a real measurement always wins
over a recorded gap. The same matrix, `perioAxisApplies()`, also governs the periodontal
setters, so a measurement the chart shows as inapplicable cannot be written through the API
either. On export an unavailable value becomes FHIR's own `dataAbsentReason` — never a
renderer-invented clinical code — and assessed-normal becomes an explicit `false` or grade `0`.

**Authoring (from 2.7.0):** an **Assessment status** toggle in the periodontal chart header
adds a companion row under every visible index row, with one cycle button per measurement point
— site, surface, furcation entrance, or the whole tooth. The rows are off by default. A point
that already holds a measurement is locked (the value is its own evidence of examination), and an
inapplicable position is disabled rather than silently ignored. Recorded statuses also appear in
the tooth tooltip and the whole-mouth periodontal summary.

## ⌨️ Charting by shorthand

Findings are taken in seconds, often dictated. With 46 axes and 129 values the number of click
paths is the bottleneck, so the chart can be filled the way a practitioner already types
(`odontogram-t8y`):

```
mark 13–23        drag across the teeth, or Shift + arrow, or Shift + click
E                 material mode: ceramic — it stays set
k                 six crowns, one keystroke
```

**The material comes first and stays**, as a mode rather than an afterthought. One material key
has two readings, because a filling and a restoration draw on different value sets: `K mo` is a
composite filling on two surfaces, `K k` a crown in Gradia. Where a reading does not exist, none
is invented.

**Tab steps to the next tooth**, Shift+Tab back, starting at 18 and running around the mouth
(18–28, then 38–48) with a wrap. It moves the *selection*, not merely the focus, so the tooth you
are standing on is highlighted. The arrow keys are unchanged: they are the map, Tab is the round.

```
G k    Tab    b          gold crown, then a pontic on the neighbour
A  mod Tab               one amalgam filling over three surfaces
c mod K3                 caries on three surfaces, at a severity
```

A key that is a finding on its own applies at once — marking six anteriors and pressing `k` is the
whole gesture. What waits is only what cannot be complete yet: a run that has been opened
(surfaces, `c`) or a key some longer key begins with.

The mapping lives in `src/shorthand.ts`, DOM-free and independent of the engine, because the same
finding set has to be reachable three ways: keystrokes, a FHIR query against a practice system, and
speech. A table inside a key handler would grow a second table beside it.

The shorthand itself is not invented: it is transcribed from the finding keypad of *charly*
(solutio), with the meanings resolved by a practising dentist rather than guessed. Seven of its keys are understood and have no axis here
yet; they are reported as such rather than silently ignored, since a typo and a missing axis are
different situations.

Both halves are switchable in **Settings → Shorthand**, separately: charting by
shorthand, and the Tab walk. Off means off — no keystroke lands, and Tab leaves the chart as it
does everywhere else, because a chart nobody types on should not have a standard navigation key
taken from it. The key table is listed in the tab itself; a shorthand nobody can look up is a
shorthand nobody uses.

Selecting a span follows the **arch**, not the geometry (`odontogram-apn`): a rectangle over the
tile centres picks up the opposing jaw as soon as the pointer strays. Across the midline (13 to 23)
yes, across the jaw never.

## ✨ Highlights

- 🎨 **One drawing per tooth position** — sixteen permanent side views (11–18, 41–48), twenty occlusal
  views and the primary dentition, drawn from measured anatomy. Nothing is shared across the jaws: a lower molar is its own drawing, not an upper one
  turned upside down. The anterior positions have a top view, which is what makes a palatal finding on
  an incisor chartable at all — a side view shows the labial surface face-on and has no lingual aspect
- 🦷 Permanent / primary / implant / missing teeth; substrate, restorations (crown/inlay/onlay/veneer/bridge × materials), removable & implant prosthetics
- 🦴 **Root fracture and resective surgery** — vertical/horizontal root fracture with a fracture line drawn through the affected root, and hemisection / root amputation / premolarisation with the removed root clipped away. Which root is named per position, so a palatal value never lands on a lower molar
- 🧪 **The pulp tests, not only the diagnosis** — sensibility (vital / no response / questionable) and percussion (negative / tender) as their own axes. `none` means *not tested*, never *unremarkable*: `apicalDx` separates symptomatic from asymptomatic apical periodontitis, and what separates those two is percussion tenderness
- 🔍 Multi-surface caries & fillings (ICDAS / CARS severity, root & radiographic caries), endo & AAE pulp diagnosis, apical diagnosis, peri-implant status, wear, discoloration, orthodontics
- 🩺 Full periodontal module (see above) + 2017 classification
- 🧭 **Orthodontics is the third clinical view** (`odontogram-c51`): an `Odontogram | Periodontal Status | Orthodontics` switcher (`#appViewToggle`) houses the model-analysis card below. The odontogram is never unmounted, only hidden, so a change of view cannot disturb the chart. The orthodontic view has no dialog housing of its own and therefore stays a segment of the switcher even where the periodontal chart is configured as a popup — only the periodontal segment goes.
- 📐 **Model analysis** (`odontogram-c51.1`): Tonn and Bolton from the mesiodistal crown widths, with the target incisor sum, the tooth-size discrepancy and which arch carries the surplus. Widths are entered on an arch or as a list — two views of one record. A tooth that is not on the model (not erupted, lost, under the gum) borrows its contralateral partner's width, visibly marked as an assumption. Plus overjet, overbite and the dental midline deviation per arch
- 🔗 **Aidbox Dental Core** via `@cognovis/fhir-sdk` — hosts inject a gateway; the session loads and saves. JSON status export/import with migrations
- ⌨️ **Charting by shorthand** (see above) — mark teeth by dragging, Shift+arrow or Shift+click, then type the finding; Tab walks the arch
- 🪞 **Depth shading** — a body gradient across crown and root and a soft shading where the tooth enters the gum, so the arch reads as a relief rather than a cut-out. Only the tooth substance is shaded: colour carries meaning here. One switch in Settings → Tooth details
- 🔢 FDI / Universal / Palmer numbering · 🌐 12 UI languages (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR/AR/ZH/FR, Arabic RTL) · 🎨 theming via `--odon-*` CSS variables · 🧩 plugin system · ⌨️ keyboard accessibility

## 📖 Documentation

Per-language guides are linked at the top of this file. Full API reference (TypeDoc):

📚 **https://zoliqua.github.io/React-Odontogram-Modul/**

## 📄 License & citation

MIT © Zoltán Dul. If you use this software in research, please cite it — see [`CITATION.cff`](../../CITATION.cff) and the [Zenodo record](https://doi.org/10.5281/zenodo.21156787).
