// SwasthyaYoga — Notification Service
// Uses @notifee/react-native for local notifications
// Daily morning yoga reminder + evening streak reminder

import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

const CHANNEL_ID        = 'swasthya_yoga_reminders';
const MORNING_NOTIF_ID  = 'morning_yoga_reminder';
const EVENING_NOTIF_ID  = 'evening_streak_reminder';

// ── Create notification channel (Android requires this) ───────────────────
async function createChannel() {
  await notifee.createChannel({
    id:          CHANNEL_ID,
    name:        'Yoga Reminders',
    importance:  AndroidImportance.HIGH,
    sound:       'default',
    vibration:   true,
  });
}

// ── Request permission from user ──────────────────────────────────────────
export async function requestNotificationPermission() {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (e) {
    console.log('Permission error:', e);
    return false;
  }
}

// ── Schedule daily morning reminder ──────────────────────────────────────
// hour: 0-23, minute: 0-59
export async function scheduleDailyReminder(hour = 6, minute = 0) {
  try {
    await createChannel();

    // Cancel existing morning reminder first
    await notifee.cancelNotification(MORNING_NOTIF_ID);

    // Build trigger time for today (or tomorrow if time passed)
    const now     = new Date();
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await notifee.createTriggerNotification(
      {
        id:    MORNING_NOTIF_ID,
        title: '🧘 స్వాస్థ్య యోగా',
        body:  'Good morning! Time for your daily yoga practice 🌅',
        android: {
          channelId:  CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          color:      '#2E7D32',
          pressAction: { id: 'default' },
          actions: [
            { title: '🧘 Start Yoga', pressAction: { id: 'start_yoga' } },
            { title: '⏰ Remind Later', pressAction: { id: 'snooze' } },
          ],
        },
      },
      {
        type:            TriggerType.TIMESTAMP,
        timestamp:       trigger.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );

    console.log(`✅ Morning reminder scheduled for ${hour}:${minute < 10 ? '0' + minute : minute} daily`);
    return true;
  } catch (e) {
    console.error('scheduleDailyReminder error:', e);
    return false;
  }
}

// ── Schedule evening streak reminder at 8 PM ─────────────────────────────
export async function scheduleStreakReminder() {
  try {
    await createChannel();

    await notifee.cancelNotification(EVENING_NOTIF_ID);

    const now     = new Date();
    const trigger = new Date();
    trigger.setHours(20, 0, 0, 0); // 8:00 PM

    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await notifee.createTriggerNotification(
      {
        id:    EVENING_NOTIF_ID,
        title: '🔥 Streak Alert!',
        body:  "Don't break your yoga streak! Complete today's session 💪",
        android: {
          channelId:   CHANNEL_ID,
          importance:  AndroidImportance.HIGH,
          color:       '#FF6F00',
          pressAction: { id: 'default' },
          actions: [
            { title: '🧘 Do Yoga Now', pressAction: { id: 'start_yoga' } },
          ],
        },
      },
      {
        type:            TriggerType.TIMESTAMP,
        timestamp:       trigger.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    );

    console.log('✅ Evening streak reminder scheduled for 8:00 PM daily');
    return true;
  } catch (e) {
    console.error('scheduleStreakReminder error:', e);
    return false;
  }
}

// ── Cancel morning reminder ───────────────────────────────────────────────
export async function cancelDailyReminder() {
  try {
    await notifee.cancelNotification(MORNING_NOTIF_ID);
    console.log('Morning reminder cancelled');
  } catch (e) {
    console.error('cancelDailyReminder error:', e);
  }
}

// ── Cancel all notifications ──────────────────────────────────────────────
export async function cancelAllNotifications() {
  try {
    await notifee.cancelAllNotifications();
    console.log('All notifications cancelled');
  } catch (e) {
    console.error('cancelAllNotifications error:', e);
  }
}

// ── Get all scheduled notifications ──────────────────────────────────────
export async function getScheduledNotifications() {
  try {
    return await notifee.getTriggerNotifications();
  } catch (e) {
    console.error('getScheduledNotifications error:', e);
    return [];
  }
}

// ── Handle notification actions (call from App.js) ────────────────────────
export function setupNotificationHandlers(navigation) {
  // Foreground handler
  notifee.onForegroundEvent(({ type, detail }) => {
    const { notification, pressAction } = detail;
    if (pressAction?.id === 'start_yoga') {
      navigation?.navigate('Pose');
    }
  });

  // Background handler
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { pressAction } = detail;
    if (pressAction?.id === 'snooze') {
      // Snooze by 30 minutes
      const snoozeTime = Date.now() + 30 * 60 * 1000;
      await notifee.createTriggerNotification(
        {
          title: '🧘 Yoga Reminder',
          body:  'Your snoozed yoga reminder!',
          android: { channelId: CHANNEL_ID, importance: AndroidImportance.HIGH, smallIcon: 'ic_notification' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: snoozeTime }
      );
    }
  });
}

// ── Send instant notification (for testing) ───────────────────────────────
export async function sendTestNotification() {
  try {
    await createChannel();
    await notifee.displayNotification({
      title: '🧘 Test — SwasthyaYoga',
      body:  'Notifications are working! Daily reminders are set ✅',
      android: {
        channelId:  CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        color:      '#2E7D32',
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    console.error('sendTestNotification error:', e);
  }
}