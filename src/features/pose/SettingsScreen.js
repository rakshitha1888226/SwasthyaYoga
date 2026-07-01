import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Switch, ScrollView,
} from 'react-native';

const SettingsScreen = ({ navigation }) => {
  const [haptics,      setHaptics]      = React.useState(true);
  const [sound,        setSound]        = React.useState(true);
  const [darkMode,     setDarkMode]     = React.useState(true);
  const [autoCapture,  setAutoCapture]  = React.useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Pose Detection</Text>
        <View style={styles.card}>
          <SettingRow label="Auto-Capture Pose" value={autoCapture} onToggle={setAutoCapture}
            description="Automatically capture when pose is held for 3 seconds" />
        </View>

        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.card}>
          <SettingRow label="Haptic Feedback"   value={haptics}     onToggle={setHaptics}
            description="Vibrate on pose detection" />
          <View style={styles.divider} />
          <SettingRow label="Sound Effects"     value={sound}       onToggle={setSound}
            description="Play sounds on success" />
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <SettingRow label="Dark Mode" value={darkMode} onToggle={setDarkMode}
            description="Use dark theme throughout the app" />
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Model</Text>
            <Text style={styles.infoValue}>SwasthyaYoga TFLite</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow = ({ label, description, value, onToggle }) => (
  <View style={styles.settingRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && <Text style={styles.settingDesc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#333', true: '#2E7D32' }}
      thumbColor={value ? '#4CAF50' : '#888'}
    />
  </View>
);

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a1a2e' },
  header:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn:     { width: 40, justifyContent: 'center' },
  backTxt:     { color: '#fff', fontSize: 28, lineHeight: 28 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },

  content:      { padding: 20, gap: 8 },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 4 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '500', marginBottom: 2 },
  settingDesc:  { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  infoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default SettingsScreen;
