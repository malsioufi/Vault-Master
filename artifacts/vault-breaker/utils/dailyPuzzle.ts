import type { FeedbackResult } from "@/context/GameContext";

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REFERENCE_DATE_MS = new Date("2026-01-01T00:00:00Z").getTime();

export function getDailyDateStr(date?: Date): string {
  const d = date ?? new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getDailyPuzzleNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  return Math.max(1, Math.floor((ms - REFERENCE_DATE_MS) / 86400000) + 1);
}

export function getTimeUntilNextPuzzle(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const diff = tomorrow.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(diff / 1000));
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

export interface DailyConfig {
  codeLength: 3 | 4 | 5 | 6;
  allowDuplicates: boolean;
  maxTries: number;
  secretCode: string[];
  puzzleNumber: number;
  dateStr: string;
}

export function getDailyConfig(dateStr: string): DailyConfig {
  const [y, m, d] = dateStr.split("-").map(Number);
  const seed = y * 10000 + m * 100 + d;
  const rng = mulberry32(seed);

  const lenRoll = rng();
  let codeLength: 3 | 4 | 5 | 6;
  if (lenRoll < 0.15) codeLength = 3;
  else if (lenRoll < 0.55) codeLength = 4;
  else if (lenRoll < 0.85) codeLength = 5;
  else codeLength = 6;

  const allowDuplicates = rng() < 0.5;

  const triesMap: Record<number, number[]> = {
    3: [5, 6, 7],
    4: [7, 8, 9, 10],
    5: [10, 11, 12],
    6: [12, 13, 14, 15],
  };
  const options = triesMap[codeLength];
  const maxTries = options[Math.floor(rng() * options.length)];

  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const secretCode: string[] = [];
  const available = [...digits];

  for (let i = 0; i < codeLength; i++) {
    const pool = allowDuplicates ? digits : available;
    const idx = Math.floor(rng() * pool.length);
    secretCode.push(pool[idx]);
    if (!allowDuplicates) available.splice(idx, 1);
  }

  return {
    codeLength,
    allowDuplicates,
    maxTries,
    secretCode,
    puzzleNumber: getDailyPuzzleNumber(dateStr),
    dateStr,
  };
}

export function evaluateDailyGuess(guess: string[], secret: string[]): FeedbackResult {
  const secretCopy = [...secret];
  const guessCopy = [...guess];
  const perDigit: ("match" | "shift" | "glitch")[] = Array(guess.length).fill("glitch");
  let matches = 0;
  let shifts = 0;

  for (let i = 0; i < guess.length; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      matches++;
      perDigit[i] = "match";
      secretCopy[i] = "X";
      guessCopy[i] = "Y";
    }
  }

  for (let i = 0; i < guessCopy.length; i++) {
    if (guessCopy[i] === "Y") continue;
    const sIdx = secretCopy.indexOf(guessCopy[i]);
    if (sIdx !== -1) {
      shifts++;
      perDigit[i] = "shift";
      secretCopy[sIdx] = "X";
    }
  }

  const glitches = guess.length - matches - shifts;
  const rawIcons: ("match" | "shift" | "glitch")[] = [
    ...Array(matches).fill("match"),
    ...Array(shifts).fill("shift"),
    ...Array(glitches).fill("glitch"),
  ];
  const icons = [...rawIcons].sort(() => Math.random() - 0.5) as ("match" | "shift" | "glitch")[];

  return { matches, shifts, glitches, icons, perDigit };
}

export function buildShareText(
  puzzleNumber: number,
  won: boolean,
  attempts: number,
  maxTries: number,
  guessHistory: { feedback: FeedbackResult }[],
  language: "en" | "ar",
  appUrl: string
): string {
  const rows = guessHistory.map((entry) =>
    entry.feedback.perDigit
      .map((s) => (s === "match" ? "🟢" : s === "shift" ? "🟡" : "⬛"))
      .join("")
  );

  if (language === "ar") {
    const header = `🔐 Vault Breaker - الأحجية #${puzzleNumber}`;
    const challenge = won
      ? `فككت الخزينة في ${attempts}/${maxTries} محاولات 😏\nهل تستطيع التغلب عليّ؟`
      : `خزينة #${puzzleNumber} هزمتني اليوم (X/${maxTries}) 💀\nأتحداك أن تفككها!`;
    const link = `👉 جرّب اليوم:\n${appUrl}`;
    return [header, "", challenge, "", ...rows, "", link].join("\n");
  }

  const header = `🔐 Vault Breaker Daily #${puzzleNumber}`;
  const challenge = won
    ? `I cracked Vault #${puzzleNumber} in ${attempts}/${maxTries} tries. Beat that! 😏`
    : `Vault #${puzzleNumber} got me today (X/${maxTries}) 💀\nThink you can crack it? I dare you.`;
  const link = `👉 Play today's vault:\n${appUrl}`;
  return [header, "", challenge, "", ...rows, "", link].join("\n");
}
