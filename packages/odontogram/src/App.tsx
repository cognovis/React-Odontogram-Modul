// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { useEffect, useRef, useState } from "react";
import { destroyOdontogram, initOdontogram, setNumberingSystem, clearSelection, setOcclusalVisible, setWisdomVisible, setShowBase, setHealthyPulpVisible, registerPlugins, setPluginState, getPluginState, getToothStateSummary, getOdontogramSummary, formatToothLabel, onStateChange, setReadOnly, getReadOnly, setNotesEnabled, getNotesEnabled, setIcdasEnabled, getIcdasEnabled, setPulpDetailLevel, getPulpDetailLevel, setSecondaryCariesMode, getSecondaryCariesMode, setRootCariesMode, getRootCariesMode, setRadiographicDepthMode, getRadiographicDepthMode, setCariesDepthEnabled, getCariesDepthEnabled, setWearDetailLevel, getWearDetailLevel, setDiscolorationDetailLevel, getDiscolorationDetailLevel, setSurfaceNotation, getSurfaceNotation, exportImage, exportSvg, openPerioOverlay, closePerioOverlay, isPerioOverlayOpen, getPerioViewMode, setPerioViewMode, getPerioRowVisibility, setPerioRowVisibility, getPerioIndexNameMode, setPerioIndexNameMode, isDualStateConfirmPending, acceptDualStateConfirm, cancelDualStateConfirm, getImportAsBaseline, setImportAsBaseline, getChartMode, setChartMode, getStatusChart, getPlanChart, setPlanChart, getPlanChanges, exportStatus, importStatus, selectToothInChart, setChartSelection, hasAnyPerioData, applyShorthand, onChartSelectionChange, getBefundDockEnabled, setBefundDockEnabled, setShorthandMaterial, getShorthandMaterialChar, getSelectedTeeth, getActiveTooth } from "./odontogram";
export { clearSelection, setOcclusalVisible, setWisdomVisible, setShowBase, setHealthyPulpVisible, registerPlugins, setPluginState, getPluginState, getToothStateSummary, getOdontogramSummary, formatToothLabel, onStateChange, setReadOnly, getReadOnly, setNotesEnabled, getNotesEnabled, setIcdasEnabled, getIcdasEnabled, setPulpDetailLevel, getPulpDetailLevel, setSecondaryCariesMode, getSecondaryCariesMode, setRootCariesMode, getRootCariesMode, setRadiographicDepthMode, getRadiographicDepthMode, setCariesDepthEnabled, getCariesDepthEnabled, setWearDetailLevel, getWearDetailLevel, setDiscolorationDetailLevel, getDiscolorationDetailLevel, setSurfaceNotation, getSurfaceNotation, exportImage, exportSvg, getPerioViewMode, setPerioViewMode, getPerioRowVisibility, setPerioRowVisibility, getPerioIndexNameMode, setPerioIndexNameMode, isDualStateConfirmPending, acceptDualStateConfirm, cancelDualStateConfirm, getImportAsBaseline, setImportAsBaseline, initOdontogram, destroyOdontogram, setNumberingSystem, getChartMode, setChartMode, getStatusChart, getPlanChart, setPlanChart, getPlanChanges, openPerioOverlay, closePerioOverlay, isPerioOverlayOpen, hasAnyPerioData, exportStatus, importStatus };
// The host selection seam. These already drove the Befund-Dock
// internally; an embedding host needs the same state
// without reading `.tooth-tile.active` out of our DOM.
export { onChartSelectionChange, getSelectedTeeth, getActiveTooth, setChartSelection, selectToothInChart, applyShorthand, getBefundDockEnabled, setBefundDockEnabled };
export { default as PerioChart } from "./PerioChart";
// Bead odontogram-3l1: the controlled-integration surface (UI-domain document
// + instance-isolated clinical sessions) and the Dental Core codec.
import {
  createOdontogramSession, getDefaultOdontogramSession,
  normalizeOdontogramDocument,
  createEngineClaim, claimEngine, releaseEngine, ownsEngine, onEngineOwnerChange,
} from "./odontogram";
export {
  createOdontogramSession, getDefaultOdontogramSession, getActiveOdontogramSession,
} from "./odontogram";
// The document an embedding host must compare against.
// Activating a session loads the live clinical state, and its snapshot always
// carries all 32 teeth hydrated from their defaults. A host that baselines the
// stored (possibly sparse) document instead reads the activation itself as an
// edit. This is the engine's own normalisation, so a host never restates
// clinical defaults of its own.
export { normalizeOdontogramDocument } from "./odontogram";
// Lets an embedding host observe the engine handover.
export type { OdontogramSession, OdontogramDocument, ChartMode, PlanChange } from "./odontogram";
export type {
  AidboxGateway, PagedSearchResult, LoadResult, LoadReport, UnsupportedResource,
  WriteTarget, WriteResult, WriteFailure, LoadOutcome, WritePlan, WriteOp, SkippedResource,
} from "./odontogram";
// Bead odontogram-2vd: examination identity, dated examination snapshots, and
// the explicit periodontal assessment status (assessed-normal / not assessed /
// unmeasurable / not applicable).
export {
  getExaminationContext, setExaminationContext, resetExaminationContext,
  captureExamination, startExamination, listExaminations, getExamination,
  removeExamination, loadExamination, resetExaminations,
  getAssessmentStatus, setAssessmentStatus, getToothAssessments,
  perioAxisApplies, PERIO_ASSESSMENT_AXES,
} from "./odontogram";
export type { ExaminationContext, AssessmentStatus, PerioAssessmentAxis } from "./odontogram";
export type { ExaminationSnapshotRecord, ExaminationContextRecord } from "./document";
import type { EngineClaim } from "./odontogram";
import type { OdontogramSession, OdontogramDocument } from "./odontogram";
import type { OdontogramSummary, PulpDetailLevel, SecondaryCariesMode, RootCariesMode, RadiographicDepthMode, ToothDetailLevel, SurfaceNotation, PerioViewMode, PerioRowId, PerioIndexNameMode } from "./odontogram";
export type { PulpDetailLevel, SecondaryCariesMode, RootCariesMode, RadiographicDepthMode, ToothDetailLevel, SurfaceNotation, PerioViewMode, PerioRowId, PerioIndexNameMode } from "./odontogram";
export type { OdontogramSummary, OdontogramSummarySection } from "./odontogram";
import { startIntroTour } from "./tour";
export { startIntroTour } from "./tour";
import { useI18n } from "./i18n/useI18n";
import SettingsModal, { type SettingsState } from "./SettingsModal";
import PerioChart from "./PerioChart";
import PerioSidebar from "./PerioSidebar";
import ModelAnalysisCard from "./ModelAnalysisCard";
import SchematicKeypad from "./SchematicKeypad";
// Bead odontogram-ap7: capture/correct the initial examination.
import ExaminationCard from "./ExaminationCard";
import { PlanSelector } from "./PlanSelector";
import DualStateConfirm from "./DualStateConfirm";
import type { Language } from "./i18n/translations";
import type { NumberingSystem } from "./utils/numbering";
import { applyThemeConfig, type OdontogramThemeConfig } from "./theme";
export type { OdontogramThemeConfig };
import type { OdontogramPlugin, PluginLayer } from "./plugin";
export type { OdontogramPlugin, PluginLayer };
// Toolbar icons rendered as inline SVG (via `loadInlineIcon`, which parses the
// `data-icon-src` markup) are imported `?raw` so they inline into the JS bundle
// as strings — no runtime fetch. `iconNoSelectionUrl` is rendered as an
// `<img src>` instead, so it stays a URL import: the library build inlines this
// small asset as a self-contained `data:` URI (Vite `assetsInlineLimit`).
import icon8Svg from "./assets/icon-svgs/icon_8.svg?raw";
import iconGumSvg from "./assets/icon-svgs/icon_gum.svg?raw";
import iconNoSelectionUrl from "./assets/icon-svgs/icon_no_selection.svg";
import iconOcclSvg from "./assets/icon-svgs/icon_occl.svg?raw";
import iconPulpSvg from "./assets/icon-svgs/icon_pulp.svg?raw";

// Task 4 (Arabic+Chinese sub-project): languages whose native reading
// direction is right-to-left. Only Arabic today; Chinese (zh) is LTR.
// The shell root's `dir` is reactive to the active `lang` (never mutates
// `document.documentElement` — an embedding host page's direction is not
// ours to change), while the dental/perio charts stay pinned `dir="ltr"`
// (see `#toothGrid` below + the defensive CSS rule in `src/index.css`) since
// they are diagrams read 18->28 left-to-right in every locale.
const RTL_LANGUAGES: ReadonlySet<Language> = new Set(["ar"]);
function isRtl(lang: Language): boolean {
  return RTL_LANGUAGES.has(lang);
}

/**
 * Props for the main Odontogram application component.
 *
 * All props are optional — when omitted, the component operates in
 * **standalone** mode with internal state. When provided, the component
 * operates in **controlled** mode and delegates state to the parent.
 */
type AppProps = {
  /** Override the UI language (controlled mode). */
  language?: Language;
  /** Callback when the user changes the language. */
  onLanguageChange?: (lang: Language) => void;
  /** Override the tooth numbering system (controlled mode). */
  numberingSystem?: NumberingSystem;
  /** Callback when the user changes the numbering system. */
  onNumberingChange?: (system: NumberingSystem) => void;
  /** Override dark mode state (controlled mode). */
  darkMode?: boolean;
  /** Callback when the user toggles dark mode. */
  onDarkModeChange?: (dark: boolean) => void;
  /**
   * Custom theme configuration. Overrides the default color palette via
   * CSS custom properties (`--odon-*`). See {@link OdontogramThemeConfig}.
   */
  themeConfig?: OdontogramThemeConfig;
  /**
   * Custom SVG plugins for extending the odontogram with additional visual
   * overlays and per-tooth custom state. See {@link OdontogramPlugin}.
   */
  plugins?: OdontogramPlugin[];
  /**
   * When true, disables all interactions (click, touch, keyboard).
   * Useful for print/report/view modes.
   */
  readOnly?: boolean;
  /**
   * When true, enables per-tooth notes. Double-click a tooth to add/edit a note.
   * Notes are shown in hover tooltips and included in JSON export/import.
   */
  enableNotes?: boolean;
  /**
   * Enable ICDAS II per-surface caries scoring (0–6). When enabled, the depth
   * selector/popup expose ICDAS codes 1–6 and the surface indicator shows a
   * numeric badge; otherwise the 3-level scale is used.
   */
  enableIcdas?: boolean;
  /**
   * Pulp-diagnosis detail level for the pulp control:
   * `"simple"` (healthy / pulpitis), `"aae"` (4 AAE pulp diagnoses, default) or
   * `"latin"` (9 practical-Latin subtypes). A stored value round-trips at every
   * level; the level only governs how the pulp control presents it.
   */
  pulpDetailLevel?: PulpDetailLevel;
  /**
   * Secondary-caries (CARS) granularity for the per-surface score picker:
   * `"simple"` ([0,3]), `"standard"` ([0,1,3,6], default) or `"full"` ([0..6]).
   * A stored score round-trips at every mode; the mode only governs the offered
   * option list. (The mode UI lives in the Settings modal; this prop is the
   * controlled entry point.)
   */
  secondaryCariesMode?: SecondaryCariesMode;
  /**
   * Root-caries granularity for the per-tooth picker: `"simple"` (none /
   * present, default) or `"severity"` (the full none/active/arrested/
   * active-cavitated enum). Non-collapsing across modes.
   */
  rootCariesMode?: RootCariesMode;
  /**
   * Radiographic-depth granularity for the per-surface picker: `"off"`
   * (hidden, default), `"threeLevel"` (superficial/middle/deep) or `"detailed"`
   * (E1..D3). When off, the per-surface radiographic badge is not shown.
   */
  radiographicDepthMode?: RadiographicDepthMode;
  /**
   * Whether the visual caries-depth encoding (per-surface depth picker + the
   * opacity/contour depth tier in the render) is active. Default `true`; set
   * `false` to render caried surfaces at the SVG default with no depth tier.
   */
  cariesDepthEnabled?: boolean;
  /**
   * Detail level for the per-tooth wear control: `"simple"` (yes/no toggle for
   * attrition) or `"complex"` (wear type per edge and cervix, default).
   */
  wearDetailLevel?: ToothDetailLevel;
  /**
   * Detail level for the per-tooth discoloration control: `"simple"` (yes/no
   * toggle) or `"complex"` (choose the discoloration cause, default).
   */
  discolorationDetailLevel?: ToothDetailLevel;
  /**
   * Surface-notation mode for caries/filling surface letters + captions:
   * `"full"` (default) makes them position-aware (incisal on an anterior
   * tooth, labial on an anterior buccal surface, palatal on an upper lingual
   * surface) or `"simple"` (always the tooth-independent B/O/L set).
   */
  surfaceNotation?: SurfaceNotation;
  /**
   * Whether the Statuses panel (`#statusCard`) is shown. Default `true`. The
   * panel visibility is a settings-driven wrapper around the section — the
   * section's own imperative collapse/expand behavior is unaffected.
   */
  showStatusCard?: boolean;
  /**
   * Whether the Orthodontics panel (`#orthoCard`) is shown. Default `true`.
   * Composes with the panel's own imperative ortho-eligibility gate (hidden
   * when no selected tooth is ortho-eligible) — both must be satisfied for
   * the panel to render.
   */
  showOrthoCard?: boolean;
  /**
   * Bind this instance to an isolated clinical session created with
   * `createOdontogramSession()`. This is the instance-isolation contract: two
   * mounted odontograms holding two different sessions never share clinical
   * state.
   *
   * Omit BOTH `session` and `document` to keep the historical standalone
   * behaviour, where the component runs on the process-wide default session and
   * every module-level entry point (`exportStatus`, `importStatus`, ...) applies
   * to it unchanged.
   */
  session?: OdontogramSession;
  /**
   * Initialize this instance from a UI-domain document — the same versioned
   * JSON `exportStatus()` produces. Supplying it (without `session`) makes the
   * component create and own a private session seeded with the document;
   * replacing the prop loads the new document into that session.
   *
   * Ignored when `session` is given: the session is then the source of truth.
   */
  document?: OdontogramDocument;
  /**
   * Observe this instance's document. Called whenever its clinical state
   * changes, with the current document. Purely observational — the component
   * never asks the host to store or transport it.
   */
  onDocumentChange?: (doc: OdontogramDocument) => void;
  /**
   * Where the right control panel sits.
   *
   * `"inline"` (default) is the standalone layout: the panel is a column of the
   * chart grid. `"compact"` is the embedded-host layout: the SAME panel becomes
   * a bounded ~320 px inspector over the chart's right edge, and its sections
   * are presented one group at a time through the group navigation this module
   * renders in the panel header. Either way the panel is moved, never cloned —
   * one `aside.panel`, one set of wired controls.
   */
  panelPlacement?: PanelPlacement;
  /**
   * Controlled override for the finding dock below the anatomical chart
   * (the Settings `befundDock` flag). Omit to keep the standalone default.
   */
  befundDock?: boolean;
  /**
   * Controlled override for the whole-mouth "Tooth information" read-back
   * (the Settings `toothInfo` flag). Omit to keep the standalone default.
   */
  toothInfoCard?: boolean;
  /**
   * Observe which clinical workspace is showing. A host that wants to label or
   * frame the current view reads it here instead of inspecting our DOM.
   */
  onViewChange?: (view: AppView) => void;
};

/**
 * The compact inspector's groups, in panel order. Labels reuse the existing
 * card titles, so no group invents a clinical term of its own.
 */
const PANEL_GROUPS: { id: PanelGroup; labelKey: string }[] = [
  { id: "tooth", labelKey: "panel.activeTooth" },
  { id: "surfaces", labelKey: "caries.title" },
  { id: "roots", labelKey: "card.rootPeriodontium" },
  { id: "more", labelKey: "status.title" },
];

const LANGUAGE_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: "hu", labelKey: "language.hu" },
  { value: "en", labelKey: "language.en" },
  { value: "de", labelKey: "language.de" },
  { value: "es", labelKey: "language.es" },
  { value: "it", labelKey: "language.it" },
  { value: "sk", labelKey: "language.sk" },
  { value: "pl", labelKey: "language.pl" },
  { value: "ru", labelKey: "language.ru" },
  { value: "pt-br", labelKey: "language.pt-br" },
  { value: "zh", labelKey: "language.zh" },
  { value: "ar", labelKey: "language.ar" },
  { value: "fr", labelKey: "language.fr" },
];

/**
 * Root React component for the Odontogram Editor.
 *
 * Renders the full dental chart UI: top bar with language/numbering/dark-mode
 * controls, the SVG tooth grid, and the right-hand control panel for setting
 * tooth states (caries, fillings, crowns, endo, inflammation, etc.).
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <App />
 *
 * // Controlled by a host application
 * <App
 *   language="en"
 *   onLanguageChange={setLang}
 *   numberingSystem="FDI"
 *   onNumberingChange={setNumbering}
 *   darkMode={isDark}
 *   onDarkModeChange={setDark}
 * />
 * ```
 */
/**
 * Which clinical workspace the switcher is showing.
 *
 * Three since bead odontogram-c51, whose own title says it: *"Orthodontics is
 * the third clinical odontogram view."* The odontogram is NEVER unmounted for
 * any of them — a view change only hides its column with CSS, which is what
 * keeps the SVG-fingerprint parity byte-identical and what keeps
 * `wireControls()`'s one-time listeners attached.
 */
export type AppView = "odontogram" | "dentalChart" | "ortho";

/**
 * Where the shared right control panel sits. `"compact"` is the embedded-host
 * inspector; see {@link AppProps.panelPlacement}.
 */
export type PanelPlacement = "inline" | "compact";

/** The groups the compact inspector presents one at a time. */
export type PanelGroup = "tooth" | "surfaces" | "roots" | "more";

export default function App({
  language,
  onLanguageChange,
  numberingSystem,
  onNumberingChange,
  darkMode,
  onDarkModeChange,
  themeConfig,
  plugins,
  readOnly: readOnlyProp,
  enableNotes,
  enableIcdas,
  pulpDetailLevel,
  secondaryCariesMode,
  rootCariesMode,
  radiographicDepthMode,
  cariesDepthEnabled,
  wearDetailLevel,
  discolorationDetailLevel,
  surfaceNotation,
  showStatusCard: showStatusCardProp,
  showOrthoCard: showOrthoCardProp,
  session: sessionProp,
  document: documentProp,
  onDocumentChange,
  panelPlacement = "inline",
  befundDock: befundDockProp,
  toothInfoCard: toothInfoCardProp,
  onViewChange,
}: AppProps){
  const { lang, setLang, t } = useI18n({ language, onLanguageChange });
  const [internalNumbering, setInternalNumbering] = useState<NumberingSystem>(numberingSystem ?? "FDI");
  const themeRootRef = useRef<HTMLDivElement | null>(null);
  const currentNumbering = numberingSystem ?? internalNumbering;
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notesOn, setNotesOn] = useState<boolean>(enableNotes ?? false);
  const [icdasOn, setIcdasOn] = useState<boolean>(enableIcdas ?? false);
  const [pulpLevel, setPulpLevel] = useState<PulpDetailLevel>(pulpDetailLevel ?? "aae");
  const [secondaryMode, setSecondaryMode] = useState<SecondaryCariesMode>(secondaryCariesMode ?? "standard");
  const [rootMode, setRootMode] = useState<RootCariesMode>(rootCariesMode ?? "simple");
  const [radiographicMode, setRadiographicMode] = useState<RadiographicDepthMode>(radiographicDepthMode ?? "off");
  const [cariesDepthOn, setCariesDepthOn] = useState<boolean>(cariesDepthEnabled ?? true);
  const [wearLevel, setWearLevel] = useState<ToothDetailLevel>(wearDetailLevel ?? "complex");
  const [discoLevel, setDiscoLevel] = useState<ToothDetailLevel>(discolorationDetailLevel ?? "complex");
  const [notation, setNotation] = useState<SurfaceNotation>(surfaceNotation ?? "full");
  const [toothInfoOnState, setToothInfoOn] = useState<boolean>(true);
  const toothInfoOn = toothInfoCardProp ?? toothInfoOnState;
  const [showStatusCard, setShowStatusCard] = useState<boolean>(showStatusCardProp ?? true);
  const [showOrthoCard, setShowOrthoCard] = useState<boolean>(showOrthoCardProp ?? true);
  const [summary, setSummary] = useState<OdontogramSummary | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const importRef = useRef<HTMLDivElement | null>(null);
  // P2 Task 1: demo state mirroring the module-level perio-overlay flag
  // (odontogram.ts), kept in sync via the existing onStateChange subscription
  // below so a host that calls openPerioOverlay()/closePerioOverlay() directly
  // (bypassing this button entirely) still gets <PerioChart/> to re-render.
  const [perioOpen, setPerioOpen] = useState(false);
  // "Dental Chart" graphical redesign, Task 1: demo state mirroring the
  // module-level perioViewMode flag (odontogram.ts) — same precedent as
  // `perioOpen` above, kept in sync via onStateChange so a host calling
  // setPerioViewMode() directly (e.g. from the Settings modal) re-renders the
  // housing without a dedicated local setter. `activeView` is purely local UI
  // state (never exposed to a host) — which of the switcher's segments is
  // showing. Since bead odontogram-c51 there are THREE views, and only the
  // periodontal one depends on `viewMode`: in popup mode it lives in its own
  // dialog and the switcher carries Odontogram | Orthodontics alone.
  const [viewMode, setViewMode] = useState<PerioViewMode>(() => getPerioViewMode());
  const [activeView, setActiveView] = useState<AppView>("odontogram");
  // The host learns the view as a value. Reported on mount
  // too, so an embedding page can label its slot without a first interaction.
  useEffect(() => { onViewChange?.(activeView); }, [activeView, onViewChange]);
  const [panelGroup, setPanelGroup] = useState<PanelGroup>("tooth");
  // Anatomical Befund-Dock "Details" drawer: reveals the full card panel below
  // the dock (the long tail of rare options). Session-only.
  const [dockShowAll, setDockShowAll] = useState<boolean>(false);
  /**
   * The engine's selection, read from the engine.
   *
   * There is no second copy. The chart, the keypad and the Befund-Dock all read
   * this one state, and the only writer is the engine's own notification, so a
   * selection made ANYWHERE — a drag over the anatomical
   * grid, a Shift+arrow walk, the "Oberkiefer Front 6" batch button — reaches
   * every surface with the same set and the same primary tooth.
   */
  const [chartSelection, setChartSelectionState] = useState<{
    teeth: number[];
    primary: number | null;
  }>(() => ({ teeth: getSelectedTeeth(), primary: getActiveTooth() }));
  useEffect(() => onChartSelectionChange((primary, teeth) => {
    setChartSelectionState({ teeth, primary });
  }), []);
  // Armed "filling vs caries" mode shared by the keypad chips AND a surface click
  // on the chart. Material chip (K/A/G/E) → filling; caries stage (cK1..cK5) →
  // graded caries; neither → default caries. Mutually exclusive.
  const [armedMat, setArmedMat] = useState<string | null>(null);
  const [armedStage, setArmedStage] = useState<string | null>(null);
  // The material chip drives BOTH the mouse (dock/surface clicks) AND the
  // keyboard shorthand mode (setShorthandMaterial), so a preselected material is
  // applied when the finding key (k/b/…) is typed — in Status and Plan.
  const onArmMat = (ch: string) => {
    const next = armedMat === ch ? null : ch;
    setArmedMat(next); setArmedStage(null); setShorthandMaterial(next);
  };
  // The keypad's caries switch: caries mode, plain (no material, no stage).
  const onArmCaries = () => {
    setArmedMat(null); setArmedStage(null); setShorthandMaterial(null);
  };
  const onArmStage = (k: string) => {
    const next = armedStage === k ? null : k;
    setArmedStage(next); setArmedMat(null); setShorthandMaterial(null);
  };
  // Mirror a keyboard-armed material back onto the dock chip, so the two stay in
  // sync whichever way the material was chosen.
  useEffect(() => {
    const refresh = () => { const ch = getShorthandMaterialChar(); setArmedMat(ch); if (ch) setArmedStage(null); };
    refresh();
    return onStateChange(refresh);
  }, []);
  // Befund-Dock in the ANATOMICAL view (Dirk 30.08.2026): the finding keypad
  // below the odontogram. Behind a Settings
  // flag while it matures. `anatTooth` mirrors the grid's active tooth via the
  // engine's selection observer (a plain selection fires no onStateChange).
  const [dockEnabledState, setDockEnabled] = useState<boolean>(() => getBefundDockEnabled());
  const dockEnabled = befundDockProp ?? dockEnabledState;
  const anatTooth = chartSelection.primary;
  // UI-2 Task 1: mirror the two Settings -> Periodontal tab module flags into
  // React state, same precedent as `viewMode` mirroring `perioViewMode` above
  // — kept in sync via the shared `onStateChange` subscription so a host
  // calling the setters directly still re-renders the Settings modal.
  const [perioRowVisibility, setPerioRowVisibilityState] = useState<Record<PerioRowId, boolean>>(
    () => getPerioRowVisibility(),
  );
  const [perioIndexNameMode, setPerioIndexNameModeState] = useState<PerioIndexNameMode>(
    () => getPerioIndexNameMode(),
  );
  // UI-1 Task 1: whether the perio (Dental Chart) view is the one currently
  // showing — ONLY true in toggle-mode dentalChart; popup mode never gates
  // the shared right panel this way (the popup itself renders <PerioSidebar/>
  // in its own body, see PerioChart.tsx). Drives which content the shared
  // right `<aside className="panel">` below renders.
  const isPerioView = viewMode === "toggle" && activeView === "dentalChart";
  // Bead odontogram-c51: the orthodontic workspace, Dirk's "dritte Ansicht"
  // (22.08.2026). Unlike the periodontal view it has no popup housing, so it
  // is reachable in BOTH perio view modes — the switcher exists for it alone
  // when the periodontal chart lives in a dialog.
  const isOrthoView = activeView === "ortho";
  const isOdontogramView = activeView === "odontogram";
  // In the compact placement the KFO workspace shares the
  // drawer, so it needs its own inspector content instead of the per-tooth
  // controls. Session UI state only — no engine field, no payload.
  const compactOrthoInspector = isOrthoView && panelPlacement === "compact";
  // DS-1 Task 2: mirror the module-level "a status edit on a planned tooth is
  // awaiting confirmation" flag into React state via the existing onStateChange
  // subscription (requestDualStateConfirm / accept / cancel all notify), so the
  // blocking confirm dialog opens/closes regardless of which gated edit raised
  // it. Initialized false — a confirm can only be requested by a post-mount
  // edit, so there is never a pending confirm at mount.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Dark mode: controlled via prop or standalone via internal state
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (darkMode !== undefined) return darkMode;
    if (typeof document !== "undefined") return document.documentElement.classList.contains("dark");
    return false;
  });
  const isDark = darkMode !== undefined ? darkMode : internalDark;

  // Only manage the .dark class when standalone (no darkMode prop from parent)
  useEffect(() => {
    if (darkMode === undefined) {
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isDark, darkMode]);

  const toggleDark = () => {
    const next = !isDark;
    if (darkMode !== undefined) {
      onDarkModeChange?.(next);
    } else {
      setInternalDark(next);
      onDarkModeChange?.(next);
    }
  };

  const setNumbering = (next: NumberingSystem) => {
    if(numberingSystem){
      onNumberingChange?.(next);
      return;
    }
    setInternalNumbering(next);
    onNumberingChange?.(next);
  };

  // ---- Bead odontogram-3l1: per-instance clinical session ----------------
  // Resolved once per instance and never swapped afterwards: an explicit
  // `session` prop wins; a `document` prop makes this instance own a private
  // session seeded from it; supplying neither keeps the historical standalone
  // behaviour on the process-wide default session (`ownedSession` stays null,
  // so nothing is activated or released and existing consumers see no change).
  const ownedSessionRef = useRef<OdontogramSession | null | undefined>(undefined);
  if (ownedSessionRef.current === undefined) {
    ownedSessionRef.current = sessionProp
      ?? (documentProp !== undefined
        ? createOdontogramSession(documentProp ?? null)
        : null);
  }
  const instanceSession = sessionProp ?? ownedSessionRef.current;
  // The session this instance OBSERVES. An instance with no session of its own
  // observes the default session, but ONLY when the host actually asked for
  // change notifications — an unconfigured standalone mount must not reach into
  // the session API at all, so nothing about the historical behaviour changes.
  const observedSession = instanceSession
    ?? (onDocumentChange ? getDefaultOdontogramSession() : null);

  // ---- Engine ownership --------------------------------------------------
  // The DOM editor is one global engine bound to a fixed set of element ids, so
  // exactly one mounted instance may drive it. This instance claims it on
  // mount; the winner activates its session and renders the editor, and a
  // loser renders a placeholder instead of a second copy of the same ids. That
  // pairing matters clinically: if a non-owning instance still rendered the
  // chart chrome, the duplicated ids would let it display the OWNER's session
  // data under its own heading. Ownership transfers when the owner unmounts.
  const engineClaimRef = useRef<EngineClaim | null>(null);
  if (engineClaimRef.current === null) engineClaimRef.current = createEngineClaim();
  const engineClaim = engineClaimRef.current;
  const [ownsTheEngine, setOwnsTheEngine] = useState(false);

  useEffect(() => {
    setOwnsTheEngine(claimEngine(engineClaim));
    const unsubscribe = onEngineOwnerChange(() => {
      setOwnsTheEngine(ownsEngine(engineClaim) || claimEngine(engineClaim));
    });
    return () => {
      unsubscribe();
      releaseEngine(engineClaim);
    };
  }, [engineClaim]);

  // The engine owner is the instance whose session is live, so what the chart
  // paints always belongs to the instance the user is looking at.
  useEffect(() => {
    if (!instanceSession || !ownsTheEngine) return;
    instanceSession.activate();
    return () => { instanceSession.release(); };
  }, [instanceSession, ownsTheEngine]);

  const onDocumentChangeRef = useRef(onDocumentChange);
  onDocumentChangeRef.current = onDocumentChange;
  useEffect(() => {
    if (!observedSession) return;
    return observedSession.subscribe((doc) => { onDocumentChangeRef.current?.(doc); });
  }, [observedSession]);

  // A replaced `document` prop loads a new document into the owned session.
  // Skipped when the host drives the instance through an explicit session.
  const lastDocumentRef = useRef<OdontogramDocument | undefined>(documentProp);
  useEffect(() => {
    if (sessionProp || !instanceSession) return;
    if (documentProp === undefined || documentProp === lastDocumentRef.current) return;
    lastDocumentRef.current = documentProp;
    instanceSession.setDocument(documentProp);
  }, [documentProp, sessionProp, instanceSession]);

  useEffect(() => {
    if (!ownsTheEngine) return;
    initOdontogram();
    return () => {
      destroyOdontogram();
    };
  }, [ownsTheEngine]);

  useEffect(() => {
    setNumberingSystem(currentNumbering);
  }, [currentNumbering]);

  // Apply custom theme config as CSS custom properties
  useEffect(() => {
    applyThemeConfig(themeRootRef.current, themeConfig);
  }, [themeConfig]);

  // Register plugins when provided or changed
  useEffect(() => {
    registerPlugins(plugins ?? []);
  }, [plugins]);

  // Sync read-only mode. The resolved value is also handed to the React
  // keypads: they call the engine's exported mutators directly instead of going
  // through its guarded DOM handlers, so they have to know about the lock.
  /** Compact embedding: the inspector owns the chart's own controls. */
  const inspectorOwnsChartControls = panelPlacement === "compact"
  const chartVisualControls = (
    <div className="chart-actions">
      <button id="btnOcclView" className="btn btn-toggle btn-icon" aria-pressed="true" title={t("chart.actions.occlusal")} aria-label={t("chart.actions.occlusal")} data-icon-src={iconOcclSvg} data-xline="1"></button>
      <button id="btnWisdomVisible" className="btn btn-toggle btn-icon" aria-pressed="true" title={t("chart.actions.wisdom")} aria-label={t("chart.actions.wisdom")} data-icon-src={icon8Svg} data-xline="1"></button>
      <button id="btnBoneVisible" className="btn btn-toggle btn-icon" aria-pressed="true" title={t("chart.actions.bone")} aria-label={t("chart.actions.bone")} data-icon-src={iconGumSvg} data-xline="1"></button>
      <button id="btnPulpVisible" className="btn btn-toggle btn-icon" aria-pressed="true" title={t("chart.actions.pulp")} aria-label={t("chart.actions.pulp")} data-icon-src={iconPulpSvg} data-xline="1"></button>
      <button id="btnSelectNoneChart" className="btn btn-ghost btn-icon" title={t("chart.actions.clearSelection")} aria-label={t("chart.actions.clearSelection")}>
        <img className="icon-img" src={iconNoSelectionUrl} alt="" aria-hidden="true" />
      </button>
    </div>
  )
  const chartModeControls = (
    <div id="chartModeToggle" className="chart-mode-toggle" role="tablist">
      <button id="chartModeStatus" type="button" className="chart-mode-btn is-active" role="tab" aria-selected="true">{t("chartMode.status")}</button>
      <button id="chartModePlan" type="button" className="chart-mode-btn" role="tab" aria-selected="false">{t("chartMode.plan")}</button>
    </div>
  )

  const chartReadOnly = readOnlyProp
    ?? (sessionProp && "readOnly" in sessionProp ? sessionProp.readOnly === true : false);
  useEffect(() => {
    if (!ownsTheEngine) return;
    setReadOnly(chartReadOnly);
  }, [chartReadOnly, ownsTheEngine]);

  // Sync notes enabled
  useEffect(() => {
    setNotesEnabled(enableNotes ?? false);
    setNotesOn(enableNotes ?? false);
  }, [enableNotes]);

  // Sync ICDAS mode enabled
  useEffect(() => {
    setIcdasEnabled(enableIcdas ?? false);
    setIcdasOn(enableIcdas ?? false);
  }, [enableIcdas]);

  // Sync pulp-detail level (controlled prop -> engine + local segmented control)
  useEffect(() => {
    setPulpDetailLevel(pulpDetailLevel ?? "aae");
    setPulpLevel(pulpDetailLevel ?? "aae");
  }, [pulpDetailLevel]);

  // SP5 Task 5: sync the caries-granularity settings (controlled props -> engine).
  // The mode-picker UI itself lives in the Settings modal (Task 6); these props
  // are the controlled entry point so hosts (and tests) can drive the modes.
  useEffect(() => {
    const v = secondaryCariesMode ?? "standard";
    setSecondaryCariesMode(v);
    setSecondaryMode(v);
  }, [secondaryCariesMode]);
  useEffect(() => {
    const v = rootCariesMode ?? "simple";
    setRootCariesMode(v);
    setRootMode(v);
  }, [rootCariesMode]);
  useEffect(() => {
    const v = radiographicDepthMode ?? "off";
    setRadiographicDepthMode(v);
    setRadiographicMode(v);
  }, [radiographicDepthMode]);
  useEffect(() => {
    const v = cariesDepthEnabled ?? true;
    setCariesDepthEnabled(v);
    setCariesDepthOn(v);
  }, [cariesDepthEnabled]);
  useEffect(() => { const v = wearDetailLevel ?? "complex"; setWearDetailLevel(v); setWearLevel(v); }, [wearDetailLevel]);
  useEffect(() => { const v = discolorationDetailLevel ?? "complex"; setDiscolorationDetailLevel(v); setDiscoLevel(v); }, [discolorationDetailLevel]);
  useEffect(() => { const v = surfaceNotation ?? "full"; setSurfaceNotation(v); setNotation(v); }, [surfaceNotation]);
  useEffect(() => { setShowStatusCard(showStatusCardProp ?? true); }, [showStatusCardProp]);
  useEffect(() => { setShowOrthoCard(showOrthoCardProp ?? true); }, [showOrthoCardProp]);

  // Refresh the tooth-information summary while its panel is open. Recomputes on
  // every state change, and when language/numbering change (which affect labels).
  useEffect(() => {
    if(!toothInfoOn) return;
    const refresh = () => {
      setSummary(getOdontogramSummary());
    };
    refresh();
    return onStateChange(refresh);
  }, [toothInfoOn, lang, currentNumbering]);

  // P2 Task 1: mirror the module-level perio-overlay flag into React state via
  // the existing onStateChange subscription (openPerioOverlay/closePerioOverlay
  // both call notifyStateChange()), so <PerioChart/> re-renders regardless of
  // whether it was opened/closed via this button or a host calling the
  // imperative API directly.
  useEffect(() => {
    const refresh = () => setPerioOpen(isPerioOverlayOpen());
    refresh();
    return onStateChange(refresh);
  }, []);

  // "Dental Chart" graphical redesign, Task 1: mirror the module-level
  // perioViewMode flag into React state the same way perioOpen mirrors
  // isPerioOverlayOpen() above.
  useEffect(() => {
    const refresh = () => setViewMode(getPerioViewMode());
    refresh();
    return onStateChange(refresh);
  }, []);

  // Mirror the Befund-Dock flag into React state (setBefundDockEnabled notifies).
  useEffect(() => {
    const refresh = () => setDockEnabled(getBefundDockEnabled());
    refresh();
    return onStateChange(refresh);
  }, []);

  // UI-2 Task 1: mirror the module-level perioRowVisibility/perioIndexNameMode
  // flags into React state the same way perioViewMode is mirrored above.
  useEffect(() => {
    const refresh = () => {
      setPerioRowVisibilityState(getPerioRowVisibility());
      setPerioIndexNameModeState(getPerioIndexNameMode());
    };
    refresh();
    return onStateChange(refresh);
  }, []);

  // DS-1 Task 2: mirror the pending-confirm flag into React state. Subscribe
  // only (no initial read) — a confirm is only ever requested by a post-mount
  // edit, so `confirmOpen` starts false and this never calls the module during
  // the initial render.
  useEffect(() => {
    return onStateChange(() => setConfirmOpen(isDualStateConfirmPending()));
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if(!languageRef.current?.contains(target)){
        setLanguageOpen(false);
      }
      if(!exportRef.current?.contains(target)){
        setExportOpen(false);
      }
      if(!importRef.current?.contains(target)){
        setImportOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Live settings surface for the tabbed Settings modal. Each handler updates
  // local React state AND calls the same module accessor the old dropdown did —
  // so the setting still does exactly what it did, only from a new location.
  const settingsState: SettingsState = {
    numbering: currentNumbering,
    onNumbering: setNumbering,
    language: lang,
    onLanguage: setLang,
    isDark,
    onToggleDark: toggleDark,
    toothInfo: toothInfoOn,
    onToothInfo: (v) => setToothInfoOn(v),
    befundDock: dockEnabled,
    onBefundDock: (v) => setBefundDockEnabled(v),
    secondaryCariesMode: secondaryMode,
    onSecondaryCariesMode: (v) => { setSecondaryMode(v); setSecondaryCariesMode(v); },
    icdas: icdasOn,
    onIcdas: (v) => { setIcdasOn(v); setIcdasEnabled(v); },
    cariesDepth: cariesDepthOn,
    onCariesDepth: (v) => { setCariesDepthOn(v); setCariesDepthEnabled(v); },
    rootCariesMode: rootMode,
    onRootCariesMode: (v) => { setRootMode(v); setRootCariesMode(v); },
    radiographicDepthMode: radiographicMode,
    onRadiographicDepthMode: (v) => { setRadiographicMode(v); setRadiographicDepthMode(v); },
    pulpLevel,
    onPulpLevel: (v) => { setPulpLevel(v); setPulpDetailLevel(v); },
    wearDetailLevel: wearLevel,
    onWearDetailLevel: (v) => { setWearLevel(v); setWearDetailLevel(v); },
    discolorationDetailLevel: discoLevel,
    onDiscolorationDetailLevel: (v) => { setDiscoLevel(v); setDiscolorationDetailLevel(v); },
    surfaceNotation: notation,
    onSurfaceNotation: (v) => { setNotation(v); setSurfaceNotation(v); },
    notes: notesOn,
    onNotes: (v) => { setNotesOn(v); setNotesEnabled(v); },
    showStatusCard,
    onShowStatusCard: (v) => setShowStatusCard(v),
    showOrthoCard,
    onShowOrthoCard: (v) => setShowOrthoCard(v),
    perioViewMode: viewMode,
    onPerioViewMode: (v) => setPerioViewMode(v),
    perioRowVisibility,
    onPerioRowVisibility: (id, v) => setPerioRowVisibility(id, v),
    perioIndexNameMode,
    onPerioIndexNameMode: (v) => setPerioIndexNameMode(v),
  };

  // A non-owning instance renders NO editor chrome. The engine's element ids
  // (`#toothGrid`, `#chartModeToggle`, `#activeToothLabel`, ...) are global, so
  // a second copy would be both invalid HTML and clinically unsafe: the engine
  // resolves each id to the first match, and this instance would then display
  // the OWNER's session data under its own heading. Its session stays fully
  // readable and writable through the session API while it waits.
  if (!ownsTheEngine) {
    return (
      <div
        ref={themeRootRef}
        className="odontogram-root odontogram-inactive"
        dir={isRtl(lang) ? "rtl" : "ltr"}
        lang={lang}
        data-odontogram-inactive="true"
        aria-hidden="true"
      />
    );
  }

  // The whole-mouth "Tooth information" read-back. Placed BELOW the Befund-Dock
  // (Dirk 31.08.2026) rather than between chart and dock, and used by the
  // anatomical dock-mode.
  const toothInfoCard = (toothInfoOn && summary) ? (
    <section className="tooth-info card" aria-label={t("toothInfo.title")}>
      <div className="card-title">{t("toothInfo.title")}</div>
      <p className="tooth-info-overview">{summary.overview}</p>
      {summary.permanentList && <p className="tooth-info-list">{summary.permanentList}</p>}
      {summary.missingList && <p className="tooth-info-list">{summary.missingList}</p>}
      {summary.individualNotes && (
        <div id="toothInfoNotes" className="tooth-info-notes">
          <span className="tooth-info-heading">{summary.individualNotes.heading}:</span>
          {summary.individualNotes.items.map((n, i) => (
            <p key={i} className="tooth-info-note-item">{n}</p>
          ))}
        </div>
      )}
      {summary.sections.map((sec) => (
        <p key={sec.key} className="tooth-info-line">
          <span className="tooth-info-heading">{sec.heading}:</span>{" "}
          {sec.items.length
            ? sec.items.join(", ")
            : <span className="tooth-info-empty">{sec.emptyText}</span>}
        </p>
      ))}
      {summary.plannedChanges && summary.plannedChanges.length > 0 && (
        <div id="plannedChangesBox" className="planned-changes">
          <div className="tooth-info-heading">{t("toothInfo.plannedChanges")}</div>
          {summary.plannedChanges.map((c, i) => (
            <p key={`${c.toothNo}-${c.axis}-${i}`} className="planned-changes-item">
              {formatToothLabel(c.toothNo)}: {t(`planChange.axis.${c.axis}`)} {c.from} → {c.to}
            </p>
          ))}
        </div>
      )}
      {summary.implants && (
        <p className="tooth-info-line">
          <span className="tooth-info-heading">{summary.implants.heading}:</span>{" "}
          {summary.implants.text}
        </p>
      )}
      <p className="tooth-info-line">
        <span className="tooth-info-heading">{summary.periodontalTitle}:</span>{" "}
        {summary.periodontalText}
      </p>
    </section>
  ) : null;

  return (
    <div
      ref={themeRootRef}
      className="odontogram-root"
      dir={isRtl(lang) ? "rtl" : "ltr"}
      lang={lang}
      data-panel-placement={panelPlacement === "compact" ? "compact" : undefined}
    >
      <header className="topbar">
        <div className="brand">
          <div className="dot"></div>
          <div>
            <div className="title">{t("app.title")}</div>
            <div className="subtitle">{`${t("app.subtitleLang")} ${t("app.subtitleNumbering." + currentNumbering)} ${t(isDark ? "app.subtitleMode.dark" : "app.subtitleMode.light")}`}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn-theme" onClick={() => startIntroTour()} title={t("intro.start")} aria-label={t("intro.start")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </button>
          <div className="topbar-group dropdown" ref={languageRef}>
            <button className="btn-theme" onClick={() => setLanguageOpen((open) => !open)} aria-haspopup="menu" aria-expanded={languageOpen} title={t("language.label")} aria-label={t("language.label")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
            </button>
            {languageOpen && (
              <div className="dropdown-menu" role="menu" aria-label={t("language.label")}>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="dropdown-item"
                    role="menuitemradio"
                    aria-checked={lang === opt.value}
                    onClick={() => {
                      setLang(opt.value);
                      setLanguageOpen(false);
                    }}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="btn-theme"
            onClick={toggleDark}
            title={isDark ? t("theme.light") : t("theme.dark")}
            aria-label={isDark ? t("theme.light") : t("theme.dark")}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
          <div className="topbar-group">
            <button className="btn-theme" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog" aria-expanded={settingsOpen} title={t("settings.title")} aria-label={t("settings.title")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
          {/* Hidden export buttons kept for host capture + wireControls wiring */}
          <button id="btnStatusExport" hidden aria-hidden="true" tabIndex={-1}>{t("topbar.exportStatus")}</button>
          <button id="btnStatusPngExport" hidden aria-hidden="true" tabIndex={-1}>{t("topbar.exportPng")}</button>
          <button id="btnStatusJpgExport" hidden aria-hidden="true" tabIndex={-1}>{t("topbar.exportJpg")}</button>
          <button id="btnStatusSvgExport" hidden aria-hidden="true" tabIndex={-1}>{t("export.menu.svg")}</button>
          <div className="topbar-group dropdown" ref={exportRef}>
            <button id="btnExportMenu" className="btn-theme" onClick={() => setExportOpen((o) => !o)} aria-haspopup="menu" aria-expanded={exportOpen} title={t("topbar.export")} aria-label={t("topbar.export")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
            {exportOpen && (
              <div className="dropdown-menu" role="menu" aria-label={t("topbar.export")}>
                <button className="dropdown-item" role="menuitem" onClick={() => { (document.getElementById("btnStatusExport") as HTMLButtonElement | null)?.click(); setExportOpen(false); }}>{t("export.menu.statusJson")}</button>
                <button className="dropdown-item" role="menuitem" onClick={() => { (document.getElementById("btnStatusPngExport") as HTMLButtonElement | null)?.click(); setExportOpen(false); }}>{t("export.menu.png")}</button>
                <button className="dropdown-item" role="menuitem" onClick={() => { (document.getElementById("btnStatusJpgExport") as HTMLButtonElement | null)?.click(); setExportOpen(false); }}>{t("export.menu.jpg")}</button>
                <button className="dropdown-item" role="menuitem" onClick={() => { (document.getElementById("btnStatusSvgExport") as HTMLButtonElement | null)?.click(); setExportOpen(false); }}>{t("export.menu.svg")}</button>
              </div>
            )}
          </div>
          <button id="btnStatusImport" hidden aria-hidden="true" tabIndex={-1}>{t("topbar.importStatus")}</button>
          <div className="topbar-group dropdown" ref={importRef}>
            <button id="btnImportMenu" className="btn-theme" onClick={() => setImportOpen((o) => !o)} aria-haspopup="menu" aria-expanded={importOpen} title={t("topbar.import")} aria-label={t("topbar.import")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12"/></svg>
            </button>
            {importOpen && (
              <div className="dropdown-menu" role="menu" aria-label={t("topbar.import")}>
                <button className="dropdown-item" role="menuitem" onClick={() => { (document.getElementById("btnStatusImport") as HTMLButtonElement | null)?.click(); setImportOpen(false); }}>{t("import.menu.statusJson")}</button>
                {/* Bead odontogram-ap7: an imported chart is somebody else's
                    record, so by default it becomes the initial examination
                    and everything in it reads as pre-existing. A document that
                    brought its own archive keeps it regardless (importStatus). */}
                <label className="dropdown-check" id="importBaselineRow">
                  <input
                    type="checkbox"
                    id="importAsBaseline"
                    defaultChecked={getImportAsBaseline()}
                    onChange={(e) => setImportAsBaseline(e.target.checked)}
                  />
                  <span>{t("import.asBaseline")}</span>
                </label>
                <p className="dropdown-hint">{t("import.asBaselineHint")}</p>
              </div>
            )}
          </div>
          <input id="statusImportInput" type="file" accept="application/json" hidden />
        </div>
      </header>

      <main className={"layout" + (dockEnabled && isOdontogramView ? " dock-mode" : "") + (dockEnabled && isOdontogramView && dockShowAll ? " dock-mode-all" : "")}>
        {/* ONE switcher for every clinical view (bead odontogram-c51).
            ------------------------------------------------------------------
            The periodontal segment is the only one that depends on the
            housing: with `perioViewMode === "popup"` the periodontal chart
            lives in its own dialog and is reached through the launch button
            beside it, so it has no segment here. The orthodontic view has no
            popup housing at all and is therefore a segment in both modes —
            which is why the switcher is no longer gated on the mode as a
            whole, as it was while there were only two views. */}
        <div className="perio-launch-bar">
          <div id="appViewToggle" className="chart-mode-toggle" role="tablist">
            <button
              id="appViewOdontogram"
              type="button"
              className={"chart-mode-btn" + (activeView === "odontogram" ? " is-active" : "")}
              role="tab"
              aria-selected={activeView === "odontogram"}
              onClick={() => setActiveView("odontogram")}
            >
              {t("view.odontogram")}
            </button>
            {viewMode === "toggle" && (
              <button
                id="appViewDentalChart"
                type="button"
                className={"chart-mode-btn" + (activeView === "dentalChart" ? " is-active" : "")}
                role="tab"
                aria-selected={activeView === "dentalChart"}
                onClick={() => setActiveView("dentalChart")}
              >
                {t("view.dentalChart")}
              </button>
            )}
            <button
              id="appViewOrtho"
              type="button"
              className={"chart-mode-btn" + (isOrthoView ? " is-active" : "")}
              role="tab"
              aria-selected={isOrthoView}
              onClick={() => setActiveView("ortho")}
            >
              {t("view.ortho")}
            </button>
          </div>
          {viewMode === "popup" && (
            <button
              type="button"
              id="openPerioOverlayBtn"
              className="btn btn-ghost"
              onClick={() => openPerioOverlay()}
              title={t("perio.open")}
              aria-label={t("perio.open")}
            >
              {t("perio.open")}
            </button>
          )}
        </div>
        <div
          className="chart-column"
          style={isPerioView || isOrthoView ? { display: "none" } : undefined}
        >
        {/* Tiefenreiz: Verlaufsdefinitionen fuer die Zahnsubstanz.
            ------------------------------------------------------------------
            Die Zaehne sind einfarbig gefuellt (`tooth-base` traegt inline
            `fill: #ebebeb`), und die Glanzebene `tooth-base-beauty` besteht aus
            zwei FLACHEN Weissflaechen. Deshalb wirkt der Bogen flach: dem Zahn
            selbst gehoert kein einziger Verlauf, die elf linearen und acht
            radialen im Template gehoeren alle den Restaurationsmaterialien.

            EINMAL im Dokument, nicht je Kachel: `objectBoundingBox` rechnet den
            Verlauf auf die Bezugsbox JEDER Form um, ein Element genuegt also
            fuer alle 64.

            SYMMETRISCH, und das ist kein Geschmack: der linke Quadrant ist
            derselbe Zahn gespiegelt. Ein Verlauf mit einer hellen und einer
            dunklen Seite wuerde dort von der anderen Seite beleuchtet, und der
            Bogen haette zwei Lichtquellen.

            Paritaetssicher von der Bauart her, nicht aus Versehen:
            `collectActiveLayers` ueberspringt alles unter `<defs>` und jedes
            Verlaufselement, und es haelt nur `id`, `opacity` und `class` fest -
            die Fuellung nicht. Was NICHT ginge, waere ein neues SICHTBARES
            Element mit `id`. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false"
             style={{ position: "absolute" }}>
          <defs>
            {/* Schmaler dunkler Rand: die Abdunklung sitzt in den aeusseren
                gut zehn Prozent, der Koerper bleibt hell. Ein breiter Verlauf
                macht den ganzen Zahn grau, statt ihn zu woelben. */}
            <linearGradient id="odonDepthBody" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#c9cbcc" />
              <stop offset="0.13" stopColor="#ededed" />
              <stop offset="0.5" stopColor="#f7f7f7" />
              <stop offset="0.87" stopColor="#ededed" />
              <stop offset="1" stopColor="#c9cbcc" />
            </linearGradient>
            <linearGradient id="odonDepthMilk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#d5d3ca" />
              <stop offset="0.13" stopColor="#f6f4ee" />
              <stop offset="0.5" stopColor="#fcfbf7" />
              <stop offset="0.87" stopColor="#f6f4ee" />
              <stop offset="1" stopColor="#d5d3ca" />
            </linearGradient>
            {/* Hoecker als KUPPELN statt als Rampen.

                Die Kauflaechenvorlagen tragen jedes Hoeckerfeld bereits als
                eigene Form - sechs beim Sechser -, aber mit einem LINEAREN
                Verlauf: eine Rampe ueber das Feld, hell auf der einen und
                dunkel auf der anderen Seite. Ein Hoecker ist aber eine Kuppel,
                und die liest man an einem radialen Verlauf.

                `objectBoundingBox` rechnet ihn auf jede Form um, ein Element
                genuegt also fuer alle Hoecker aller Kauflaechen. Der Mittelpunkt
                sitzt leicht ueber der Mitte - dort, wo das Licht auf eine
                Woelbung faellt.

                Die Felder tragen keine `id`, der Fingerabdruck sieht sie also
                ohnehin nicht; er sammelt nur Elemente MIT `id`. */}
            {/* Bead odontogram-5hm: die KRONE als gewoelbter Koerper.

                Dirk, 21.08.2026, nachdem er die Zahnform-Ableitung gesehen
                hatte: "Ich finde B super, so bauen" - B war die Zahnform MIT
                Verlauf. e.max und Metallkeramik bringen ihre Neun-Stopp-Rampe
                schon aus der Vorlage mit; die uebrigen sieben Fuellungen sind
                eine einzige flache Farbe, und eine flache Flaeche liest sich
                wie Papier, nicht wie ein gegossener oder gefraester Koerper.

                DER MITTLERE STOPP IST GENAU DIE EINGESTELLTE FARBE. Das ist
                der Grund, warum diese Woelbung die Regel "nur die Zahnsubstanz
                wird schattiert" nicht bricht: die Aussage der Farbe bleibt
                unveraendert, sie wird nur beleuchtet. Aus derselben Ueberlegung
                laufen alle drei Stopps ueber die Palettenvariable - wer unter
                Einstellungen -> Farben eine andere Farbe waehlt, bekommt IHRE
                Woelbung und nicht die des Standards.

                ZWEI SCHREIBWEISEN JE STOPP, und das ist Absicht: das Attribut
                traegt den ausgerechneten Rueckfall, die Stilangabe das
                `color-mix`. Kennt ein Browser `color-mix` nicht, faellt die
                Stilangabe beim Einlesen weg und das Attribut greift - statt
                dass ein ungueltiger Farbwert die Krone schwarz macht.

                `objectBoundingBox` rechnet den Verlauf auf jede Form um, ein
                Element genuegt also fuer alle 52 Vorlagen. */}
            <radialGradient id="odonKroneGold" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#ecc969"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-gold, #e0a80d) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#e0a80d"
                    style={{ stopColor: "var(--odon-rest-gold, #e0a80d)" }} />
              <stop offset="1" stopColor="#b3860a"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-gold, #e0a80d) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneGradia" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#97cfb3"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-gradia, #57b285) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#57b285"
                    style={{ stopColor: "var(--odon-rest-gradia, #57b285)" }} />
              <stop offset="1" stopColor="#468e6a"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-gradia, #57b285) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneZirkon" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#e1eef4"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-zircon, #cfe3ee) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#cfe3ee"
                    style={{ stopColor: "var(--odon-rest-zircon, #cfe3ee)" }} />
              <stop offset="1" stopColor="#a6b6be"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-zircon, #cfe3ee) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneMetall" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#6193d7"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-metal, #0051bf) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#0051bf"
                    style={{ stopColor: "var(--odon-rest-metal, #0051bf)" }} />
              <stop offset="1" stopColor="#004199"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-metal, #0051bf) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneProvi" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#ddd0bb"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-temporary, #c8b392) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#c8b392"
                    style={{ stopColor: "var(--odon-rest-temporary, #c8b392)" }} />
              <stop offset="1" stopColor="#a08f75"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-temporary, #c8b392) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneTeleAussen" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#6193d7"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-telescope, #0051bf) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#0051bf"
                    style={{ stopColor: "var(--odon-rest-telescope, #0051bf)" }} />
              <stop offset="1" stopColor="#004199"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-telescope, #0051bf) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneTeleInnen" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#cacaca"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-telescope-inner, #aaaaaa) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#aaaaaa"
                    style={{ stopColor: "var(--odon-rest-telescope-inner, #aaaaaa)" }} />
              <stop offset="1" stopColor="#888888"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-telescope-inner, #aaaaaa) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneProthZahn" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#c9ead4"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-denture-tooth, #a8ddb9) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#a8ddb9"
                    style={{ stopColor: "var(--odon-rest-denture-tooth, #a8ddb9)" }} />
              <stop offset="1" stopColor="#86b194"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-denture-tooth, #a8ddb9) 80%, #000)" }} />
            </radialGradient>
            <radialGradient id="odonKroneProthBasis" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#fbcdbd"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-denture-base, #f9ae94) 62%, #fff)" }} />
              <stop offset="0.55" stopColor="#f9ae94"
                    style={{ stopColor: "var(--odon-rest-denture-base, #f9ae94)" }} />
              <stop offset="1" stopColor="#c78b76"
                    style={{ stopColor: "color-mix(in srgb, var(--odon-rest-denture-base, #f9ae94) 80%, #000)" }} />
            </radialGradient>
            {/* Bead odontogram-qvr: e.max und Metallkeramik haben keine flache
                Palettenvariable - sie malen aus einer Neun-Stopp-Rampe in der
                Vorlage. Fuer die Hoecker unter einer Kauflaechenkrone braucht es
                trotzdem eine Kuppel, also entsteht sie hier aus ihrem Grundton.
                Ohne Palettenvariable: wer diese beiden umfaerbt, aendert die
                Rampe, und die Kuppel bliebe sonst als einzige stehen. */}
            <radialGradient id="odonKroneEmax" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#f6e7da" />
              <stop offset="0.55" stopColor="#f0d9c4" />
              <stop offset="1" stopColor="#c0ae9d" />
            </radialGradient>
            <radialGradient id="odonKroneMetKer" cx="0.5" cy="0.38" r="0.72">
              <stop offset="0" stopColor="#e1ece7" />
              <stop offset="0.55" stopColor="#cfe0d8" />
              <stop offset="1" stopColor="#a6b3ad" />
            </radialGradient>
            <radialGradient id="odonDepthCusp" cx="0.5" cy="0.40" r="0.66">
              <stop offset="0" stopColor="#fcfbf8" />
              <stop offset="0.55" stopColor="#f1efe9" />
              <stop offset="1" stopColor="#dcd8ce" />
            </radialGradient>
          </defs>
        </svg>
        {/*
          * Where the chart's own controls live depends on the placement.
          *
          * Standalone keeps them in the chart header, above the arches, which is
          * the full-page layout this package has always had. In the embedded
          * COMPACT placement the chart column is the graphic and nothing else,
          * and the inspector is the one place the user operates it from — so the
          * visual toggles and the Status/Plan tabs move INTO the inspector,
          * above the selection actions (Malte, 04.10.2026: mode and visual
          * controls first, then which teeth are selected, then the form for the
          * selected tooth).
          *
          * The SAME elements move; they are not recreated. Every id the engine
          * wires in `wireControls()` is still rendered exactly once, and
          * `panelPlacement` is fixed for the lifetime of a mount, so React never
          * re-creates these nodes and the one-time listeners survive.
          */}
        <section className="chart">
          <div className="chart-header">
            <div>
              <div className="chart-title">{t("chart.title")}</div>
              <div className="chart-hint">{t("chart.hint")}</div>
              <div className="chart-hint">{t("chart.hint.drag")}</div>
            </div>
            {!inspectorOwnsChartControls && chartModeControls}
            {/* Planalternativen: the chooser between named plan alternatives.
                Self-subscribing (onStateChange) and rendered only in plan
                mode - no App state, no new engine call path. */}
            <PlanSelector />
            {/* R2-C Task 2: "dashed = proposed" legend. Always rendered — its
                visibility is pure CSS, scoped by the `.chart.plan-mode
                #proposedLegend` descendant selector (src/index.css), which
                reuses the SAME `.plan-mode` cue the chart card already gets
                from the real, unchanged syncChartModeUi() in odontogram.ts.
                No new React state, no new engine call. */}
            <div id="proposedLegend" className="proposed-legend">
              <span className="proposed-legend-swatch" aria-hidden="true"></span>
              {t("chart.proposedLegend")}
            </div>
            {/* Bead odontogram-t8y: what the keyboard has collected so far — the
                material mode that is standing, and the keys not yet committed.
                Multi-character keys (mod, Twf, K3) mean a keystroke cannot be
                applied on its own, so the buffer has to be visible or one is
                typing blind. Filled by syncShorthandReadout() in
                odontogram.ts; empty and invisible until a key is pressed. */}
            <div id="shorthandBuffer" className="shorthand-buffer empty" aria-live="polite" aria-atomic="true"></div>
            {!inspectorOwnsChartControls && chartVisualControls}
          </div>
          <div id="toothGrid" className="tooth-grid" dir="ltr" aria-label={t("chart.aria.toothGrid")}></div>
        </section>
        {/* Non-dock mode keeps the read-back under the chart; in dock mode it
            moves BELOW the dock (rendered after the befund-dock-column). */}
        {!(dockEnabled && isOdontogramView) && toothInfoCard}
        </div>
        {dockEnabled && isOdontogramView && (
          <div className="befund-dock-column" dir="ltr">
            <div className="schematic-toolbar">
              <span className="schematic-hint">{t("dock.hint")}</span>
              <button
                type="button"
                id="dockShowAllToggle"
                className={"btn btn-ghost btn-sm" + (dockShowAll ? " is-active" : "")}
                aria-pressed={dockShowAll}
                onClick={() => setDockShowAll((v) => !v)}
              >
                {dockShowAll ? t("schematic.compact") : t("schematic.showAll")}
              </button>
            </div>
            {!dockShowAll && (
              <SchematicKeypad
                tooth={anatTooth}
                readOnly={chartReadOnly}
                mat={armedMat}
                stage={armedStage}
                onMat={onArmMat}
                onStage={onArmStage}
                onCaries={onArmCaries}
              />
            )}
            {toothInfoCard}
          </div>
        )}
        {isPerioView && (
          <div className="dental-chart-column" dir="ltr">
            <PerioChart inline />
          </div>
        )}
        {/* The orthodontic workspace spans BOTH grid columns and the right
            control panel is hidden beside it: the card is not per-tooth, so
            the tooth selection the panel operates on has nothing to say here,
            and the arch of measured widths
            wants the full width. The panel itself is only hidden, never
            unmounted — same reason as the perio view above.

            In COMPACT placement the drawer stays, and a
            drawer showing per-tooth controls beside a KFO workspace shows the
            one thing KFO has no use for. The two halves are therefore split
            along the seam the cards already had: what is DERIVED stays here
            beside the chart, what is TYPED moves into the inspector, and the
            chooser below picks which of the two records is being worked on —
            one at a time, so neither column holds two large forms. */}
        {isOrthoView && (
          <div className="ortho-column">
            {compactOrthoInspector ? (
              <ModelAnalysisCard section="results" />
            ) : (
              <ModelAnalysisCard />
            )}
          </div>
        )}
        {/* The inspector is hidden beside the orthodontic workspace in the
            STANDALONE layout only. Both KFO cards want a full-width page and
            neither is per-tooth, so there the panel has nothing to say — but
            the compact embedding has no second place to put it: the drawer IS
            the inspector, and a view that empties it reads as a broken panel
            rather than as a deliberate full-width workspace
            (the drawer stays visible and
            consistent across Anatomical, Periodontal and KFO).

            This is an INLINE style, so no stylesheet rule can override it;
            the placement therefore has to be read here rather than in
            index.css, where every other compact relocation lives. */}
        <aside
          className="panel"
          style={isOrthoView && panelPlacement !== "compact" ? { display: "none" } : undefined}
          data-panel-group={panelPlacement === "compact" ? panelGroup : undefined}
        >
          {/* Keep the odontogram control panel ALWAYS mounted, toggling only
              its visibility with CSS. Unmounting it on the perio toggle
              produced fresh DOM nodes whose one-time wireControls() listeners
              were never re-attached, silently breaking odontogram editing after
              a round-trip through Periodontal Status. PerioSidebar stays a
              plain conditional (mounted only in the perio view). */}
          {isPerioView && <PerioSidebar />}
          {/* The compact KFO inspector. A plain conditional like PerioSidebar:
              both KFO cards are pure React over the engine's module state and
              carry no wireControls() listeners, so remounting them is safe.

              The chooser decides BOTH columns at once — the entry here and the
              derived results beside the chart — so exactly one entry form and
              one results block are mounted, and no id appears twice. */}
          {compactOrthoInspector && (
            <div className="panel-ortho-controls">
              <div className="panel-header">
                <div className="panel-title-row">
                  <span className="panel-title">{t("view.ortho")}</span>
                </div>
              </div>
              <div className="panel-body">
                {/* `list` in a 320px drawer: the arch puts twelve fields in a
                    row, which the switch still offers and the card's own
                    `overflow-x` still handles. */}
                <ModelAnalysisCard section="entry" defaultView="list" />
              </div>
            </div>
          )}
          <div
            className="panel-odontogram-controls"
            style={isPerioView || compactOrthoInspector ? { display: "none" } : undefined}
          >
          <div className="panel-header">
            <div>
              <div className="panel-title-row">
                <span className="panel-title">{t("panel.controls")}</span>
                <div className="panel-title-actions">
                  <button id="btnSelectNone" className="btn btn-ghost btn-icon btn-danger" title={t("panel.clearSelection")} aria-label={t("panel.clearSelection")}>{t("panel.clearSelection")}</button>
                  <button id="btnToggleControlsCard" className="icon-btn" title={t("actions.collapse", { label: t("panel.controls") })} aria-label={t("actions.collapse", { label: t("panel.controls") })}>
                    <span className="toggle-icon" aria-hidden="true">−</span>
                  </button>
                </div>
              </div>
              <div className="panel-subtitle">{t("panel.activeTooth")}: <span id="activeToothLabel" className="pill">{t("selection.none")}</span></div>
            </div>
            {/*
              * Compact: the chart's own controls, then WHICH TEETH are selected,
              * then the group nav that chooses what the form below shows. The
              * selection actions used to sit directly under the panel title as
              * one large block above everything, which read as the inspector's
              * main subject rather than as a step between the chart and the
              * form.
              */}
            {inspectorOwnsChartControls && (
              <div className="panel-chart-controls">
                {chartVisualControls}
                {chartModeControls}
              </div>
            )}
            <div id="controlsActions" className="panel-subtitle select-actions">
              <div className="select-actions-row">
                <button id="btnSelectAll" className="btn btn-ghost btn-icon" title={t("panel.selectActions.all")}>{t("panel.selectActions.all")}</button>
                <button id="btnSelectAllPresent" className="btn btn-ghost btn-icon fade-toggle" title={t("panel.selectActions.present")}>{t("panel.selectActions.present")}</button>
                <button id="btnSelectPermanent" className="btn btn-ghost btn-icon fade-toggle" title={t("panel.selectActions.permanent")}>{t("panel.selectActions.permanent")}</button>
                <button id="btnSelectMilk" className="btn btn-ghost btn-icon fade-toggle" title={t("panel.selectActions.milk")}>{t("panel.selectActions.milk")}</button>
                <button id="btnSelectImplants" className="btn btn-ghost btn-icon fade-toggle" title={t("panel.selectActions.implants")}>{t("panel.selectActions.implants")}</button>
                <button id="btnSelectAllMissing" className="btn btn-ghost btn-icon fade-toggle" title={t("panel.selectActions.missing")}>{t("panel.selectActions.missing")}</button>
              </div>
              <div className="select-actions-row">
                <button id="btnSelectUpper" className="btn btn-ghost btn-icon" title={t("panel.selectActions.upper")}>{t("panel.selectActions.upper")}</button>
                <button id="btnSelectUpperFront" className="btn btn-ghost btn-icon" title={t("panel.selectActions.upperFront")}>{t("panel.selectActions.upperFront")}</button>
                <button id="btnSelectUpperMolar" className="btn btn-ghost btn-icon" title={t("panel.selectActions.upperMolar")}>{t("panel.selectActions.upperMolar")}</button>
                <button id="btnSelectLower" className="btn btn-ghost btn-icon" title={t("panel.selectActions.lower")}>{t("panel.selectActions.lower")}</button>
                <button id="btnSelectLowerFront" className="btn btn-ghost btn-icon" title={t("panel.selectActions.lowerFront")}>{t("panel.selectActions.lowerFront")}</button>
                <button id="btnSelectLowerMolar" className="btn btn-ghost btn-icon" title={t("panel.selectActions.lowerMolar")}>{t("panel.selectActions.lowerMolar")}</button>
              </div>
            </div>
            {panelPlacement === "compact" && (
              <nav className="panel-group-nav" aria-label={t("panel.controls")}>
                {PANEL_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={"btn btn-ghost btn-sm" + (panelGroup === group.id ? " is-active" : "")}
                    aria-pressed={panelGroup === group.id}
                    onClick={() => setPanelGroup(group.id)}
                  >
                    {t(group.labelKey)}
                  </button>
                ))}
              </nav>
            )}
            <div id="warnings" className="warnings"></div>
          </div>

          <div className="panel-body">
            <ExaminationCard />
            <div className={showStatusCard ? "" : "hidden"}>
              <section className="card" id="statusCard">
                <div className="card-title card-title-row">
                  <span>{t("status.title")}</span>
                  <button id="btnToggleStatusCard" className="icon-btn" title={t("actions.collapse", { label: t("status.title") })} aria-label={t("actions.collapse", { label: t("status.title") })}>
                    <span className="toggle-icon" aria-hidden="true">−</span>
                  </button>
                </div>
                <div className="row status-actions" id="statusCardBody">
                  <button id="btnResetAll" className="btn btn-ghost btn-sm">{t("status.resetAll")}</button>
                  <button id="btnPrimaryDentition" className="btn btn-ghost btn-sm">{t("status.primaryDentition")}</button>
                  <button id="btnMixedDentition" className="btn btn-ghost btn-sm">{t("status.mixedDentition")}</button>
                  <button id="btnEdentulous" className="btn btn-toggle btn-sm" aria-pressed="false">{t("status.edentulous")}</button>
                </div>
                {/* odontogram-iqj: der Vorschlag aus dem Alter. Er SCHLAEGT VOR
                    und wendet nie von selbst an - ein Preset setzt jeden Zahn
                    auf den Ausgangszustand zurueck, und wer ein Geburtsdatum
                    nachtraegt, hat womoeglich schon befundet. */}
                <div id="dentitionSuggestion" className="row hidden">
                  <span id="dentitionSuggestionText" className="hint"></span>
                  <button id="btnApplyDentitionSuggestion" className="btn btn-ghost btn-sm"></button>
                </div>
                <div className="row status-extra-row">
                  <span>{t("status.extraLabel")}</span>
                  <select id="statusExtraSelect"></select>
                  <button id="statusExtraApply" className="btn btn-ghost btn-sm">{t("status.extraApply")}</button>
                </div>
              </section>
            </div>

            <section className="card">
              <div className="card-title card-title-row">
                <span>{t("tooth.title")}</span>
                <button id="btnResetTooth" className="btn btn-ghost btn-sm" title={t("tooth.resetTitle")} aria-label={t("tooth.resetTitle")}>{t("tooth.reset")}</button>
              </div>
              <div className="row">
                <span>{t("tooth.baseLabel")}</span>
                <select id="toothSelect"></select>
              </div>
              {/* odontogram-0n8: wie weit ein SICHTBARER Zahn durchgebrochen
                  ist. Steht HIER, direkt unter der Anwesenheit, weil es
                  dieselbe Frage eine Stufe feiner beantwortet: "nicht
                  durchgebrochen" in der Liste darueber heisst, dass gar
                  nichts zu sehen ist. Zwei Karten weiter bei den
                  Wurzelbefunden stand es zuerst - und dort sucht es niemand. */}
              <div id="eruptionRow" className="row">
                <span>{t("eruptionStage.label")}</span>
                <select id="eruptionSelect"></select>
              </div>
              <div id="substrateRow" className="row">
                <span>{t("substrate.label")}</span>
                <select id="substrateSelect"></select>
              </div>
              <label id="extractionRow" className="row">
                <input type="checkbox" id="extractionWound" />
                <span>{t("tooth.extractionWound")}</span>
              </label>
              <label id="missingClosedRow" className="row">
                <input type="checkbox" id="missingClosed" />
                <span>{t("tooth.missingClosed")}</span>
              </label>
              <div id="restorationRow" className="row">
                <span>{t("restoration.label")}</span>
                <select id="restorationSelect"></select>
              </div>
              <div id="onlayCoverageRow" className="row inline-checks hidden">
                <span>{t("onlayCoverage.label")}</span>
                <label><input type="checkbox" id="onlayCovMesial" /><span>{t("surface.mesial")}</span></label>
                <label><input type="checkbox" id="onlayCovDistal" /><span>{t("surface.distal")}</span></label>
                <label><input type="checkbox" id="onlayCovBuccal" /><span>{t("surface.buccal")}</span></label>
                <label><input type="checkbox" id="onlayCovLingual" /><span>{t("surface.lingual")}</span></label>
                <label><input type="checkbox" id="onlayCovOcclusal" /><span>{t("surface.occlusal")}</span></label>
              </div>
              <div id="inlayCoverageRow" className="row inline-checks hidden">
                <span>{t("inlayCoverage.label")}</span>
                <label><input type="checkbox" id="inlayCovMesial" /><span>{t("surface.mesial")}</span></label>
                <label><input type="checkbox" id="inlayCovDistal" /><span>{t("surface.distal")}</span></label>
                <label><input type="checkbox" id="inlayCovBuccal" /><span>{t("surface.buccal")}</span></label>
                <label><input type="checkbox" id="inlayCovLingual" /><span>{t("surface.lingual")}</span></label>
                <label><input type="checkbox" id="inlayCovOcclusal" /><span>{t("surface.occlusal")}</span></label>
              </div>
              <div id="veneerCoverageRow" className="row inline-checks hidden">
                <span>{t("veneerCoverage.label")}</span>
                <label><input type="checkbox" id="veneerCovMesial" /><span>{t("surface.mesial")}</span></label>
                <label><input type="checkbox" id="veneerCovDistal" /><span>{t("surface.distal")}</span></label>
                <label><input type="checkbox" id="veneerCovBuccal" /><span>{t("surface.buccal")}</span></label>
                <label><input type="checkbox" id="veneerCovLingual" /><span>{t("surface.lingual")}</span></label>
                <label><input type="checkbox" id="veneerCovOcclusal" /><span>{t("surface.occlusal")}</span></label>
              </div>
              {/* Bead odontogram-dma: what holds a removable denture to this
                  tooth. Its own row rather than more entries in the restoration
                  dropdown: a clasp is not a restoration, and it sits on teeth
                  that carry none. Hidden by syncControlsFromState on a tooth
                  that can hold nothing. */}
              <div id="retentionRow" className="row hidden">
                <span>{t("retention.label")}</span>
                <select id="retentionSelect"></select>
                <select id="retentionSideSelect"></select>
              </div>
              {/* odontogram-5rv: die Schwebebruecke und der Hinweis auf
                  fehlende Pfeiler. HIER und nicht bei den Kronen-Schaltern:
                  jene Zeile (#crownActionsRow) haengt an extractionPlanAllowed
                  und steht an einer LUECKE auf display:none - also genau dort,
                  wo ein Brueckenglied steht und beides gebraucht wird. Erst in
                  der laufenden App gemessen, im Quelltext war nichts zu sehen.

                  Der Hinweis MELDET, er verhindert nichts: ein Befund wird in
                  Bruchstuecken aufgenommen, erst das Glied, dann die Pfeiler.
                  Er verschwindet, sobald die Pfeiler stehen oder das Glied als
                  schwebend erklaert ist. */}
              <label id="cantileverRow" className="row hidden">
                <input type="checkbox" id="cantilever" />
                <span>{t("tooth.cantilever")}</span>
              </label>
              <div id="bridgeSupportGap" className="hint bridge-support-gap hidden"></div>
              <label id="crownLeakageRow" className="row hidden">
                <input type="checkbox" id="crownLeakage" />
                <span>{t("crownLeakage.label")}</span>
              </label>
              <div id="crownMarginRow" className="row hidden">
                <span>{t("crownMarginType.label")}</span>
                <select id="crownMarginTypeSelect"></select>
                <select id="crownMarginSideSelect"></select>
              </div>
              <label id="splintedRow" className="row hidden">
                <input type="checkbox" id="splinted" />
                <span>{t("splint.label")}</span>
              </label>
              <label id="occlusalSplintRow" className="row hidden">
                <input type="checkbox" id="occlusalSplint" />
                <span>{t("occlusalSplint.label")}</span>
              </label>
              <div id="occlusalFunctionRow" className="row hidden">
                <span>{t("occlusalFunction.label")}</span>
                <select id="occlusalFunctionSelect"></select>
              </div>
              <label id="rootCapRow" className="row hidden">
                <input type="checkbox" id="rootCap" />
                <span>{t("rootCap.label")}</span>
              </label>
              <div id="brokenCrownRow" className="row inline-checks contact-row">
                <label>
                  <input type="checkbox" id="brokenMesial" />
                  <span>{t("tooth.broken.mesial")}</span>
                </label>
                <label>
                  <input type="checkbox" id="brokenIncisal" />
                  <span>{t("tooth.broken.incisal")}</span>
                </label>
                <label>
                  <input type="checkbox" id="brokenDistal" />
                  <span>{t("tooth.broken.distal")}</span>
                </label>
              </div>
              <div id="crownFractureTypeRow" className="row">
                <span>{t("crownFractureType.label")}</span>
                <select id="crownFractureTypeSelect"></select>
              </div>
              <div id="contactPointRow" className="row inline-checks contact-row">
                <label>
                  <input type="checkbox" id="contactMesial" />
                  <span>{t("tooth.contact.mesialMissing")}</span>
                </label>
                <label>
                  <input type="checkbox" id="contactDistal" />
                  <span>{t("tooth.contact.distalMissing")}</span>
                </label>
              </div>
              <div id="bruxismRow" className="inline-checks bruxism-row wear-stack">
                <div id="wearEdgeRow" className="row">
                  <label id="wearEdgeSelectLabel"><span>{t("tooth.bruxism.edgeWear")}</span><select id="wearEdgeSelect"></select></label>
                  <label id="wearEdgeToggleLabel" className="inline-check hidden"><input type="checkbox" id="wearEdgeToggle" /><span>{t("tooth.bruxism.edgeWear")}</span></label>
                </div>
                <div id="wearCervicalRow" className="row">
                  <label id="wearCervicalSelectLabel"><span>{t("tooth.bruxism.neckWear")}</span><select id="wearCervicalSelect"></select></label>
                  <label id="wearCervicalToggleLabel" className="inline-check hidden"><input type="checkbox" id="wearCervicalToggle" /><span>{t("tooth.bruxism.neckWear")}</span></label>
                </div>
              </div>
              <div id="discolorationRow" className="row inline-checks">
                <label id="discolorationSelectLabel"><span>{t("discoloration.label")}</span><select id="discolorationSelect"></select></label>
                <label id="discolorationToggleLabel" className="inline-check hidden"><input type="checkbox" id="discolorationToggle" /><span>{t("discoloration.label")}</span></label>
              </div>
              <div id="crownActionsRow" className="row inline-checks bridge-actions-row">
                <label id="bridgePillarRow" className="inline-check">
                  <input type="checkbox" id="bridgePillar" />
                  <span>{t("tooth.bridgePillar")}</span>
                </label>
                <label id="extractionPlanRow" className="inline-check">
                  <input type="checkbox" id="extractionPlan" />
                  <span>{t("tooth.extractionPlan")}</span>
                </label>
              </div>
              <label id="crownReplaceRow" className="row">
                <input type="checkbox" id="crownReplace" />
                <span>{t("tooth.crownReplace")}</span>
              </label>
              <label id="crownNeededRow" className="row">
                <input type="checkbox" id="crownNeeded" />
                <span>{t("tooth.crownNeeded")}</span>
              </label>
            </section>

            <div className={showOrthoCard ? "" : "hidden"}>
              <section id="orthoCard" className="card">
                <div className="card-title card-title-row">
                  <span>{t("toothInfo.orthodontics")}</span>
                </div>
                <div id="orthoApplianceRow" className="row">
                  <span>{t("ortho.appliance.label")}</span>
                  <select id="orthoApplianceSelect"></select>
                </div>
                <div id="orthoBracketSideRow" className="row">
                  <span>{t("ortho.bracketSide.label")}</span>
                  <select id="orthoBracketSideSelect"></select>
                </div>
                <div id="orthoDriftRow" className="row">
                  <span>{t("ortho.drift.label")}</span>
                  <select id="orthoDriftSelect"></select>
                </div>
                <div id="orthoVerticalRow" className="row">
                  <span>{t("ortho.vertical.label")}</span>
                  <select id="orthoVerticalSelect"></select>
                </div>
                <label id="orthoRotationRow" className="row inline-check">
                  <input type="checkbox" id="orthoRotationToggle" />
                  <span>{t("ortho.rotation.label")}</span>
                </label>
                <label id="orthoProgressiveRow" className="row inline-check">
                  <input type="checkbox" id="orthoProgressiveToggle" />
                  <span>{t("ortho.progressive.label")}</span>
                </label>
              </section>
            </div>

            <section id="cariesSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("caries.title")}</span>
                <button id="btnToggleCariesCard" className="icon-btn" title={t("actions.collapse", { label: t("caries.title") })} aria-label={t("actions.collapse", { label: t("caries.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="hint">{t("caries.hint")}</div>
              <div id="cariesDepthRow" className="row">
                <span>{t("caries.depthLabel")}</span>
                <select id="cariesDepthSelect"></select>
              </div>
              <div id="cariesChecks"></div>
              <div id="cariesSubcrownRow" className="check-grid subcrown-row"></div>
              {/* Bead odontogram-d1b: cervical caries whose side the source does not name. */}
              <div id="cervicalUnknownCariesRow" className="row inline-checks hidden">
                <label title={t("cervical.unknown.hint")}><input type="checkbox" id="cervicalUnknownCaries" /><span>{t("cervical.unknown.label")}</span></label>
              </div>
              <div id="rootCariesRow" className="row">
                <span>{t("caries.rootLabel")}</span>
                <select id="rootCariesSelect"></select>
              </div>
            </section>

            <section id="fillingSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("filling.title")}</span>
                <button id="btnToggleFillingCard" className="icon-btn" title={t("actions.collapse", { label: t("filling.title") })} aria-label={t("actions.collapse", { label: t("filling.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="row">
                <span>{t("filling.typeLabel")}</span>
                <select id="fillingSelect"></select>
              </div>
              <div id="fillingSurfaceChecks" className="hidden"></div>
              {/* Bead odontogram-d1b: a cervical filling whose side the source does not name. */}
              <div id="cervicalUnknownFillingRow" className="row inline-checks hidden">
                <label title={t("cervical.unknown.hint")}><input type="checkbox" id="cervicalUnknownFilling" /><span>{t("cervical.unknown.label")}</span></label>
              </div>
              <label id="fissureSealingRow" className="row fissure-row">
                <input type="checkbox" id="fissureSealing" />
                <span>{t("filling.fissureSealing")}</span>
              </label>
              <div id="fillingSubcariesSummary" className="hint hidden"></div>
              <div id="fillingDefectSummary" className="hint hidden"></div>
            </section>

            <section id="rootPeriodontiumSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("card.rootPeriodontium")}</span>
                <button id="btnToggleRootPeriodontiumCard" className="icon-btn" title={t("actions.collapse", { label: t("card.rootPeriodontium") })} aria-label={t("actions.collapse", { label: t("card.rootPeriodontium") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>

              <div id="rpRootBlock">
                <div className="hint">{t("endo.hint")}</div>
                {/* Bead odontogram-fu1: was GEPRUEFT wurde, VOR dem, was daraus
                    geschlossen wurde. Die Reihenfolge im Bedienfeld ist die
                    Reihenfolge am Stuhl - erst Kaeltespray und Klopfen, dann
                    die Benennung. */}
                <div id="sensibilityRow" className="row">
                  <span>{t("sensibility.label")}</span>
                  <select id="sensibilitySelect"></select>
                </div>
                <div id="percussionRow" className="row">
                  <span>{t("percussion.label")}</span>
                  <select id="percussionSelect"></select>
                </div>
                <div id="pulpEndoRow" className="row">
                  <span>{t("pulpEndo.label")}</span>
                  <select id="pulpEndoSelect"></select>
                </div>
                <div id="rootPostRow" className="row">
                  <span>{t("rootPost.label")}</span>
                  <select id="rootPostSelect"></select>
                </div>
                <div id="apicalDxRow" className="row">
                  <span>{t("apical.dxLabel")}</span>
                  <select id="apicalDxSelect"></select>
                </div>
                <div id="periapicalTypeRow" className="row hidden">
                  <span>{t("periapical.typeLabel")}</span>
                  <select id="periapicalTypeSelect"></select>
                </div>
                <div id="apicalRootRow" className="row hidden">
                  <span>{t("apical.rootLabel")}</span>
                  <select id="apicalRootSelect"></select>
                </div>
                <div id="papillaMesialRow" className="row">
                  <span>{t("papillaLoss.label")} ({t("papillaLoss.site.mesial")})</span>
                  <select id="papillaMesialSelect"></select>
                </div>
                <div id="papillaDistalRow" className="row">
                  <span>{t("papillaLoss.label")} ({t("papillaLoss.site.distal")})</span>
                  <select id="papillaDistalSelect"></select>
                </div>
                {/* Beads odontogram-t6y / -ca0. Die Wurzelfraktur steht bei den
                    Wurzelbefunden, nicht bei den drei Bruchachsen der Krone -
                    sie ist ein anderer Befund mit anderer Folge. */}
                <div id="rootFractureRow" className="row">
                  <span>{t("rootFracture.label")}</span>
                  <select id="rootFractureSelect"></select>
                </div>
                {/* Welche Wurzel. Nur bei mehrwurzeligen Zaehnen sichtbar -
                    bei einem Einwurzler gibt es nichts zu waehlen. */}
                <div id="rootFractureRootRow" className="row hidden">
                  <span>{t("rootFracture.rootLabel")}</span>
                  <select id="rootFractureRootSelect"></select>
                </div>
                <div id="rootResectionRow" className="row">
                  <span>{t("rootResection.label")}</span>
                  <select id="rootResectionSelect"></select>
                </div>
                <div id="rootResectionRootRow" className="row hidden">
                  <span>{t("rootResection.rootLabel")}</span>
                  <select id="rootResectionRootSelect"></select>
                </div>
                <div id="resorptionRow" className="row">
                  <span>{t("root.resorption")}</span>
                  <select id="resorptionSelect"></select>
                </div>
                <div className="row inline-checks">
                  <label>
                    <input type="checkbox" id="endoResection" />
                    <span>{t("endo.resection")}</span>
                  </label>
                  <label>
                    <input type="checkbox" id="parapulpalPin" />
                    <span>{t("endo.parapulpalPin")}</span>
                  </label>
                </div>
              </div>

              <div id="rpPerioBlock">
                <div id="mobilityRow" className="row">
                  <span>{t("inflammation.mobilityLabel")}</span>
                  <select id="mobilitySelect"></select>
                </div>
                <div id="perioRow" className="perio-block">
                  <div className="perio-block-title">{t("perio.title")}</div>
                  <div id="perioGrid" className="perio-grid"></div>
                  <div id="perioReadout" className="hint perio-readout"></div>
                </div>
                <div id="modsChecks" className="check-grid"></div>
                <div id="calculusRow" className="row inline-checks hidden">
                  <label><input type="checkbox" id="calculusToggle" /><span>{t("calculus.label")}</span></label>
                </div>
                <div id="periImplantRow" className="row hidden">
                  <span>{t("periImplant.label")}</span>
                  <select id="periImplantSelect"></select>
                </div>
                {/* Implantatposition (charly BefundAngabeImplantat) — wo das
                    Implantat im Zahnfach steht. Nur auf einem Implantat gezeigt,
                    dieselbe Sichtbarkeits-Gatterung wie #periImplantRow. */}
                <div id="implantPositionRow" className="row hidden">
                  <span>{t("implantPosition.label")}</span>
                  <select id="implantPositionSelect"></select>
                </div>
                {/* odontogram-im1: which implant is in the tooth. Its own block
                    rather than more entries in the restoration list, and shown
                    only on an implant — the same gate `#periImplantRow` uses.
                    Every field may stay empty: an implant that arrived with the
                    patient is a complete record without any of this. */}
                <div id="implantProductBlock" className="implant-product hidden">
                  <div className="implant-product-head">
                    <span>{t("implantProduct.legend")}</span>
                    <span className="hint">{t("implantProduct.optional")}</span>
                  </div>
                  <div className="row">
                    <span>{t("implantProduct.manufacturer")}</span>
                    <input id="implantManufacturer" type="text" list="implantManufacturerList" autoComplete="off" />
                    <datalist id="implantManufacturerList"></datalist>
                  </div>
                  <div className="row">
                    <span>{t("implantProduct.system")}</span>
                    <input id="implantSystem" type="text" list="implantSystemList" autoComplete="off" />
                    <datalist id="implantSystemList"></datalist>
                  </div>
                  <div className="row implant-product-dims">
                    <span>{t("implantProduct.diameter")}</span>
                    <input id="implantDiameter" type="number" min="1" max="10" step="0.1" />
                    <span>{t("implantProduct.length")}</span>
                    <input id="implantLength" type="number" min="4" max="25" step="0.5" />
                  </div>
                  <div className="row">
                    <span>{t("implantProduct.udi")}</span>
                    <input id="implantUdi" type="text" autoComplete="off" />
                  </div>
                  <div id="implantUdiReadout" className="hint implant-product-readout"></div>
                  {/* odontogram-im1: shown ONLY where an empty product is a
                      gap — an implant this practice placed. One the patient
                      arrived with is a complete record without any of it. */}
                  <div id="implantProductGap" className="hint implant-product-gap hidden"></div>
                </div>
                {/* Bead odontogram-99h: WELCHES Produkt in der Restauration
                    steckt. Gebaut wie der Implantatblock darueber, aus
                    demselben Grund und mit derselben Regel: Dirk, 21.08.2026,
                    "eine derartige Versorgung muss auch gueltig sein, wenn sie
                    nicht erhoben wird. Bei einem Eingangsbefund wird sie mit
                    grosser Wahrscheinlichkeit sowieso nicht zu ermitteln sein."
                    Der Hinweis unten erscheint deshalb NUR, wo ein leeres Feld
                    wirklich eine Luecke ist - an Arbeit, die diese Praxis
                    gemacht hat. */}
                <div id="restorationProductBlock" className="implant-product hidden">
                  <div className="implant-product-head">
                    <span>{t("restorationProduct.legend")}</span>
                    <span className="hint">{t("restorationProduct.optional")}</span>
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.manufacturer")}</span>
                    <input id="restProdManufacturer" type="text" list="restProdManufacturerList" autoComplete="off" />
                    <datalist id="restProdManufacturerList"></datalist>
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.product")}</span>
                    <input id="restProdProduct" type="text" list="restProdProductList" autoComplete="off" />
                    <datalist id="restProdProductList"></datalist>
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.shade")}</span>
                    <input id="restProdShade" type="text" autoComplete="off" />
                    <span>{t("restorationProduct.lab")}</span>
                    <input id="restProdLab" type="text" list="restProdLabList" autoComplete="off" />
                    <datalist id="restProdLabList"></datalist>
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.udi")}</span>
                    <input id="restProdUdi" type="text" autoComplete="off" />
                  </div>
                  <div id="restProdReadout" className="hint implant-product-readout"></div>
                  <div id="restorationProductGap" className="hint implant-product-gap hidden"></div>
                </div>
                {/* odontogram-99h, zweiter Teil. Dirk, 21.08.2026: "Ja, beim
                    Komposit machen wir es der Vollstaendigkeit halber mit dazu,
                    erlauben aber, dass es fehlt." KEIN Lueckenhinweis also -
                    das ist der Unterschied zur Laborarbeit darueber.

                    Ein Block mit Materialwahl statt einem Block je Material:
                    ein Zahn traegt fast immer ein Material, und wo er zwei
                    traegt, waeren zwei gleich aussehende Bloecke uebereinander
                    schwerer zu lesen als eine Auswahl. */}
                <div id="fillingProductBlock" className="implant-product hidden">
                  <div className="implant-product-head">
                    <span>{t("fillingProduct.legend")}</span>
                    <span className="hint">{t("restorationProduct.optional")}</span>
                  </div>
                  <div className="row">
                    <span>{t("fillingProduct.material")}</span>
                    <select id="fillProdMaterial"></select>
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.manufacturer")}</span>
                    <input id="fillProdManufacturer" type="text" list="restProdManufacturerList" autoComplete="off" />
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.product")}</span>
                    <input id="fillProdProduct" type="text" list="restProdProductList" autoComplete="off" />
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.shade")}</span>
                    <input id="fillProdShade" type="text" autoComplete="off" />
                  </div>
                  <div className="row">
                    <span>{t("restorationProduct.udi")}</span>
                    <input id="fillProdUdi" type="text" autoComplete="off" />
                  </div>
                  <div id="fillProdReadout" className="hint implant-product-readout"></div>
                </div>
              </div>
            </section>

          </div>
          </div>
        </aside>
      </main>

      {viewMode === "popup" && <PerioChart open={perioOpen} onClose={closePerioOverlay} />}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        t={t}
        settings={settingsState}
      />

      <DualStateConfirm
        open={confirmOpen}
        t={t}
        onAccept={acceptDualStateConfirm}
        onCancel={cancelDualStateConfirm}
      />    </div>
  );
}
