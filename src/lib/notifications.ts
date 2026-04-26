import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "MathQuest",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C63FF",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyStreakReminder(hour = 19, minute = 0): Promise<void> {
  // Cancel any existing streak reminders before scheduling a new one
  await cancelDailyStreakReminder();

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: "daily_streak_reminder",
    content: {
      title: "Don't break your streak! 🔥",
      body: "You haven't done your maths today. Keep the streak alive!",
      sound: true,
      data: { type: "streak_reminder" },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as any,
  });
}

export async function cancelDailyStreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("daily_streak_reminder");
}

export async function scheduleEncouragementNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const messages = [
    { title: "Keep going! 💪", body: "You're on a roll — complete a lesson to earn XP!" },
    { title: "New lessons await! 📚", body: "Jump back into MathQuest and keep improving." },
    { title: "Almost there! ⚡", body: "A quick maths session will keep your skills sharp." },
    { title: "Level up time! 🚀", body: "You're close to your next level — keep learning!" },
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: "encouragement",
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      data: { type: "encouragement" },
    },
    trigger: { seconds: 60 * 60 * 48, repeats: false }, // 48 hours after inactivity
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function useNotificationListener(
  onReceive?: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void
) {
  const receiveListener = onReceive
    ? Notifications.addNotificationReceivedListener(onReceive)
    : null;
  const responseListener = onResponse
    ? Notifications.addNotificationResponseReceivedListener(onResponse)
    : null;

  return () => {
    receiveListener?.remove();
    responseListener?.remove();
  };
}
