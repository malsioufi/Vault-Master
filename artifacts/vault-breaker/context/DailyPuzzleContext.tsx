import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeedbackResult } from "@/context/GameContext";
import {
  getDailyDateStr,
  getDailyConfig,
  evaluateDailyGuess,
  type DailyConfig,
} from "@/utils/dailyPuzzle";

const STORAGE_KEY = "@vault_breaker_daily";

export interface DailyGuessEntry {
  guess: string[];
  feedback: FeedbackResult;
}

export interface DailyHistoryRecord {
  dateStr: string;
  won: boolean;
  attempts: number;
  guessHistory: DailyGuessEntry[];
}

interface DailyStorage {
  streak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  history: Record<string, DailyHistoryRecord>;
}

type DailyPhase = "idle" | "playing" | "won" | "lost";

interface DailyPuzzleState {
  phase: DailyPhase;
  config: DailyConfig | null;
  guessHistory: DailyGuessEntry[];
  currentGuess: string[];
  streak: number;
  longestStreak: number;
  todayRecord: DailyHistoryRecord | null;
  loaded: boolean;
}

interface DailyPuzzleContextType {
  daily: DailyPuzzleState;
  startDaily: () => void;
  makeGuess: (guess: string[]) => void;
  surrender: () => void;
  backToMenu: () => void;
}

const DailyPuzzleContext = createContext<DailyPuzzleContextType | null>(null);

export function useDailyPuzzle(): DailyPuzzleContextType {
  const ctx = useContext(DailyPuzzleContext);
  if (!ctx) throw new Error("useDailyPuzzle must be used inside DailyPuzzleProvider");
  return ctx;
}

const defaultState: DailyPuzzleState = {
  phase: "idle",
  config: null,
  guessHistory: [],
  currentGuess: [],
  streak: 0,
  longestStreak: 0,
  todayRecord: null,
  loaded: false,
};

export function DailyPuzzleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DailyPuzzleState>(defaultState);
  const storageRef = useRef<DailyStorage>({
    streak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    history: {},
  });

  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const stored: DailyStorage = raw
          ? JSON.parse(raw)
          : { streak: 0, longestStreak: 0, lastPlayedDate: null, history: {} };
        storageRef.current = stored;
        const today = getDailyDateStr();
        const todayRecord = stored.history[today] ?? null;
        setState((prev) => ({
          ...prev,
          streak: stored.streak,
          longestStreak: stored.longestStreak,
          todayRecord,
          loaded: true,
        }));
      } catch {
        setState((prev) => ({ ...prev, loaded: true }));
      }
    }
    load();
  }, []);

  const persist = useCallback(async (data: DailyStorage) => {
    storageRef.current = data;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const startDaily = useCallback(() => {
    const today = getDailyDateStr();
    const config = getDailyConfig(today);
    const todayRecord = storageRef.current.history[today] ?? null;
    if (todayRecord) {
      setState((prev) => ({
        ...prev,
        phase: todayRecord.won ? "won" : "lost",
        config,
        guessHistory: todayRecord.guessHistory,
        todayRecord,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        phase: "playing",
        config,
        guessHistory: [],
        currentGuess: [],
        todayRecord: null,
      }));
    }
  }, []);

  const makeGuess = useCallback(
    (guess: string[]) => {
      setState((prev) => {
        if (prev.phase !== "playing" || !prev.config) return prev;
        const feedback = evaluateDailyGuess(guess, prev.config.secretCode);
        const newHistory: DailyGuessEntry[] = [...prev.guessHistory, { guess, feedback }];
        const won = feedback.matches === prev.config.codeLength;
        const exhausted = newHistory.length >= prev.config.maxTries;
        const newPhase: DailyPhase = won ? "won" : exhausted ? "lost" : "playing";

        if (newPhase !== "playing") {
          const today = getDailyDateStr();
          const stored = storageRef.current;
          const lastDate = stored.lastPlayedDate;
          const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return getDailyDateStr(d);
          })();
          const newStreak = won
            ? lastDate === yesterday || lastDate === today
              ? stored.streak + (lastDate === yesterday ? 1 : lastDate === today ? 0 : 1)
              : 1
            : 0;
          const longestStreak = Math.max(stored.longestStreak, newStreak);
          const record: DailyHistoryRecord = {
            dateStr: today,
            won,
            attempts: newHistory.length,
            guessHistory: newHistory,
          };
          const newStorage: DailyStorage = {
            streak: newStreak,
            longestStreak,
            lastPlayedDate: today,
            history: { ...stored.history, [today]: record },
          };
          persist(newStorage);
          return {
            ...prev,
            phase: newPhase,
            guessHistory: newHistory,
            currentGuess: [],
            streak: newStreak,
            longestStreak,
            todayRecord: record,
          };
        }

        return { ...prev, guessHistory: newHistory, currentGuess: [] };
      });
    },
    [persist]
  );

  const surrender = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "playing" || !prev.config) return prev;
      const today = getDailyDateStr();
      const stored = storageRef.current;
      const newStreak = 0;
      const longestStreak = stored.longestStreak;
      const record: DailyHistoryRecord = {
        dateStr: today,
        won: false,
        attempts: prev.guessHistory.length,
        guessHistory: prev.guessHistory,
      };
      const newStorage: DailyStorage = {
        streak: newStreak,
        longestStreak,
        lastPlayedDate: today,
        history: { ...stored.history, [today]: record },
      };
      persist(newStorage);
      return {
        ...prev,
        phase: "lost",
        currentGuess: [],
        streak: newStreak,
        longestStreak,
        todayRecord: record,
      };
    });
  }, [persist]);

  const backToMenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "idle",
      config: null,
      guessHistory: [],
      currentGuess: [],
    }));
  }, []);

  return (
    <DailyPuzzleContext.Provider value={{ daily: state, startDaily, makeGuess, surrender, backToMenu }}>
      {children}
    </DailyPuzzleContext.Provider>
  );
}
