import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
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
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import { DigitInput } from "@/components/DigitInput";
import { GuessRow } from "@/components/GuessRow";
import { TurnTimer } from "@/components/TurnTimer";
import { FeedbackCounts } from "@/components/FeedbackIcons";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { GuessEntry } from "@/context/GameContext";

function BotGuessPanel({ entries }: { entries: GuessEntry[] }) {
  const colors = useColors();
  const { t } = useGame();

  if (entries.length === 0) return null;

  const last = entries[entries.length - 1];

  return (
    <View
      style={[
        styles.botPanel,
        { backgroundColor: `${colors.accent}10`, borderColor: colors.accent },
      ]}
    >
      <Text
        style={[
          styles.botLabel,
          { color: colors.accent, fontFamily: "SpaceMono_400Regular" },
        ]}
      >
        {t("botGuessesYou")} [{entries.length}]
      </Text>
      <View style={styles.botLastGuess}>
        {last.guess.map((d, i) => (
          <Text
            key={i}
            style={[
              styles.botDigit,
              { color: colors.accent, borderColor: colors.accent, fontFamily: "SpaceMono_400Regular" },
            ]}
          >
            {d}
          </Text>
        ))}
        <FeedbackCounts feedback={last.feedback} />
      </View>
    </View>
  );
}

export function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, makeGuess, surrender, backToMenu, setDigit, removeDigit, t } = useGame();
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 80 : insets.bottom + 80;

  const { settings, currentGuess, guessHistory, botGuessHistory, isPlayerTurn, botMode } = state;
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isPlayerTurn) {
      pulse.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 400 }), withTiming(1, { duration: 400 })),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [isPlayerTurn, pulse]);

  const botPulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  useEffect(() => {
    if (!isPlayerTurn) {
      setTimer(30);
      return;
    }
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          const guess = [...currentGuess];
          while (guess.length < settings.codeLength) guess.push(String(Math.floor(Math.random() * 10)));
          makeGuess(guess);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayerTurn, currentGuess, settings.codeLength, makeGuess]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [guessHistory.length]);

  const handleSubmit = useCallback(() => {
    const filled = currentGuess.filter(Boolean);
    if (filled.length !== settings.codeLength) return;
    makeGuess([...currentGuess]);
  }, [currentGuess, settings.codeLength, makeGuess]);

  const handleSurrender = useCallback(() => {
    setShowSurrenderModal(true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ConfirmModal
        visible={showSurrenderModal}
        title={t("surrender")}
        message={t("confirmSurrender")}
        confirmText={t("yes")}
        cancelText={t("no")}
        dangerous
        onConfirm={() => { setShowSurrenderModal(false); surrender(); }}
        onCancel={() => setShowSurrenderModal(false)}
      />
      <ScanlineBackground />

      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: `${colors.background}E0` }]}>
        <TouchableOpacity onPress={handleSurrender} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <GlowText style={styles.headerTitle} variant="primary">
            VAULT BREAKER
          </GlowText>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("attempt")} {guessHistory.length}{settings.maxTries > 0 ? `/${settings.maxTries}` : ""}
            </Text>
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {settings.codeLength} {t("digits")}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSurrender} style={styles.surrenderBtn}>
          <Feather name="flag" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {settings.botMode === "active" && (
        <Animated.View style={[styles.turnBanner, botPulseStyle, {
          backgroundColor: isPlayerTurn ? `${colors.primary}15` : `${colors.accent}15`,
          borderBottomColor: isPlayerTurn ? colors.primary : colors.accent,
        }]}>
          <Text style={[styles.turnText, {
            color: isPlayerTurn ? colors.primary : colors.accent,
            fontFamily: "SpaceMono_400Regular",
          }]}>
            {isPlayerTurn ? `> ${t("yourTurn")}` : `> ${t("botGuessing")}`}
          </Text>
          {isPlayerTurn && (
            <TurnTimer seconds={timer} />
          )}
        </Animated.View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.historyScroll}
        contentContainerStyle={[styles.historyContent, { paddingTop: 12, paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {guessHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {"> "}{t("noHistory")}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.historyLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("history")}
            </Text>
            {guessHistory.map((entry, i) => (
              <Animated.View key={i} entering={FadeInDown.duration(300)}>
                <GuessRow entry={entry} index={i} />
              </Animated.View>
            ))}
          </>
        )}

        {settings.botMode === "active" && botGuessHistory.length > 0 && (
          <BotGuessPanel entries={botGuessHistory} />
        )}
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
        <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {"> "}{t("enterGuess")}
        </Text>

        <DigitInput
          length={settings.codeLength}
          value={currentGuess}
          onChange={setDigit}
          onRemove={removeDigit}
          allowDuplicates={settings.allowDuplicates}
          onSubmit={handleSubmit}
          disabled={!isPlayerTurn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2e3a",
    gap: 12,
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  statText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  surrenderBtn: {
    padding: 8,
  },
  turnBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  turnText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  historyScroll: {
    flex: 1,
  },
  historyContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  historyLabel: {
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 4,
  },
  emptyHistory: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    letterSpacing: 2,
  },
  inputPanel: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 10,
    letterSpacing: 2,
    alignSelf: "flex-start",
  },
  botPanel: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  botLabel: {
    fontSize: 10,
    letterSpacing: 2,
  },
  botLastGuess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  botDigit: {
    fontSize: 15,
    fontWeight: "bold",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
