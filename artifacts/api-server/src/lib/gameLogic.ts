export type Difficulty = "easy" | "medium" | "hard";

export interface FeedbackResult {
  matches: number;
  shifts: number;
  glitches: number;
  icons: ("match" | "shift" | "glitch")[];
}

export interface GameSettings {
  codeLength: 3 | 4 | 5 | 6;
  allowDuplicates: boolean;
  maxTries: number;
}

export function generateCode(
  length: number,
  allowDuplicates: boolean
): string[] {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const code: string[] = [];
  const available = allowDuplicates ? digits : [...digits];

  for (let i = 0; i < length; i++) {
    const pool = allowDuplicates ? digits : available;
    const idx = Math.floor(Math.random() * pool.length);
    code.push(pool[idx]);
    if (!allowDuplicates) available.splice(idx, 1);
  }
  return code;
}

export function evaluateGuess(
  guess: string[],
  secret: string[]
): FeedbackResult {
  let matches = 0;
  let shifts = 0;
  const secretCopy = [...secret];
  const guessCopy = [...guess];

  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      matches++;
      secretCopy[i] = "X";
      guessCopy[i] = "Y";
    }
  }

  for (let i = 0; i < guessCopy.length; i++) {
    if (guessCopy[i] === "Y") continue;
    const sIdx = secretCopy.indexOf(guessCopy[i]);
    if (sIdx !== -1) {
      shifts++;
      secretCopy[sIdx] = "X";
    }
  }

  const glitches = guess.length - matches - shifts;

  const rawIcons: ("match" | "shift" | "glitch")[] = [
    ...Array(matches).fill("match" as const),
    ...Array(shifts).fill("shift" as const),
    ...Array(glitches).fill("glitch" as const),
  ];

  const icons = [...rawIcons].sort(
    () => Math.random() - 0.5
  ) as ("match" | "shift" | "glitch")[];

  return { matches, shifts, glitches, icons };
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
  ).toUpperCase();
}
