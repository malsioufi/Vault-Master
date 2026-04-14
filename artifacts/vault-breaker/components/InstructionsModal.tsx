import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface InstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

function ColorDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.dotRow}>
      <Text style={[styles.dot, { color, textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }]}>
        ●
      </Text>
      <Text style={[styles.dotLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function InstructionsModal({ visible, onClose }: InstructionsModalProps) {
  const colors = useColors();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.handle} />

              <Text style={[styles.title, { color: colors.primary, fontFamily: "SpaceMono_400Regular" }]}>
                {">"} HOW TO PLAY
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
                    OBJECTIVE
                  </Text>
                  <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                    Crack the hidden secret code before you run out of attempts. Each guess gives you feedback clues.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
                    FEEDBACK INDICATORS
                  </Text>
                  <View style={styles.indicators}>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.match}15`, borderColor: colors.match }]}>
                      <ColorDot color={colors.match} label="MATCH" />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                        Right digit, right position
                      </Text>
                    </View>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.shift}15`, borderColor: colors.shift }]}>
                      <ColorDot color={colors.shift} label="SHIFT" />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                        Right digit, wrong position
                      </Text>
                    </View>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.glitch}15`, borderColor: colors.glitch }]}>
                      <ColorDot color={colors.glitch} label="GLITCH" />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                        Digit not in the code at all
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.note, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                    Note: feedback dots are shown in random order during play to avoid giving away positions.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
                    GAME MODES
                  </Text>
                  <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                    <Text style={{ color: colors.primary }}>SOLO — PASSIVE BOT:{"\n"}</Text>
                    {"  "}You guess the code alone. No time pressure.
                    {"\n\n"}
                    <Text style={{ color: colors.primary }}>SOLO — ACTIVE BOT:{"\n"}</Text>
                    {"  "}Race against an AI that is simultaneously trying to crack your code too. First to break wins. Unlimited tries.
                    {"\n\n"}
                    <Text style={{ color: colors.accent }}>ONLINE:{"\n"}</Text>
                    {"  "}Two real players. Each sets a secret code for the other to crack. Guess simultaneously — first to break the opponent's vault wins.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
                    SETTINGS
                  </Text>
                  <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                    <Text style={{ color: colors.foreground }}>Code Length:{"\n"}</Text>
                    {"  "}3–6 digits. Longer = harder.
                    {"\n\n"}
                    <Text style={{ color: colors.foreground }}>Allow Duplicates:{"\n"}</Text>
                    {"  "}When ON, the same digit can appear more than once.
                    {"\n\n"}
                    <Text style={{ color: colors.foreground }}>AI Difficulty:{"\n"}</Text>
                    {"  "}Controls how smart the bot guesses (Easy / Medium / Hard).
                    {"\n\n"}
                    <Text style={{ color: colors.foreground }}>Max Tries:{"\n"}</Text>
                    {"  "}Limit your attempts (6–12) or set ∞ for unlimited.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular" }]}>
                    TIPS
                  </Text>
                  <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" }]}>
                    {"›"} Use early guesses to test many different digits at once.{"\n"}
                    {"›"} Track SHIFT clues — the digit exists but needs to move.{"\n"}
                    {"›"} Review your full history at the end; digits are color-coded by position accuracy.{"\n"}
                    {"›"} You can give up at any time using the flag button — the secret will be revealed.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.closeBtnText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
                  GOT IT
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  scroll: {
    flexGrow: 0,
  },
  section: {
    gap: 8,
    marginBottom: 20,
  },
  heading: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  body: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  note: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  indicators: {
    gap: 8,
  },
  indicatorCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dotLabel: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  indicatorDesc: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginLeft: 22,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 4,
  },
});
