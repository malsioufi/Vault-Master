import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface DigitCellProps {
  value: string;
  index: number;
  isFocused: boolean;
  isError: boolean;
  onPress: (index: number) => void;
}

function DigitCell({ value, index, isFocused, isError, onPress }: DigitCellProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    onPress(index);
  }, [index, onPress, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = isError
    ? colors.destructive
    : isFocused
    ? colors.primary
    : value
    ? colors.accent
    : colors.border;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.cell,
          animStyle,
          {
            borderColor,
            backgroundColor: colors.card,
            shadowColor: isFocused ? colors.primary : isError ? colors.destructive : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isFocused ? 0.6 : 0,
            shadowRadius: 8,
          },
        ]}
      >
        <Text
          style={[
            styles.digit,
            { color: value ? colors.primary : colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
          ]}
        >
          {value || (isFocused ? "_" : "?")}
        </Text>
        {isFocused && (
          <View style={[styles.cursor, { backgroundColor: colors.primary }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface DigitInputProps {
  length: number;
  value: string[];
  onChange: (index: number, digit: string) => void;
  onRemove: (index: number) => void;
  allowDuplicates: boolean;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function DigitInput({
  length,
  value,
  onChange,
  onRemove,
  allowDuplicates,
  onSubmit,
  disabled = false,
}: DigitInputProps) {
  const colors = useColors();
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [errorIndex, setErrorIndex] = React.useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const errorAnim = useSharedValue(0);

  const focusedIndexRef = useRef(focusedIndex);
  const valueRef = useRef(value);
  const disabledRef = useRef(disabled);

  useEffect(() => { focusedIndexRef.current = focusedIndex; }, [focusedIndex]);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  const triggerError = useCallback((index: number) => {
    setErrorIndex(index);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    errorAnim.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    setTimeout(() => setErrorIndex(null), 300);
  }, [errorAnim]);

  const processKey = useCallback(
    (key: string) => {
      if (disabledRef.current) return;
      const fi = focusedIndexRef.current;
      const val = valueRef.current;

      if (key === "Backspace" || key === "Delete") {
        if (val[fi]) {
          onRemove(fi);
          if (fi > 0) setFocusedIndex(fi - 1);
        } else if (fi > 0) {
          setFocusedIndex(fi - 1);
          onRemove(fi - 1);
        }
        return;
      }

      if (key === "Enter") {
        const filled = val.filter(Boolean);
        if (filled.length === length && onSubmit) onSubmit();
        return;
      }

      if (!/^[0-9]$/.test(key)) return;

      if (!allowDuplicates && val.includes(key)) {
        triggerError(fi);
        return;
      }

      onChange(fi, key);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (fi < length - 1) {
        setFocusedIndex(fi + 1);
      } else if (fi === length - 1) {
        const filled = [...val];
        filled[fi] = key;
        if (filled.filter(Boolean).length === length && onSubmit) {
          setTimeout(onSubmit, 100);
        }
      }
    },
    [allowDuplicates, onChange, onRemove, onSubmit, length, triggerError]
  );

  const handleCellPress = useCallback(
    (index: number) => {
      if (disabled) return;
      setFocusedIndex(index);
      inputRef.current?.focus();
    },
    [disabled]
  );

  const handleKeyPress = useCallback(
    ({ nativeEvent }: { nativeEvent: { key: string } }) => {
      processKey(nativeEvent.key);
    },
    [processKey]
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      processKey(e.key);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [processKey]);

  const errorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cellRow, errorStyle]}>
        {Array.from({ length }).map((_, i) => (
          <DigitCell
            key={i}
            value={value[i] ?? ""}
            index={i}
            isFocused={focusedIndex === i && !disabled}
            isError={errorIndex === i}
            onPress={handleCellPress}
          />
        ))}
      </Animated.View>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        caretHidden
        editable={!disabled}
        autoFocus={!disabled}
      />

      {!disabled && (
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: value.filter(Boolean).length === length ? colors.primary : colors.muted,
              opacity: value.filter(Boolean).length === length ? 1 : 0.35,
            },
          ]}
          onPress={onSubmit}
          disabled={value.filter(Boolean).length !== length}
          activeOpacity={0.75}
        >
          <Text style={[styles.submitText, { color: colors.primaryForeground, fontFamily: "SpaceMono_400Regular" }]}>
            SUBMIT
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 20,
    width: "100%",
  },
  cellRow: {
    flexDirection: "row",
    gap: 10,
  },
  cell: {
    width: 56,
    height: 68,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  digit: {
    fontSize: 30,
    fontWeight: "bold",
  },
  cursor: {
    position: "absolute",
    bottom: 8,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 6,
    alignItems: "center",
  },
  submitText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 3,
  },
});
