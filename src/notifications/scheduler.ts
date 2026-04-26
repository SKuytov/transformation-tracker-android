/**
 * Notification scheduler for daily reminders.
 *
 * Scheduled notifications:
 * - 04:00 — Weigh-in ("Weigh-in time — XMART scale")
 * - 04:50 — Post-workout meal reminder (configurable)
 * - 12:30 — Lunch reminder
 * - 19:30 — Dinner reminder
 * - 21:00 — Bedtime ("Lights out for 04:00 wake")
 *
 * All times are configurable in Settings.
 * Notification IDs are stable so rescheduling cancels previous versions.
 */

import * as Notifications from 'expo-notifications';
import type { UserSettings } from '../data/types';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_IDS = {
  weighIn: 'tt-weigh-in',
  postWorkout: 'tt-post-workout',
  lunch: 'tt-lunch',
  dinner: 'tt-dinner',
  bedtime: 'tt-bedtime',
};

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h || 4, minute: m || 0 };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllNotifications(settings: UserSettings): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.log('Notification permission not granted — skipping scheduling');
    return;
  }

  await cancelAllNotifications();

  const { weighInTime, workoutTime, mealReminders } = settings.notifications;

  // Weigh-in notification (configurable)
  const wi = parseTime(weighInTime);
  await scheduleDaily(NOTIFICATION_IDS.weighIn, {
    title: '⚖️ Weigh-in time',
    body: 'Step on the XMART scale. After toilet, before food.',
    hour: wi.hour,
    minute: wi.minute,
  });

  // Post-workout meal (configurable)
  const pt = parseTime(workoutTime);
  await scheduleDaily(NOTIFICATION_IDS.postWorkout, {
    title: '🥚 Post-workout breakfast',
    body: 'Eat your post-workout meal — protein within 60 min of training.',
    hour: pt.hour + 1, // 1 hour after workout start
    minute: pt.minute,
  });

  if (mealReminders) {
    // Lunch 12:30
    await scheduleDaily(NOTIFICATION_IDS.lunch, {
      title: '🍽️ Lunch time',
      body: 'Chicken + rice + veg — hit that protein target!',
      hour: 12,
      minute: 30,
    });

    // Dinner 19:30
    await scheduleDaily(NOTIFICATION_IDS.dinner, {
      title: '🥗 Dinner time',
      body: 'Last big meal — stay on track for the day.',
      hour: 19,
      minute: 30,
    });
  }

  // Bedtime 21:00
  await scheduleDaily(NOTIFICATION_IDS.bedtime, {
    title: '🌙 Lights out',
    body: 'Time for bed — 04:00 wake-up is coming. Sleep is the secret weapon.',
    hour: 21,
    minute: 0,
  });
}

async function scheduleDaily(
  identifier: string,
  {
    title,
    body,
    hour,
    minute,
  }: { title: string; body: string; hour: number; minute: number }
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        // Android channel
        channelId: 'tt-daily-reminders',
      } as Notifications.DailyTriggerInput,
    });
  } catch (e) {
    console.warn(`Failed to schedule notification ${identifier}:`, e);
  }
}

export async function setupNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('tt-daily-reminders', {
    name: 'Daily Reminders',
    description: 'Daily weigh-in, meal, and bedtime reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0ea5e9',
  });
}
