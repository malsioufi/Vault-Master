import React from "react";
import { GameProvider, useGame } from "@/context/GameContext";
import { MenuScreen } from "@/screens/MenuScreen";
import { GameScreen } from "@/screens/GameScreen";
import { ResultScreen } from "@/screens/ResultScreen";
import { OnlineScreen } from "@/screens/OnlineScreen";

function AppRouter() {
  const { state } = useGame();

  if (state.phase === "menu" || state.phase === "settings") {
    return <MenuScreen />;
  }

  if (state.phase === "playing") {
    return <GameScreen />;
  }

  if (state.phase === "won" || state.phase === "lost") {
    return <ResultScreen />;
  }

  if (state.phase === "lobby" || state.phase === "waiting") {
    return <OnlineScreen />;
  }

  return <MenuScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
