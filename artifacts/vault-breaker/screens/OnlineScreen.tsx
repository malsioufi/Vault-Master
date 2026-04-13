import React, { useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Platform,
  ScrollView,
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
import { ScanlineBackground } from "@/components/ScanlineBackground";
import { GlowText } from "@/components/GlowText";

export function OnlineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, createRoom, joinRoom, backToMenu, t } = useGame();
  const [joinCode, setJoinCode] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (state.phase === "lobby") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScanlineBackground />
        <View style={[styles.content, { paddingTop: topPad + 32, paddingBottom: botPad + 32 }]}>
          <TouchableOpacity onPress={backToMenu} style={styles.backBtn}>
            <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
            <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.lobbyCenter}>
            <GlowText style={styles.lobbyTitle} variant="accent">
              {t("roomCode")}
            </GlowText>

            <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Text style={[styles.roomCode, { color: colors.primary, fontFamily: "SpaceMono_400Regular" }]}>
                {state.roomCode}
              </Text>
            </View>

            <Text style={[styles.waitingText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("waitingOpponent")}
            </Text>

            <View style={styles.loadingDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
              ))}
            </View>
          </View>
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
          { paddingTop: topPad + 32, paddingBottom: botPad + 32 },
        ]}
      >
        <TouchableOpacity onPress={backToMenu} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            Back
          </Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <GlowText style={styles.sectionTitle} variant="primary">
            {t("createRoom")}
          </GlowText>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {">"} Generate a room code and share it with your opponent.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={createRoom}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
              {t("createRoom")}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <GlowText style={styles.sectionTitle} variant="accent">
            {t("joinRoom")}
          </GlowText>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
            {">"} Enter a room code from your opponent.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.accent,
                fontFamily: "SpaceMono_400Regular",
              },
            ]}
            placeholder={t("enterRoomCode")}
            placeholderTextColor={colors.mutedForeground}
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: joinCode.length >= 4 ? colors.accent : colors.muted,
                opacity: joinCode.length >= 4 ? 1 : 0.5,
              },
            ]}
            onPress={() => joinRoom(joinCode)}
            disabled={joinCode.length < 4}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.btnText,
                {
                  color: joinCode.length >= 4 ? colors.accentForeground : colors.mutedForeground,
                  fontFamily: "SpaceMono_400Regular",
                },
              ]}
            >
              {t("joinRoom")}
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
  content: {
    padding: 24,
    gap: 24,
    flex: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 13,
    letterSpacing: 1,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  desc: {
    fontSize: 12,
    letterSpacing: 1,
    lineHeight: 18,
  },
  divider: {
    height: 1,
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: "center",
  },
  lobbyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  lobbyTitle: {
    fontSize: 12,
    letterSpacing: 4,
  },
  codeBox: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  roomCode: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 8,
  },
  waitingText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
});
