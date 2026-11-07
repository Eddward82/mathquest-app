import { auth } from "./firebase";
import { getAppCheckToken } from "./appCheck";

// Long enough for the server to wake from a cold start.
const REQUEST_TIMEOUT_MS = 70_000;

/**
 * Headers for calling our server. Each credential is left out if it can't be
 * fetched (offline, say), and the server decides whether that's acceptable.
 */
export async function apiHeaders(): Promise<Record<string, string>> {
  let idToken: string | undefined;
  try {
    idToken = await auth().currentUser?.getIdToken();
  } catch {}
  const appCheckToken = await getAppCheckToken();

  return {
    "Content-Type": "application/json",
    ...(process.env.EXPO_PUBLIC_APP_PROXY_KEY
      ? { "x-app-key": process.env.EXPO_PUBLIC_APP_PROXY_KEY }
      : {}),
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
  };
}

/** Throws if the server can't be reached; check `status` for a refusal. */
export async function apiPost<T>(path: string, body: object = {}): Promise<{ status: number; data: T | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = response.ok ? ((await response.json()) as T) : null;
    return { status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}
