// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * SCHEMATIC keypad (bead odontogram-ip3, Phase 2 — Dirk, 24.08.2026: "klein
 * und übersichtlich wie in charly").
 *
 * A compact charly-style keypad shown BELOW the schematic chart. It is NOT a
 * second mutation path: every key routes through `applyShorthand`, the very
 * function the keyboard shorthand (bead odontogram-t8y) uses, so edits go
 * through `applyToSelected` + the DS-1 gate exactly as typing would. The button
 * set and its abbreviations are charly's own keypad, transcribed in
 * `shorthand.ts` / `docs/charly/01-befund-tastenfeld.md`.
 *
 * Two mode rows, mutually exclusive, drive the five surface keys — charly's own
 * "pick the material, then key the surfaces" (Dirk, 19.08.2026):
 *   - a MATERIAL chip active → a surface writes a FILLING (`Ko`);
 *   - a CARIES stage active (or neither) → a surface writes CARIES (`cK3o`/`co`).
 *
 * The button GLYPHS are charly's German keypad vocabulary (the `SHORTHAND_DE`
 * table is German-only) and stay as-is; everything AROUND them — headings, row
 * labels, material names, hints, tooltips — goes through `t()` and follows the
 * UI language.
 */
import { type ReactNode, useEffect, useState } from "react";
import { applyShorthand, setRetention, onShorthandReadout, getShorthandBuffer, applyDentitionSuggestion, type ShorthandReadout } from "./odontogram";
import { t } from "./i18n/useI18n";

type Btn = { label: string; token?: string; titleKey: string; mat?: boolean };

const MATERIALS: { label: string; ch: string; labelKey: string }[] = [
  { label: "Kst", ch: "K", labelKey: "schematic.keypad.mat.composite" },   // Kunststoff
  { label: "Am", ch: "A", labelKey: "schematic.keypad.mat.amalgam" },
  { label: "G", ch: "G", labelKey: "schematic.keypad.mat.gold" },
  { label: "Ker", ch: "E", labelKey: "schematic.keypad.mat.ceramic" },
  { label: "Zir", ch: "Zir", labelKey: "schematic.keypad.mat.zircon" },
  { label: "NEM", ch: "NEM", labelKey: "schematic.keypad.mat.nem" },
];
// charly's five caries stages K1…K5 → cariesSeverity 2…6 (SHORTHAND_DE); the
// K-token is what rides into the shorthand string (`cK3o`).
const CARIES_STAGES = ["K1", "K2", "K3", "K4", "K5"] as const;
// Labelled in LOWER case, exactly what is typed (Dirk, 25.09.2026) — charly's
// key field does the same. Upper case is a different key here: `D` is the
// eruption stage, `K`/`A`/`G`/`E` are materials.
const SURFACES: { label: string; ch: string; titleKey: string }[] = [
  { label: "m", ch: "m", titleKey: "schematic.keypad.t.mesial" },
  { label: "o", ch: "o", titleKey: "schematic.keypad.t.occlusal" },
  { label: "d", ch: "d", titleKey: "schematic.keypad.t.distal" },
  { label: "v", ch: "v", titleKey: "schematic.keypad.t.buccal" },
  { label: "l", ch: "l", titleKey: "schematic.keypad.t.lingual" },
];
const STATE_BTNS: Btn[] = [
  { label: "o.B.", token: "o.B.", titleKey: "schematic.keypad.t.oB" },
  { label: "f", token: "f", titleKey: "schematic.keypad.t.f" },
  { label: "x", token: "x", titleKey: "schematic.keypad.t.x" },
  { label: "i", token: "i", titleKey: "schematic.keypad.t.i" },
  { label: "WR", token: "WR", titleKey: "schematic.keypad.t.wr" },
  { label: "Fr", token: "Fr", titleKey: "schematic.keypad.t.fr" },
  { label: "Zst", token: "Zst", titleKey: "schematic.keypad.t.zst" },
  { label: ")L(", token: ")L(", titleKey: "schematic.keypad.t.gap" },
];
// charly's D — eruption stage in three steps (bead odontogram-0n8).
const ERUPTION_BTNS: Btn[] = [
  { label: "D1", token: "D1", titleKey: "schematic.keypad.t.d1" },
  { label: "D2", token: "D2", titleKey: "schematic.keypad.t.d2" },
  { label: "D3", token: "D3", titleKey: "schematic.keypad.t.d3" },
];
// charly's clasp/bar pictures → the retention axis (bead odontogram-dma). These
// do NOT go through applyShorthand (retention has its own gated setter that
// clears the side and honours retentionAllowed); they call setRetention direct.
const RETENTION_BTNS: { label: string; value: string; titleKey: string }[] = [
  { label: "Kl", value: "clasp", titleKey: "schematic.keypad.t.clasp" },
  { label: "Gesch", value: "attachment", titleKey: "schematic.keypad.t.attachment" },
  { label: "Steg", value: "bar-abutment", titleKey: "schematic.keypad.t.bar" },
];
const RESTO_BTNS: Btn[] = [
  { label: "k", titleKey: "schematic.keypad.t.crown", mat: true },
  { label: "ONL", titleKey: "schematic.keypad.t.onlay", mat: true },
  { label: "t", token: "t", titleKey: "schematic.keypad.t.telescope" },
  { label: "b", titleKey: "schematic.keypad.t.pontic", mat: true },
  { label: "e", token: "e", titleKey: "schematic.keypad.t.denture" },
];
const ENDO_BTNS: Btn[] = [
  { label: "wf", token: "wf", titleKey: "schematic.keypad.t.wf" },
  { label: "WFi", token: "WFi", titleKey: "schematic.keypad.t.wfi" },
  { label: "Twf", token: "Twf", titleKey: "schematic.keypad.t.twf" },
  { label: "Sti", token: "Sti", titleKey: "schematic.keypad.t.post" },
  { label: "Res", token: "Res", titleKey: "schematic.keypad.t.res" },
];
const APICAL_BTNS: Btn[] = [
  { label: "Fra", token: "Fra", titleKey: "schematic.keypad.t.fra" },
  { label: "Hem", token: "Hem", titleKey: "schematic.keypad.t.hem" },
  { label: "Be", token: "Be", titleKey: "schematic.keypad.t.be" },
  { label: "Zys", token: "Zys", titleKey: "schematic.keypad.t.zys" },
];
const PULP_BTNS: Btn[] = [
  { label: "+", token: "+", titleKey: "schematic.keypad.t.vital" },
  { label: "−", token: "-", titleKey: "schematic.keypad.t.noresp" },
  { label: "?", token: "?", titleKey: "schematic.keypad.t.quest" },
  { label: "p", token: "p", titleKey: "schematic.keypad.t.perc" },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="keypad-row">
      {label ? <span className="keypad-row-label">{label}</span> : null}
      <div className="keypad-keys">{children}</div>
    </div>
  );
}

/** A titled dock card grouping related rows (Befund-Dock, Dirk 30.08.2026). */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="keypad-group">
      <h3 className="keypad-group-title">{title}</h3>
      {children}
    </div>
  );
}

export default function SchematicKeypad({ tooth, readOnly, mat, stage, onMat, onStage, onCaries }: {
  tooth: number | null;
  /**
   * The chart is locked (host read-only, or a save in flight).
   *
   * Without this the keypad stayed fully lit on a locked chart: every key
   * looked live, and a click reported nothing back. The engine refuses the edit
   * either way (see `applyShorthand`); this is the half that SAYS so, the same
   * way `.panel.read-only` dims the native control panel.
   */
  readOnly?: boolean;
  // The armed material chip char (K/A/G/E) or null, and the armed caries stage
  // K-token or null — LIFTED to App so a surface click on the chart shares the
  // same "filling vs caries" mode. Mutually exclusive.
  mat: string | null;
  stage: string | null;
  onMat: (ch: string) => void;
  onStage: (k: string) => void;
  /** The visible caries switch: back to caries mode (no material, no stage). */
  onCaries: () => void;
}) {
  const enabled = tooth != null && !readOnly;
  const [readout, setReadout] = useState<ShorthandReadout>(() => ({ material: null, buffer: getShorthandBuffer(), notice: "" }));
  useEffect(() => onShorthandReadout(setReadout), []);
  const apply = (token: string) => { if (enabled) applyShorthand(token); };
  // Restoration keys that take a material get the chosen chip, defaulting to
  // ceramic ("E") — a crown/onlay/bridge with no material would only report
  // `needsMaterial` and change nothing.
  const applyResto = (b: Btn) => {
    if (!enabled) return;
    if (b.mat) applyShorthand((mat ?? "E") + b.label);
    else if (b.token) applyShorthand(b.token);
  };
  // charly's double role: material active → filling; otherwise caries, at the
  // chosen stage if one is picked (`cK3o`), else default severity (`co`).
  const applySurface = (ch: string) => {
    if (!enabled) return;
    applyShorthand(mat ? mat + ch : "c" + (stage ?? "") + ch);
  };
  const pickMat = (ch: string) => onMat(ch);
  const pickStage = (k: string) => onStage(k);
  const applyRetention = (v: string) => { if (enabled && tooth != null) setRetention(tooth, v); };

  const hint = mat
    ? t("schematic.keypad.hint.filling")
    : stage
      ? t("schematic.keypad.hint.cariesStage", { n: stage.slice(1) })
      : t("schematic.keypad.hint.caries");

  const btn = (b: Btn) => (
    <button key={b.label} type="button" className="keypad-btn" aria-label={t(b.titleKey)} data-tip={t(b.titleKey)}
      disabled={!enabled} onClick={() => (b.mat ? applyResto(b) : apply(b.token!))}>
      {b.label}
    </button>
  );

  return (
    <div className={"schematic-keypad" + (enabled ? "" : " is-disabled")}>
      <div className="keypad-head">
        <span className="keypad-title">{t("schematic.keypad.title")}</span>
        <span className="keypad-active">
          {tooth != null ? t("schematic.keypad.tooth", { n: tooth }) : t("schematic.keypad.pickTooth")}
        </span>
        {/* What the keyboard has typed so far (material mode + open buffer), or
            what a key did NOT do — the same read-out the anatomical panel has. */}
        {(readout.notice || readout.buffer || readout.material) && (
          <span className={"keypad-readout" + (readout.notice ? " is-notice" : "")} aria-live="polite">
            {readout.notice || [readout.material, readout.buffer].filter(Boolean).join(" ")}
          </span>
        )}
      </div>
      <div className="keypad-groups">
        <Group title={t("schematic.keypad.row.state")}>
          <Row label="">{STATE_BTNS.map(btn)}</Row>
          <Row label={t("schematic.keypad.row.eruption")}>{ERUPTION_BTNS.map(btn)}</Row>
          {/* Milk teeth (Dirk, 25.09.2026: "Wie schalte ich hier auf Milchzaehne
              um?" - in the compact view there was no way). charly's `MZ` marks
              the selected teeth as milk teeth; the two dentition presets reset
              EVERY tooth, so they ask first, and they need no tooth selected. */}
          <Row label={t("schematic.keypad.row.dentition")}>
            <button type="button" className="keypad-btn" aria-label={t("schematic.keypad.t.mz")} data-tip={t("schematic.keypad.t.mz")}
              disabled={!enabled} onClick={() => apply("MZ")}>MZ</button>
            <button type="button" className="keypad-btn" onClick={() => {
              if (window.confirm(t("schematic.keypad.confirmDentition"))) applyDentitionSuggestion("primary");
            }}>{t("status.primaryDentition")}</button>
            <button type="button" className="keypad-btn" onClick={() => {
              if (window.confirm(t("schematic.keypad.confirmDentition"))) applyDentitionSuggestion("mixed");
            }}>{t("status.mixedDentition")}</button>
          </Row>
        </Group>

        <Group title={t("schematic.keypad.row.restoration")}>
          <Row label="">{RESTO_BTNS.map(btn)}</Row>
          <Row label={t("schematic.keypad.row.material")}>
            {/* The CARIES switch, first in the mode row like charly's `C` before
                Am/G/Kst/Ker (Dirk, 25.09.2026: "ein Schalter, der Karies
                einschaltet, sichtbar als Knopf"). Caries was the mode whenever
                no material was armed, but nothing SHOWED it, and the only way
                back from a material was to click that material again. Lit
                whenever surfaces enter caries — with or without a stage K1-K5. */}
            <button type="button" aria-pressed={mat === null} aria-label={t("schematic.keypad.row.caries")}
              data-tip={t("schematic.keypad.hint.caries")} disabled={!enabled}
              className={"keypad-btn keypad-mat keypad-caries" + (mat === null ? " is-active" : "")}
              onClick={onCaries}>
              {t("schematic.keypad.row.caries")}
            </button>
            {MATERIALS.map((m) => (
              <button key={m.ch} type="button" aria-label={t(m.labelKey)} data-tip={t(m.labelKey)} disabled={!enabled}
                className={"keypad-btn keypad-mat" + (mat === m.ch ? " is-active" : "")}
                onClick={() => pickMat(m.ch)}>
                {t(m.labelKey)}
              </button>
            ))}
          </Row>
        </Group>

        <Group title={t("schematic.keypad.row.surfaces")}>
          <Row label="">
            {SURFACES.map((s) => (
              <button key={s.ch} type="button" className="keypad-btn keypad-surf" aria-label={t(s.titleKey)} data-tip={t(s.titleKey)}
                disabled={!enabled} onClick={() => applySurface(s.ch)}>
                {s.label}
              </button>
            ))}
          </Row>
          <Row label={t("schematic.keypad.row.caries")}>
            {CARIES_STAGES.map((k) => (
              <button key={k} type="button" aria-label={t("schematic.keypad.t.cariesStage", { n: k.slice(1) })}
                data-tip={t("schematic.keypad.t.cariesStage", { n: k.slice(1) })} disabled={!enabled}
                className={"keypad-btn keypad-stage" + (stage === k ? " is-active" : "")}
                onClick={() => pickStage(k)}>
                {k}
              </button>
            ))}
          </Row>
          <span className="keypad-hint">{hint}</span>
        </Group>

        <Group title={t("schematic.keypad.row.endo")}>
          <Row label="">{ENDO_BTNS.map(btn)}</Row>
          <Row label={t("schematic.keypad.row.rootApical")}>{APICAL_BTNS.map(btn)}</Row>
        </Group>

        <Group title={t("schematic.keypad.row.retention")}>
          <Row label="">
            {RETENTION_BTNS.map((r) => (
              <button key={r.value} type="button" className="keypad-btn" aria-label={t(r.titleKey)} data-tip={t(r.titleKey)}
                disabled={!enabled} onClick={() => applyRetention(r.value)}>
                {r.label}
              </button>
            ))}
          </Row>
        </Group>

        <Group title={t("schematic.keypad.row.pulp")}>
          <Row label="">{PULP_BTNS.map(btn)}</Row>
        </Group>
      </div>
    </div>
  );
}
