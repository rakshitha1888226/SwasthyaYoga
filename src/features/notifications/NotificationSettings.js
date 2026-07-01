import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, StatusBar,
} from 'react-native';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleStreakReminder,
  cancelDailyReminder,
  cancelAllNotifications,
  getScheduledNotifications,
  sendTestNotification,
} from './NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMES = [
  { label: '5:00 AM', hour: 5,  minute: 0 },
  { label: '6:00 AM', hour: 6,  minute: 0 },
  { label: '7:00 AM', hour: 7,  minute: 0 },
  { label: '8:00 AM', hour: 8,  minute: 0 },
  { label: '9:00 AM', hour: 9,  minute: 0 },
];

const NotificationSettings = ({ navigation }) => {
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [selectedTime,   setSelectedTime]   = useState(1); // 6 AM default
  const [hasPermission,  setHasPermission]  = useState(false);
  const [scheduled,      setScheduled]      = useState([]);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    loadSettings();
    checkScheduled();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notif_settings');
      if (saved) {
        const s = JSON.parse(saved);
        setMorningEnabled(s.morningEnabled ?? true);
        setEveningEnabled(s.eveningEnabled ?? true);
        setSelectedTime(s.selectedTime ?? 1);
      }
    } catch (e) {}
  };

  const checkScheduled = async () => {
    const list = await getScheduledNotifications();
    setScheduled(list);
    setHasPermission(list.length > 0 || true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      if (!granted) { setSaving(false); return; }

      await cancelAllNotifications();

      const time = TIMES[selectedTime];
      if (morningEnabled) await scheduleDailyReminder(time.hour, time.minute);
      if (eveningEnabled) await scheduleStreakReminder();

      await AsyncStorage.setItem('notif_settings', JSON.stringify({
        morningEnabled, eveningEnabled, selectedTime,
      }));

      await checkScheduled();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Morning reminder */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardTitle}>🌅 Morning Reminder</Text>
              <Text style={styles.cardSub}>Daily yoga practice reminder</Text>
            </View>
            <Switch
              value={morningEnabled}
              onValueChange={setMorningEnabled}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={morningEnabled ? '#2E7D32' : '#888'}
            />
          </View>
          {morningEnabled && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Reminder time:</Text>
              <View style={styles.timePills}>
                {TIMES.map((t, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.timePill, selectedTime === i && styles.timePillActive]}
                    onPress={() => setSelectedTime(i)}
                  >
                    <Text style={[styles.timePillText, selectedTime === i && styles.timePillTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Evening streak reminder */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardTitle}>🔥 Streak Reminder</Text>
              <Text style={styles.cardSub}>8:00 PM — if yoga not done yet</Text>
            </View>
            <Switch
              value={eveningEnabled}
              onValueChange={setEveningEnabled}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={eveningEnabled ? '#2E7D32' : '#888'}
            />
          </View>
        </View>

        {/* Scheduled info */}
        {scheduled.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>✅ Active Reminders</Text>
            {scheduled.map((n, i) => (
              <Text key={i} style={styles.infoText}>
                🔔 {n.notification?.title || 'Yoga Reminder'}
              </Text>
            ))}
          </View>
        )}

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>📱 Preview</Text>
          <View style={styles.previewNotif}>
            <Text style={styles.previewApp}>SwasthyaYoga</Text>
            <Text style={styles.previewMsg}>🧘 Time for your daily yoga!</Text>
            <Text style={styles.previewTime}>
              {TIMES[selectedTime]?.label} — every day
            </Text>
          </View>
        </View>

        {/* Test notification */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={sendTestNotification}
        >
          <Text style={styles.testBtnText}>🔔 Send Test Notification</Text>
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={saveSettings}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '⏳ Saving...' : '💾 Save & Schedule'}
          </Text>
        </TouchableOpacity>

        {/* Turn off */}
        <TouchableOpacity
          style={styles.offBtn}
          onPress={async () => {
            await cancelAllNotifications();
            await AsyncStorage.removeItem('notif_settings');
            setScheduled([]);
          }}
        >
          <Text style={styles.offBtnText}>🔕 Turn Off All Notifications</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F4F0' },
  scroll: { flex: 1 },

  header: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
  },
  backText:    { color: '#fff', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0,
    borderRadius: 16, padding: 16, elevation: 2,
  },
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#888' },

  timeRow:   { marginTop: 14 },
  timeLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  timePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timePill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0F0F0',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  timePillActive:     { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  timePillText:       { fontSize: 13, color: '#555', fontWeight: '500' },
  timePillTextActive: { color: '#fff', fontWeight: 'bold' },

  infoCard: {
    backgroundColor: '#E8F5E9', margin: 16, marginBottom: 0,
    borderRadius: 14, padding: 14, gap: 6,
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  infoText:  { fontSize: 13, color: '#388E3C' },

  previewCard: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0,
    borderRadius: 16, padding: 16, elevation: 1,
  },
  previewTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 12 },
  previewNotif: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: '#2E7D32',
  },
  previewApp:  { fontSize: 11, color: '#888', marginBottom: 4 },
  previewMsg:  { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
  previewTime: { fontSize: 12, color: '#888' },

  testBtn: {
    backgroundColor: '#E3F2FD', margin: 16, marginBottom: 0,
    padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#1565C0',
  },
  testBtnText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },

  saveBtn: {
    backgroundColor: '#2E7D32', margin: 16, marginBottom: 8,
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  offBtn: {
    marginHorizontal: 16, padding: 14,
    borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  offBtnText: { color: '#C62828', fontWeight: '600', fontSize: 14 },
});

export default NotificationSettings;