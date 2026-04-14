import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FeedbackCounts, FeedbackIcons } from "./FeedbackIcons";
import type { GuessEntry } from "@/context/GameContext";

interface GuessRowProps {
  entry: GuessEntry;
  index: number;
  compact?: boolean;
  revealed?: boolean;
}

export function GuessRow({ entry, index, compact = false, revealed = false }: GuessRowProps) {
  const colors = useColors();

  const isWin =
    entry.feedback.matches === entry.guess.length &&
    entry.feedback.shifts === 0 &&
    entry.feedback.glitches === 0;

  const digitColor = (status: "match" | "shift" | "glitch") => {
    if (status === "match") return colors.match;
    if (status === "shift") return colors.shift;
    return colors.glitch;
  };

  const digitBorderColor = (status: "match" | "shift" | "glitch") => {
    if (status === "match") return colors.match;
    if (status === "shift") return colors.shift;
    return colors.glitch;
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isWin
            ? `${colors.primary}15`
            : colors.card,
          borderColor: isWin ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.index,
          { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
        ]}
      >
        {String(index + 1).padStart(2, "0")}
      </Text>
      <View style={styles.digits}>
        {entry.guess.map((d, i) => {
          const status = entry.feedback.perDigit?.[i] ?? "glitch";
          const active = revealed;
          return (
            <Text
              key={i}
              style={[
                styles.digit,
                {
                  color: active ? digitColor(status) : colors.accent,
                  fontFamily: "SpaceMono_400Regular",
                  borderColor: active ? digitBorderColor(status) : colors.border,
                  backgroundColor: active ? `${digitColor(status)}18` : "transparent",
                  textShadowColor: active ? digitColor(status) : "transparent",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: active ? 4 : 0,
                },
              ]}
            >
              {d}
            </Text>
          );
        })}
      </View>
      <View style={styles.feedback}>
        {compact ? (
          <FeedbackIcons feedback={entry.feedback} size="sm" />
        ) : (
          <FeedbackCounts feedback={entry.feedback} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 10,
  },
  index: {
    fontSize: 11,
    width: 22,
  },
  digits: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  digit: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    textAlign: "center",
    minWidth: 24,
  },
  feedback: {
    alignItems: "flex-end",
    minWidth: 80,
  },
});
