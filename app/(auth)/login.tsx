import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { Button } from "../../src/components/ui/Button";
import { TextInput } from "../../src/components/ui/TextInput";
import { useAuthStore } from "../../src/store/authStore";

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    await signIn(form.email, form.password);
    const store = useAuthStore.getState();
    if (!store.error) {
      router.replace("/(tabs)");
    }
  };

  const isVerifyEmail = error === "verify_email";

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
    const store = useAuthStore.getState();
    if (!store.error && store.user) {
      router.replace("/(tabs)");
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
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your learning streak
          </Text>
        </View>

        {/* Email verification banner */}
        {isVerifyEmail && (
          <View style={styles.verifyBanner}>
            <Feather name="mail" size={16} color="#0369A1" />
            <Text style={styles.verifyBannerText}>
              A verification email has been sent. Please check your inbox and verify your email before signing in.
            </Text>
          </View>
        )}

        {/* Error banner */}
        {error && !isVerifyEmail && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.dangerDark} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="Your password"
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            error={errors.password}
            secureToggle
          />
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
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
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/signup")}>
            <Text style={styles.footerLink}>Sign up</Text>
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
  header: { alignItems: "center", gap: 8, paddingVertical: 12 },
  emoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },
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
  verifyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#E0F2FE",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  verifyBannerText: { color: "#0369A1", fontWeight: "500", flex: 1, fontSize: 14, lineHeight: 20 },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 14 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: COLORS.textSecondary, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
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
