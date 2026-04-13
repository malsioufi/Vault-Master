import React, { useEffect, useRef, useState } from "react";
import Animated, {
  FadeInDown,
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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";
import type { Difficulty, BotMode, Language } from "@/context/GameContext";

function TerminalHeader() {
  const colors = useColors();
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(withTiming(0, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, [blink]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));

  return (
    <View style={styles.headerContainer}>
      <View style={styles.terminalBar}>
        <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.terminalTitle, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          vault_breaker.exe
        </Text>
      </View>

      <GlowText
        style={styles.gameTitle}
        intensity="high"
        variant="primary"
      >
        VAULT BREAKER
      </GlowText>

      <View style={styles.taglineRow}>
        <Text style={[styles.tagline, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
          {">"} Crack the Code. Break the Vault.
        </Text>
        <Animated.View style={[styles.cursor, { backgroundColor: colors.accent }, cursorStyle]} />
      </View>
    </View>
  );
}

function SettingsSection() {
  const colors = useColors();
  const { state, updateSettings, t } = useGame();
  const { settings } = state;

  const codeLengths: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const botModes: { value: BotMode; key: string }[] = [
    { value: "passive", key: "passiveBot" },
    { value: "active", key: "activeBot" },
  ];

  const maxTriesOptions = [6, 8, 10, 12];

  return (
    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
        {t("settings")}
      </Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {t("codeLength")}
        </Text>
        <View style={styles.optionRow}>
          {codeLengths.map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: settings.codeLength === n ? colors.primary : colors.muted,
                  borderColor: settings.codeLength === n ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateSettings({ codeLength: n })}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: settings.codeLength === n ? colors.primaryForeground : colors.foreground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {t("allowDuplicates")}
        </Text>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: settings.allowDuplicates ? colors.primary : colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {settings.allowDuplicates ? t("on") : t("off")}
          </Text>
          <Switch
            value={settings.allowDuplicates}
            onValueChange={(v) => updateSettings({ allowDuplicates: v })}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={settings.allowDuplicates ? colors.primary : colors.mutedForeground}
          />
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {t("aiDifficulty")}
        </Text>
        <View style={styles.optionRow}>
          {difficulties.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: settings.difficulty === d ? colors.accent : colors.muted,
                  borderColor: settings.difficulty === d ? colors.accent : colors.border,
                },
              ]}
              onPress={() => updateSettings({ difficulty: d })}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: settings.difficulty === d ? colors.accentForeground : colors.foreground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {t(d)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {t("botMode")}
        </Text>
        <View style={styles.optionRow}>
          {botModes.map(({ value, key }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.optionBtn,
                styles.optionBtnWide,
                {
                  backgroundColor: settings.botMode === value ? colors.accent : colors.muted,
                  borderColor: settings.botMode === value ? colors.accent : colors.border,
                },
              ]}
              onPress={() => updateSettings({ botMode: value })}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: settings.botMode === value ? colors.accentForeground : colors.foreground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {t(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
          {t("maxTries")}
        </Text>
        <View style={styles.optionRow}>
          {maxTriesOptions.map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: settings.maxTries === n ? colors.primary : colors.muted,
                  borderColor: settings.maxTries === n ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateSettings({ maxTries: n })}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: settings.maxTries === n ? colors.primaryForeground : colors.foreground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startSoloGame, goOnline, language, setLanguage, t } = useGame();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScanlineBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <TerminalHeader />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.modesContainer}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
            ]}
            onPress={startSoloGame}
            activeOpacity={0.8}
          >
            <GlowText style={styles.modeBtnText} variant="primary">
              {t("soloMode")}
            </GlowText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              {
                backgroundColor: `${colors.accent}20`,
                borderColor: colors.accent,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
            ]}
            onPress={goOnline}
            activeOpacity={0.8}
          >
            <GlowText style={styles.modeBtnText} variant="accent">
              {t("onlineMode")}
            </GlowText>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(600)}>
          <SettingsSection />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.langRow}>
          <TouchableOpacity
            style={[
              styles.langBtn,
              {
                borderColor: language === "en" ? colors.accent : colors.border,
                backgroundColor: language === "en" ? `${colors.accent}20` : "transparent",
              },
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text style={[styles.langText, { color: language === "en" ? colors.accent : colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langBtn,
              {
                borderColor: language === "ar" ? colors.accent : colors.border,
                backgroundColor: language === "ar" ? `${colors.accent}20` : "transparent",
              },
            ]}
            onPress={() => setLanguage("ar")}
          >
            <Text style={[styles.langText, { color: language === "ar" ? colors.accent : colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              AR
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {"[ SYSTEM READY ]"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  headerContainer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  terminalBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginLeft: 8,
  },
  gameTitle: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 1,
  },
  cursor: {
    width: 8,
    height: 14,
  },
  modesContainer: {
    gap: 12,
  },
  modeBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modeBtnDisabled: {
    borderWidth: 1,
    opacity: 0.6,
  },
  modeBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  modeBtnTextDisabled: {
    fontSize: 13,
    letterSpacing: 1,
  },
  settingsCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  settingLabel: {
    fontSize: 10,
    letterSpacing: 2,
    flex: 1,
    minWidth: 80,
  },
  optionRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  optionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 44,
    alignItems: "center",
  },
  optionBtnWide: {
    paddingHorizontal: 10,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  langText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 3,
  },
});
