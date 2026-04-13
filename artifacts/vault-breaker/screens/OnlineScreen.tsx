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
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
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

function LoadingDots() {
  const colors = useColors();
  const dots = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];

  useEffect(() => {
    dots.forEach((dot, i) => {
      setTimeout(() => {
        dot.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.3, { duration: 500 })
          ),
          -1,
          false
        );
      }, i * 200);
    });
  }, []);

  return (
    <View style={styles.loadingDots}>
      {dots.map((dot, i) => {
        const style = useAnimatedStyle(() => ({ opacity: dot.value }));
        return (
          <Animated.View
            key={i}
            style={[styles.dot, style, { backgroundColor: colors.primary }]}
          />
        );
      })}
    </View>
  );
}

export function OnlineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state: gameState, backToMenu, t } = useGame();
  const { online, createRoom, joinRoom, reset } = useMultiplayer();
  const [joinCode, setJoinCode] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBack = () => {
    reset();
    backToMenu();
  };

  const handleCreate = () => {
    createRoom({
      codeLength: gameState.settings.codeLength,
      allowDuplicates: gameState.settings.allowDuplicates,
      maxTries: gameState.settings.maxTries,
      difficulty: gameState.settings.difficulty,
      botMode: gameState.settings.botMode,
      language: gameState.settings.language,
    });
  };

  const handleJoin = () => {
    if (joinCode.length >= 4) joinRoom(joinCode);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Vault Breaker game! Room code: ${online.roomCode}`,
      });
    } catch {}
  };

  if (online.connectionStatus === "connecting" && online.phase === "idle") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScanlineBackground />
        <View style={[styles.centered, { paddingTop: topPad }]}>
          <GlowText style={styles.statusText} variant="accent">
            {t("connecting")}
          </GlowText>
          <LoadingDots />
        </View>
      </View>
    );
  }

  if (online.phase === "lobby_host") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScanlineBackground />
        <View
          style={[
            styles.content,
            { paddingTop: topPad + 20, paddingBottom: botPad + 32 },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
            <Text
              style={[
                styles.backText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={styles.lobbyCenter}>
            <Text
              style={[
                styles.lobbyLabel,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {">"} {t("roomCode")}
            </Text>

            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.roomCode,
                  { color: colors.primary, fontFamily: "SpaceMono_400Regular" },
                ]}
              >
                {online.roomCode}
              </Text>
              <View style={styles.shareHint}>
                <Feather name="share-2" size={14} color={colors.mutedForeground} />
                <Text
                  style={[
                    styles.shareText,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "SpaceMono_400Regular",
                    },
                  ]}
                >
                  tap to share
                </Text>
              </View>
            </TouchableOpacity>

            <Text
              style={[
                styles.waitingText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {t("waitingOpponent")}
            </Text>

            <LoadingDots />

            <View
              style={[
                styles.settingsSummary,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.settingItem,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {online.settings?.codeLength ?? gameState.settings.codeLength}{" "}
                digits ·{" "}
                {online.settings?.allowDuplicates ?? gameState.settings.allowDuplicates
                  ? "duplicates"
                  : "no duplicates"}{" "}
                · {(online.settings?.maxTries ?? gameState.settings.maxTries) === 0 ? "∞" : (online.settings?.maxTries ?? gameState.settings.maxTries)}{" "}
                tries
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (online.phase === "lobby_guest") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScanlineBackground />
        <View style={[styles.centered, { paddingTop: topPad }]}>
          <GlowText style={styles.statusText} variant="accent">
            {t("opponentConnected")}
          </GlowText>
          <Text
            style={[
              styles.subText,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            {">"} Initializing game...
          </Text>
          <LoadingDots />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScanlineBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 20, paddingBottom: botPad + 32 },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
          <Text
            style={[
              styles.backText,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        {online.errorMessage && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[
              styles.errorBanner,
              { backgroundColor: `${colors.destructive}20`, borderColor: colors.destructive },
            ]}
          >
            <Feather name="alert-triangle" size={14} color={colors.destructive} />
            <Text
              style={[
                styles.errorText,
                {
                  color: colors.destructive,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {online.errorMessage}
            </Text>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.section}
        >
          <GlowText style={styles.sectionTitle} variant="primary">
            {t("createRoom")}
          </GlowText>
          <Text
            style={[
              styles.desc,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            {">"} Host a new game with your current settings.
          </Text>
          <View
            style={[
              styles.settingsSummary,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.settingItem,
                {
                  color: colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {gameState.settings.codeLength} digits ·{" "}
              {gameState.settings.allowDuplicates
                ? "duplicates ON"
                : "no duplicates"}{" "}
              · {gameState.settings.maxTries === 0 ? "∞" : gameState.settings.maxTries} tries
            </Text>
          </View>
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
            onPress={handleCreate}
            disabled={online.connectionStatus === "connecting"}
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
              {online.connectionStatus === "connecting"
                ? t("connecting")
                : t("createRoom")}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <GlowText style={styles.sectionTitle} variant="accent">
            {t("joinRoom")}
          </GlowText>
          <Text
            style={[
              styles.desc,
              {
                color: colors.mutedForeground,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
          >
            {">"} Enter a 6-character room code from your opponent.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor:
                  joinCode.length >= 4 ? colors.accent : colors.border,
                color: colors.accent,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
            placeholder={t("enterRoomCode")}
            placeholderTextColor={colors.mutedForeground}
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor:
                  joinCode.length >= 4 ? colors.accent : colors.muted,
                opacity: joinCode.length >= 4 ? 1 : 0.4,
              },
            ]}
            onPress={handleJoin}
            disabled={joinCode.length < 4 || online.connectionStatus === "connecting"}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.btnText,
                {
                  color:
                    joinCode.length >= 4
                      ? colors.accentForeground
                      : colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {online.connectionStatus === "connecting"
                ? t("connecting")
                : t("joinRoom")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 13, letterSpacing: 1 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", letterSpacing: 3 },
  desc: { fontSize: 12, letterSpacing: 1, lineHeight: 18 },
  divider: { height: 1 },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { fontSize: 14, fontWeight: "bold", letterSpacing: 3 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
  },
  lobbyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 32,
  },
  lobbyLabel: { fontSize: 11, letterSpacing: 3 },
  codeBox: {
    paddingHorizontal: 40,
    paddingVertical: 28,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  roomCode: { fontSize: 40, fontWeight: "bold", letterSpacing: 8 },
  shareHint: { flexDirection: "row", alignItems: "center", gap: 6 },
  shareText: { fontSize: 11, letterSpacing: 1 },
  waitingText: { fontSize: 12, letterSpacing: 2 },
  statusText: { fontSize: 14, fontWeight: "bold", letterSpacing: 3 },
  subText: { fontSize: 12, letterSpacing: 1 },
  loadingDots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  settingsSummary: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  settingItem: { fontSize: 11, letterSpacing: 1 },
  errorBanner: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { fontSize: 12, letterSpacing: 1, flex: 1 },
});
