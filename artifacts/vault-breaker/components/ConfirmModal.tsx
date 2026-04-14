import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmModalProps) {
  const colors = useColors();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.box,
                {
                  backgroundColor: colors.card,
                  borderColor: dangerous ? colors.destructive : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color: dangerous ? colors.destructive : colors.foreground,
                    fontFamily: "SpaceMono_400Regular",
                  },
                ]}
              >
                {title}
              </Text>

              {message ? (
                <Text
                  style={[
                    styles.message,
                    { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
                  ]}
                >
                  {message}
                </Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { borderColor: colors.border }]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: colors.mutedForeground, fontFamily: "SpaceMono_400Regular" },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnFilled,
                    {
                      backgroundColor: dangerous ? colors.destructive : colors.primary,
                      borderColor: dangerous ? colors.destructive : colors.primary,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
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
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  message: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
  },
  btnFilled: {
    borderWidth: 0,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
