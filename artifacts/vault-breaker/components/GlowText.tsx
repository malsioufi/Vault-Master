import React from "react";
import { Platform, StyleSheet, Text, TextStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlowTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  color?: string;
  intensity?: "low" | "medium" | "high";
  variant?: "primary" | "accent" | "muted" | "warning" | "destructive";
}

export function GlowText({
  children,
  style,
  color,
  intensity = "medium",
  variant = "primary",
}: GlowTextProps) {
  const colors = useColors();

  const variantColors: Record<string, string> = {
    primary: colors.primary,
    accent: colors.accent,
    muted: colors.mutedForeground,
    warning: colors.warning,
    destructive: colors.destructive,
  };

  const resolvedColor = color ?? variantColors[variant];

  const shadowRadius =
    intensity === "low" ? 4 : intensity === "medium" ? 8 : 16;
  const shadowOpacity =
    intensity === "low" ? 0.5 : intensity === "medium" ? 0.8 : 1;

  return (
    <Text
      style={[
        styles.base,
        {
          color: resolvedColor,
          ...(Platform.OS !== "web"
            ? {
                textShadowColor: resolvedColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: shadowRadius,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "SpaceMono_400Regular",
  },
});
