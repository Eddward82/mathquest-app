import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { Button } from "../../src/components/ui/Button";
import { TextInput } from "../../src/components/ui/TextInput";
import { useAuthStore } from "../../src/store/authStore";

export default function SignupScreen() {
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (form.username.length < 3) e.username = "At least 3 characters";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "At least 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    clearError();
    if (!validate()) return;
    await signUp(form.email, form.password, form.username);
    const store = useAuthStore.getState();
    if (store.error === "verify_email") {
      router.replace("/(auth)/login");
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
    const store = useAuthStore.getState();
    if (!store.error && store.user) {
      router.replace("/onboarding");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join MathQuest and start your learning journey
          </Text>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.dangerDark} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Username"
            icon="user"
            placeholder="mathwiz123"
            value={form.username}
            onChangeText={(t) => setForm({ ...form, username: t })}
            error={errors.username}
            autoCapitalize="none"
          />
          <TextInput
            label="Email address"
            icon="mail"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            icon="lock"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            error={errors.password}
            secureToggle
          />
          <TextInput
            label="Confirm password"
            icon="lock"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
            error={errors.confirmPassword}
            secureToggle
          />
        </View>

        <Button
          title="Create Account"
          onPress={handleSignup}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Sign up with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  container: { padding: 24, gap: 20, paddingBottom: 40 },
  back: { marginBottom: 8 },
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  form: { gap: 16 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF1F2",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: { color: COLORS.dangerDark, fontWeight: "500", flex: 1, fontSize: 14 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: COLORS.textSecondary, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 14 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  googleIcon: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
});
