import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput } from "../ui/TextInput";
import { Button } from "../ui/Button";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

interface ConfirmPasswordModalProps {
  visible: boolean;
  loading: boolean;
  error: string | null;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

// Firebase needs a fresh sign-in before deleting an email/password account.
// Alert.prompt is iOS-only, so this collects the password on every platform.
export const ConfirmPasswordModal: React.FC<ConfirmPasswordModalProps> = ({
  visible,
  loading,
  error,
  onConfirm,
  onCancel,
}) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!visible) setPassword("");
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Confirm it&apos;s you</Text>
          <Text style={styles.body}>
            Enter your password to permanently delete your account and all your progress.
          </Text>
          <TextInput
            placeholder="Password"
            icon="lock"
            secureTextEntry
            secureToggle
            autoFocus
            value={password}
            onChangeText={setPassword}
            error={error ?? undefined}
            editable={!loading}
          />
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Cancel" variant="outline" onPress={onCancel} disabled={loading} fullWidth />
            </View>
            <View style={styles.action}>
              <Button
                title="Delete"
                variant="danger"
                onPress={() => onConfirm(password)}
                disabled={!password || loading}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  action: {
    flex: 1,
  },
});
