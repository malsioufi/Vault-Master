import React from "react";
import { GameProvider, useGame } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { useDailyPuzzle } from "@/context/DailyPuzzleContext";
import { MenuScreen } from "@/screens/MenuScreen";
import { GameScreen } from "@/screens/GameScreen";
import { ResultScreen } from "@/screens/ResultScreen";
import { OnlineScreen } from "@/screens/OnlineScreen";
import { OnlineGameScreen } from "@/screens/OnlineGameScreen";
import { OnlineResultScreen } from "@/screens/OnlineResultScreen";
import { DailyPuzzleScreen } from "@/screens/DailyPuzzleScreen";
import { DailyResultScreen } from "@/screens/DailyResultScreen";

function AppRouter() {
  const { state } = useGame();
  const { online } = useMultiplayer();
  const { daily } = useDailyPuzzle();

  if (online.phase === "playing") return <OnlineGameScreen />;
  if (online.phase === "finished") return <OnlineResultScreen />;
  if (
    online.phase === "lobby_host" ||
    online.phase === "lobby_guest" ||
    (online.connectionStatus === "connecting" && online.phase === "idle")
  ) return <OnlineScreen />;

  if (daily.phase === "playing") return <DailyPuzzleScreen />;
  if (daily.phase === "won" || daily.phase === "lost") return <DailyResultScreen />;

  if (state.phase === "menu" || state.phase === "settings") return <MenuScreen />;
  if (state.phase === "online") return <OnlineScreen />;
  if (state.phase === "playing") return <GameScreen />;
  if (state.phase === "won" || state.phase === "lost") return <ResultScreen />;

  return <MenuScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
