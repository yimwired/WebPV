/**
 * The keys on the ball: one keyboard, ANSI, with the Thai Kedmanee layout
 * printed beside the Latin the way keyboards sold in Thailand are.
 *
 * A key is matched by `KeyboardEvent.code`, the physical key, never by the
 * character it typed. Someone typing Thai presses the same caps as someone
 * typing English, and a held Shift does not turn `1` into a different key.
 */

export type IconName =
  | "arrow-up"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "shift"
  | "enter"
  | "backspace"
  | "tab"
  | "caps"
  | "command"
  | "option"
  | "space";

export interface KeySpec {
  /** stable id, also the first of `codes` */
  id: string;
  /** every `KeyboardEvent.code` that presses this cap: both Shifts are one cap */
  codes: readonly string[];
  /** printed top left, or centred when the key has no Thai */
  latin?: string;
  /** printed bottom right: the Kedmanee character on the same key, unshifted */
  thai?: string;
  icon?: IconName;
  /** how many caps on the ball carry this legend */
  copies: number;
  /** cut in the colourway's accent plastic, as Esc and Enter are on most sets */
  accent?: boolean;
}

/** Latin on the key, then the Thai the same key types without Shift. */
const LETTERS: readonly (readonly [string, string])[] = [
  ["Q", "ๆ"], ["W", "ไ"], ["E", "ำ"], ["R", "พ"], ["T", "ะ"], ["Y", "ั"], ["U", "ี"], ["I", "ร"], ["O", "น"], ["P", "ย"],
  ["A", "ฟ"], ["S", "ห"], ["D", "ก"], ["F", "ด"], ["G", "เ"], ["H", "้"], ["J", "่"], ["K", "า"], ["L", "ส"],
  ["Z", "ผ"], ["X", "ป"], ["C", "แ"], ["V", "อ"], ["B", "ิ"], ["N", "ื"], ["M", "ท"],
];

const DIGITS: readonly (readonly [string, string])[] = [
  ["1", "ๅ"], ["2", "/"], ["3", "-"], ["4", "ภ"], ["5", "ถ"], ["6", "ุ"], ["7", "ึ"], ["8", "ค"], ["9", "ต"], ["0", "จ"],
];

/** `KeyboardEvent.code`, the Latin printed on it, and its Thai. */
const PUNCTUATION: readonly (readonly [string, string, string])[] = [
  ["Backquote", "`", "_"],
  ["Minus", "-", "ข"],
  ["Equal", "=", "ช"],
  ["BracketLeft", "[", "บ"],
  ["BracketRight", "]", "ล"],
  ["Backslash", "\\", "ฃ"],
  ["Semicolon", ";", "ว"],
  ["Quote", "'", "ง"],
  ["Comma", ",", "ม"],
  ["Period", ".", "ใ"],
  ["Slash", "/", "ฝ"],
];

const SPECIALS: readonly KeySpec[] = [
  { id: "Escape", codes: ["Escape"], latin: "esc", copies: 2, accent: true },
  { id: "Enter", codes: ["Enter", "NumpadEnter"], icon: "enter", copies: 2, accent: true },
  { id: "Backspace", codes: ["Backspace"], icon: "backspace", copies: 2 },
  { id: "Tab", codes: ["Tab"], icon: "tab", copies: 2 },
  { id: "CapsLock", codes: ["CapsLock"], icon: "caps", copies: 1 },
  { id: "Shift", codes: ["ShiftLeft", "ShiftRight"], icon: "shift", copies: 2 },
  { id: "Control", codes: ["ControlLeft", "ControlRight"], latin: "ctrl", copies: 2 },
  { id: "Alt", codes: ["AltLeft", "AltRight"], icon: "option", copies: 2 },
  { id: "Meta", codes: ["MetaLeft", "MetaRight"], icon: "command", copies: 2 },
  { id: "Space", codes: ["Space"], icon: "space", copies: 2 },
  { id: "Delete", codes: ["Delete"], latin: "del", copies: 1 },
  { id: "ArrowUp", codes: ["ArrowUp"], icon: "arrow-up", copies: 1 },
  { id: "ArrowDown", codes: ["ArrowDown"], icon: "arrow-down", copies: 1 },
  { id: "ArrowLeft", codes: ["ArrowLeft"], icon: "arrow-left", copies: 1 },
  { id: "ArrowRight", codes: ["ArrowRight"], icon: "arrow-right", copies: 1 },
];

export const KEYS: readonly KeySpec[] = [
  ...LETTERS.map(([latin, thai]) => ({ id: `Key${latin}`, codes: [`Key${latin}`], latin, thai, copies: 4 })),
  ...DIGITS.map(([latin, thai]) => ({ id: `Digit${latin}`, codes: [`Digit${latin}`], latin, thai, copies: 2 })),
  ...PUNCTUATION.map(([code, latin, thai]) => ({ id: code, codes: [code], latin, thai, copies: 2 })),
  ...SPECIALS,
];

const KEY_BY_CODE = new Map<string, number>(
  KEYS.flatMap((key, index) => key.codes.map((code) => [code, index] as const)),
);

/** The key a physical key press lands on, or -1 for one the ball does not carry. */
export function keyIndexForCode(code: string): number {
  return KEY_BY_CODE.get(code) ?? -1;
}
