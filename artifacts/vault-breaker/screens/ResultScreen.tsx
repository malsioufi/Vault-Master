import React, { useEffect, useRef } from "react";
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
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import { GuessRow } from "@/components/GuessRow";

function VaultAnimation({ won }: { won: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

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

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const color = won ? colors.primary : colors.destructive;

  return (
    <Animated.View style={[styles.vaultContainer, scaleStyle]}>
      <Animated.View
        style={[
          styles.vaultGlow,
          glowStyle,
          { backgroundColor: color, shadowColor: color },
        ]}
      />
      <View style={[styles.vault, { borderColor: color, backgroundColor: colors.card }]}>
        <Text style={[styles.vaultIcon, { color }]}>{won ? "[+]" : "[-]"}</Text>
        <Text
          style={[
            styles.vaultStatus,
            { color, fontFamily: "SpaceMono_400Regular" },
          ]}
        >
          {won ? "ACCESS\nGRANTED" : "ACCESS\nDENIED"}
        </Text>
      </View>
    </Animated.View>
  );
}

export function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, startSoloGame, backToMenu, t } = useGame();
  const { playerWon, secretCode, guessHistory, settings } = state;
  const won = playerWon === true;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

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
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
          <Text
            style={[
              styles.terminalLine,
              { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
            ]}
          >
            {">"} breach_result.log
          </Text>
        </Animated.View>

        <VaultAnimation won={won} />

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.titleSection}>
          <GlowText
            style={styles.resultTitle}
            variant={won ? "primary" : "destructive"}
            intensity="high"
          >
            {won ? t("youWin") : t("youLose")}
          </GlowText>

          <View style={styles.codeReveal}>
            <Text
              style={[
                styles.codeLabel,
                { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
              ]}
            >
              {t("secretWas")}
            </Text>
            <View style={styles.secretDigits}>
              {secretCode.map((d, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(400 + i * 100).duration(400)}
                  style={[
                    styles.secretCell,
                    {
                      backgroundColor: `${won ? colors.primary : colors.destructive}20`,
                      borderColor: won ? colors.primary : colors.destructive,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secretDigit,
                      {
                        color: won ? colors.primary : colors.destructive,
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

          <Text
            style={[
              styles.statsText,
              { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
            ]}
          >
            {guessHistory.length}{settings.maxTries > 0 ? ` / ${settings.maxTries}` : ""} {t("attempt").toLowerCase()}s
          </Text>
        </Animated.View>

        {guessHistory.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.historySection}>
            <Text
              style={[
                styles.historyLabel,
                { color: colors.accent, fontFamily: "SpaceMono_400Regular" },
              ]}
            >
              {t("history")}
            </Text>
            {guessHistory.map((entry, i) => (
              <GuessRow key={i} entry={entry} index={i} compact revealed />
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.actions}>
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
            onPress={startSoloGame}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("tryAgain")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnOutline,
              { borderColor: colors.border },
            ]}
            onPress={backToMenu}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.btnText,
                { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
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
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    gap: 28,
    alignItems: "center",
  },
  headerSection: {
    alignSelf: "flex-start",
  },
  terminalLine: {
    fontSize: 11,
    letterSpacing: 1,
  },
  vaultContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  vaultIcon: {
    fontSize: 30,
    fontWeight: "bold",
  },
  vaultStatus: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  titleSection: {
    alignItems: "center",
    gap: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
  },
  codeReveal: {
    alignItems: "center",
    gap: 10,
  },
  codeLabel: {
    fontSize: 12,
    letterSpacing: 2,
  },
  secretDigits: {
    flexDirection: "row",
    gap: 8,
  },
  secretCell: {
    width: 48,
    height: 56,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secretDigit: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  historySection: {
    width: "100%",
    gap: 6,
  },
  historyLabel: {
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 4,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  btnOutline: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 3,
  },
});
