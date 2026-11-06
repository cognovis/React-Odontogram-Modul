// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

/**
 * Supported tooth numbering systems.
 * - **FDI** – ISO 3950 two-digit notation (default in most countries).
 * - **UNIVERSAL** – ADA numbering (1-32 adult, A-T primary).
 * - **PALMER** – Quadrant-based notation (UR/UL/LL/LR + position).
 */
export type NumberingSystem = "FDI" | "UNIVERSAL" | "PALMER";

function normalizeFdi(input: number | string): number | null {
  const num = typeof input === "number" ? input : Number(input);
  if(!Number.isFinite(num)) return null;
  return Math.trunc(num);
}

function isAdultFdi(fdi: number): boolean {
  return (fdi >= 11 && fdi <= 18)
    || (fdi >= 21 && fdi <= 28)
    || (fdi >= 31 && fdi <= 38)
    || (fdi >= 41 && fdi <= 48);
}

function isPrimaryFdi(fdi: number): boolean {
  return (fdi >= 51 && fdi <= 55)
    || (fdi >= 61 && fdi <= 65)
    || (fdi >= 71 && fdi <= 75)
    || (fdi >= 81 && fdi <= 85);
}

/** True when `value` is an adult or primary FDI tooth this odontogram charts. */
export function isFdiTooth(value: number | string): boolean {
  const fdi = normalizeFdi(value);
  if (fdi === null) return false;
  return isAdultFdi(fdi) || isPrimaryFdi(fdi);
}

/**
 * Convert an FDI tooth number to the label for the requested numbering system.
 *
 * @param fdiTooth - Tooth number in FDI notation (e.g. `14`, `55`). Accepts a string that can be parsed as a number.
 * @param system - The target numbering system (`"FDI"`, `"UNIVERSAL"`, or `"PALMER"`).
 * @returns The formatted label (e.g. `"5"` for Universal, `"UR-4"` for Palmer). Returns the input as-is when it cannot be mapped.
 *
 * @example
 * ```ts
 * toLabel(14, "FDI");       // "14"
 * toLabel(14, "UNIVERSAL"); // "5"
 * toLabel(14, "PALMER");    // "UR-4"
 * toLabel(55, "UNIVERSAL"); // "A"
 * ```
 */
export function toLabel(fdiTooth: number | string, system: NumberingSystem): string {
  const fdi = normalizeFdi(fdiTooth);
  if(fdi === null) return String(fdiTooth);

  if(system === "FDI"){
    return String(fdi);
  }

  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;

  if(!isAdultFdi(fdi) && !isPrimaryFdi(fdi)){
    return String(fdi);
  }

  if(system === "UNIVERSAL"){
    if(isPrimaryFdi(fdi)){
      if(quadrant === 5){
        return String.fromCharCode(65 + (5 - position));
      }
      if(quadrant === 6){
        return String.fromCharCode(70 + (position - 1));
      }
      if(quadrant === 7){
        return String.fromCharCode(75 + (5 - position));
      }
      if(quadrant === 8){
        return String.fromCharCode(80 + (position - 1));
      }
    }
    // Deterministic adult mapping based on FDI quadrants.
    if(quadrant === 1){
      // Maxilla right: 18 -> 1, 11 -> 8
      return String(9 - position);
    }
    if(quadrant === 2){
      // Maxilla left: 21 -> 9, 28 -> 16
      return String(8 + position);
    }
    if(quadrant === 3){
      // Mandible left: 38 -> 17, 31 -> 24
      return String(25 - position);
    }
    if(quadrant === 4){
      // Mandible right: 41 -> 25, 48 -> 32
      return String(24 + position);
    }
  }

  if(system === "PALMER"){
    let quadLabel = "";
    if(quadrant === 1) quadLabel = "UR";
    if(quadrant === 2) quadLabel = "UL";
    if(quadrant === 3) quadLabel = "LL";
    if(quadrant === 4) quadLabel = "LR";
    if(quadrant === 5) quadLabel = "UR";
    if(quadrant === 6) quadLabel = "UL";
    if(quadrant === 7) quadLabel = "LL";
    if(quadrant === 8) quadLabel = "LR";
    if(!quadLabel) return String(fdi);
    if(isPrimaryFdi(fdi)){
      const letter = String.fromCharCode(65 + (position - 1));
      return `${quadLabel}-${letter}`;
    }
    return `${quadLabel}-${position}`;
  }

  return String(fdi);
}

/**
 * The primary FDI number for a permanent chart slot.
 *
 * A deciduous tooth occupies its successor's slot in this engine, so the slot
 * is a permanent number and the tooth's own identity has to be derived: the
 * quadrant moves 1-4 -> 5-8 and the position is unchanged. Only positions 1-5
 * have a deciduous predecessor, so a molar slot returns `null` rather than an
 * invented number.
 *
 * @param slot - Permanent FDI slot (11-48).
 * @returns The primary FDI number (51-85), or `null` if the slot has no
 *          deciduous predecessor.
 *
 * @example
 * ```ts
 * primaryFdiForSlot(11); // 51
 * primaryFdiForSlot(45); // 85
 * primaryFdiForSlot(16); // null — a first permanent molar replaces nothing
 * ```
 */
export function primaryFdiForSlot(slot: number | string): number | null {
  const fdi = normalizeFdi(slot);
  if(fdi === null || !isAdultFdi(fdi)) return null;
  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;
  if(position > 5) return null;
  return (quadrant + 4) * 10 + position;
}

/**
 * The permanent chart slot a primary FDI number is charted in — the inverse of
 * {@link primaryFdiForSlot}.
 *
 * @param fdiTooth - Primary FDI number (51-85).
 * @returns The permanent slot (11-45), or `null` if the input is not a primary
 *          FDI number.
 *
 * @example
 * ```ts
 * slotForPrimaryFdi(51); // 11
 * slotForPrimaryFdi(85); // 45
 * slotForPrimaryFdi(11); // null — already a permanent number
 * ```
 */
export function slotForPrimaryFdi(fdiTooth: number | string): number | null {
  const fdi = normalizeFdi(fdiTooth);
  if(fdi === null || !isPrimaryFdi(fdi)) return null;
  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;
  return (quadrant - 4) * 10 + position;
}
