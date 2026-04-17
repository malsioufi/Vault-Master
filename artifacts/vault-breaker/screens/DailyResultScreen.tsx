import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Clipboard,
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
import { GuessRow } from "@/components/GuessRow";
import { buildShareText, getTimeUntilNextPuzzle } from "@/utils/dailyPuzzle";

function VaultIcon({ won }: { won: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const color = won ? colors.warning : colors.destructive;

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    glow.value = withDelay(
      300,
      withRepeat(
        withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
        -1,
        false
      )
    );
  }, [scale, glow]);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[styles.iconContainer, scaleStyle]}>
      <Animated.View style={[styles.iconGlow, { backgroundColor: color }, glowStyle]} />
      <Text style={[styles.iconText, { color }]}>{won ? "🏆" : "💀"}</Text>
    </Animated.View>
  );
}

function CountdownTimer() {
  const colors = useColors();
  const { t } = useGame();
  const [time, setTime] = useState(getTimeUntilNextPuzzle());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilNextPuzzle()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View style={[styles.countdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.countdownLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
        {t("nextPuzzleIn")}
      </Text>
      <Text style={[styles.countdownTime, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </Text>
    </View>
  );
}

export function DailyResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, language } = useGame();
  const { daily, backToMenu } = useDailyPuzzle();
  const { config, guessHistory, streak, longestStreak, todayRecord } = daily;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [copied, setCopied] = useState(false);

  const won = todayRecord?.won ?? false;
  const attempts = todayRecord?.attempts ?? guessHistory.length;
  const displayHistory = todayRecord?.guessHistory ?? guessHistory;

  const getAppUrl = useCallback((): string => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return window.location.origin;
    }
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    return domain ? `https://${domain}` : "https://vault-breaker.replit.app";
  }, []);

  const handleShare = useCallback(() => {
    if (!config) return;
    const text = buildShareText(
      config.puzzleNumber,
      won,
      attempts,
      config.maxTries,
      displayHistory,
      language,
      getAppUrl()
    );
    if (Platform.OS === "web" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      Clipboard.setString(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [config, won, attempts, displayHistory, language, getAppUrl]);

  if (!config) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScanlineBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 24, paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.topRow}>
          <Text style={[styles.puzzleNum, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {">"} {t("dailyPuzzle")} #{config.puzzleNumber}
          </Text>
        </Animated.View>

        <VaultIcon won={won} />

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.titleSection}>
          <GlowText
            style={styles.resultTitle}
            variant={won ? "primary" : "destructive"}
            intensity="high"
          >
            {won ? t("youWin") : t("youLose")}
          </GlowText>

          <View style={[styles.codeReveal, { borderColor: won ? colors.warning : colors.destructive }]}>
            <Text style={[styles.codeLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("secretWas")}
            </Text>
            <View style={styles.secretDigits}>
              {config.secretCode.map((d, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(400 + i * 100).duration(400)}
                  style={[
                    styles.secretCell,
                    {
                      backgroundColor: `${won ? colors.warning : colors.destructive}20`,
                      borderColor: won ? colors.warning : colors.destructive,
                    },
                  ]}
                >
                  <Text style={[styles.secretDigit, { color: won ? colors.warning : colors.destructive, fontFamily: "SpaceMono_400Regular" }]}>
                    {d}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.warning, fontFamily: "SpaceMono_400Regular" }]}>
              {won ? `${attempts}/${config.maxTries}` : "✗"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("attempt")}s
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.warning, fontFamily: "SpaceMono_400Regular" }]}>
              🔥 {streak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("streak")}
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
              {longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("bestStreak")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <CountdownTimer />
        </Animated.View>

        {displayHistory.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.historySection}>
            <Text style={[styles.historyLabel, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
              {t("history")}
            </Text>
            {displayHistory.map((entry, i) => (
              <GuessRow key={i} entry={entry} index={i} compact revealed />
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.warning, shadowColor: colors.warning, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12 }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Feather name={copied ? "check" : "share-2"} size={14} color={colors.primaryForeground} />
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {copied ? t("copied") : t("shareResult")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
            onPress={backToMenu}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("backToMenu")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  topRow: { alignItems: "center" },
  puzzleNum: { fontSize: 11, letterSpacing: 2 },
  iconContainer: { alignItems: "center", justifyContent: "center", marginVertical: 8 },
  iconGlow: { position: "absolute", width: 80, height: 80, borderRadius: 40, opacity: 0.3 },
  iconText: { fontSize: 52 },
  titleSection: { alignItems: "center", gap: 16 },
  resultTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 4, textAlign: "center" },
  codeReveal: { alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, padding: 16, width: "100%" },
  codeLabel: { fontSize: 11, letterSpacing: 2 },
  secretDigits: { flexDirection: "row", gap: 8 },
  secretCell: { width: 36, height: 44, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secretDigit: { fontSize: 18, fontWeight: "bold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, alignItems: "center", gap: 4, padding: 12, borderRadius: 8, borderWidth: 1 },
  statVal: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 9, letterSpacing: 1, textAlign: "center" },
  countdown: { alignItems: "center", gap: 4, padding: 14, borderRadius: 8, borderWidth: 1 },
  countdownLabel: { fontSize: 9, letterSpacing: 2 },
  countdownTime: { fontSize: 22, fontWeight: "bold", letterSpacing: 4 },
  historySection: { gap: 8 },
  historyLabel: { fontSize: 10, fontWeight: "bold", letterSpacing: 3 },
  actions: { gap: 10 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 6 },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 12, fontWeight: "bold", letterSpacing: 2 },
});
