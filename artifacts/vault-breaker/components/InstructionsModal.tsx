import React from "react";
import {
  I18nManager,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";

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
  const { t, language } = useGame();
  const isRTL = language === "ar";
  const textAlign = isRTL ? "right" : "left";
  const dir = isRTL ? "rtl" : "ltr";

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

              <Text style={[styles.title, { color: colors.primary, fontFamily: "SpaceMono_400Regular", textAlign: "center" }]}>
                {">"} {t("howToPlay")}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrObjective")}
                  </Text>
                  <Text style={[styles.body, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrObjectiveText")}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrFeedbackSection")}
                  </Text>
                  <View style={styles.indicators}>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.match}15`, borderColor: colors.match }]}>
                      <ColorDot color={colors.match} label={t("match")} />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                        {t("instrMatchDesc")}
                      </Text>
                    </View>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.shift}15`, borderColor: colors.shift }]}>
                      <ColorDot color={colors.shift} label={t("shift")} />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                        {t("instrShiftDesc")}
                      </Text>
                    </View>
                    <View style={[styles.indicatorCard, { backgroundColor: `${colors.glitch}15`, borderColor: colors.glitch }]}>
                      <ColorDot color={colors.glitch} label={t("glitch")} />
                      <Text style={[styles.indicatorDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                        {t("instrGlitchDesc")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.note, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrFeedbackNote")}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrGameModes")}
                  </Text>
                  <View style={styles.modeBlock}>
                    <Text style={[styles.modeTitle, { color: colors.primary, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrPassiveModeTitle")}
                    </Text>
                    <Text style={[styles.modeDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrPassiveModeDesc")}
                    </Text>
                  </View>
                  <View style={styles.modeBlock}>
                    <Text style={[styles.modeTitle, { color: colors.primary, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrActiveModeTitle")}
                    </Text>
                    <Text style={[styles.modeDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrActiveModeDesc")}
                    </Text>
                  </View>
                  <View style={styles.modeBlock}>
                    <Text style={[styles.modeTitle, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrOnlineModeTitle")}
                    </Text>
                    <Text style={[styles.modeDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {t("instrOnlineModeDesc")}
                    </Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrSettingsSection")}
                  </Text>
                  {[
                    { title: "instrCodeLengthTitle", desc: "instrCodeLengthDesc" },
                    { title: "instrDuplicatesTitle", desc: "instrDuplicatesDesc" },
                    { title: "instrDifficultyTitle", desc: "instrDifficultyDesc" },
                    { title: "instrMaxTriesTitle", desc: "instrMaxTriesDesc" },
                  ].map(({ title, desc }) => (
                    <View key={title} style={styles.settingBlock}>
                      <Text style={[styles.settingTitle, { color: colors.foreground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                        {t(title)}
                      </Text>
                      <Text style={[styles.settingDesc, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                        {t(desc)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={[styles.heading, { color: colors.accent, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                    {t("instrTipsSection")}
                  </Text>
                  {(["instrTip1", "instrTip2", "instrTip3", "instrTip4"] as const).map((key) => (
                    <Text key={key} style={[styles.tip, { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular", textAlign }]}>
                      {isRTL ? "›" : "›"} {t(key)}
                    </Text>
                  ))}
                </View>

              </ScrollView>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.closeBtnText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
                  {t("gotIt")}
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
  note: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  modeBlock: {
    gap: 2,
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  settingBlock: {
    gap: 2,
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  tip: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
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
