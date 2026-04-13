import { WebSocket } from "ws";
import {
  evaluateGuess,
  generateCode,
  generatePlayerId,
  type FeedbackResult,
  type GameSettings,
} from "./gameLogic.js";
import { logger } from "./logger.js";

export interface GuessEntry {
  guess: string[];
  feedback: FeedbackResult;
  turnNumber: number;
}

export type PlayerRole = "host" | "guest";

export interface Player {
  id: string;
  role: PlayerRole;
  ws: WebSocket;
  secretCode: string[];
  guessHistory: GuessEntry[];
  surrendered: boolean;
}

export type RoomPhase =
  | "waiting"
  | "playing"
  | "finished";

export interface Room {
  code: string;
  settings: GameSettings;
  host: Player | null;
  guest: Player | null;
  phase: RoomPhase;
  currentTurn: PlayerRole;
  turnNumber: number;
  turnTimer: ReturnType<typeof setInterval> | null;
  turnTimeLeft: number;
  winner: PlayerRole | "draw" | null;
  createdAt: number;
}

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

const TURN_SECONDS = 30;

export function createRoom(
  hostWs: WebSocket,
  settings: GameSettings
): { room: Room; player: Player } {
  const code = generateUniqueCode();
  const hostId = generatePlayerId();

  const host: Player = {
    id: hostId,
    role: "host",
    ws: hostWs,
    secretCode: [],
    guessHistory: [],
    surrendered: false,
  };

  const room: Room = {
    code,
    settings,
    host,
    guest: null,
    phase: "waiting",
    currentTurn: "host",
    turnNumber: 0,
    turnTimer: null,
    turnTimeLeft: TURN_SECONDS,
    winner: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  playerToRoom.set(hostId, code);

  return { room, player: host };
}

export function joinRoom(
  guestWs: WebSocket,
  code: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());

  if (!room) return { error: "Room not found" };
  if (room.phase !== "waiting") return { error: "Game already in progress" };
  if (room.guest !== null) return { error: "Room is full" };

  const guestId = generatePlayerId();
  const guest: Player = {
    id: guestId,
    role: "guest",
    ws: guestWs,
    secretCode: [],
    guessHistory: [],
    surrendered: false,
  };

  room.guest = guest;
  playerToRoom.set(guestId, code);

  return { room, player: guest };
}

export function startGame(room: Room): void {
  if (!room.host || !room.guest) return;

  room.host.secretCode = generateCode(
    room.settings.codeLength,
    room.settings.allowDuplicates
  );
  room.guest.secretCode = generateCode(
    room.settings.codeLength,
    room.settings.allowDuplicates
  );

  room.phase = "playing";
  room.currentTurn = "host";
  room.turnNumber = 1;

  startTurnTimer(room);
}

export function processGuess(
  room: Room,
  playerId: string,
  guess: string[]
): { feedback: FeedbackResult; won: boolean } | { error: string } {
  const player = getPlayerById(room, playerId);
  if (!player) return { error: "Player not found" };

  if (room.phase !== "playing") return { error: "Game not active" };
  if (player.role !== room.currentTurn) return { error: "Not your turn" };

  if (guess.length !== room.settings.codeLength) {
    return { error: "Invalid guess length" };
  }

  const opponent = getOpponent(room, player.role);
  if (!opponent) return { error: "Opponent not found" };

  const feedback = evaluateGuess(guess, opponent.secretCode);
  const entry: GuessEntry = {
    guess,
    feedback,
    turnNumber: room.turnNumber,
  };
  player.guessHistory.push(entry);

  const won = feedback.matches === room.settings.codeLength;
  const maxTries = room.settings.maxTries;
  const outOfTries = maxTries > 0 && player.guessHistory.length >= maxTries;

  if (won || outOfTries) {
    clearTurnTimer(room);
    endGame(room, won ? player.role : null);
  } else {
    advanceTurn(room);
  }

  return { feedback, won };
}

export function processSurrender(room: Room, playerId: string): void {
  const player = getPlayerById(room, playerId);
  if (!player || room.phase !== "playing") return;

  player.surrendered = true;
  clearTurnTimer(room);
  const opponent = getOpponent(room, player.role);
  endGame(room, opponent?.role ?? null);
}

export function getRoomByPlayerId(playerId: string): Room | null {
  const code = playerToRoom.get(playerId);
  if (!code) return null;
  return rooms.get(code) ?? null;
}

export function getPlayerById(room: Room, playerId: string): Player | null {
  if (room.host?.id === playerId) return room.host;
  if (room.guest?.id === playerId) return room.guest;
  return null;
}

export function getOpponent(room: Room, role: PlayerRole): Player | null {
  if (role === "host") return room.guest;
  return room.host;
}

export function removePlayer(playerId: string): void {
  const room = getRoomByPlayerId(playerId);
  if (!room) return;

  playerToRoom.delete(playerId);

  if (room.phase === "playing") {
    const player = getPlayerById(room, playerId);
    if (player) {
      const opponent = getOpponent(room, player.role);
      clearTurnTimer(room);
      endGame(room, opponent?.role ?? null);
    }
  }

  if (room.host?.id === playerId) {
    room.host = null;
  } else if (room.guest?.id === playerId) {
    room.guest = null;
  }

  if (!room.host && !room.guest) {
    rooms.delete(room.code);
    logger.info({ code: room.code }, "Room deleted (empty)");
  }
}

function endGame(room: Room, winner: PlayerRole | null): void {
  room.phase = "finished";
  room.winner = winner ?? "draw";
  clearTurnTimer(room);

  const hostSecret = room.host?.secretCode ?? [];
  const guestSecret = room.guest?.secretCode ?? [];

  const payload = {
    type: "game_over" as const,
    winner,
    hostSecret,
    guestSecret,
    hostHistory: room.host?.guessHistory ?? [],
    guestHistory: room.guest?.guessHistory ?? [],
  };

  broadcast(room, payload);

  setTimeout(() => {
    rooms.delete(room.code);
    if (room.host) playerToRoom.delete(room.host.id);
    if (room.guest) playerToRoom.delete(room.guest.id);
    logger.info({ code: room.code }, "Room cleaned up after game over");
  }, 60_000);
}

function advanceTurn(room: Room): void {
  room.currentTurn = room.currentTurn === "host" ? "guest" : "host";
  room.turnNumber++;
  room.turnTimeLeft = TURN_SECONDS;
  startTurnTimer(room);

  broadcast(room, {
    type: "turn_changed",
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    timeLeft: TURN_SECONDS,
  });
}

function startTurnTimer(room: Room): void {
  clearTurnTimer(room);
  room.turnTimeLeft = TURN_SECONDS;

  room.turnTimer = setInterval(() => {
    room.turnTimeLeft--;

    broadcast(room, {
      type: "timer_tick",
      timeLeft: room.turnTimeLeft,
    });

    if (room.turnTimeLeft <= 0) {
      clearTurnTimer(room);
      const currentPlayer =
        room.currentTurn === "host" ? room.host : room.guest;
      if (currentPlayer && room.phase === "playing") {
        const randomGuess = generateCode(
          room.settings.codeLength,
          room.settings.allowDuplicates
        );
        processGuess(room, currentPlayer.id, randomGuess);
        send(currentPlayer.ws, {
          type: "timeout_guess",
          guess: randomGuess,
        });
      }
    }
  }, 1000);
}

function clearTurnTimer(room: Room): void {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }
}

function broadcast(room: Room, payload: object): void {
  const msg = JSON.stringify(payload);
  if (room.host?.ws.readyState === 1) room.host.ws.send(msg);
  if (room.guest?.ws.readyState === 1) room.guest.ws.send(msg);
}

export function send(ws: WebSocket, payload: object): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function generateUniqueCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function cleanupStaleRooms(): void {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > ONE_HOUR) {
      clearTurnTimer(room);
      rooms.delete(code);
      if (room.host) playerToRoom.delete(room.host.id);
      if (room.guest) playerToRoom.delete(room.guest.id);
      logger.info({ code }, "Stale room cleaned up");
    }
  }
}

setInterval(cleanupStaleRooms, 15 * 60 * 1000);
