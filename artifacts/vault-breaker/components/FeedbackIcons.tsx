import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { FeedbackResult } from "@/context/GameContext";

interface FeedbackIconsProps {
  feedback: FeedbackResult;
  size?: "sm" | "md";
}

export function FeedbackIcons({ feedback, size = "md" }: FeedbackIconsProps) {
  const colors = useColors();

  const iconMap = {
    match: { symbol: "●", color: colors.match },
    shift: { symbol: "●", color: colors.shift },
    glitch: { symbol: "●", color: colors.glitch },
  };

  const iconSize = size === "sm" ? 10 : 14;
  const gap = size === "sm" ? 3 : 5;

  return (
    <View style={[styles.row, { gap }]}>
      {feedback.icons.map((icon, i) => {
        const { symbol, color } = iconMap[icon];
        return (
          <Text
            key={i}
            style={[
              styles.icon,
              {
                color,
                fontSize: iconSize,
                textShadowColor: color,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 4,
              },
            ]}
          >
            {symbol}
          </Text>
        );
      })}
    </View>
  );
}

interface FeedbackCountsProps {
  feedback: FeedbackResult;
}

export function FeedbackCounts({ feedback }: FeedbackCountsProps) {
  const colors = useColors();

  return (
    <View style={styles.countsRow}>
      <View style={styles.countItem}>
        <Text style={[styles.countDot, { color: colors.match }]}>●</Text>
        <Text style={[styles.countNum, { color: colors.match, fontFamily: "SpaceMono_400Regular" }]}>
          {feedback.matches}
        </Text>
      </View>
      <View style={styles.countItem}>
        <Text style={[styles.countDot, { color: colors.shift }]}>●</Text>
        <Text style={[styles.countNum, { color: colors.shift, fontFamily: "SpaceMono_400Regular" }]}>
          {feedback.shifts}
        </Text>
      </View>
      <View style={styles.countItem}>
        <Text style={[styles.countDot, { color: colors.glitch }]}>●</Text>
        <Text style={[styles.countNum, { color: colors.glitch, fontFamily: "SpaceMono_400Regular" }]}>
          {feedback.glitches}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  icon: {
    fontWeight: "bold",
  },
  countsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  countItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countDot: {
    fontSize: 10,
  },
  countNum: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
