import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
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
import { useDailyPuzzle } from "@/context/DailyPuzzleContext";
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import { DigitInput } from "@/components/DigitInput";
import { GuessRow } from "@/components/GuessRow";
import { ConfirmModal } from "@/components/ConfirmModal";

export function DailyPuzzleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, language } = useGame();
  const { daily, makeGuess, surrender, backToMenu } = useDailyPuzzle();
  const { config, guessHistory, streak } = daily;
  const scrollRef = useRef<ScrollView>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const isRTL = language === "ar";

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, [pulse]);

  const pulseBorder = useAnimatedStyle(() => ({ opacity: pulse.value }));

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [guessHistory.length]);

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
    if (!config) return;
    const filled = currentGuess.filter(Boolean);
    if (filled.length !== config.codeLength) return;
    makeGuess([...currentGuess]);
    setCurrentGuess([]);
  }, [currentGuess, config, makeGuess]);

  const handleBack = useCallback(() => {
    if (guessHistory.length > 0) {
      setShowSurrenderModal(true);
    } else {
      backToMenu();
    }
  }, [guessHistory.length, backToMenu]);

  if (!config) return null;

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

      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: `${colors.background}E0`, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <GlowText style={styles.headerTitle} variant="primary">
            {t("dailyPuzzle")} #{config.puzzleNumber}
          </GlowText>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("attempt")} {guessHistory.length}/{config.maxTries}
            </Text>
            {streak > 0 && (
              <Text style={[styles.statText, { color: colors.warning, fontFamily: "SpaceMono_400Regular" }]}>
                🔥 {streak}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowSurrenderModal(true)} style={styles.surrenderBtn}>
          <Feather name="flag" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.infoBanner, { backgroundColor: `${colors.warning}10`, borderBottomColor: colors.warning }, pulseBorder]}>
        <Text style={[styles.infoText, { color: colors.warning, fontFamily: "SpaceMono_400Regular" }]}>
          {config.codeLength} {t("digits")} · {config.allowDuplicates ? t("allowDuplicates") : t("noDuplicates")} · {config.maxTries} {t("maxTries").toLowerCase()}
        </Text>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={styles.historyScroll}
        contentContainerStyle={styles.historyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {guessHistory.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {t("noHistory")}
          </Text>
        )}
        {guessHistory.map((entry, i) => (
          <GuessRow key={i} entry={entry} index={i} />
        ))}
      </ScrollView>

      <View style={[styles.inputArea, { paddingBottom: botPad, backgroundColor: `${colors.background}F0`, borderTopColor: colors.border }]}>
        <DigitInput
          length={config.codeLength}
          value={currentGuess}
          allowDuplicates={config.allowDuplicates}
          onChange={setDigit}
          onRemove={removeDigit}
          onSubmit={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  surrenderBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 13, fontWeight: "bold", letterSpacing: 2 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 2 },
  statText: { fontSize: 10, letterSpacing: 1 },
  infoBanner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  infoText: { fontSize: 10, letterSpacing: 1 },
  historyScroll: { flex: 1 },
  historyContent: { padding: 12, gap: 6, paddingBottom: 24 },
  emptyText: { textAlign: "center", marginTop: 32, fontSize: 12, letterSpacing: 1 },
  inputArea: {
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
  },
});
