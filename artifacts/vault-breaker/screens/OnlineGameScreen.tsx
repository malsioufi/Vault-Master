import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import { DigitInput } from "@/components/DigitInput";
import { GuessRow } from "@/components/GuessRow";
import { TurnTimer } from "@/components/TurnTimer";
import { FeedbackCounts, FeedbackIcons } from "@/components/FeedbackIcons";
import type { GuessEntry, FeedbackResult } from "@/context/GameContext";

interface OpponentEntryRowProps {
  feedback: FeedbackResult;
  index: number;
}

function OpponentEntryRow({ feedback, index }: OpponentEntryRowProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.opponentRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.rowIndex,
          { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
        ]}
      >
        {String(index + 1).padStart(2, "0")}
      </Text>
      <Text
        style={[
          styles.hiddenGuess,
          {
            color: colors.mutedForeground,
            fontFamily: "SpaceMono_400Regular",
            borderColor: colors.border,
          },
        ]}
      >
        {"? ? ? ?".slice(0, feedback.matches + feedback.shifts + feedback.glitches > 0 ? 7 : 3)}
      </Text>
      <FeedbackCounts feedback={feedback} />
    </View>
  );
}

export function OnlineGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, state: gameState } = useGame();
  const { online, submitGuess, surrender, reset } = useMultiplayer();
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 80 : insets.bottom + 80;

  const isMyTurn =
    online.currentTurn !== null && online.currentTurn === online.role;
  const settings = online.settings!;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [online.myHistory.length]);

  const setDigit = useCallback((index: number, digit: string) => {
    setCurrentGuess((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = digit;
      return next;
    });
  }, []);

  const removeDigit = useCallback((index: number) => {
    setCurrentGuess((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const filled = currentGuess.filter(Boolean);
    if (filled.length !== settings.codeLength) return;
    submitGuess([...currentGuess]);
    setCurrentGuess([]);
  }, [currentGuess, settings.codeLength, submitGuess]);

  const handleSurrender = useCallback(() => {
    Alert.alert(t("surrender"), t("confirmSurrender"), [
      { text: t("no"), style: "cancel" },
      { text: t("yes"), style: "destructive", onPress: surrender },
    ]);
  }, [surrender, t]);

  const convertToGuessEntry = (entry: {
    guess?: string[];
    feedback: FeedbackResult;
    turnNumber: number;
    isMine: boolean;
  }): GuessEntry => ({
    guess: entry.guess ?? [],
    feedback: entry.feedback,
    timestamp: Date.now(),
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScanlineBackground />

      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: `${colors.background}E0`,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Alert.alert(t("surrender"), t("confirmSurrender"), [
              { text: t("no"), style: "cancel" },
              {
                text: t("yes"),
                style: "destructive",
                onPress: () => {
                  surrender();
                },
              },
            ]);
          }}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <GlowText style={styles.headerTitle} variant="primary">
            ONLINE BREACH
          </GlowText>
          <View style={styles.statsRow}>
            <Text
              style={[
                styles.statText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {online.myHistory.length}/{settings.maxTries}
            </Text>
            <Text
              style={[
                styles.statText,
                {
                  color: online.role === "host" ? colors.primary : colors.accent,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {online.role?.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSurrender} style={styles.surrenderBtn}>
          <Feather name="flag" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.turnBanner,
          {
            backgroundColor: isMyTurn
              ? `${colors.primary}15`
              : `${colors.accent}10`,
            borderBottomColor: isMyTurn ? colors.primary : colors.accent,
          },
        ]}
      >
        <Text
          style={[
            styles.turnText,
            {
              color: isMyTurn ? colors.primary : colors.accent,
              fontFamily: "SpaceMono_400Regular",
            },
          ]}
        >
          {isMyTurn ? `> ${t("yourTurn")}` : `> ${t("opponentTurn")}`}
        </Text>
        <TurnTimer seconds={online.timeLeft} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.historyScroll}
        contentContainerStyle={styles.historyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.historyColumns}>
          <View style={styles.historyColumn}>
            <Text
              style={[
                styles.columnLabel,
                { color: colors.primary, fontFamily: "SpaceMono_400Regular" },
              ]}
            >
              {">"} YOUR GUESSES
            </Text>
            {online.myHistory.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {t("noHistory")}
              </Text>
            ) : (
              online.myHistory.map((entry, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.duration(300)}
                >
                  <GuessRow
                    entry={convertToGuessEntry(entry)}
                    index={i}
                    compact
                  />
                </Animated.View>
              ))
            )}
          </View>

          <View
            style={[styles.columnDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.historyColumn}>
            <Text
              style={[
                styles.columnLabel,
                { color: colors.accent, fontFamily: "SpaceMono_400Regular" },
              ]}
            >
              {">"} THEIR GUESSES
            </Text>
            {online.opponentHistory.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {t("noHistory")}
              </Text>
            ) : (
              online.opponentHistory.map((entry, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.duration(300)}
                >
                  <View
                    style={[
                      styles.opponentEntryRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rowIndex,
                        {
                          color: colors.mutedForeground,
                          fontFamily: "SpaceMono_400Regular",
                        },
                      ]}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Text
                      style={[
                        styles.redacted,
                        {
                          color: colors.mutedForeground,
                          fontFamily: "SpaceMono_400Regular",
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {"?".repeat(settings.codeLength).split("").join(" ")}
                    </Text>
                    <FeedbackCounts feedback={entry.feedback} />
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[
          styles.inputPanel,
          {
            backgroundColor: `${colors.card}F0`,
            borderTopColor: colors.border,
            paddingBottom: botPad,
          },
        ]}
      >
        <Text
          style={[
            styles.inputLabel,
            {
              color: isMyTurn ? colors.mutedForeground : colors.mutedForeground,
              fontFamily: "SpaceMono_400Regular",
            },
          ]}
        >
          {isMyTurn
            ? `> ${t("enterGuess")}`
            : `> ${t("opponentTurn").toLowerCase()}...`}
        </Text>

        <DigitInput
          length={settings.codeLength}
          value={currentGuess}
          onChange={setDigit}
          onRemove={removeDigit}
          allowDuplicates={settings.allowDuplicates}
          onSubmit={handleSubmit}
          disabled={!isMyTurn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 14, fontWeight: "bold", letterSpacing: 3 },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  statText: { fontSize: 10, letterSpacing: 1 },
  surrenderBtn: { padding: 8 },
  turnBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  turnText: { fontSize: 11, letterSpacing: 2 },
  historyScroll: { flex: 1 },
  historyContent: { padding: 12, paddingBottom: 24 },
  historyColumns: { flexDirection: "row", gap: 0 },
  historyColumn: { flex: 1, gap: 6 },
  columnDivider: { width: 1, marginHorizontal: 8 },
  columnLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  emptyText: { fontSize: 11, letterSpacing: 1, marginTop: 8 },
  opponentEntryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    flexWrap: "wrap",
  },
  opponentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    flexWrap: "wrap",
  },
  rowIndex: { fontSize: 10, width: 18 },
  hiddenGuess: { fontSize: 12, flex: 1 },
  redacted: { fontSize: 13, letterSpacing: 2 },
  inputPanel: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  inputLabel: { fontSize: 10, letterSpacing: 2, alignSelf: "flex-start" },
});
