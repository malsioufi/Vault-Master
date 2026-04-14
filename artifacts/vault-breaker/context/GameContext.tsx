import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type BotMode = "passive" | "active";
export type Language = "en" | "ar";
export type GameMode = "solo" | "online";
export type GamePhase =
  | "menu"
  | "settings"
  | "playing"
  | "won"
  | "lost"
  | "waiting"
  | "lobby"
  | "online";

export interface FeedbackResult {
  matches: number;
  shifts: number;
  glitches: number;
  icons: ("match" | "shift" | "glitch")[];
  perDigit: ("match" | "shift" | "glitch")[];
}

export interface GuessEntry {
  guess: string[];
  feedback: FeedbackResult;
  timestamp: number;
}

export interface GameSettings {
  codeLength: 3 | 4 | 5 | 6;
  allowDuplicates: boolean;
  difficulty: Difficulty;
  botMode: BotMode;
  maxTries: number;
  language: Language;
}

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  secretCode: string[];
  currentGuess: string[];
  guessHistory: GuessEntry[];
  botGuessHistory: GuessEntry[];
  botSecretCode: string[];
  turnTimer: number;
  isPlayerTurn: boolean;
  roomCode: string;
  playerId: string;
  opponentConnected: boolean;
  opponentGuessHistory: GuessEntry[];
  playerWon: boolean | null;
}

interface GameContextType {
  state: GameState;
  updateSettings: (s: Partial<GameSettings>) => void;
  startSoloGame: () => void;
  goOnline: () => void;
  makeGuess: (guess: string[]) => void;
  surrender: () => void;
  backToMenu: () => void;
  setDigit: (index: number, digit: string) => void;
  removeDigit: (index: number) => void;
  clearCurrentGuess: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  sendOnlineGuess: (guess: string[]) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const defaultSettings: GameSettings = {
  codeLength: 4,
  allowDuplicates: false,
  difficulty: "medium",
  botMode: "passive",
  maxTries: 10,
  language: "en",
};

const defaultState: GameState = {
  phase: "menu",
  settings: defaultSettings,
  secretCode: [],
  currentGuess: [],
  guessHistory: [],
  botGuessHistory: [],
  botSecretCode: [],
  turnTimer: 30,
  isPlayerTurn: true,
  roomCode: "",
  playerId: "",
  opponentConnected: false,
  opponentGuessHistory: [],
  playerWon: null,
};

const translations: Record<string, Record<string, string>> = {
  en: {
    vaultBreaker: "VAULT BREAKER",
    tagline: "Crack the Code. Break the Vault.",
    soloMode: "Solo Mode",
    onlineMode: "Online Mode",
    settings: "SETTINGS",
    codeLength: "CODE LENGTH",
    allowDuplicates: "ALLOW DUPLICATES",
    aiDifficulty: "AI DIFFICULTY",
    botMode: "BOT MODE",
    maxTries: "MAX TRIES",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    passiveBot: "Passive Bot",
    activeBot: "Active Bot",
    on: "ON",
    off: "OFF",
    startGame: "INITIATE BREACH",
    enterGuess: "ENTER ACCESS CODE",
    submit: "SUBMIT",
    giveUp: "SURRENDER",
    history: "BREACH LOG",
    match: "MATCH",
    shift: "SHIFT",
    glitch: "GLITCH",
    youWin: "VAULT BREACHED",
    youLose: "ACCESS DENIED",
    secretWas: "The code was:",
    tryAgain: "Try Again",
    backToMenu: "Main Menu",
    attempt: "ATTEMPT",
    turnTimer: "TURN EXPIRES IN",
    yourTurn: "YOUR TURN",
    opponentTurn: "OPPONENT TURN",
    waitingOpponent: "WAITING FOR OPPONENT...",
    roomCode: "ROOM CODE",
    createRoom: "CREATE ROOM",
    joinRoom: "JOIN ROOM",
    enterRoomCode: "Enter room code...",
    connecting: "CONNECTING...",
    opponentConnected: "OPPONENT CONNECTED",
    surrender: "SURRENDER",
    confirmSurrender: "Are you sure you want to surrender?",
    yes: "Yes",
    no: "No",
    duplicateError: "Duplicate digits not allowed",
    invalidInput: "Numbers only",
    botGuessing: "AI ANALYZING...",
    youGuessBot: "BREACH THEIR VAULT",
    botGuessesYou: "AI BREACH ATTEMPT",
    digits: "digits",
    noHistory: "No attempts yet",
    loading: "LOADING...",
    language: "Language",
    online: "Online",
    coming: "Coming",
    soon: "Soon",
    howToPlay: "HOW TO PLAY",
    gotIt: "GOT IT",
    dailyPuzzle: "DAILY PUZZLE",
    streak: "STREAK",
    bestStreak: "BEST",
    nextPuzzleIn: "Next puzzle in",
    shareResult: "SHARE",
    copied: "Copied!",
    noDuplicates: "No Duplicates",
    alreadyPlayed: "Already Played Today",
    playDaily: "DAILY PUZZLE",
    instrObjective: "OBJECTIVE",
    instrObjectiveText: "Crack the hidden secret code before you run out of attempts. Each guess gives you feedback clues.",
    instrFeedbackSection: "FEEDBACK INDICATORS",
    instrMatchDesc: "Right digit, right position",
    instrShiftDesc: "Right digit, wrong position",
    instrGlitchDesc: "Digit not in the code at all",
    instrFeedbackNote: "Note: feedback dots are shown in random order during play to avoid giving away positions.",
    instrGameModes: "GAME MODES",
    instrPassiveModeTitle: "SOLO — PASSIVE BOT:",
    instrPassiveModeDesc: "You guess the code alone. No time pressure.",
    instrActiveModeTitle: "SOLO — ACTIVE BOT:",
    instrActiveModeDesc: "Race against an AI that is simultaneously trying to crack your code too. First to break wins. Unlimited tries.",
    instrOnlineModeTitle: "ONLINE:",
    instrOnlineModeDesc: "Two real players. Each sets a secret code for the other to crack. Guess simultaneously — first to break the opponent's vault wins.",
    instrSettingsSection: "SETTINGS",
    instrCodeLengthTitle: "Code Length:",
    instrCodeLengthDesc: "3–6 digits. Longer = harder.",
    instrDuplicatesTitle: "Allow Duplicates:",
    instrDuplicatesDesc: "When ON, the same digit can appear more than once.",
    instrDifficultyTitle: "AI Difficulty:",
    instrDifficultyDesc: "Controls how smart the bot guesses (Easy / Medium / Hard).",
    instrMaxTriesTitle: "Max Tries:",
    instrMaxTriesDesc: "Limit your attempts (6–12) or set ∞ for unlimited.",
    instrTipsSection: "TIPS",
    instrTip1: "Use early guesses to test many different digits at once.",
    instrTip2: "Track SHIFT clues — the digit exists but needs to move.",
    instrTip3: "Review your full history at the end; digits are color-coded by position accuracy.",
    instrTip4: "You can give up at any time using the flag button — the secret will be revealed.",
  },
  ar: {
    vaultBreaker: "كاسر الخزنة",
    tagline: "اكسر الشفرة. اختق الخزنة.",
    soloMode: "وضع فردي",
    onlineMode: "وضع متعدد",
    settings: "الإعدادات",
    codeLength: "طول الرمز",
    allowDuplicates: "السماح بالتكرار",
    aiDifficulty: "صعوبة الذكاء",
    botMode: "وضع الروبوت",
    maxTries: "أقصى محاولات",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    passiveBot: "روبوت سلبي",
    activeBot: "روبوت نشط",
    on: "مفعّل",
    off: "معطّل",
    startGame: "بدء الاختراق",
    enterGuess: "أدخل رمز الوصول",
    submit: "إرسال",
    giveUp: "الاستسلام",
    history: "سجل المحاولات",
    match: "تطابق",
    shift: "إزاحة",
    glitch: "خطأ",
    youWin: "تم كسر الخزنة",
    youLose: "رُفض الوصول",
    secretWas: "كان الرمز:",
    tryAgain: "حاول مجددًا",
    backToMenu: "القائمة الرئيسية",
    attempt: "المحاولة",
    turnTimer: "الدور ينتهي خلال",
    yourTurn: "دورك",
    opponentTurn: "دور الخصم",
    waitingOpponent: "انتظار الخصم...",
    roomCode: "رمز الغرفة",
    createRoom: "إنشاء غرفة",
    joinRoom: "الانضمام",
    enterRoomCode: "أدخل رمز الغرفة...",
    connecting: "جارٍ الاتصال...",
    opponentConnected: "الخصم متصل",
    surrender: "استسلم",
    confirmSurrender: "هل أنت متأكد أنك تريد الاستسلام؟",
    yes: "نعم",
    no: "لا",
    duplicateError: "الأرقام المكررة غير مسموحة",
    invalidInput: "أرقام فقط",
    botGuessing: "الذكاء يحلل...",
    youGuessBot: "اختق خزنته",
    botGuessesYou: "محاولة اختراق الذكاء",
    digits: "أرقام",
    noHistory: "لا محاولات بعد",
    loading: "جارٍ التحميل...",
    language: "اللغة",
    online: "متعدد اللاعبين",
    coming: "قريبًا",
    soon: "",
    howToPlay: "كيف تلعب",
    gotIt: "فهمت",
    dailyPuzzle: "الأحجية اليومية",
    streak: "السلسلة",
    bestStreak: "الأفضل",
    nextPuzzleIn: "الأحجية التالية خلال",
    shareResult: "مشاركة",
    copied: "تم النسخ!",
    noDuplicates: "بلا تكرار",
    alreadyPlayed: "لعبت اليوم بالفعل",
    playDaily: "الأحجية اليومية",
    instrObjective: "الهدف",
    instrObjectiveText: "اكسر الرمز السري المخفي قبل نفاد محاولاتك. كل تخمين يعطيك تلميحات.",
    instrFeedbackSection: "مؤشرات التغذية الراجعة",
    instrMatchDesc: "الرقم صحيح والموضع صحيح",
    instrShiftDesc: "الرقم صحيح لكن الموضع خاطئ",
    instrGlitchDesc: "الرقم غير موجود في الرمز أصلاً",
    instrFeedbackNote: "ملاحظة: تُعرض نقاط التغذية الراجعة بترتيب عشوائي أثناء اللعب لتجنب الكشف عن المواضع.",
    instrGameModes: "أوضاع اللعب",
    instrPassiveModeTitle: "فردي — روبوت سلبي:",
    instrPassiveModeDesc: "تخمّن الرمز بمفردك. لا ضغط زمني.",
    instrActiveModeTitle: "فردي — روبوت نشط:",
    instrActiveModeDesc: "تسابق مع الذكاء الاصطناعي الذي يحاول كسر رمزك في الوقت ذاته. من يكسر أولاً يفوز. محاولات غير محدودة.",
    instrOnlineModeTitle: "متعدد اللاعبين:",
    instrOnlineModeDesc: "لاعبان حقيقيان. كل واحد يضع رمزاً سرياً للآخر. يتخمنان في الوقت ذاته — من يكسر خزنة الخصم أولاً يفوز.",
    instrSettingsSection: "الإعدادات",
    instrCodeLengthTitle: "طول الرمز:",
    instrCodeLengthDesc: "3 إلى 6 أرقام. أطول = أصعب.",
    instrDuplicatesTitle: "السماح بالتكرار:",
    instrDuplicatesDesc: "عند التفعيل، يمكن أن يتكرر الرقم أكثر من مرة.",
    instrDifficultyTitle: "صعوبة الذكاء:",
    instrDifficultyDesc: "يتحكم في ذكاء الروبوت (سهل / متوسط / صعب).",
    instrMaxTriesTitle: "أقصى محاولات:",
    instrMaxTriesDesc: "حدد محاولاتك (6-12) أو اختر ∞ لمحاولات غير محدودة.",
    instrTipsSection: "نصائح",
    instrTip1: "استخدم المحاولات الأولى لاختبار أرقام مختلفة كثيرة دفعة واحدة.",
    instrTip2: "انتبه لتلميحات الإزاحة — الرقم موجود لكن في موضع خاطئ.",
    instrTip3: "راجع سجلك الكامل في النهاية؛ الأرقام ملوّنة حسب دقة موضعها.",
    instrTip4: "يمكنك الاستسلام في أي وقت بزر العلم — سيُكشف الرمز السري.",
  },
};

function generateCode(length: number, allowDuplicates: boolean): string[] {
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

function evaluateGuess(guess: string[], secret: string[]): FeedbackResult {
  let matches = 0;
  let shifts = 0;
  const secretCopy = [...secret];
  const guessCopy = [...guess];
  const perDigit: ("match" | "shift" | "glitch")[] = Array(guess.length).fill("glitch");

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

  const icons = [...rawIcons].sort(() => Math.random() - 0.5) as (
    | "match"
    | "shift"
    | "glitch"
  )[];

  return { matches, shifts, glitches, icons, perDigit };
}

function aiGuessEasy(length: number, allowDuplicates: boolean): string[] {
  return generateCode(length, allowDuplicates);
}

function aiGuessMedium(
  history: GuessEntry[],
  length: number,
  allowDuplicates: boolean
): string[] {
  if (history.length === 0) return generateCode(length, allowDuplicates);

  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = generateCode(length, allowDuplicates);
    let valid = true;

    for (const entry of history) {
      const fb = evaluateGuess(candidate, entry.guess);
      if (
        fb.matches !== entry.feedback.matches ||
        fb.shifts !== entry.feedback.shifts
      ) {
        valid = false;
        break;
      }
    }

    if (valid) return candidate;
  }

  return generateCode(length, allowDuplicates);
}

function aiGuessHard(
  history: GuessEntry[],
  length: number,
  allowDuplicates: boolean,
  secretCode: string[]
): string[] {
  if (history.length === 0) {
    const starter: string[] = [];
    const pool = ["1", "2", "3", "4", "5", "6"];
    for (let i = 0; i < length; i++) {
      starter.push(pool[i % pool.length]);
    }
    return starter;
  }

  const candidates: string[][] = [];
  const allCodes = generateAllCodes(length, allowDuplicates);

  for (const candidate of allCodes) {
    let valid = true;
    for (const entry of history) {
      const fb = evaluateGuess(candidate, entry.guess);
      if (
        fb.matches !== entry.feedback.matches ||
        fb.shifts !== entry.feedback.shifts
      ) {
        valid = false;
        break;
      }
    }
    if (valid) candidates.push(candidate);
  }

  if (candidates.length === 0) return generateCode(length, allowDuplicates);
  if (candidates.length <= 2) return candidates[0];

  let bestGuess = candidates[0];
  let bestScore = Infinity;

  const sampleSize = Math.min(candidates.length, 20);
  const sample = candidates.slice(0, sampleSize);

  for (const guess of sample) {
    const partitions: Record<string, number> = {};
    for (const candidate of candidates) {
      const fb = evaluateGuess(guess, candidate);
      const key = `${fb.matches},${fb.shifts}`;
      partitions[key] = (partitions[key] || 0) + 1;
    }
    const maxPartition = Math.max(...Object.values(partitions));
    if (maxPartition < bestScore) {
      bestScore = maxPartition;
      bestGuess = guess;
    }
  }

  return bestGuess;
}

function generateAllCodes(length: number, allowDuplicates: boolean): string[][] {
  const result: string[][] = [];
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  function backtrack(current: string[], used: Set<string>) {
    if (current.length === length) {
      result.push([...current]);
      return;
    }
    for (const d of digits) {
      if (!allowDuplicates && used.has(d)) continue;
      current.push(d);
      used.add(d);
      backtrack(current, used);
      current.pop();
      if (!allowDuplicates) used.delete(d);
    }
  }

  backtrack([], new Set());
  return result;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [language, setLanguageState] = useState<Language>("en");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("vb_language").then((val) => {
      if (val === "en" || val === "ar") setLanguageState(val);
    });
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    AsyncStorage.setItem("vb_language", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] ?? translations["en"]?.[key] ?? key;
    },
    [language]
  );

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
  }, []);

  const updateSettings = useCallback((s: Partial<GameSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...s },
    }));
  }, []);

  const startSoloGame = useCallback(() => {
    clearTimers();
    setState((prev) => {
      const secret = generateCode(
        prev.settings.codeLength,
        prev.settings.allowDuplicates
      );
      const botSecret = generateCode(
        prev.settings.codeLength,
        prev.settings.allowDuplicates
      );
      return {
        ...prev,
        phase: "playing",
        secretCode: secret,
        botSecretCode: botSecret,
        currentGuess: [],
        guessHistory: [],
        botGuessHistory: [],
        playerWon: null,
        isPlayerTurn: true,
        turnTimer: 30,
      };
    });
  }, [clearTimers]);

  const scheduleBotGuess = useCallback(
    (
      botHistory: GuessEntry[],
      settings: GameSettings,
      secretCode: string[],
      difficulty: Difficulty
    ) => {
      const delay = difficulty === "easy" ? 1500 : difficulty === "medium" ? 2000 : 2500;
      botTimeoutRef.current = setTimeout(() => {
        setState((prev) => {
          if (prev.phase !== "playing") return prev;
          if (prev.settings.botMode !== "active") {
            return { ...prev, isPlayerTurn: true };
          }

          let botGuess: string[];
          if (difficulty === "easy") {
            botGuess = aiGuessEasy(settings.codeLength, settings.allowDuplicates);
          } else if (difficulty === "medium") {
            botGuess = aiGuessMedium(botHistory, settings.codeLength, settings.allowDuplicates);
          } else {
            botGuess = aiGuessHard(botHistory, settings.codeLength, settings.allowDuplicates, prev.secretCode);
          }

          const botFeedback = evaluateGuess(botGuess, prev.secretCode);
          const newBotHistory: GuessEntry[] = [
            ...prev.botGuessHistory,
            { guess: botGuess, feedback: botFeedback, timestamp: Date.now() },
          ];

          if (botFeedback.matches === settings.codeLength) {
            return {
              ...prev,
              botGuessHistory: newBotHistory,
              phase: "lost",
              playerWon: false,
            };
          }

          return {
            ...prev,
            botGuessHistory: newBotHistory,
            isPlayerTurn: true,
          };
        });
      }, delay);
    },
    []
  );

  const makeGuess = useCallback(
    (guess: string[]) => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;
        if (guess.length !== prev.settings.codeLength) return prev;

        const feedback = evaluateGuess(guess, prev.secretCode);
        const newHistory: GuessEntry[] = [
          ...prev.guessHistory,
          { guess, feedback, timestamp: Date.now() },
        ];

        if (feedback.matches === prev.settings.codeLength) {
          return {
            ...prev,
            guessHistory: newHistory,
            phase: "won",
            playerWon: true,
            currentGuess: [],
          };
        }

        if (prev.settings.maxTries > 0 && newHistory.length >= prev.settings.maxTries) {
          return {
            ...prev,
            guessHistory: newHistory,
            phase: "lost",
            playerWon: false,
            currentGuess: [],
          };
        }

        if (prev.settings.botMode === "active") {
          scheduleBotGuess(
            prev.botGuessHistory,
            prev.settings,
            prev.secretCode,
            prev.settings.difficulty
          );
          return {
            ...prev,
            guessHistory: newHistory,
            currentGuess: [],
            isPlayerTurn: false,
          };
        }

        return {
          ...prev,
          guessHistory: newHistory,
          currentGuess: [],
          isPlayerTurn: true,
        };
      });
    },
    [scheduleBotGuess]
  );

  const surrender = useCallback(() => {
    clearTimers();
    setState((prev) => ({
      ...prev,
      phase: "lost",
      playerWon: false,
      currentGuess: [],
    }));
  }, [clearTimers]);

  const backToMenu = useCallback(() => {
    clearTimers();
    setState((prev) => ({
      ...prev,
      phase: "menu",
      currentGuess: [],
      guessHistory: [],
      botGuessHistory: [],
      playerWon: null,
    }));
  }, [clearTimers]);

  const setDigit = useCallback(
    (index: number, digit: string) => {
      setState((prev) => {
        const newGuess = [...prev.currentGuess];
        while (newGuess.length <= index) newGuess.push("");
        newGuess[index] = digit;
        return { ...prev, currentGuess: newGuess };
      });
    },
    []
  );

  const removeDigit = useCallback((index: number) => {
    setState((prev) => {
      const newGuess = [...prev.currentGuess];
      newGuess[index] = "";
      return { ...prev, currentGuess: newGuess };
    });
  }, []);

  const clearCurrentGuess = useCallback(() => {
    setState((prev) => ({ ...prev, currentGuess: [] }));
  }, []);

  const createRoom = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setState((prev) => ({
      ...prev,
      phase: "lobby",
      roomCode: code,
    }));
  }, []);

  const joinRoom = useCallback((_code: string) => {
    setState((prev) => ({
      ...prev,
      phase: "lobby",
      roomCode: _code.toUpperCase(),
    }));
  }, []);

  const sendOnlineGuess = useCallback((_guess: string[]) => {}, []);

  const goOnline = useCallback(() => {
    clearTimers();
    setState((prev) => ({ ...prev, phase: "online" }));
  }, [clearTimers]);

  return (
    <GameContext.Provider
      value={{
        state,
        updateSettings,
        startSoloGame,
        goOnline,
        makeGuess,
        surrender,
        backToMenu,
        setDigit,
        removeDigit,
        clearCurrentGuess,
        createRoom,
        joinRoom,
        sendOnlineGuess,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
