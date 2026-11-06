// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-ap7: the initial examination, and correcting it.
//
// The archive from odontogram-2vd had no controls at all — it was a host-only
// API — so "what the patient arrived with" could be derived but never actually
// recorded from the chart. This card is the missing half: it captures the
// initial examination, names the date every finding is judged against, and
// runs the correction round trip Dirk chose over a per-tooth override.
//
// It subscribes to `onStateChange` on its own, like PerioChart and
// PerioSidebar do, so archiving an examination re-renders the card without the
// whole App re-mounting.
import { useEffect, useState } from "react";
import {
  onStateChange, listExaminations, captureExamination, getBaselineExamination,
  beginBaselineCorrection, commitBaselineCorrection, cancelBaselineCorrection,
  isCorrectingBaseline, getReadOnly,
} from "./odontogram";
import { useI18n } from "./i18n/useI18n";

/** Today as `YYYY-MM-DD`, the shape `effectiveDateTime` takes elsewhere. */
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function ExaminationCard() {
  const { t } = useI18n();
  const [, bump] = useState(0);
  const [date, setDate] = useState(today);

  useEffect(() => onStateChange(() => bump((n) => n + 1)), []);

  const baseline = getBaselineExamination();
  const archived = listExaminations();
  const correcting = isCorrectingBaseline();
  const readOnly = getReadOnly();

  return (
    <section className="card" id="examinationCard">
      <div className="card-title">{t("examination.title")}</div>

      {correcting ? (
        // Unmissable on purpose: the chart is showing the initial examination,
        // NOT today's findings, and the stash that holds today's findings is
        // runtime-only (see beginBaselineCorrection) — a reload here loses them.
        <div id="baselineCorrectionBanner" className="baseline-correcting">
          <p className="baseline-correcting-text">{t("examination.correctingHint")}</p>
          <div className="row">
            <button
              className="btn btn-sm"
              onClick={() => { commitBaselineCorrection(); bump((n) => n + 1); }}
            >{t("examination.correctionSave")}</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { cancelBaselineCorrection(); bump((n) => n + 1); }}
            >{t("examination.correctionCancel")}</button>
          </div>
        </div>
      ) : (
        <>
          <p className="examination-baseline">
            <span className="tooth-info-heading">{t("examination.baseline")}:</span>{" "}
            {baseline
              ? (baseline.effectiveDateTime || baseline.id)
              : <span className="tooth-info-empty">{t("examination.noBaseline")}</span>}
          </p>

          <div className="row examination-actions">
            <input
              type="date"
              id="examinationDate"
              value={date}
              disabled={readOnly}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t("examination.date")}
            />
            <button
              id="btnCaptureExamination"
              className="btn btn-sm"
              disabled={readOnly}
              onClick={() => { captureExamination({ effectiveDateTime: date || null }); bump((n) => n + 1); }}
            >{baseline ? t("examination.capture") : t("examination.captureFirst")}</button>
            {baseline && (
              <button
                id="btnCorrectBaseline"
                className="btn btn-ghost btn-sm"
                disabled={readOnly}
                onClick={() => { beginBaselineCorrection(); bump((n) => n + 1); }}
              >{t("examination.correct")}</button>
            )}
          </div>

          {archived.length > 0 && (
            <ul className="examination-list">
              {archived.map((e, i) => (
                <li key={e.id ?? i} className={i === 0 ? "is-baseline" : ""}>
                  {e.effectiveDateTime || e.id}
                  {i === 0 && <span className="examination-badge">{t("examination.baselineBadge")}</span>}
                </li>
              ))}
            </ul>
          )}

          <p className="hint">{t("examination.hint")}</p>
        </>
      )}
    </section>
  );
}
