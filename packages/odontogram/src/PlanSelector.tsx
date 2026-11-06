// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger 2026
//
// Planalternativen (Phase 1): the plan chooser beside the Status | Plan toggle.
// One chip per named alternative, the active one highlighted. Click switches,
// double-click renames inline, "+" adds a fresh alternative (a copy of the
// Befund), "x" on the active chip deletes it. Shown only in plan mode - in
// status mode there is nothing to choose between.
//
// It subscribes to `onStateChange` itself, like ExaminationCard and
// PerioSidebar, so it re-renders on every create/rename/switch/delete, on the
// mode switch and on a read-only flip without App.tsx holding any plan state.
// Every mutation goes through the engine API (createPlan / renamePlan /
// setActivePlan / deletePlan) - no second mutation path, the DS-1 gate and the
// per-alternative plan-edits stay where they are.
//
// The odontogram never classifies an alternative (Regelversorgung /
// gleichartig / andersartig): that is the job of a downstream planning service, downstream of the
// FHIR store (Dirk, 16.09.2026). A chip is a free name, nothing more.
import { useEffect, useRef, useState } from "react";
import {
  onStateChange, getChartMode, getReadOnly,
  listPlans, getActivePlanId, createPlan, renamePlan, setActivePlan, deletePlan,
} from "./odontogram";
import { useI18n } from "./i18n/useI18n";

export function PlanSelector() {
  const { t } = useI18n();
  const [, bump] = useState(0);
  useEffect(() => onStateChange(() => bump((n) => n + 1)), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if(editingId) inputRef.current?.select(); }, [editingId]);

  if(getChartMode() !== "plan") return null;
  const plans = listPlans();
  const active = getActivePlanId();
  const readOnly = getReadOnly();

  const startRename = (id: string, name: string) => {
    if(readOnly) return;
    setEditingId(id);
    setDraft(name);
  };
  const commitRename = () => {
    if(editingId) renamePlan(editingId, draft);   // an empty draft is refused by the engine
    setEditingId(null);
  };
  const remove = (id: string, name: string) => {
    if(readOnly) return;
    if(window.confirm(t("plans.deleteConfirm", { name }))) deletePlan(id);
  };

  return (
    <div id="planSelector" className="plan-selector" role="tablist" aria-label={t("plans.aria")}>
      {plans.map((p) => {
        const isActive = p.id === active;
        const editing = editingId === p.id;
        return (
          <div key={p.id} className={"plan-chip" + (isActive ? " is-active" : "")} role="tab" aria-selected={isActive}>
            {editing ? (
              <input
                ref={inputRef}
                className="plan-chip-input"
                value={draft}
                aria-label={t("plans.renameAria")}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  // The chart's own key handling (shorthand, Escape clearing the
                  // selection) must not see keys typed into a plan name.
                  e.stopPropagation();
                  if(e.key === "Enter") commitRename();
                  else if(e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="plan-chip-name"
                title={t("plans.chipTitle")}
                onClick={() => setActivePlan(p.id)}
                onDoubleClick={() => startRename(p.id, p.name)}
              >{p.name}</button>
            )}
            {isActive && !readOnly && !editing && (
              <button
                type="button"
                className="plan-chip-delete"
                aria-label={t("plans.delete", { name: p.name })}
                title={t("plans.delete", { name: p.name })}
                onClick={() => remove(p.id, p.name)}
              >×</button>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <button
          type="button"
          className="plan-chip plan-chip-add"
          title={t("plans.add")}
          aria-label={t("plans.add")}
          onClick={() => createPlan()}
        >+ {t("plans.addShort")}</button>
      )}
    </div>
  );
}
