// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

// PROTOTYPE ONLY: seven KFO view concepts for odontogram-c51.
// Run with `npm run prototype:kfo` and switch variants with `?variant=A|B|C|D|E|F|G`.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./kfo-view-prototype.css";

type VariantKey = "A" | "B" | "C" | "D" | "E" | "F" | "G";

type KfoState = {
  angleRight: string;
  angleLeft: string;
  canineAngleRight: string;
  canineAngleLeft: string;
  sagittalRight: string;
  sagittalLeft: string;
  canineSagittalRight: string;
  canineSagittalLeft: string;
  sagittalUnit: string;
  overjet: string;
  verticalRelation: string;
  overbite: string;
  midlineUpper: string;
  midlineLower: string;
  crossbite: string[];
  scissorsBite: string[];
  crowdingUpper: string;
  crowdingLower: string;
  crowdingSeverityUpper: string;
  crowdingSeverityLower: string;
  kigGroup: string;
  kigGrade: string;
  kigMethod: string;
  boltonAnterior: string;
  boltonOverall: string;
  treatmentPhase: string;
  apparatusType: string;
  selectedTooth: number;
  eruptionStatus: string;
  missingEtiology: string;
  appliance: string;
  drift: string;
  verticalMovement: string;
  rotation: boolean;
};

const VARIANTS: ReadonlyArray<{ key: VariantKey; name: string; premise: string }> = [
  { key: "A", name: "Befundbogen", premise: "Alle Fallbefunde auf einen Blick, Zahnstatus rechts" },
  { key: "B", name: "Kieferzentriert", premise: "Das Gebiss ist die Arbeitsfläche, Befunde liegen darum" },
  { key: "C", name: "Geführte Untersuchung", premise: "Vier kurze Schritte mit sichtbarem Fortschritt" },
  { key: "D", name: "Expertenmatrix", premise: "Tastaturfreundliche, dichte Eingabe für Routinenutzer" },
  { key: "E", name: "KIG-Matrix", premise: "Die deutsche Einstufung ist die zentrale Arbeitsfläche" },
  { key: "F", name: "Okklusions-Schema", premise: "Relationen und Zahnzeilen werden anatomisch ausgerichtet" },
  { key: "G", name: "KFO-Cockpit", premise: "Kennzahlen, Fachregister und Verlauf bilden eine skalierbare Hülle" },
];

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const initialState: KfoState = {
  angleRight: "II/1",
  angleLeft: "I",
  canineAngleRight: "II",
  canineAngleLeft: "I",
  sagittalRight: "0.5",
  sagittalLeft: "0",
  canineSagittalRight: "0.5",
  canineSagittalLeft: "0",
  sagittalUnit: "PB",
  overjet: "5",
  verticalRelation: "deep",
  overbite: "4",
  midlineUpper: "2",
  midlineLower: "0",
  crossbite: ["right-posterior"],
  scissorsBite: [],
  crowdingUpper: "-3",
  crowdingLower: "-5",
  crowdingSeverityUpper: "moderate",
  crowdingSeverityLower: "moderate",
  kigGroup: "D",
  kigGrade: "4",
  kigMethod: "sagittale-stufe",
  boltonAnterior: "78.1",
  boltonOverall: "91.4",
  treatmentPhase: "aktiv",
  apparatusType: "festsitzend",
  selectedTooth: 13,
  eruptionStatus: "partial",
  missingEtiology: "none",
  appliance: "bracket",
  drift: "distal",
  verticalMovement: "none",
  rotation: true,
};

function readVariant(): VariantKey {
  const value = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
  return value && ["A", "B", "C", "D", "E", "F", "G"].includes(value) ? value as VariantKey : "A";
}

function FhirBadge({ status = "carrier" }: { status?: "carrier" | "pending" | "blocked" }) {
  const labels = {
    carrier: "FHIR publiziert",
    pending: "FHIR-Zielvertrag",
    blocked: "Carrier offen",
  };
  return <span className={`kfo-fhir-badge is-${status}`}>{labels[status]}</span>;
}

function SectionTitle({ children, status }: { children: ReactNode; status?: "carrier" | "pending" | "blocked" }) {
  return (
    <div className="kfo-section-title">
      <span>{children}</span>
      {status && <FhirBadge status={status} />}
    </div>
  );
}

function SelectField({ label, value, options, onChange, compact = false }: {
  label: string;
  value: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={`kfo-field${compact ? " is-compact" : ""}`}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
    </label>
  );
}

function NumberField({ label, value, unit, onChange, compact = false }: {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={`kfo-field${compact ? " is-compact" : ""}`}>
      <span>{label}</span>
      <span className="kfo-number-control">
        <input type="number" step="0.1" value={value} onChange={(event) => onChange(event.target.value)} />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function ToggleGroup({ label, values, selected, onChange }: {
  label: string;
  values: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]);
  };
  return (
    <fieldset className="kfo-toggle-field">
      <legend>{label}</legend>
      <div className="kfo-chip-row">
        {values.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={selected.includes(entry.value) ? "is-active" : ""}
            aria-pressed={selected.includes(entry.value)}
            onClick={() => toggle(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Arch({ state, update, compact = false }: {
  state: KfoState;
  update: <K extends keyof KfoState>(key: K, value: KfoState[K]) => void;
  compact?: boolean;
}) {
  const renderRow = (teeth: number[], jaw: "upper" | "lower") => (
    <div className={`kfo-arch-row is-${jaw}`}>
      {teeth.map((tooth) => {
        const isSelected = state.selectedTooth === tooth;
        const hasFinding = tooth === 13 || tooth === 23 || tooth === 36;
        return (
          <button
            key={tooth}
            type="button"
            className={`kfo-tooth${isSelected ? " is-selected" : ""}${hasFinding ? " has-finding" : ""}`}
            aria-label={`Zahn ${tooth}${isSelected ? ", ausgewählt" : ""}`}
            aria-pressed={isSelected}
            onClick={() => update("selectedTooth", tooth)}
          >
            <span className="kfo-tooth-shape" aria-hidden="true">
              {tooth === 13 && <span className="kfo-tooth-marker">R</span>}
              {tooth === 23 && <span className="kfo-tooth-marker">U</span>}
              {tooth === 36 && <span className="kfo-tooth-marker">B</span>}
            </span>
            <span>{tooth}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`kfo-arch${compact ? " is-compact" : ""}`} dir="ltr">
      <div className="kfo-arch-label">Oberkiefer</div>
      {renderRow(upperTeeth, "upper")}
      <div className="kfo-arch-midline"><span>rechts</span><i /><span>links</span></div>
      {renderRow(lowerTeeth, "lower")}
      <div className="kfo-arch-label">Unterkiefer</div>
    </div>
  );
}

function AngleFields({ state, update, compact = false }: FormProps & { compact?: boolean }) {
  const angleOptions = [
    { value: "unknown", label: "nicht erhoben" },
    { value: "I", label: "Klasse I" },
    { value: "II/1", label: "Klasse II/1" },
    { value: "II/2", label: "Klasse II/2" },
    { value: "II", label: "Klasse II, Division offen" },
    { value: "III", label: "Klasse III" },
  ];
  const rows = [
    { label: "Molaren rechts", teeth: "16 / 46", angle: "angleRight" as const, magnitude: "sagittalRight" as const },
    { label: "Molaren links", teeth: "26 / 36", angle: "angleLeft" as const, magnitude: "sagittalLeft" as const },
    { label: "Eckzähne rechts", teeth: "13 / 43", angle: "canineAngleRight" as const, magnitude: "canineSagittalRight" as const },
    { label: "Eckzähne links", teeth: "23 / 33", angle: "canineAngleLeft" as const, magnitude: "canineSagittalLeft" as const },
  ];
  return (
    <div className="kfo-relation-wrap">
      <div className="kfo-relation-toolbar">
        <p>Vier FHIR-Befundstellen; PB wird nie automatisch in mm umgerechnet.</p>
        <SelectField
          label="Einheit"
          value={state.sagittalUnit}
          options={[
            { value: "PB", label: "PB (Prämolarenbreite)" },
            { value: "mm", label: "mm" },
          ]}
          compact
          onChange={(value) => update("sagittalUnit", value)}
        />
      </div>
      <div className="kfo-relation-matrix">
        <div className="kfo-relation-head">Befundstelle</div><div className="kfo-relation-head">Angle</div><div className="kfo-relation-head">Abweichung</div>
        {rows.map((row) => (
          <div className="kfo-relation-row" key={row.label}>
            <div className="kfo-relation-site"><strong>{row.label}</strong><span>{row.teeth}</span></div>
            <SelectField label={`${row.label}: Angle`} value={state[row.angle]} options={angleOptions} compact={compact} onChange={(value) => update(row.angle, value)} />
            <NumberField label={`${row.label}: Abweichung`} value={state[row.magnitude]} unit={state.sagittalUnit} compact={compact} onChange={(value) => update(row.magnitude, value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

type FormProps = {
  state: KfoState;
  update: <K extends keyof KfoState>(key: K, value: KfoState[K]) => void;
};

function OcclusionFields({ state, update }: FormProps) {
  const regionValues = [
    { value: "anterior", label: "Front" },
    { value: "right-posterior", label: "Seite rechts" },
    { value: "left-posterior", label: "Seite links" },
  ];
  return (
    <>
      <div className="kfo-field-grid is-three">
        <NumberField label="Overjet" value={state.overjet} unit="mm" onChange={(value) => update("overjet", value)} />
        <SelectField
          label="Vertikalrelation"
          value={state.verticalRelation}
          options={[
            { value: "normal", label: "regelrecht" },
            { value: "deep", label: "Tiefbiss" },
            { value: "open", label: "offener Biss" },
          ]}
          onChange={(value) => update("verticalRelation", value)}
        />
        <NumberField label={state.verticalRelation === "open" ? "Offener Biss" : "Overbite"} value={state.overbite} unit="mm" onChange={(value) => update("overbite", value)} />
        <NumberField label="Mittellinie Oberkiefer (+ rechts)" value={state.midlineUpper} unit="mm" onChange={(value) => update("midlineUpper", value)} />
        <NumberField label="Mittellinie Unterkiefer (+ rechts)" value={state.midlineLower} unit="mm" onChange={(value) => update("midlineLower", value)} />
      </div>
      <ToggleGroup label="Kreuzbiss" values={regionValues} selected={state.crossbite} onChange={(value) => update("crossbite", value)} />
      <ToggleGroup label="Scherenbiss" values={regionValues.slice(1)} selected={state.scissorsBite} onChange={(value) => update("scissorsBite", value)} />
    </>
  );
}

function AnalysisFields({ state, update }: FormProps) {
  return (
    <div className="kfo-field-grid is-three">
      <NumberField label="Platzbilanz Oberkiefer" value={state.crowdingUpper} unit="mm" onChange={(value) => update("crowdingUpper", value)} />
      <NumberField label="Platzbilanz Unterkiefer" value={state.crowdingLower} unit="mm" onChange={(value) => update("crowdingLower", value)} />
      <SelectField label="Engstand Oberkiefer" value={state.crowdingSeverityUpper} options={[
        { value: "mild", label: "mild (< 3 mm)" },
        { value: "moderate", label: "moderat (3–6 mm)" },
        { value: "severe", label: "schwer (> 6 mm)" },
      ]} onChange={(value) => update("crowdingSeverityUpper", value)} />
      <SelectField label="Engstand Unterkiefer" value={state.crowdingSeverityLower} options={[
        { value: "mild", label: "mild (< 3 mm)" },
        { value: "moderate", label: "moderat (3–6 mm)" },
        { value: "severe", label: "schwer (> 6 mm)" },
      ]} onChange={(value) => update("crowdingSeverityLower", value)} />
      <NumberField label="Bolton anterior (Norm 77,2)" value={state.boltonAnterior} unit="%" onChange={(value) => update("boltonAnterior", value)} />
      <NumberField label="Bolton gesamt (Norm 91,3)" value={state.boltonOverall} unit="%" onChange={(value) => update("boltonOverall", value)} />
    </div>
  );
}

const KIG_GRADES: Record<string, string[]> = {
  A: ["5"], U: ["4"], S: ["4", "5"], D: ["1", "2", "4", "5"],
  M: ["4", "5"], O: ["1", "2", "3", "4", "5"], T: ["1", "2", "3"],
  B: ["4"], P: ["2", "3", "4"], E: ["1", "2", "3", "4"], K: ["2", "3", "4"],
};

function KigFields({ state, update }: FormProps) {
  const updateGroup = (group: string) => {
    update("kigGroup", group);
    if (!KIG_GRADES[group].includes(state.kigGrade)) update("kigGrade", KIG_GRADES[group][0]);
  };
  return (
    <div className="kfo-field-grid is-three">
      <SelectField
        label="Indikationsgruppe"
        value={state.kigGroup}
        options={[
          { value: "A", label: "A · kraniofaziale Anomalie" },
          { value: "U", label: "U · Zahnunterzahl" },
          { value: "S", label: "S · Durchbruchstörung" },
          { value: "D", label: "D · sagittale Stufe distal" },
          { value: "M", label: "M · sagittale Stufe mesial" },
          { value: "O", label: "O · offener Biss" },
          { value: "T", label: "T · tiefer Biss" },
          { value: "B", label: "B · Bukkal-/Lingualokklusion" },
          { value: "P", label: "P · Platzmangel" },
          { value: "E", label: "E · Kontaktpunktabweichung" },
          { value: "K", label: "K · Kreuzbiss" },
        ]}
        onChange={updateGroup}
      />
      <SelectField label={`Grad · FHIR-Befund ${state.kigGroup}${state.kigGrade}`} value={state.kigGrade} options={KIG_GRADES[state.kigGroup]} onChange={(value) => update("kigGrade", value)} />
      <SelectField
        label="Messmethode"
        value={state.kigMethod}
        options={[
          { value: "sagittale-stufe", label: "Sagittale Stufe (D/M)" },
          { value: "vertikale-stufe", label: "Vertikale Stufe (O/T)" },
          { value: "engstand-summe", label: "Engstand-Summe (E)" },
          { value: "platzmangel-differenz", label: "Platzmangel-Differenz (P)" },
          { value: "kontaktpunktabweichung", label: "Kontaktpunktabweichung (E)" },
          { value: "bukkal-lingual-abweichung", label: "Bukkal-/Lingualabweichung (B)" },
        ]}
        onChange={(value) => update("kigMethod", value)}
      />
    </div>
  );
}

function TreatmentContextFields({ state, update }: FormProps) {
  return (
    <div className="kfo-field-grid is-two">
      <SelectField label="Behandlungsphase" value={state.treatmentPhase} options={[
        { value: "aktiv", label: "aktiv" },
        { value: "retention", label: "Retention" },
        { value: "abschluss", label: "Abschluss" },
      ]} onChange={(value) => update("treatmentPhase", value)} />
      <SelectField label="Apparaturtyp im Behandlungsplan" value={state.apparatusType} options={[
        { value: "festsitzend", label: "festsitzend" },
        { value: "herausnehmbar", label: "herausnehmbar" },
      ]} onChange={(value) => update("apparatusType", value)} />
    </div>
  );
}

function ToothEditor({ state, update, dense = false }: FormProps & { dense?: boolean }) {
  return (
    <div className={`kfo-tooth-editor${dense ? " is-dense" : ""}`}>
      <div className="kfo-selected-tooth">
        <span>Aktiver Zahn</span>
        <strong>{state.selectedTooth}</strong>
        <span className="kfo-dentition-tag">bleibend</span>
      </div>
      <SelectField
        label="Durchbruchsstatus"
        value={state.eruptionStatus}
        options={[
          { value: "not-assessed", label: "nicht erhoben" },
          { value: "delayed", label: "nicht / verzögert durchgebrochen" },
          { value: "partial", label: "Teildurchgebrochen" },
          { value: "full-recent", label: "vollständig, < 2 Jahre" },
          { value: "full-established", label: "vollständig, etabliert (>= 2 Jahre)" },
        ]}
        compact={dense}
        onChange={(value) => update("eruptionStatus", value)}
      />
      <SelectField
        label="Fehlender Zahn: Ursache"
        value={state.missingEtiology}
        options={[
          { value: "none", label: "Zahn vorhanden" },
          { value: "aplasia", label: "Aplasie" },
          { value: "extracted", label: "extrahiert" },
          { value: "lost", label: "anderweitig verloren" },
        ]}
        compact={dense}
        onChange={(value) => update("missingEtiology", value)}
      />
      <SelectField label="Apparatur" value={state.appliance} options={[
        { value: "none", label: "keine" },
        { value: "bracket", label: "Bracket" },
        { value: "band", label: "Band" },
      ]} compact={dense} onChange={(value) => update("appliance", value)} />
      <SelectField label="Verschiebung" value={state.drift} options={[
        { value: "none", label: "keine" },
        { value: "mesial", label: "mesial" },
        { value: "distal", label: "distal" },
      ]} compact={dense} onChange={(value) => update("drift", value)} />
      <SelectField label="Vertikal" value={state.verticalMovement} options={[
        { value: "none", label: "keine" },
        { value: "extrusion", label: "Extrusion" },
        { value: "intrusion", label: "Intrusion" },
      ]} compact={dense} onChange={(value) => update("verticalMovement", value)} />
      <label className="kfo-check-row">
        <input type="checkbox" checked={state.rotation} onChange={(event) => update("rotation", event.target.checked)} />
        <span>Rotation vorhanden</span>
      </label>
      <p className="kfo-precedence-note">Durchbruch und Fehlursache werden mit dem bestehenden Zahnstatus abgeglichen; ein Widerspruch ist nicht auswählbar.</p>
    </div>
  );
}

function StateSummary({ state, concise = false }: { state: KfoState; concise?: boolean }) {
  const eruptionLabels: Record<string, string> = {
    "not-assessed": "nicht erhoben",
    delayed: "verzögerter Durchbruch",
    partial: "teildurchgebrochen",
    "full-recent": "vollständig, < 2 Jahre",
    "full-established": "vollständig, etabliert",
  };
  const applianceLabels: Record<string, string> = { none: "keine Apparatur", bracket: "Bracket", band: "Band" };
  const lines = [
    `Molaren: rechts ${state.angleRight} / ${state.sagittalRight} ${state.sagittalUnit}, links ${state.angleLeft} / ${state.sagittalLeft} ${state.sagittalUnit}`,
    `Eckzähne: rechts ${state.canineAngleRight} / ${state.canineSagittalRight} ${state.sagittalUnit}, links ${state.canineAngleLeft} / ${state.canineSagittalLeft} ${state.sagittalUnit}`,
    `Overjet ${state.overjet} mm, ${state.verticalRelation === "open" ? "offener Biss" : "Overbite"} ${state.overbite} mm`,
    `Mittellinie: OK ${state.midlineUpper} mm, UK ${state.midlineLower} mm (positiv = rechts)`,
    `Platzbilanz: OK ${state.crowdingUpper} mm, UK ${state.crowdingLower} mm`,
    `KIG ${state.kigGroup}${state.kigGrade}, ${state.kigMethod}`,
    `CarePlan: ${state.treatmentPhase}, ${state.apparatusType}`,
    `Zahn ${state.selectedTooth}: ${eruptionLabels[state.eruptionStatus]}, ${applianceLabels[state.appliance]}${state.rotation ? ", rotiert" : ""}`,
  ];
  return (
    <div className={`kfo-state-summary${concise ? " is-concise" : ""}`}>
      <div className="kfo-summary-heading"><span>Aktueller Demo-Befund</span><FhirBadge status="pending" /></div>
      <ul>{lines.slice(0, concise ? 4 : lines.length).map((line) => <li key={line}>{line}</li>)}</ul>
    </div>
  );
}

function VariantA(props: FormProps) {
  return (
    <div className="kfo-variant-a">
      <div className="kfo-a-main">
        <section className="kfo-card">
          <SectionTitle status="pending">Sagittale Relation</SectionTitle>
          <AngleFields {...props} />
        </section>
        <section className="kfo-card">
          <SectionTitle status="pending">Vertikale und transversale Relation</SectionTitle>
          <OcclusionFields {...props} />
        </section>
        <div className="kfo-card-pair">
          <section className="kfo-card">
            <SectionTitle status="pending">KIG</SectionTitle>
            <KigFields {...props} />
          </section>
          <section className="kfo-card">
            <SectionTitle status="pending">Modellanalyse</SectionTitle>
            <AnalysisFields {...props} />
          </section>
        </div>
        <section className="kfo-card">
          <SectionTitle status="carrier">Behandlungsbezug im DentalCarePlanDE</SectionTitle>
          <TreatmentContextFields {...props} />
        </section>
      </div>
      <aside className="kfo-a-side">
        <section className="kfo-card is-sticky">
          <SectionTitle status="pending">Zahnbezogener Befund</SectionTitle>
          <Arch {...props} compact />
          <ToothEditor {...props} dense />
        </section>
      </aside>
    </div>
  );
}

function VariantB(props: FormProps) {
  return (
    <div className="kfo-variant-b">
      <section className="kfo-b-stage">
        <header>
          <div>
            <span className="kfo-eyebrow">Kieferbezogener Befund</span>
            <h2>Okklusion und Zahnstellung gemeinsam lesen</h2>
          </div>
          <div className="kfo-stage-metrics">
            <span><small>Overjet</small><strong>{props.state.overjet} mm</strong></span>
            <span><small>Overbite</small><strong>{props.state.overbite} mm</strong></span>
            <span><small>KIG</small><strong>{props.state.kigGroup}{props.state.kigGrade}</strong></span>
          </div>
        </header>
        <div className="kfo-b-workbench">
          <aside className="kfo-b-side-card">
            <SectionTitle status="pending">Rechte Seite</SectionTitle>
            <SelectField label="Einheit beider Seiten" value={props.state.sagittalUnit} options={[
              { value: "PB", label: "PB (keine mm-Umrechnung)" }, { value: "mm", label: "mm" },
            ]} onChange={(value) => props.update("sagittalUnit", value)} />
            <SelectField label="Molaren 16 / 46" value={props.state.angleRight} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("angleRight", value)} />
            <NumberField label="Molaren-Abweichung" value={props.state.sagittalRight} unit={props.state.sagittalUnit} onChange={(value) => props.update("sagittalRight", value)} />
            <SelectField label="Eckzähne 13 / 43" value={props.state.canineAngleRight} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("canineAngleRight", value)} />
            <NumberField label="Eckzahn-Abweichung" value={props.state.canineSagittalRight} unit={props.state.sagittalUnit} onChange={(value) => props.update("canineSagittalRight", value)} />
            <div className="kfo-side-bite"><span>Kreuzbiss</span><strong>{props.state.crossbite.includes("right-posterior") ? "vorhanden" : "nein"}</strong></div>
          </aside>
          <div className="kfo-b-arch-wrap">
            <Arch {...props} />
            <div className="kfo-arch-legend">
              <span><i className="is-blue" /> ausgewählt</span>
              <span><i className="is-green" /> Einzelbefund</span>
              <span>R Rotation</span><span>U nicht durchgebrochen</span><span>B Band</span>
            </div>
          </div>
          <aside className="kfo-b-side-card">
            <SectionTitle status="pending">Linke Seite</SectionTitle>
            <SelectField label="Molaren 26 / 36" value={props.state.angleLeft} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("angleLeft", value)} />
            <NumberField label="Molaren-Abweichung" value={props.state.sagittalLeft} unit={props.state.sagittalUnit} onChange={(value) => props.update("sagittalLeft", value)} />
            <SelectField label="Eckzähne 23 / 33" value={props.state.canineAngleLeft} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("canineAngleLeft", value)} />
            <NumberField label="Eckzahn-Abweichung" value={props.state.canineSagittalLeft} unit={props.state.sagittalUnit} onChange={(value) => props.update("canineSagittalLeft", value)} />
            <div className="kfo-side-bite"><span>Kreuzbiss</span><strong>{props.state.crossbite.includes("left-posterior") ? "vorhanden" : "nein"}</strong></div>
          </aside>
        </div>
      </section>
      <div className="kfo-b-lower">
        <section className="kfo-card">
          <SectionTitle status="pending">Aktiver Zahn {props.state.selectedTooth}</SectionTitle>
          <ToothEditor {...props} dense />
        </section>
        <section className="kfo-card">
          <SectionTitle status="pending">Fallrelationen</SectionTitle>
          <OcclusionFields {...props} />
        </section>
        <section className="kfo-card">
          <SectionTitle status="pending">Klassifikation und Analyse</SectionTitle>
          <KigFields {...props} />
          <AnalysisFields {...props} />
          <div className="kfo-divider" />
          <TreatmentContextFields {...props} />
        </section>
      </div>
    </div>
  );
}

function VariantC(props: FormProps) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Sagittal", detail: "Angle und Seitenabweichung" },
    { title: "Bisslage", detail: "vertikal, transversal, Mittellinie" },
    { title: "Zähne", detail: "Durchbruch, Fehlen, Bewegung, Apparatur" },
    { title: "KIG und Analyse", detail: "Indikation und Modellwerte" },
  ];
  return (
    <div className="kfo-variant-c">
      <nav className="kfo-step-nav" aria-label="Untersuchungsschritte">
        <span className="kfo-eyebrow">Untersuchung</span>
        <h2>KFO-Befund erfassen</h2>
        {steps.map((entry, index) => (
          <button key={entry.title} type="button" className={step === index ? "is-active" : ""} onClick={() => setStep(index)}>
            <span>{index + 1}</span>
            <span><strong>{entry.title}</strong><small>{entry.detail}</small></span>
          </button>
        ))}
        <div className="kfo-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <small>Schritt {step + 1} von {steps.length}</small>
      </nav>
      <main className="kfo-step-content">
        <header>
          <div><span className="kfo-eyebrow">Schritt {step + 1}</span><h2>{steps[step].title}</h2></div>
          <FhirBadge status="pending" />
        </header>
        {step === 0 && <div className="kfo-step-form"><p>Die Seiten werden getrennt erfasst; Klasse und Messwert bleiben eigenständige Befunde.</p><AngleFields {...props} /></div>}
        {step === 1 && <div className="kfo-step-form"><p>Richtung, Region und Einheit stehen immer direkt am Messwert.</p><OcclusionFields {...props} /></div>}
        {step === 2 && <div className="kfo-step-form"><Arch {...props} /><ToothEditor {...props} /></div>}
        {step === 3 && <div className="kfo-step-form"><KigFields {...props} /><div className="kfo-divider" /><AnalysisFields {...props} /><div className="kfo-divider" /><TreatmentContextFields {...props} /></div>}
        <footer>
          <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Zurück</button>
          <button type="button" className="btn" disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Weiter</button>
        </footer>
      </main>
      <aside className="kfo-c-summary">
        <StateSummary state={props.state} />
        <div className="kfo-completeness">
          <div><span>Vollständigkeit</span><strong>82 %</strong></div>
          <div className="kfo-progress"><i style={{ width: "82%" }} /></div>
          <p>Noch offen: Scherenbiss und Fehlursache explizit bestätigen.</p>
        </div>
      </aside>
    </div>
  );
}

function MatrixSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return <SelectField label={label} value={value} options={options} compact onChange={onChange} />;
}

function VariantD(props: FormProps) {
  return (
    <div className="kfo-variant-d">
      <div className="kfo-matrix-toolbar">
        <div><span className="kfo-eyebrow">Expertenmodus</span><h2>KFO-Matrix</h2></div>
        <div><button type="button" className="btn btn-ghost">Leere Werte ausblenden</button><button type="button" className="btn">Befund prüfen</button></div>
      </div>
      <section className="kfo-matrix-card">
        <table className="kfo-case-matrix">
          <thead><tr><th>Achse</th><th>rechts / Oberkiefer</th><th>links / Unterkiefer</th><th>Einheit / Methode</th><th>FHIR</th></tr></thead>
          <tbody>
            <tr><th>Angle · Molaren</th><td><MatrixSelect label="Molaren rechts 16/46" value={props.state.angleRight} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("angleRight", value)} /></td><td><MatrixSelect label="Molaren links 26/36" value={props.state.angleLeft} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("angleLeft", value)} /></td><td>16/46 · 26/36</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Angle · Eckzähne</th><td><MatrixSelect label="Eckzähne rechts 13/43" value={props.state.canineAngleRight} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("canineAngleRight", value)} /></td><td><MatrixSelect label="Eckzähne links 23/33" value={props.state.canineAngleLeft} options={["I", "II/1", "II/2", "II", "III"]} onChange={(value) => props.update("canineAngleLeft", value)} /></td><td>13/43 · 23/33</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Abweichung · Molaren</th><td><NumberField label="Molaren rechts" value={props.state.sagittalRight} unit={props.state.sagittalUnit} compact onChange={(value) => props.update("sagittalRight", value)} /></td><td><NumberField label="Molaren links" value={props.state.sagittalLeft} unit={props.state.sagittalUnit} compact onChange={(value) => props.update("sagittalLeft", value)} /></td><td><MatrixSelect label="Einheit" value={props.state.sagittalUnit} options={["PB", "mm"]} onChange={(value) => props.update("sagittalUnit", value)} /></td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Abweichung · Eckzähne</th><td><NumberField label="Eckzähne rechts" value={props.state.canineSagittalRight} unit={props.state.sagittalUnit} compact onChange={(value) => props.update("canineSagittalRight", value)} /></td><td><NumberField label="Eckzähne links" value={props.state.canineSagittalLeft} unit={props.state.sagittalUnit} compact onChange={(value) => props.update("canineSagittalLeft", value)} /></td><td>keine Umrechnung</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Platzbilanz</th><td><NumberField label="Oberkiefer" value={props.state.crowdingUpper} unit="mm" compact onChange={(value) => props.update("crowdingUpper", value)} /></td><td><NumberField label="Unterkiefer" value={props.state.crowdingLower} unit="mm" compact onChange={(value) => props.update("crowdingLower", value)} /></td><td>{props.state.crowdingSeverityUpper} / {props.state.crowdingSeverityLower}</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Bolton</th><td><NumberField label="anterior" value={props.state.boltonAnterior} unit="%" compact onChange={(value) => props.update("boltonAnterior", value)} /></td><td><NumberField label="gesamt" value={props.state.boltonOverall} unit="%" compact onChange={(value) => props.update("boltonOverall", value)} /></td><td>Norm 77,2 / 91,3</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>KIG-Befund</th><td><MatrixSelect label="KIG-Befund" value={`${props.state.kigGroup}${props.state.kigGrade}`} options={["A5", "U4", "S4", "S5", "D1", "D2", "D4", "D5", "M4", "M5", "O1", "O2", "O3", "O4", "O5", "T1", "T2", "T3", "B4", "P2", "P3", "P4", "E1", "E2", "E3", "E4", "K2", "K3", "K4"]} onChange={(value) => { props.update("kigGroup", value.slice(0, 1)); props.update("kigGrade", value.slice(1)); }} /></td><td>{props.state.kigGroup} · Grad {props.state.kigGrade}</td><td>{props.state.kigMethod}</td><td><FhirBadge status="pending" /></td></tr>
            <tr><th>Behandlungsbezug</th><td><MatrixSelect label="Phase" value={props.state.treatmentPhase} options={["aktiv", "retention", "abschluss"]} onChange={(value) => props.update("treatmentPhase", value)} /></td><td><MatrixSelect label="Apparaturtyp" value={props.state.apparatusType} options={["festsitzend", "herausnehmbar"]} onChange={(value) => props.update("apparatusType", value)} /></td><td>DentalCarePlanDE</td><td><FhirBadge status="carrier" /></td></tr>
          </tbody>
        </table>
      </section>
      <section className="kfo-matrix-card">
        <div className="kfo-matrix-section-heading"><SectionTitle status="pending">Zahnmatrix</SectionTitle><span>FDI und Dentition bleiben an jedem Eintrag sichtbar</span></div>
        <Arch {...props} compact />
        <table className="kfo-tooth-matrix">
          <thead><tr><th>Zahn</th><th>Dentition</th><th>Durchbruch</th><th>Fehlursache</th><th>Apparatur</th><th>Verschiebung</th><th>Vertikal</th><th>Rotation</th></tr></thead>
          <tbody>
            <tr className="is-selected"><th>{props.state.selectedTooth}</th><td>bleibend</td><td><MatrixSelect label="Durchbruch" value={props.state.eruptionStatus} options={[
              { value: "not-assessed", label: "nicht erhoben" }, { value: "delayed", label: "verzögert" }, { value: "partial", label: "teildurchgebrochen" }, { value: "full-recent", label: "vollständig < 2 J." }, { value: "full-established", label: "vollständig etabliert" },
            ]} onChange={(value) => props.update("eruptionStatus", value)} /></td><td><MatrixSelect label="Fehlursache" value={props.state.missingEtiology} options={[
              { value: "none", label: "vorhanden" }, { value: "aplasia", label: "Aplasie" }, { value: "extracted", label: "extrahiert" }, { value: "lost", label: "verloren" },
            ]} onChange={(value) => props.update("missingEtiology", value)} /></td><td><MatrixSelect label="Apparatur" value={props.state.appliance} options={[
              { value: "none", label: "keine" }, { value: "bracket", label: "Bracket" }, { value: "band", label: "Band" },
            ]} onChange={(value) => props.update("appliance", value)} /></td><td><MatrixSelect label="Verschiebung" value={props.state.drift} options={[
              { value: "none", label: "keine" }, { value: "mesial", label: "mesial" }, { value: "distal", label: "distal" },
            ]} onChange={(value) => props.update("drift", value)} /></td><td><MatrixSelect label="Vertikal" value={props.state.verticalMovement} options={[
              { value: "none", label: "keine" }, { value: "extrusion", label: "Extrusion" }, { value: "intrusion", label: "Intrusion" },
            ]} onChange={(value) => props.update("verticalMovement", value)} /></td><td><label className="kfo-table-check"><input type="checkbox" checked={props.state.rotation} onChange={(event) => props.update("rotation", event.target.checked)} /><span>ja</span></label></td></tr>
            <tr><th>23</th><td>bleibend</td><td>nicht durchgebrochen</td><td>vorhanden</td><td>keine</td><td>keine</td><td>keine</td><td>nein</td></tr>
            <tr><th>36</th><td>bleibend</td><td>durchgebrochen</td><td>vorhanden</td><td>Band</td><td>keine</td><td>keine</td><td>nein</td></tr>
          </tbody>
        </table>
      </section>
      <StateSummary state={props.state} concise />
    </div>
  );
}

const KIG_ROWS = [
  { code: "A", label: "Kraniofaziale Anomalie" },
  { code: "U", label: "Zahnunterzahl" },
  { code: "S", label: "Durchbruchstörung" },
  { code: "D", label: "Sagittal distal" },
  { code: "M", label: "Sagittal mesial" },
  { code: "O", label: "Vertikal offen" },
  { code: "T", label: "Vertikal tief" },
  { code: "B", label: "Bukkal-/Lingualokklusion" },
  { code: "P", label: "Platzmangel" },
  { code: "E", label: "Kontaktpunktabweichung" },
  { code: "K", label: "Kopf-/Kreuzbiss" },
] as const;

function VariantE(props: FormProps) {
  const selected = `${props.state.kigGroup}${props.state.kigGrade}`;
  return (
    <div className="kfo-variant-e">
      <section className="kfo-card kfo-kig-board">
        <div className="kfo-kig-heading">
          <div><span className="kfo-eyebrow">Manuelle Klassifikation</span><h2>KIG-Matrix</h2><p>Nur klinisch bestätigte Einstufungen werden übernommen. Es findet keine automatische KIG-Ableitung statt.</p></div>
          <div className="kfo-kig-result"><small>Aktueller Befund</small><strong>{selected}</strong><span>{Number(props.state.kigGrade) >= 3 ? "GKV-Bereich" : "Grad 1–2"}</span></div>
        </div>
        <div className="kfo-kig-scroll">
          <table className="kfo-kig-table">
            <thead><tr><th>Gruppe</th>{[1, 2, 3, 4, 5].map((grade) => <th key={grade} className={grade >= 3 ? "is-gkv" : ""}>{grade}{grade === 3 && <small>GKV</small>}</th>)}</tr></thead>
            <tbody>{KIG_ROWS.map((row) => (
              <tr key={row.code}><th><b>{row.code}</b><span>{row.label}</span></th>{[1, 2, 3, 4, 5].map((grade) => {
                const code = `${row.code}${grade}`;
                const valid = KIG_GRADES[row.code]?.includes(String(grade));
                return <td key={grade} className={grade >= 3 ? "is-gkv" : ""}>{valid ? <button type="button" className={selected === code ? "is-selected" : ""} onClick={() => { props.update("kigGroup", row.code); props.update("kigGrade", String(grade)); }}>{code}</button> : <span>–</span>}</td>;
              })}</tr>
            ))}</tbody>
          </table>
        </div>
        <div className="kfo-kig-legend"><span><i className="is-confirmed" /> manuell bestätigt</span><span><i className="is-gkv" /> GKV-Zone Grad 3–5</span><FhirBadge status="pending" /></div>
      </section>
      <aside className="kfo-e-side">
        <section className="kfo-card"><SectionTitle status="pending">Befundgrundlage</SectionTitle><div className="kfo-e-measures"><span><small>Overjet</small><strong>{props.state.overjet} mm</strong></span><span><small>Overbite</small><strong>{props.state.overbite} mm</strong></span><span><small>Platz OK / UK</small><strong>{props.state.crowdingUpper} / {props.state.crowdingLower} mm</strong></span></div><KigFields {...props} /></section>
        <section className="kfo-card"><SectionTitle status="pending">Okklusion</SectionTitle><AngleFields {...props} compact /><div className="kfo-divider" /><OcclusionFields {...props} /></section>
        <StateSummary state={props.state} concise />
      </aside>
    </div>
  );
}

const cycleRows = [
  { label: "Durchbruch", values: ["–", "V", "V", "P", "V", "R", "V", "V", "V", "V", "P", "V", "V", "V", "V", "–"] },
  { label: "Fehlursache", values: ["–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–", "–"] },
  { label: "Apparatur", values: ["–", "–", "B", "Br", "Br", "–", "Br", "Br", "Br", "Br", "–", "Br", "Br", "B", "–", "–"] },
  { label: "Stellung", values: ["–", "–", "m", "–", "–", "–", "R", "–", "–", "E", "–", "–", "–", "–", "–", "–"] },
] as const;

function VariantF(props: FormProps) {
  return (
    <div className="kfo-variant-f">
      <section className="kfo-card kfo-occlusion-stage">
        <div className="kfo-occlusion-header"><div><span className="kfo-eyebrow">Eigenständiges KFO-Schema</span><h2>Okklusionsbefund</h2></div><strong>KIG {props.state.kigGroup}{props.state.kigGrade}</strong></div>
        <div className="kfo-relation-flags"><span><small>rechts · Molar</small><b>{props.state.angleRight} · {props.state.sagittalRight} {props.state.sagittalUnit}</b></span><span><small>rechts · Eckzahn</small><b>{props.state.canineAngleRight} · {props.state.canineSagittalRight} {props.state.sagittalUnit}</b></span><span><small>links · Eckzahn</small><b>{props.state.canineAngleLeft} · {props.state.canineSagittalLeft} {props.state.sagittalUnit}</b></span><span><small>links · Molar</small><b>{props.state.angleLeft} · {props.state.sagittalLeft} {props.state.sagittalUnit}</b></span></div>
        <div className="kfo-schema-arch"><Arch {...props} /><div className="kfo-midline-callout">Mittellinie OK {props.state.midlineUpper} mm · UK {props.state.midlineLower} mm</div>{props.state.crossbite.length > 0 && <div className="kfo-crossbite-band">Kreuzbiss · {props.state.crossbite.join(", ")}</div>}</div>
        <div className="kfo-arch-legend"><span>V voll durchgebrochen</span><span>P partiell</span><span>R retiniert / Rotation</span><span>Br Bracket</span><span>B Band</span></div>
      </section>
      <section className="kfo-card kfo-cycle-card"><SectionTitle status="pending">Zahnbezogene KFO-Befunde</SectionTitle><div className="kfo-cycle-scroll"><div className="kfo-cycle-grid"><div /><>{upperTeeth.map((tooth) => <b key={tooth}>{tooth}</b>)}</>{cycleRows.map((row) => <div className="kfo-cycle-row" key={row.label}><strong>{row.label}</strong>{row.values.map((value, index) => <button type="button" key={`${row.label}-${upperTeeth[index]}`} className={upperTeeth[index] === props.state.selectedTooth ? "is-selected" : value !== "–" ? "has-value" : ""} onClick={() => props.update("selectedTooth", upperTeeth[index])}>{value}</button>)}</div>)}</div></div></section>
      <div className="kfo-f-lower"><section className="kfo-card"><SectionTitle status="pending">Aktiver Zahn {props.state.selectedTooth}</SectionTitle><ToothEditor {...props} dense /></section><section className="kfo-card"><SectionTitle status="pending">Fallmesswerte</SectionTitle><OcclusionFields {...props} /><div className="kfo-divider" /><AnalysisFields {...props} /></section></div>
    </div>
  );
}

function VariantG(props: FormProps) {
  const [tab, setTab] = useState("Okklusion");
  const tabs = ["Okklusion", "KIG", "Zähne", "Modellanalyse"];
  return (
    <div className="kfo-variant-g">
      <div className="kfo-kpi-row"><div className="is-alert"><small>KIG</small><strong>{props.state.kigGroup}{props.state.kigGrade}</strong><span>GKV-Bereich</span></div><div><small>Angle rechts / links</small><strong>{props.state.angleRight} / {props.state.angleLeft}</strong><span>{props.state.sagittalRight} / {props.state.sagittalLeft} {props.state.sagittalUnit}</span></div><div><small>Overjet / Overbite</small><strong>{props.state.overjet} / {props.state.overbite} mm</strong><span>{props.state.verticalRelation}</span></div><div><small>Mittellinie OK / UK</small><strong>{props.state.midlineUpper} / {props.state.midlineLower} mm</strong><span>+ = rechts</span></div><div><small>Phase</small><strong>{props.state.treatmentPhase}</strong><span>{props.state.apparatusType}</span></div></div>
      <div className="kfo-g-layout">
        <section className="kfo-card kfo-cockpit-card">
          <nav className="kfo-cockpit-tabs" aria-label="KFO-Befundbereiche">{tabs.map((entry) => <button type="button" key={entry} className={tab === entry ? "is-active" : ""} onClick={() => setTab(entry)}>{entry}</button>)}</nav>
          <div className="kfo-cockpit-content">{tab === "Okklusion" && <><AngleFields {...props} /><div className="kfo-divider" /><OcclusionFields {...props} /></>}{tab === "KIG" && <KigFields {...props} />}{tab === "Zähne" && <><Arch {...props} compact /><ToothEditor {...props} /></>}{tab === "Modellanalyse" && <><AnalysisFields {...props} /><div className="kfo-divider" /><TreatmentContextFields {...props} /></>}</div>
        </section>
        <aside className="kfo-card kfo-finding-feed"><SectionTitle status="carrier">Befund-Feed</SectionTitle><p>Die Hülle ist für spätere Verlaufs- und Aligner-Einträge vorbereitet.</p><ol><li><time>heute</time><div><strong>KIG {props.state.kigGroup}{props.state.kigGrade} bestätigt</strong><span>{props.state.kigMethod}</span></div></li><li><time>heute</time><div><strong>Zahn {props.state.selectedTooth} bearbeitet</strong><span>{props.state.eruptionStatus} · {props.state.appliance}</span></div></li><li><time>Import</time><div><strong>Behandlungsplan</strong><span>{props.state.treatmentPhase} · {props.state.apparatusType}</span></div></li></ol></aside>
      </div>
    </div>
  );
}

function PrototypeSwitcher({ variant, onChange }: { variant: VariantKey; onChange: (variant: VariantKey) => void }) {
  const currentIndex = VARIANTS.findIndex((entry) => entry.key === variant);
  const cycle = (delta: number) => onChange(VARIANTS[(currentIndex + delta + VARIANTS.length) % VARIANTS.length].key);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const active = VARIANTS[currentIndex];
  return (
    <div className="kfo-prototype-switcher" aria-label="Prototyp-Varianten">
      <button type="button" onClick={() => cycle(-1)} aria-label="Vorherige Variante">Zurück</button>
      <div className="kfo-switcher-center"><div className="kfo-variant-buttons">{VARIANTS.map((entry) => <button type="button" key={entry.key} className={entry.key === variant ? "is-active" : ""} onClick={() => onChange(entry.key)} aria-label={`Variante ${entry.key}: ${entry.name}`}>{entry.key}</button>)}</div><strong>{active.key} — {active.name}</strong><span>{active.premise}</span></div>
      <button type="button" onClick={() => cycle(1)} aria-label="Nächste Variante">Weiter</button>
    </div>
  );
}

export default function KfoViewPrototype() {
  const [variant, setVariant] = useState<VariantKey>(readVariant);
  const [state, setState] = useState<KfoState>(initialState);
  const [dark, setDark] = useState(false);

  const update = <K extends keyof KfoState>(key: K, value: KfoState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const changeVariant = (next: VariantKey) => {
    const params = new URLSearchParams(window.location.search);
    params.set("prototype", "kfo");
    params.set("variant", next);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    setVariant(next);
  };

  const active = useMemo(() => VARIANTS.find((entry) => entry.key === variant) ?? VARIANTS[0], [variant]);
  const formProps = { state, update };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="odontogram-root kfo-prototype-root" lang="de">
        <header className="topbar kfo-prototype-topbar">
          <div className="brand"><div className="dot" /><div><div className="title">React Advanced Odontogram</div><div className="subtitle">PROTOTYP odontogram-c51 · {active.name}</div></div></div>
          <div className="topbar-actions">
            <span className="kfo-prototype-label">Nur Designstudie · keine Persistenz</span>
            <button type="button" className="btn btn-ghost" onClick={() => setState(initialState)}>Demo zurücksetzen</button>
            <button type="button" className="btn btn-ghost" onClick={() => setDark((value) => !value)}>{dark ? "Hell" : "Dunkel"}</button>
          </div>
        </header>
        <div className="kfo-patient-strip">
          <div><strong>Lea Mustermann</strong><span>14 Jahre · 12.04.2012 · Patient-ID 10482</span></div>
          <div><span>Untersuchung</span><strong>10.08.2026</strong></div>
          <div><span>Dentition</span><strong>bleibend</strong></div>
          <div className="kfo-safety-status"><span>Befundstatus</span><strong>in Bearbeitung</strong></div>
        </div>
        <nav className="kfo-view-tabs" role="tablist" aria-label="Klinische Ansichten">
          <button type="button" role="tab" aria-selected="false">Odontogramm</button>
          <button type="button" role="tab" aria-selected="false">Parodontalstatus</button>
          <button type="button" role="tab" aria-selected="true" className="is-active">Kieferorthopädie</button>
        </nav>
        <main className="kfo-prototype-main">
          <div className="kfo-page-heading">
            <div><span className="kfo-eyebrow">Kieferorthopädischer Befund</span><h1>{active.name}</h1><p>{active.premise}. Fall- und Zahnwerte bleiben im gemeinsamen Sitzungsdokument.</p></div>
            <FhirBadge status="pending" />
          </div>
          {variant === "A" && <VariantA {...formProps} />}
          {variant === "B" && <VariantB {...formProps} />}
          {variant === "C" && <VariantC {...formProps} />}
          {variant === "D" && <VariantD {...formProps} />}
          {variant === "E" && <VariantE {...formProps} />}
          {variant === "F" && <VariantF {...formProps} />}
          {variant === "G" && <VariantG {...formProps} />}
        </main>
        <PrototypeSwitcher variant={variant} onChange={changeVariant} />
      </div>
    </div>
  );
}
