const ENDODONTIC_FILL_STATES = new Set(["filling", "incomplete", "temporary"]);
const ENDODONTIC_STATES = new Set([...ENDODONTIC_FILL_STATES, "post"]);

/** Root identities exposed by the current odontogram UI for an FDI position. */
export function sourceRootIdentities(fdi: string): readonly string[] {
  if (!/^[1-8][1-8]$/.test(fdi)) return [];
  const quadrant = Number(fdi[0]);
  const position = Number(fdi[1]);
  const upper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const lower = quadrant === 3 || quadrant === 4 || quadrant === 7 || quadrant === 8;
  const permanentMolar = position === 6 || position === 7 || position === 8;
  const deciduousMolar = quadrant >= 5 && (position === 4 || position === 5);
  if ((permanentMolar || deciduousMolar) && upper) return ["mesiobuccal", "distobuccal", "palatal"];
  if ((permanentMolar || deciduousMolar) && lower) return ["mesial", "distal"];
  if (position === 4 && upper && quadrant < 5) return ["buccal", "palatal"];
  return ["single"];
}

export function isSourceRootIdentity(fdi: string, root: unknown): root is string {
  return typeof root === "string" && sourceRootIdentities(fdi).includes(root);
}

/** A canal has at most one fill state; a post may coexist with that state. */
export function isValidEndodonticStates(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length === 0 || new Set(value).size !== value.length) return false;
  if (!value.every((state) => typeof state === "string" && ENDODONTIC_STATES.has(state))) return false;
  return value.filter((state) => ENDODONTIC_FILL_STATES.has(state)).length <= 1;
}
