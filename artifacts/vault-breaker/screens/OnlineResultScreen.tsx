import React, { useEffect } from "react";
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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import { GuessRow } from "@/components/GuessRow";
import type { FeedbackResult } from "@/context/GameContext";

export function OnlineResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, backToMenu } = useGame();
  const { online, reset } = useMultiplayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const iWon = online.winner === online.role;
  const isDraw = online.winner === "draw";
  const won = iWon && !isDraw;

  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    glow.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      )
    );
  }, [scale, glow]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const resultColor = won ? colors.primary : isDraw ? colors.warning : colors.destructive;
  const resultTitle = won ? t("youWin") : isDraw ? "DRAW" : t("youLose");

  const handlePlayAgain = () => {
    reset();
  };

  const handleMenu = () => {
    reset();
    backToMenu();
  };

  const convertedHistory = online.myHistory
    .filter((e) => e.guess && e.guess.length > 0)
    .map((e) => ({
      guess: e.guess!,
      feedback: e.feedback as FeedbackResult,
      timestamp: Date.now(),
    }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScanlineBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 24, paddingBottom: botPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text
            style={[
              styles.terminalLine,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            {">"} online_match.result
          </Text>
        </Animated.View>

        <Animated.View style={[styles.vaultContainer, scaleStyle]}>
          <Animated.View
            style={[
              styles.vaultGlow,
              glowStyle,
              { backgroundColor: resultColor, shadowColor: resultColor },
            ]}
          />
          <View
            style={[
              styles.vault,
              {
                borderColor: resultColor,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text style={[styles.vaultIcon, { color: resultColor }]}>
              {won ? "[+]" : isDraw ? "[=]" : "[-]"}
            </Text>
            <Text
              style={[
                styles.vaultStatus,
                { color: resultColor, fontFamily: "SpaceMono_400Regular" },
              ]}
            >
              {won
                ? "ACCESS\nGRANTED"
                : isDraw
                ? "STANDOFF"
                : "ACCESS\nDENIED"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.titleSection}
        >
          <GlowText
            style={styles.resultTitle}
            color={resultColor}
            intensity="high"
          >
            {resultTitle}
          </GlowText>

          {online.errorMessage && (
            <Text
              style={[
                styles.errorMsg,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {online.errorMessage}
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(450).duration(500)}
          style={styles.secretsSection}
        >
          <View style={styles.secretRow}>
            <View style={styles.secretBlock}>
              <Text
                style={[
                  styles.secretLabel,
                  {
                    color: colors.primary,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                YOUR CODE
              </Text>
              <View style={styles.secretDigits}>
                {online.mySecret.map((d, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(500 + i * 80).duration(300)}
                    style={[
                      styles.secretCell,
                      {
                        backgroundColor: `${colors.primary}20`,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secretDigit,
                        {
                          color: colors.primary,
                          fontFamily: "SpaceMono_400Regular",
                        },
                      ]}
                    >
                      {d}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <View style={styles.secretBlock}>
              <Text
                style={[
                  styles.secretLabel,
                  {
                    color: colors.accent,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                THEIR CODE
              </Text>
              <View style={styles.secretDigits}>
                {online.opponentSecret.map((d, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(600 + i * 80).duration(300)}
                    style={[
                      styles.secretCell,
                      {
                        backgroundColor: `${colors.accent}20`,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secretDigit,
                        {
                          color: colors.accent,
                          fontFamily: "SpaceMono_400Regular",
                        },
                      ]}
                    >
                      {d}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.statsText,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            You made {online.myHistory.length} guess
            {online.myHistory.length !== 1 ? "es" : ""} ·{" "}
            Opponent made {online.opponentHistory.length}
          </Text>
        </Animated.View>

        {convertedHistory.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(650).duration(500)}
            style={styles.historySection}
          >
            <Text
              style={[
                styles.historyLabel,
                {
                  color: colors.primary,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {">"} YOUR BREACH LOG
            </Text>
            {convertedHistory.map((entry, i) => (
              <GuessRow key={i} entry={entry} index={i} compact />
            ))}
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(700).duration(400)}
          style={styles.actions}
        >
          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              },
            ]}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.btnText,
                {
                  color: colors.primaryForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              PLAY AGAIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
            onPress={handleMenu}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.btnText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
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
  scroll: { paddingHorizontal: 24, gap: 28, alignItems: "center" },
  header: { alignSelf: "flex-start" },
  terminalLine: { fontSize: 11, letterSpacing: 1 },
  vaultContainer: { alignItems: "center", justifyContent: "center" },
  vaultGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  vault: {
    width: 110,
    height: 110,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  vaultIcon: { fontSize: 30, fontWeight: "bold" },
  vaultStatus: { fontSize: 12, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  titleSection: { alignItems: "center", gap: 10 },
  resultTitle: { fontSize: 26, fontWeight: "900", letterSpacing: 4, textAlign: "center" },
  errorMsg: { fontSize: 11, letterSpacing: 1, textAlign: "center", opacity: 0.7 },
  secretsSection: { width: "100%", gap: 16, alignItems: "center" },
  secretRow: { flexDirection: "row", gap: 20, justifyContent: "center" },
  secretBlock: { alignItems: "center", gap: 8 },
  secretLabel: { fontSize: 10, letterSpacing: 2 },
  secretDigits: { flexDirection: "row", gap: 6 },
  secretCell: {
    width: 40,
    height: 48,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secretDigit: { fontSize: 20, fontWeight: "bold" },
  statsText: { fontSize: 11, letterSpacing: 1 },
  historySection: { width: "100%", gap: 6 },
  historyLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  actions: { width: "100%", gap: 12 },
  btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 6, alignItems: "center" },
  btnOutline: { borderWidth: 1, backgroundColor: "transparent" },
  btnText: { fontSize: 14, fontWeight: "bold", letterSpacing: 3 },
});
