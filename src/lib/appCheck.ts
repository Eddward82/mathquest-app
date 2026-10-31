import appCheck from "@react-native-firebase/app-check";

// ─── Firebase App Check ──────────────────────────────────────────────────────
// Proves requests come from the genuine MathQuest app installed from Google
// Play (Play Integrity). Once initialized, Auth and Firestore attach the token
// automatically; our own AI proxy gets it via getAppCheckToken().
//
// Dev builds can't pass Play Integrity, so they use the debug provider: the
// debug token is printed in logcat and must be added under App Check → Apps →
// Manage debug tokens in the Firebase console.
//
// Nothing is blocked until enforcement is turned on in the Firebase console
// (and REQUIRE_APP_CHECK=true on the proxy), so this is safe to ship first.

let initPromise: Promise<void> | null = null;

export function initAppCheck(): Promise<void> {
  initPromise ??= (async () => {
    const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: { provider: __DEV__ ? "debug" : "playIntegrity" },
      apple: { provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback" },
    });
    await appCheck().initializeAppCheck({ provider, isTokenAutoRefreshEnabled: true });
  })().catch((err) => {
    // Never let App Check break startup — unenforced requests still work.
    console.warn("App Check init failed:", err?.message);
    initPromise = null;
  });
  return initPromise;
}

// Token for the AI proxy's X-Firebase-AppCheck header, or undefined if one
// can't be fetched (offline, Play services missing) — the server decides.
export async function getAppCheckToken(): Promise<string | undefined> {
  try {
    await initAppCheck();
    const { token } = await appCheck().getToken();
    return token || undefined;
  } catch {
    return undefined;
  }
}
