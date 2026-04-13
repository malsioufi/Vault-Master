import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import type { GameSettings, FeedbackResult } from "@/context/GameContext";

export type OnlinePhase =
  | "idle"
  | "connecting"
  | "lobby_host"
  | "lobby_guest"
  | "playing"
  | "finished";

export interface OnlineGuessEntry {
  guess?: string[];
  feedback: FeedbackResult;
  turnNumber: number;
  isMine: boolean;
}

export interface OnlineGameState {
  phase: OnlinePhase;
  roomCode: string;
  playerId: string;
  role: "host" | "guest" | null;
  settings: GameSettings | null;
  currentTurn: "host" | "guest" | null;
  turnNumber: number;
  timeLeft: number;
  myHistory: OnlineGuessEntry[];
  opponentHistory: OnlineGuessEntry[];
  mySecret: string[];
  opponentSecret: string[];
  winner: "host" | "guest" | "draw" | null;
  errorMessage: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
}

interface MultiplayerContextType {
  online: OnlineGameState;
  connect: () => void;
  disconnect: () => void;
  createRoom: (settings: GameSettings) => void;
  joinRoom: (code: string) => void;
  submitGuess: (guess: string[]) => void;
  surrender: () => void;
  reset: () => void;
}

const defaultSettings: GameSettings = {
  codeLength: 4,
  allowDuplicates: false,
  maxTries: 10,
  difficulty: "medium",
  botMode: "passive",
  language: "en",
};

const defaultOnline: OnlineGameState = {
  phase: "idle",
  roomCode: "",
  playerId: "",
  role: null,
  settings: null,
  currentTurn: null,
  turnNumber: 0,
  timeLeft: 30,
  myHistory: [],
  opponentHistory: [],
  mySecret: [],
  opponentSecret: [],
  winner: null,
  errorMessage: null,
  connectionStatus: "disconnected",
};

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

function getWsUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    const proto = isSecure ? "wss:" : "ws:";
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const host = domain ?? window.location.host;
    return `${proto}//${host}/api/ws`;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  if (domain) return `wss://${domain}/api/ws`;
  return `ws://localhost:8080/api/ws`;
}

export function MultiplayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [online, setOnline] = useState<OnlineGameState>(defaultOnline);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const handleMessage = useCallback(
    (raw: MessageEvent) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = msg["type"] as string;

      switch (type) {
        case "connected": {
          setOnline((prev) => ({
            ...prev,
            connectionStatus: "connected",
          }));
          if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
          }
          break;
        }

        case "room_created": {
          setOnline((prev) => ({
            ...prev,
            phase: "lobby_host",
            roomCode: msg["roomCode"] as string,
            playerId: msg["playerId"] as string,
            role: "host",
            settings: msg["settings"] as GameSettings,
            errorMessage: null,
          }));
          break;
        }

        case "room_joined": {
          setOnline((prev) => ({
            ...prev,
            phase: "lobby_guest",
            roomCode: msg["roomCode"] as string,
            playerId: msg["playerId"] as string,
            role: "guest",
            settings: msg["settings"] as GameSettings,
            errorMessage: null,
          }));
          break;
        }

        case "opponent_joined": {
          setOnline((prev) => ({
            ...prev,
            errorMessage: null,
          }));
          break;
        }

        case "game_started": {
          setOnline((prev) => ({
            ...prev,
            phase: "playing",
            currentTurn: msg["currentTurn"] as "host" | "guest",
            turnNumber: msg["turnNumber"] as number,
            timeLeft: msg["timeLeft"] as number,
            settings: (msg["settings"] as GameSettings) ?? prev.settings,
            myHistory: [],
            opponentHistory: [],
            mySecret: [],
            opponentSecret: [],
            winner: null,
          }));
          break;
        }

        case "guess_result": {
          const feedback = msg["feedback"] as FeedbackResult;
          const won = msg["won"] as boolean;
          setOnline((prev) => ({
            ...prev,
            myHistory: [
              ...prev.myHistory,
              {
                guess: msg["guess"] as string[],
                feedback,
                turnNumber: msg["turnNumber"] as number,
                isMine: true,
              },
            ],
          }));
          break;
        }

        case "opponent_guessed": {
          const feedback = msg["feedback"] as FeedbackResult;
          setOnline((prev) => ({
            ...prev,
            opponentHistory: [
              ...prev.opponentHistory,
              {
                feedback,
                turnNumber: msg["turnNumber"] as number,
                isMine: false,
              },
            ],
          }));
          break;
        }

        case "turn_changed": {
          setOnline((prev) => ({
            ...prev,
            currentTurn: msg["currentTurn"] as "host" | "guest",
            turnNumber: msg["turnNumber"] as number,
            timeLeft: msg["timeLeft"] as number,
          }));
          break;
        }

        case "timer_tick": {
          setOnline((prev) => ({
            ...prev,
            timeLeft: msg["timeLeft"] as number,
          }));
          break;
        }

        case "timeout_guess": {
          const guess = msg["guess"] as string[];
          const fakeFeedback: FeedbackResult = {
            matches: 0,
            shifts: 0,
            glitches: guess.length,
            icons: Array(guess.length).fill("glitch") as "glitch"[],
          };
          setOnline((prev) => ({
            ...prev,
            myHistory: [
              ...prev.myHistory,
              {
                guess,
                feedback: fakeFeedback,
                turnNumber: prev.turnNumber,
                isMine: true,
              },
            ],
          }));
          break;
        }

        case "game_over": {
          const winner = msg["winner"] as "host" | "guest" | "draw" | null;
          const hostSecret = msg["hostSecret"] as string[];
          const guestSecret = msg["guestSecret"] as string[];
          setOnline((prev) => {
            const mySecret =
              prev.role === "host" ? hostSecret : guestSecret;
            const opponentSecret =
              prev.role === "host" ? guestSecret : hostSecret;
            return {
              ...prev,
              phase: "finished",
              winner,
              mySecret,
              opponentSecret,
            };
          });
          break;
        }

        case "error": {
          setOnline((prev) => ({
            ...prev,
            errorMessage: msg["message"] as string,
          }));
          break;
        }

        case "pong": {
          break;
        }
      }
    },
    []
  );

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    setOnline((prev) => ({
      ...prev,
      connectionStatus: "connecting",
      errorMessage: null,
    }));

    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setOnline((prev) => ({ ...prev, connectionStatus: "connected" }));
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      setOnline((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        errorMessage: "Connection failed. Check your network.",
        phase: "idle",
      }));
    };

    ws.onclose = () => {
      setOnline((prev) => {
        if (prev.phase === "playing" || prev.phase === "lobby_host" || prev.phase === "lobby_guest") {
          return {
            ...prev,
            connectionStatus: "disconnected",
            errorMessage: "Connection lost. Opponent may have disconnected.",
            phase: "finished",
          };
        }
        return { ...prev, connectionStatus: "disconnected" };
      });
      if (pingRef.current) clearInterval(pingRef.current);
    };

    pingRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (pingRef.current) clearInterval(pingRef.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const createRoomFn = useCallback(
    (settings: GameSettings) => {
      const doCreate = () => {
        send({
          type: "create_room",
          settings: {
            codeLength: settings.codeLength,
            allowDuplicates: settings.allowDuplicates,
            maxTries: settings.maxTries,
          },
        });
      };

      if (
        !wsRef.current ||
        wsRef.current.readyState === WebSocket.CLOSED ||
        wsRef.current.readyState === WebSocket.CLOSING
      ) {
        pendingActionRef.current = doCreate;
        connect();
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        pendingActionRef.current = doCreate;
      } else {
        doCreate();
      }
    },
    [send, connect]
  );

  const joinRoomFn = useCallback(
    (code: string) => {
      const doJoin = () => {
        send({ type: "join_room", roomCode: code });
      };

      if (
        !wsRef.current ||
        wsRef.current.readyState === WebSocket.CLOSED ||
        wsRef.current.readyState === WebSocket.CLOSING
      ) {
        pendingActionRef.current = doJoin;
        connect();
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        pendingActionRef.current = doJoin;
      } else {
        doJoin();
      }
    },
    [send, connect]
  );

  const submitGuess = useCallback(
    (guess: string[]) => {
      setOnline((prev) => {
        send({ type: "submit_guess", playerId: prev.playerId, guess });
        return prev;
      });
    },
    [send]
  );

  const surrenderFn = useCallback(() => {
    setOnline((prev) => {
      send({ type: "surrender", playerId: prev.playerId });
      return prev;
    });
  }, [send]);

  const reset = useCallback(() => {
    disconnect();
    setOnline(defaultOnline);
  }, [disconnect]);

  useEffect(() => {
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <MultiplayerContext.Provider
      value={{
        online,
        connect,
        disconnect,
        createRoom: createRoomFn,
        joinRoom: joinRoomFn,
        submitGuess,
        surrender: surrenderFn,
        reset,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext);
  if (!ctx)
    throw new Error("useMultiplayer must be used within MultiplayerProvider");
  return ctx;
}
