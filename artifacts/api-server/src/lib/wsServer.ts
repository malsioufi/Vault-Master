import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { logger } from "./logger.js";
import {
  createRoom,
  joinRoom,
  startGame,
  processGuess,
  processSurrender,
  getRoomByPlayerId,
  getPlayerById,
  getOpponent,
  removePlayer,
  send,
  type Room,
} from "./roomManager.js";
import type { GameSettings } from "./gameLogic.js";

interface ClientMessage {
  type: string;
  [key: string]: unknown;
}

export function createWsServer(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let playerId: string | null = null;

    logger.info("WebSocket client connected");

    ws.on("message", (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        send(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      handleMessage(ws, msg, (id) => {
        playerId = id;
      });
    });

    ws.on("close", () => {
      logger.info({ playerId }, "WebSocket client disconnected");
      if (playerId) {
        removePlayer(playerId);
      }
    });

    ws.on("error", (err) => {
      logger.error({ err, playerId }, "WebSocket error");
    });

    send(ws, { type: "connected" });
  });

  return wss;
}

function handleMessage(
  ws: WebSocket,
  msg: ClientMessage,
  setPlayerId: (id: string) => void
): void {
  switch (msg.type) {
    case "create_room": {
      const settings = msg.settings as GameSettings;
      if (!isValidSettings(settings)) {
        send(ws, { type: "error", message: "Invalid settings" });
        return;
      }

      const { room, player } = createRoom(ws, settings);
      setPlayerId(player.id);

      send(ws, {
        type: "room_created",
        roomCode: room.code,
        playerId: player.id,
        role: player.role,
        settings: room.settings,
      });

      logger.info({ code: room.code, playerId: player.id }, "Room created");
      break;
    }

    case "join_room": {
      const code = (msg.roomCode as string)?.toUpperCase();
      if (!code) {
        send(ws, { type: "error", message: "Missing room code" });
        return;
      }

      const result = joinRoom(ws, code);

      if ("error" in result) {
        send(ws, { type: "error", message: result.error });
        return;
      }

      const { room, player } = result;
      setPlayerId(player.id);

      send(ws, {
        type: "room_joined",
        roomCode: room.code,
        playerId: player.id,
        role: player.role,
        settings: room.settings,
      });

      if (room.host) {
        send(room.host.ws, {
          type: "opponent_joined",
          opponentId: player.id,
        });
      }

      logger.info(
        { code: room.code, playerId: player.id },
        "Player joined room"
      );

      startGame(room);
      broadcastGameStarted(room);
      break;
    }

    case "submit_guess": {
      const guess = msg.guess as string[];
      const pid = msg.playerId as string;

      if (!pid || !Array.isArray(guess)) {
        send(ws, { type: "error", message: "Invalid guess" });
        return;
      }

      const room = getRoomByPlayerId(pid);
      if (!room) {
        send(ws, { type: "error", message: "Room not found" });
        return;
      }

      const player = getPlayerById(room, pid);
      if (!player) {
        send(ws, { type: "error", message: "Player not found" });
        return;
      }

      const result = processGuess(room, pid, guess);

      if ("error" in result) {
        send(ws, { type: "error", message: result.error });
        return;
      }

      const { feedback, won } = result;
      const opponent = getOpponent(room, player.role);

      send(ws, {
        type: "guess_result",
        guess,
        feedback,
        won,
        turnNumber: room.turnNumber,
      });

      if (opponent) {
        send(opponent.ws, {
          type: "opponent_guessed",
          feedback: {
            matches: feedback.matches,
            shifts: feedback.shifts,
            glitches: feedback.glitches,
            icons: feedback.icons,
          },
          turnNumber: room.turnNumber,
        });
      }

      logger.info(
        { code: room.code, pid, matches: feedback.matches },
        "Guess processed"
      );
      break;
    }

    case "surrender": {
      const pid = msg.playerId as string;
      if (!pid) return;

      const room = getRoomByPlayerId(pid);
      if (!room) return;

      processSurrender(room, pid);
      logger.info({ pid }, "Player surrendered");
      break;
    }

    case "ping": {
      send(ws, { type: "pong" });
      break;
    }

    default: {
      send(ws, { type: "error", message: `Unknown message type: ${msg.type}` });
    }
  }
}

function broadcastGameStarted(room: Room): void {
  if (!room.host || !room.guest) return;

  send(room.host.ws, {
    type: "game_started",
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    timeLeft: 30,
    settings: room.settings,
    opponentId: room.guest.id,
  });

  send(room.guest.ws, {
    type: "game_started",
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    timeLeft: 30,
    settings: room.settings,
    opponentId: room.host.id,
  });
}

function isValidSettings(s: unknown): s is GameSettings {
  if (!s || typeof s !== "object") return false;
  const settings = s as Record<string, unknown>;
  const maxTries = settings["maxTries"] as number;
  return (
    [3, 4, 5, 6].includes(settings["codeLength"] as number) &&
    typeof settings["allowDuplicates"] === "boolean" &&
    typeof maxTries === "number" &&
    (maxTries === 0 || (maxTries >= 4 && maxTries <= 20))
  );
}
