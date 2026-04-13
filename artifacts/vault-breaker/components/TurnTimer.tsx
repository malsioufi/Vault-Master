import React, { useEffect, useRef } from "react";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TurnTimerProps {
  seconds: number;
  maxSeconds?: number;
  label?: string;
}

export function TurnTimer({ seconds, maxSeconds = 30, label }: TurnTimerProps) {
  const colors = useColors();
  const progress = seconds / maxSeconds;

  const urgentColor =
    progress < 0.3
      ? colors.destructive
      : progress < 0.6
      ? colors.warning
      : colors.primary;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={[styles.bar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%` as any,
              backgroundColor: urgentColor,
              shadowColor: urgentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.number,
          { color: urgentColor, fontFamily: "SpaceMono_400Regular" },
        ]}
      >
        {String(seconds).padStart(2, "0")}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
  },
  bar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  number: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
