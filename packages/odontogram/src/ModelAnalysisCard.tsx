// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51.1: entering the measured crown widths, and the analysis
// derived from them, in one card.
//
// TWO VIEWS, ONE SOURCE. Dirk chose an arch layout and a list, switchable. They
// are two renderings of the SAME `getToothWidths()` — neither owns the data and
// neither mirrors the other, so there is nothing to keep in sync. Switching
// view is a local `useState`; it deliberately does NOT go through the engine,
// because which layout someone prefers while measuring is not clinical state.
//
// NORMS ARE LIVE. Also Dirk's call: every index shows its published norm, the
// deviation and a bar while the numbers are still being typed, so entering the
// measurements doubles as checking them — a transposed digit moves the bar
// visibly instead of hiding in a total.
//
// Self-contained in the `PerioSidebar` mould: owns its React state and ONE
// `onStateChange` subscription, so it can be mounted anywhere without a host
// having to thread props. The analysis itself is never stored — it is derived
// on every render by `deriveModelAnalysis`, which is pure.

import { useEffect, useMemo, useRef, useState } from "react";
import { t, getI18nLanguage } from "./i18n/useI18n";
import {
  formatToothLabel,
  getAbsentTeeth,
  getOcclusalMeasurements,
  getReadOnly,
  getToothWidths,
  onStateChange,
  setOcclusalMeasurement,
  setToothWidth,
} from "./odontogram";
import {
  deriveModelAnalysis,
  type ModelAnalysis,
  type RatioIndex,
} from "./modelAnalysis";

/** The four direct-entry occlusal readings, in the order they are charted. */
const OCCLUSAL_FIELDS = [
  { key: "overjet", labelKey: "model.overjet", hintKey: "model.overjet.negative" },
  { key: "overbite", labelKey: "model.overbite", hintKey: "model.overbite.negative" },
  { key: "midlineUpper", labelKey: "model.midline.upper", hintKey: null },
  { key: "midlineLower", labelKey: "model.midline.lower", hintKey: null },
] as const;

/** Arch order, midline in the middle — the order a model is measured in. */
const UPPER_ROW = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26];
const LOWER_ROW = [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36];

type ViewMode = "arch" | "list";

interface ViewProps {
  widths: Record<number, number>;
  readOnly: boolean;
  /** toothNo -> the contralateral tooth its width was borrowed from. */
  assumed: Record<number, number>;
}

// A German clinician writes 7,0 mm, not 7.0 mm. `toFixed` always emits a dot,
// so every number a reader sees goes through the active locale instead —
// caught in the browser, not in the tests, which all run under English.
function locale(): string {
  const lang = getI18nLanguage();
  return lang === "pt-br" ? "pt-BR" : lang;
}

/** Exactly one fraction digit — for derived values, which are all 0,1 precise. */
function num(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return value.toLocaleString(locale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * A measured width as the field should show it: always at least one decimal,
 * so a column of readings lines up (7 reads as 7,0), but never rounding away a
 * finer reading the caliper actually gave.
 */
function widthText(value: number | null): string {
  if (value === null) return "";
  return value.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function signed(value: number | null, digits = 1): string {
  if (value === null) return "—";
  const s = num(value, digits);
  return value > 0 ? `+${s}` : s;
}

/**
 * Deviation bar, centred on the norm. Full deflection at ±5 percentage points,
 * which covers every clinically interesting Tonn/Bolton deviation without
 * flattening the small ones. Beyond that the bar simply saturates — it is an
 * orientation aid, and the number next to it stays exact.
 */
function DeviationBar({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null) {
    return <span className="ma-bar ma-bar-empty" aria-hidden="true" />;
  }
  const clamped = Math.max(-5, Math.min(5, deltaPercent));
  const halfWidth = Math.abs(clamped) / 5 * 50;
  const left = clamped < 0 ? 50 - halfWidth : 50;
  return (
    <span className="ma-bar" aria-hidden="true">
      <span className="ma-bar-axis" />
      <span
        className={`ma-bar-fill ${clamped < 0 ? "is-under" : "is-over"}`}
        style={{ left: `${left}%`, width: `${halfWidth}%` }}
      />
    </span>
  );
}

/** `8,7` and `8.7` are the same reading. Anything else is not a number. */
function parseWidth(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function WidthInput({ toothNo, value, readOnly, assumedFrom }: {
  toothNo: number;
  value: number | null;
  readOnly: boolean;
  /** Set when this width was BORROWED from the contralateral tooth. */
  assumedFrom?: number;
}) {
  // NOT `type="number"`. A number input rejects the decimal COMMA that every
  // German-speaking user types, and hands back an empty string instead of the
  // reading — the measurement would silently not be recorded. Text plus
  // inputMode="decimal" still raises the numeric keypad on a tablet, which is
  // where a caliper reading actually gets typed.
  const [draft, setDraft] = useState(() => widthText(value));
  const focused = useRef(false);

  // While the field has focus the draft is the user's text and nothing may
  // overwrite it — otherwise committing each keystroke would fight the typist
  // halfway through "10,5". Unfocused, it mirrors the engine, so an external
  // change (blank-slate reset, import, a second view) shows up here.
  useEffect(() => {
    if (!focused.current) setDraft(widthText(value));
  }, [value]);

  // An assumed width is an INFERENCE. It shows the borrowed number so the sums
  // are traceable, but it is read-only and visibly marked: a substituted value
  // that looks like a measurement is the one way this could mislead someone.
  if (assumedFrom !== undefined) {
    return (
      <input
        type="text"
        readOnly
        className="ma-width-input is-assumed"
        value={widthText(value)}
        data-tooth={toothNo}
        data-assumed-from={assumedFrom}
        title={t("model.assumed.hint", { from: formatToothLabel(assumedFrom) })}
        aria-label={t("model.assumed.aria", {
          tooth: formatToothLabel(toothNo),
          from: formatToothLabel(assumedFrom),
        })}
      />
    );
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className="ma-width-input"
      value={draft}
      disabled={readOnly}
      aria-label={t("model.widthOf", { tooth: formatToothLabel(toothNo) })}
      data-tooth={toothNo}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        // Show what was actually stored, including a clamped caliper slip.
        setDraft(widthText(value));
      }}
      onChange={e => {
        setDraft(e.currentTarget.value);
        setToothWidth(toothNo, parseWidth(e.currentTarget.value));
      }}
    />
  );
}

function ArchView({ widths, readOnly, assumed }: ViewProps) {
  const row = (teeth: number[], label: string) => (
    <div className="ma-arch-row">
      <span className="ma-arch-label">{label}</span>
      <div className="ma-arch-teeth">
        {teeth.map((toothNo, i) => (
          <div
            key={toothNo}
            className={`ma-arch-cell${i === teeth.length / 2 ? " is-midline" : ""}`}
          >
            <span className="ma-arch-tooth">{formatToothLabel(toothNo)}</span>
            <WidthInput toothNo={toothNo} value={assumed[toothNo] !== undefined ? (widths[assumed[toothNo]] ?? null) : (widths[toothNo] ?? null)} readOnly={readOnly} assumedFrom={assumed[toothNo]} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="ma-arch" dir="ltr">
      {row(UPPER_ROW, t("model.upper"))}
      {row(LOWER_ROW, t("model.lower"))}
    </div>
  );
}

function ListView({ widths, readOnly, assumed }: ViewProps) {
  return (
    <div className="ma-list-scroll">
      <table className="ma-list">
        <thead>
          <tr>
            <th scope="col">{t("model.tooth")}</th>
            <th scope="col">{t("model.width")}</th>
            <th scope="col">{t("model.tooth")}</th>
            <th scope="col">{t("model.width")}</th>
          </tr>
        </thead>
        <tbody>
          {UPPER_ROW.map((upper, i) => {
            const lower = LOWER_ROW[i];
            return (
              <tr key={upper}>
                <th scope="row">{formatToothLabel(upper)}</th>
                <td><WidthInput toothNo={upper} value={assumed[upper] !== undefined ? (widths[assumed[upper]] ?? null) : (widths[upper] ?? null)} readOnly={readOnly} assumedFrom={assumed[upper]} /></td>
                <th scope="row">{formatToothLabel(lower)}</th>
                <td><WidthInput toothNo={lower} value={assumed[lower] !== undefined ? (widths[assumed[lower]] ?? null) : (widths[lower] ?? null)} readOnly={readOnly} assumedFrom={assumed[lower]} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The four ruler readings. Direct entry, not derived — so unlike the indices
 * they carry no norm bar, only their sign convention, which is spelled out
 * next to the field rather than left for the reader to guess.
 */
function OcclusalRow({ values, readOnly }: {
  values: Record<string, number | null>;
  readOnly: boolean;
}) {
  return (
    <div className="ma-occlusal">
      {OCCLUSAL_FIELDS.map(({ key, labelKey, hintKey }) => {
        const value = values[key] ?? null;
        const isMidline = key.startsWith("midline");
        return (
          <div className="ma-occl-field" key={key}>
            <label htmlFor={`ma-${key}`}>{t(labelKey)}</label>
            <div className="ma-occl-entry">
              <SignedInput id={`ma-${key}`} field={key} value={value} readOnly={readOnly} />
              <small>mm</small>
            </div>
            <span className="ma-occl-hint">
              {isMidline
                ? (value === null || value === 0 ? t("model.midline.centred") :
                   t(value > 0 ? "model.midline.right" : "model.midline.left"))
                : (value !== null && value < 0 && hintKey ? t(hintKey) : "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Signed millimetre entry — same comma tolerance and draft handling as a width. */
function SignedInput({ id, field, value, readOnly }: {
  id: string;
  field: string;
  value: number | null;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState(() => (value === null ? "" : num(value)));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value === null ? "" : num(value));
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className="ma-width-input"
      value={draft}
      disabled={readOnly}
      data-occlusal={field}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setDraft(value === null ? "" : num(value)); }}
      onChange={e => {
        setDraft(e.currentTarget.value);
        const raw = e.currentTarget.value.trim().replace(",", ".");
        const n = raw === "" || raw === "-" ? null : Number(raw);
        setOcclusalMeasurement(field as never, n === null || !Number.isFinite(n) ? null : n);
      }}
    />
  );
}

function IndexRow({ labelKey, index }: { labelKey: string; index: RatioIndex }) {
  return (
    <tr>
      <th scope="row">{t(labelKey)}</th>
      <td className="ma-num ma-norm">{num(index.targetPercent)} %</td>
      <td className="ma-num">{index.actualPercent === null ? "—" : `${num(index.actualPercent)} %`}</td>
      <td className={`ma-num ma-delta${index.deltaPercent === null ? "" : index.deltaPercent > 0 ? " is-over" : " is-under"}`}>
        {signed(index.deltaPercent)}
      </td>
      <td className="ma-bar-cell"><DeviationBar deltaPercent={index.deltaPercent} /></td>
    </tr>
  );
}

function Analysis({ analysis }: { analysis: ModelAnalysis }) {
  const { sums } = analysis;
  const excess = analysis.boltonAnterior.excess;
  return (
    <>
      <div className="ma-sums">
        {([
          ["model.sum.si", sums.upperIncisors],
          ["model.sum.siLower", sums.lowerIncisors],
          ["model.sum.upperAnterior", sums.upperAnterior],
          ["model.sum.lowerAnterior", sums.lowerAnterior],
          ["model.sum.upperTotal", sums.upperTotal],
          ["model.sum.lowerTotal", sums.lowerTotal],
        ] as const).map(([key, value]) => (
          <div className="ma-sum" key={key}>
            <span className="ma-sum-label">{t(key)}</span>
            <span className="ma-sum-value">{num(value)}<small> mm</small></span>
          </div>
        ))}
      </div>

      <div className="ma-list-scroll">
        <table className="ma-indices">
          <thead>
            <tr>
              <th scope="col">{t("model.index")}</th>
              <th scope="col">{t("model.col.norm")}</th>
              <th scope="col">{t("model.col.actual")}</th>
              <th scope="col">{t("model.col.delta")}</th>
              <th scope="col"><span className="ma-visually-hidden">{t("model.col.deviation")}</span></th>
            </tr>
          </thead>
          <tbody>
            <IndexRow labelKey="model.index.tonn" index={analysis.tonn} />
            <IndexRow labelKey="model.index.boltonAnterior" index={analysis.boltonAnterior} />
            <IndexRow labelKey="model.index.boltonOverall" index={analysis.boltonOverall} />
          </tbody>
        </table>
      </div>

      {analysis.substitutions.length > 0 && (
        <p className="ma-assumed-note">
          {t("model.assumed.note", {
            list: analysis.substitutions
              .map(sub => `${formatToothLabel(sub.toothNo)} ← ${formatToothLabel(sub.from)}`)
              .join(", "),
          })}
        </p>
      )}

      <dl className="ma-findings">
        <dt>{t("model.targetSi")}</dt>
        <dd>{num(analysis.targetUpperIncisorSum)}<small> mm</small></dd>
        <dt>{t("model.discrepancy")}</dt>
        <dd>
          {excess === null || analysis.boltonAnterior.excessMm === null
            ? "—"
            : t(excess === "lower" ? "model.excess.lower" : "model.excess.upper", {
                mm: num(Math.abs(analysis.boltonAnterior.excessMm)),
              })}
        </dd>
      </dl>
    </>
  );
}

/**
 * Which half of the card to render.
 *
 * `entry` is the measured record — the arch or list of tooth widths and the
 * four occlusal readings. `results` is everything DERIVED from it: the sums,
 * the Tonn/Bolton table and the findings. Omitted renders both, which is the
 * whole card as it has always been.
 *
 * The split exists because a bounded host inspector is too narrow to hold the
 * entry and the results at once. Both halves read the same engine state and
 * both subscribe to `onStateChange`, so they stay in step without talking to
 * each other — and the entry half is the only one carrying fields, so mounting
 * the two together duplicates no form and no id.
 */
export type ModelCardSection = "entry" | "results";

/**
 * The model-analysis card. Mount it wherever the orthodontic workspace ends up;
 * every prop is optional and it keeps itself current through `onStateChange`.
 */
export function ModelAnalysisCard({ section, defaultView = "arch" }: {
  section?: ModelCardSection;
  /** The view the entry half opens in. A narrow host wants `list`. */
  defaultView?: ViewMode;
} = {}) {
  const [widths, setWidths] = useState<Record<number, number>>(() => getToothWidths());
  const [absent, setAbsent] = useState<number[]>(() => getAbsentTeeth());
  const [occlusal, setOcclusal] = useState(() => getOcclusalMeasurements());
  const [readOnly, setReadOnly] = useState<boolean>(() => getReadOnly());
  const [view, setView] = useState<ViewMode>(defaultView);

  useEffect(() => onStateChange(() => {
    setWidths(getToothWidths());
    setAbsent(getAbsentTeeth());
    setOcclusal(getOcclusalMeasurements());
    setReadOnly(getReadOnly());
  }), []);

  const analysis = useMemo(
    () => deriveModelAnalysis({ widths, absentTeeth: absent }),
    [widths, absent],
  );
  // toothNo -> the tooth its width came from, for the two views to mark.
  const assumed = useMemo(
    () => Object.fromEntries(analysis.substitutions.map(sub => [sub.toothNo, sub.from])),
    [analysis],
  );

  const showEntry = section !== "results";
  const showResults = section !== "entry";
  // The fields live in the entry half, so that half keeps the card's id and
  // every host selector that already points at it. The results half gets its
  // own, because the two can be mounted side by side.
  const sectionId = section === "results" ? "modelAnalysisResults" : "modelAnalysisCard";
  const titleId = section === "results" ? "maResultsTitle" : "maTitle";

  return (
    <section
      className={"card ma-card" + (section ? ` ma-${section}` : "")}
      id={sectionId}
      aria-labelledby={titleId}
    >
      <header className="ma-head">
        <h3 id={titleId}>{t("model.title")}</h3>
        {showEntry && (
          <div className="ma-viewswitch" role="group" aria-label={t("model.view.label")}>
            {(["arch", "list"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                className={view === mode ? "is-active" : ""}
                aria-pressed={view === mode}
                onClick={() => setView(mode)}
              >
                {t(mode === "arch" ? "model.view.arch" : "model.view.list")}
              </button>
            ))}
          </div>
        )}
      </header>

      {showEntry && (view === "arch"
        ? <ArchView widths={widths} readOnly={readOnly} assumed={assumed} />
        : <ListView widths={widths} readOnly={readOnly} assumed={assumed} />)}

      {showEntry && <OcclusalRow values={occlusal} readOnly={readOnly} />}

      {showResults && <Analysis analysis={analysis} />}
    </section>
  );
}

export default ModelAnalysisCard;
