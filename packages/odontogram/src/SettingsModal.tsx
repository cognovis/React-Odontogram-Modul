// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Language } from "./i18n/translations";
import type { NumberingSystem } from "./utils/numbering";
import type {
  PulpDetailLevel,
  SecondaryCariesMode,
  RootCariesMode,
  RadiographicDepthMode,
  ToothDetailLevel,
  SurfaceNotation,
  PerioViewMode,
  PerioRowId,
  PerioIndexNameMode,
} from "./odontogram";
// Bead odontogram-sjr: the palette is engine state; the modal is its control
// surface, so it reads and writes it directly rather than through SettingsState.
import {
  getRestorationColours, isRestorationPaletteDefault, setRestorationColour, resetRestorationColours,
  getShorthandEnabled, setShorthandEnabled, getShorthandTabWalk, setShorthandTabWalk,
  getToothDepth, setToothDepth,
  getAnatomicalStyle, setAnatomicalStyle, type AnatomicalStyle,
} from "./odontogram";
import { SHORTHAND_DE, SHORTHAND_PENDING, MATERIALS } from "./shorthand";
import { AXES } from "./registry/axes";

/** Translation function signature (subset of `useI18n`'s `t`). */
type TFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * The full set of live setting values + change handlers the modal drives.
 *
 * Every field maps 1:1 to an existing App-level piece of state / module
 * accessor — the modal never owns behavior, it only surfaces the controls.
 * New settings are added here and wired into a tab's `render()`.
 */
export type SettingsState = {
  numbering: NumberingSystem;
  onNumbering: (value: NumberingSystem) => void;
  language: Language;
  onLanguage: (value: Language) => void;
  isDark: boolean;
  onToggleDark: () => void;
  toothInfo: boolean;
  onToothInfo: (value: boolean) => void;
  befundDock?: boolean;
  onBefundDock?: (value: boolean) => void;
  secondaryCariesMode: SecondaryCariesMode;
  onSecondaryCariesMode: (value: SecondaryCariesMode) => void;
  icdas: boolean;
  onIcdas: (value: boolean) => void;
  cariesDepth: boolean;
  onCariesDepth: (value: boolean) => void;
  rootCariesMode: RootCariesMode;
  onRootCariesMode: (value: RootCariesMode) => void;
  radiographicDepthMode: RadiographicDepthMode;
  onRadiographicDepthMode: (value: RadiographicDepthMode) => void;
  pulpLevel: PulpDetailLevel;
  onPulpLevel: (value: PulpDetailLevel) => void;
  wearDetailLevel: ToothDetailLevel;
  onWearDetailLevel: (value: ToothDetailLevel) => void;
  discolorationDetailLevel: ToothDetailLevel;
  onDiscolorationDetailLevel: (value: ToothDetailLevel) => void;
  surfaceNotation: SurfaceNotation;
  onSurfaceNotation: (value: SurfaceNotation) => void;
  notes: boolean;
  onNotes: (value: boolean) => void;
  showStatusCard: boolean;
  onShowStatusCard: (value: boolean) => void;
  showOrthoCard: boolean;
  onShowOrthoCard: (value: boolean) => void;
  perioViewMode: PerioViewMode;
  onPerioViewMode: (value: PerioViewMode) => void;
  perioRowVisibility: Record<PerioRowId, boolean>;
  onPerioRowVisibility: (id: PerioRowId, visible: boolean) => void;
  perioIndexNameMode: PerioIndexNameMode;
  onPerioIndexNameMode: (value: PerioIndexNameMode) => void;
};

/** Context handed to every tab's `render()`. */
type TabContext = { t: TFn; s: SettingsState };

/**
 * Declarative tab registry. Adding a settings section is a matter of pushing a
 * new `{ id, titleKey, render }` entry (and its i18n keys) — no structural
 * changes to the modal shell. `render` receives the live settings + `t`.
 */
type SettingsTab = {
  id: string;
  titleKey: string;
  render: (ctx: TabContext) => ReactNode;
};

const NUMBERING_OPTIONS: { value: NumberingSystem; labelKey: string }[] = [
  { value: "FDI", labelKey: "numbering.fdi" },
  { value: "UNIVERSAL", labelKey: "numbering.universal" },
  { value: "PALMER", labelKey: "numbering.palmer" },
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

const SECONDARY_OPTIONS: { value: SecondaryCariesMode; labelKey: string }[] = [
  { value: "simple", labelKey: "settings.secondaryCaries.simple" },
  { value: "standard", labelKey: "settings.secondaryCaries.standard" },
  { value: "full", labelKey: "settings.secondaryCaries.full" },
];

const ROOT_OPTIONS: { value: RootCariesMode; labelKey: string }[] = [
  { value: "simple", labelKey: "settings.rootCaries.simple" },
  { value: "severity", labelKey: "settings.rootCaries.severity" },
];

const RADIOGRAPHIC_OPTIONS: { value: RadiographicDepthMode; labelKey: string }[] = [
  { value: "off", labelKey: "settings.radiographic.off" },
  { value: "threeLevel", labelKey: "settings.radiographic.threeLevel" },
  { value: "detailed", labelKey: "settings.radiographic.detailed" },
];

const PULP_OPTIONS: { value: PulpDetailLevel; labelKey: string }[] = [
  { value: "simple", labelKey: "pulp.level.simple" },
  { value: "aae", labelKey: "pulp.level.aae" },
  { value: "latin", labelKey: "pulp.level.latin" },
];

const TOOTH_DETAIL_OPTIONS: { value: ToothDetailLevel; labelKey: string }[] = [
  { value: "complex", labelKey: "settings.toothDetail.complex" },
  { value: "simple", labelKey: "settings.toothDetail.simple" },
];

const SURFACE_NOTATION_OPTIONS: { value: SurfaceNotation; labelKey: string }[] = [
  { value: "full", labelKey: "settings.surfaceNotation.full" },
  { value: "simple", labelKey: "settings.surfaceNotation.simple" },
];

const PERIO_VIEW_MODE_OPTIONS: { value: PerioViewMode; labelKey: string }[] = [
  { value: "toggle", labelKey: "settings.perioViewMode.toggle" },
  { value: "popup", labelKey: "settings.perioViewMode.popup" },
];

const PERIO_INDEX_NAME_MODE_OPTIONS: { value: PerioIndexNameMode; labelKey: string }[] = [
  { value: "translated", labelKey: "settings.perioIndexNameMode.translated" },
  { value: "canonical", labelKey: "settings.perioIndexNameMode.canonical" },
];

/**
 * Declarative row-id groups for the Periodontal settings tab. Each group is a
 * sub-heading + the row ids it covers; a `ToggleRow` is rendered per id,
 * bound to `s.perioRowVisibility[id]` / `s.onPerioRowVisibility(id, v)`.
 */
const PERIO_ROW_GROUPS: { titleKey: string; ids: PerioRowId[] }[] = [
  { titleKey: "settings.perio.group.pocket", ids: ["pd", "gm", "cal", "bop", "sup"] },
  { titleKey: "settings.perio.group.hygiene", ids: ["plaque", "pi", "gi"] },
  { titleKey: "settings.perio.group.mucogingival", ids: ["cej", "rootConcavity", "kg", "gt"] },
  { titleKey: "settings.perio.group.support", ids: ["furcation", "mobility", "miller", "papillaLoss"] },
  { titleKey: "settings.perio.group.periimplant", ids: ["mpi", "mbi"] },
];

/** A single settings row: label + description + a control on the right. */
function SettingRow({
  t,
  label,
  descKey,
  children,
}: {
  t: TFn;
  label: string;
  descKey: string;
  children: ReactNode;
}) {
  const descId = useId();
  return (
    <div className="odon-settings-row">
      <div className="odon-settings-row-text">
        <div className="odon-settings-row-label">{label}</div>
        <div className="odon-settings-row-desc" id={descId}>
          {t(descKey)}
        </div>
      </div>
      <div className="odon-settings-row-control" data-desc={descId}>
        {children}
      </div>
    </div>
  );
}

/** A labelled <select> control bound to a string-enum setting. */
function SelectRow<V extends string>({
  t,
  label,
  descKey,
  value,
  options,
  onChange,
}: {
  t: TFn;
  label: string;
  descKey: string;
  value: V;
  options: { value: V; labelKey: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <SettingRow t={t} label={label} descKey={descKey}>
      <select
        className="odon-settings-select"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </SettingRow>
  );
}

/** A labelled on/off switch (accessible checkbox). */
function ToggleRow({
  t,
  label,
  descKey,
  checked,
  onChange,
}: {
  t: TFn;
  label: string;
  descKey: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <SettingRow t={t} label={label} descKey={descKey}>
      <label className="odon-settings-switch">
        <input
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="odon-settings-switch-track" aria-hidden="true" />
      </label>
    </SettingRow>
  );
}

/** Bead odontogram-sjr: one colour picker per restoration material, plus a
 *  reset. Reads and writes the engine directly rather than threading fifteen
 *  values through SettingsState — the palette is engine state, and the modal is
 *  only its control surface. */
function ColourTab({ t }: { t: (k: string, v?: Record<string, unknown>) => string }) {
  const [, bump] = useState(0);
  const colours = getRestorationColours();
  // "Reset to defaults" is enabled only when something differs from the fork
  // default palette (the shipped standard), not merely when any colour is set.
  const dirty = !isRestorationPaletteDefault();
  return (
    <>
      <p className="settings-desc">{t("settings.colours.desc")}</p>
      <div className="settings-colour-grid">
        {colours.map(({ key, value }) => (
          <label key={key} className="settings-colour-row">
            <input
              type="color"
              value={value}
              aria-label={t("restColour." + key)}
              onChange={(e) => { setRestorationColour(key, e.target.value); bump((n) => n + 1); }}
            />
            <span>{t("restColour." + key)}</span>
          </label>
        ))}
      </div>
      <button
        className="btn btn-ghost btn-sm"
        disabled={!dirty}
        onClick={() => { resetRestorationColours(); bump((n) => n + 1); }}
      >{t("settings.colours.reset")}</button>
    </>
  );
}

/** Resolves a shorthand entry into a translated label, so the key list needs no
 *  copy of its own in twelve languages. The registry already carries a
 *  `labelKey` for every enum value the pickers show; a key that writes
 *  `restorationType: crown` therefore reads exactly as the dropdown does. */
function shorthandLabel(t: TFn, entry: unknown): string {
  const e = entry as { kind: string; field?: string; value?: unknown;
                       edits?: { field: string; value: unknown }[];
                       surface?: string; material?: string; severity?: number };
  const axisLabel = (field: string, value: unknown): string | null => {
    const axis = AXES.find(a => a.field === field);
    const opt = axis?.uiOptions?.find(o => o.value === value);
    if(opt) return t(opt.labelKey);
    if(typeof value === "boolean") return field;
    return null;
  };
  switch(e.kind){
    case "axis": {
      const l = axisLabel(e.field!, e.value);
      return l ?? `${e.field}: ${String(e.value)}`;
    }
    case "axes":
      return (e.edits ?? [])
        .map(x => axisLabel(x.field, x.value) ?? `${x.field}: ${String(x.value)}`)
        .join(" + ");
    case "surface":  return t(`surface.${e.surface}`);
    case "material": return t(`settings.shorthand.material`, { m: e.material ?? "" });
    case "caries":   return t("settings.shorthand.cariesRun");
    case "severity": return t("settings.shorthand.severity", { n: e.severity ?? 0 });
    case "denture":  return t("settings.shorthand.denture");
    case "reset":    return t("settings.shorthand.reset");
    default:         return e.kind;
  }
}

/** Bead odontogram-t8y + Zoltán Dul's condition on the upstream issue
 *  (19.08.2026): keyboard entry "has to be flexible and fully configurable in
 *  Settings, never hard-wired". Two switches, and the key table laid open —
 *  a shorthand nobody can look up is a shorthand nobody uses.
 *
 *  Reads and writes the engine directly, like {@link ColourTab}. */
function ShorthandTab({ t }: { t: TFn }) {
  const [, bump] = useState(0);
  const on = getShorthandEnabled();
  const walk = getShorthandTabWalk();
  const materials = Object.keys(MATERIALS);
  const gruppen: { titleKey: string; keys: string[] }[] = [
    { titleKey: "settings.shorthand.groupMaterial",
      keys: Object.keys(SHORTHAND_DE).filter(k => (SHORTHAND_DE[k] as { kind: string }).kind === "material") },
    { titleKey: "settings.shorthand.groupSurface",
      keys: Object.keys(SHORTHAND_DE).filter(k => {
        const kind = (SHORTHAND_DE[k] as { kind: string }).kind;
        return kind === "surface" || kind === "caries" || kind === "severity";
      }) },
    { titleKey: "settings.shorthand.groupTooth",
      keys: Object.keys(SHORTHAND_DE).filter(k => {
        const kind = (SHORTHAND_DE[k] as { kind: string }).kind;
        return kind !== "material" && kind !== "surface" && kind !== "caries" && kind !== "severity";
      }) },
  ];
  return (
    <>
      <p className="settings-desc">{t("settings.shorthand.desc")}</p>
      <ToggleRow
        t={t}
        label={t("settings.shorthand.enabled")}
        descKey="settings.shorthand.enabled.desc"
        checked={on}
        onChange={(v) => { setShorthandEnabled(v); bump(n => n + 1); }}
      />
      <ToggleRow
        t={t}
        label={t("settings.shorthand.tabWalk")}
        descKey="settings.shorthand.tabWalk.desc"
        checked={walk}
        onChange={(v) => { setShorthandTabWalk(v); bump(n => n + 1); }}
      />
      <p className="settings-note">{t("settings.shorthand.multiSelectNote")}</p>
      <div className="settings-shorthand-table" aria-disabled={!on}>
        {gruppen.map(g => (
          <section key={g.titleKey}>
            <h4>{t(g.titleKey)}</h4>
            <dl>
              {g.keys.map(k => (
                <div key={k} className="settings-shorthand-row">
                  <dt><kbd>{k}</kbd></dt>
                  <dd>{shorthandLabel(t, SHORTHAND_DE[k])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h4>{t("settings.shorthand.groupPending")}</h4>
          <p className="settings-desc">{t("settings.shorthand.pending.desc")}</p>
          <p className="settings-shorthand-pending">
            {Object.keys(SHORTHAND_PENDING).map(k => <kbd key={k}>{k}</kbd>)}
          </p>
        </section>
      </div>
      <p className="settings-desc">{t("settings.shorthand.materialsHint", { list: materials.join(" ") })}</p>
    </>
  );
}

/** Dirk, 20.08.2026: "Aber das laesst sich alles an und abschalten?" - zur
 *  Tiefenwirkung an Zahnsubstanz und Zahnhals. Ja: sie traegt keinen Befund,
 *  sie ist Darstellung, und wer den flachen Schnitt lieber liest, bekommt ihn.
 *  Liest und schreibt die Maschine direkt, wie {@link ColourTab}. */
function DepthToggle({ t }: { t: TFn }) {
  const [, bump] = useState(0);
  return (
    <ToggleRow
      t={t}
      label={t("settings.depth.label")}
      descKey="settings.depth.desc"
      checked={getToothDepth()}
      onChange={(v) => { setToothDepth(v); bump((n) => n + 1); }}
    />
  );
}

/** Anatomische Darstellung (Claude Design "Entwurf v1", 26.09.2026): eine
 *  dritte Ansicht neben der klassischen, umschaltbar und ohne Folgen fuer die
 *  Befunddaten. Liest und schreibt die Maschine direkt, wie {@link DepthToggle}. */
const ANATOMICAL_STYLE_OPTIONS: { value: AnatomicalStyle; labelKey: string }[] = [
  { value: "classic", labelKey: "settings.anatStyle.classic" },
  { value: "draft-v1", labelKey: "settings.anatStyle.draftV1" },
];
function AnatomicalStyleSelect({ t }: { t: TFn }) {
  const [, bump] = useState(0);
  return (
    <SelectRow<AnatomicalStyle>
      t={t}
      label={t("settings.anatStyle.label")}
      descKey="settings.anatStyle.desc"
      value={getAnatomicalStyle()}
      options={ANATOMICAL_STYLE_OPTIONS}
      onChange={(v) => { setAnatomicalStyle(v); bump((n) => n + 1); }}
    />
  );
}

export const SETTINGS_TABS: SettingsTab[] = [
  {
    id: "general",
    titleKey: "settings.tab.general",
    render: ({ t, s }) => (
      <>
        <SelectRow<NumberingSystem>
          t={t}
          label={t("numbering.label")}
          descKey="settings.numbering.desc"
          value={s.numbering}
          options={NUMBERING_OPTIONS}
          onChange={s.onNumbering}
        />
        <SelectRow<Language>
          t={t}
          label={t("language.label")}
          descKey="settings.language.desc"
          value={s.language}
          options={LANGUAGE_OPTIONS}
          onChange={s.onLanguage}
        />
        <ToggleRow
          t={t}
          label={t("settings.theme.label")}
          descKey="settings.theme.desc"
          checked={s.isDark}
          onChange={() => s.onToggleDark()}
        />
        <ToggleRow
          t={t}
          label={t("settings.toothInfo")}
          descKey="settings.toothInfo.desc"
          checked={s.toothInfo}
          onChange={s.onToothInfo}
        />
        <ToggleRow
          t={t}
          label={t("settings.befundDock")}
          descKey="settings.befundDock.desc"
          checked={!!s.befundDock}
          onChange={s.onBefundDock ?? (() => {})}
        />
        <div className="odon-settings-row odon-settings-row-disabled" aria-disabled="true">
          <div className="odon-settings-row-text">
            <div className="odon-settings-row-label">
              {t("settings.exportImport.title")}{" "}
              <span className="odon-settings-badge">{t("settings.comingSoon")}</span>
            </div>
            <div className="odon-settings-row-desc">{t("settings.exportImport.desc")}</div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "panels",
    titleKey: "settings.tab.panels",
    render: ({ t, s }) => (
      <>
        <ToggleRow
          t={t}
          label={t("settings.panels.statuses")}
          descKey="settings.panels.statuses.desc"
          checked={s.showStatusCard}
          onChange={s.onShowStatusCard}
        />
        <ToggleRow
          t={t}
          label={t("settings.panels.orthodontics")}
          descKey="settings.panels.orthodontics.desc"
          checked={s.showOrthoCard}
          onChange={s.onShowOrthoCard}
        />
        <SelectRow<PerioViewMode>
          t={t}
          label={t("settings.perioViewMode")}
          descKey="settings.perioViewMode.desc"
          value={s.perioViewMode}
          options={PERIO_VIEW_MODE_OPTIONS}
          onChange={s.onPerioViewMode}
        />
      </>
    ),
  },
  {
    id: "toothDetails",
    titleKey: "settings.tab.toothDetails",
    render: ({ t, s }) => (
      <>
        <AnatomicalStyleSelect t={t} />
        <DepthToggle t={t} />
        <SelectRow<ToothDetailLevel>
          t={t}
          label={t("settings.wearDetail.label")}
          descKey="settings.wearDetail.desc"
          value={s.wearDetailLevel}
          options={TOOTH_DETAIL_OPTIONS}
          onChange={s.onWearDetailLevel}
        />
        <SelectRow<ToothDetailLevel>
          t={t}
          label={t("settings.discolorationDetail.label")}
          descKey="settings.discolorationDetail.desc"
          value={s.discolorationDetailLevel}
          options={TOOTH_DETAIL_OPTIONS}
          onChange={s.onDiscolorationDetailLevel}
        />
        <SelectRow<SurfaceNotation>
          t={t}
          label={t("settings.surfaceNotation.label")}
          descKey="settings.surfaceNotation.desc"
          value={s.surfaceNotation}
          options={SURFACE_NOTATION_OPTIONS}
          onChange={s.onSurfaceNotation}
        />
      </>
    ),
  },
  {
    id: "caries",
    titleKey: "settings.tab.caries",
    render: ({ t, s }) => (
      <>
        <ToggleRow
          t={t}
          label={t("icdas.enable")}
          descKey="settings.icdas.desc"
          checked={s.icdas}
          onChange={s.onIcdas}
        />
        <ToggleRow
          t={t}
          label={t("settings.cariesDepth.label")}
          descKey="settings.cariesDepth.desc"
          checked={s.cariesDepth}
          onChange={s.onCariesDepth}
        />
        <SelectRow<RootCariesMode>
          t={t}
          label={t("caries.rootLabel")}
          descKey="settings.rootCaries.desc"
          value={s.rootCariesMode}
          options={ROOT_OPTIONS}
          onChange={s.onRootCariesMode}
        />
        <SelectRow<SecondaryCariesMode>
          t={t}
          label={t("caries.secondaryLabel")}
          descKey="settings.secondaryCaries.desc"
          value={s.secondaryCariesMode}
          options={SECONDARY_OPTIONS}
          onChange={s.onSecondaryCariesMode}
        />
        <SelectRow<RadiographicDepthMode>
          t={t}
          label={t("caries.radiographicLabel")}
          descKey="settings.radiographic.desc"
          value={s.radiographicDepthMode}
          options={RADIOGRAPHIC_OPTIONS}
          onChange={s.onRadiographicDepthMode}
        />
      </>
    ),
  },
  {
    id: "pulpa",
    titleKey: "settings.tab.pulpa",
    render: ({ t, s }) => (
      <SelectRow<PulpDetailLevel>
        t={t}
        label={t("pulp.level.label")}
        descKey="settings.pulpLevel.desc"
        value={s.pulpLevel}
        options={PULP_OPTIONS}
        onChange={s.onPulpLevel}
      />
    ),
  },
  {
    id: "notes",
    titleKey: "settings.tab.notes",
    render: ({ t, s }) => (
      <ToggleRow
        t={t}
        label={t("settings.notes")}
        descKey="settings.notes.desc"
        checked={s.notes}
        onChange={s.onNotes}
      />
    ),
  },
  {
    id: "periodontal",
    titleKey: "settings.tab.periodontal",
    render: ({ t, s }) => (
      <>
        {PERIO_ROW_GROUPS.map((group) => (
          <div key={group.titleKey}>
            <div className="odon-settings-group-title">{t(group.titleKey)}</div>
            {group.ids.map((id) => (
              <ToggleRow
                key={id}
                t={t}
                label={t(`settings.perio.row.${id}`)}
                descKey={`settings.perio.row.${id}.desc`}
                checked={s.perioRowVisibility[id]}
                onChange={(v) => s.onPerioRowVisibility(id, v)}
              />
            ))}
          </div>
        ))}
        <SelectRow<PerioIndexNameMode>
          t={t}
          label={t("settings.perioIndexNameMode")}
          descKey="settings.perioIndexNameMode.desc"
          value={s.perioIndexNameMode}
          options={PERIO_INDEX_NAME_MODE_OPTIONS}
          onChange={s.onPerioIndexNameMode}
        />
      </>
    ),
  },
  {
    // Bead odontogram-sjr: the 58n palette is the DEFAULT, not the only answer.
    // Session state, never payload — a practice preference, not patient data.
    // Appended rather than slotted in: the general -> panels -> toothDetails
    // run is pinned by two tests, and a display preference has no claim to sit
    // in front of the clinical tabs anyway.
    id: "colours",
    titleKey: "settings.tab.colours",
    render: ({ t }) => <ColourTab t={t} />,
  },
  {
    // Bead odontogram-t8y: keyboard shorthand switches + the key reference
    // table. Restored to the registry (Dirk 02.09.2026) — the ShorthandTab
    // component existed but had been dropped from SETTINGS_TABS, so the two
    // switches and the key list were unreachable. Appended like "colours" so
    // the general -> panels -> toothDetails order pins stay intact.
    id: "shorthand",
    titleKey: "settings.tab.shorthand",
    render: ({ t }) => <ShorthandTab t={t} />,
  },
];

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus-trapped, ARIA-labelled settings dialog. Opened from the topbar gear.
 *
 * - `role="dialog"` + `aria-modal`, labelled by its title.
 * - Esc closes; backdrop click closes; focus is trapped inside while open and
 *   returned to the opener element on close.
 * - Content is driven by the declarative {@link SETTINGS_TABS} registry.
 */
export default function SettingsModal({
  open,
  onClose,
  t,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  t: TFn;
  settings: SettingsState;
}) {
  const [activeTab, setActiveTab] = useState<string>(SETTINGS_TABS[0].id);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Capture the opener + move focus into the dialog when it opens; restore
  // focus to the opener when it closes/unmounts.
  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();
    return () => {
      openerRef.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    },
    [onClose],
  );

  // FIX 2 (a11y): APG-tabs keyboard support on the tablist. With a roving
  // tabindex only the active tab is Tab-reachable, so without this handler the
  // other tabs are mouse-only. Arrow Left/Right (and Up/Down) move between tabs
  // wrapping; Home → first, End → last. Activation is automatic (moving focus
  // also selects), matching the existing click-to-activate model. `.focus()`
  // works regardless of the roving `tabIndex`, so the just-selected tab (whose
  // DOM node already exists — same stable id) is focused synchronously.
  const onTabListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const nav = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!nav.includes(e.key)) return;
      e.preventDefault();
      const count = SETTINGS_TABS.length;
      if (count === 0) return;
      const cur = SETTINGS_TABS.findIndex((tab) => tab.id === activeTab);
      const idx = cur < 0 ? 0 : cur;
      let next = idx;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = count - 1;
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % count;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + count) % count;
      const nextTab = SETTINGS_TABS[next];
      if (!nextTab) return;
      if (nextTab.id !== activeTab) setActiveTab(nextTab.id);
      tablistRef.current
        ?.querySelector<HTMLElement>(`#odon-settings-tab-${nextTab.id}`)
        ?.focus();
    },
    [activeTab],
  );

  if (!open) return null;

  const current = SETTINGS_TABS.find((tab) => tab.id === activeTab) ?? SETTINGS_TABS[0];

  return (
    <div
      className="odon-settings-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="odon-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="odon-settings-header">
          <h2 className="odon-settings-title" id={titleId}>
            {t("settings.title")}
          </h2>
          <button
            type="button"
            className="odon-settings-close"
            onClick={onClose}
            aria-label={t("settings.close")}
            title={t("settings.close")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="odon-settings-body">
          <div
            ref={tablistRef}
            className="odon-settings-tabs"
            role="tablist"
            aria-label={t("settings.title")}
            onKeyDown={onTabListKeyDown}
          >
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`odon-settings-tab-${tab.id}`}
                aria-selected={tab.id === activeTab}
                aria-controls={`odon-settings-panel-${tab.id}`}
                tabIndex={tab.id === activeTab ? 0 : -1}
                className={
                  "odon-settings-tab" + (tab.id === activeTab ? " is-active" : "")
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {t(tab.titleKey)}
              </button>
            ))}
          </div>
          <div
            className="odon-settings-panel"
            role="tabpanel"
            id={`odon-settings-panel-${current.id}`}
            aria-labelledby={`odon-settings-tab-${current.id}`}
          >
            {current.render({ t, s: settings })}
          </div>
        </div>
      </div>
    </div>
  );
}
