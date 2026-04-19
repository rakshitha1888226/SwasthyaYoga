import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { key: 'en',   label: 'English',       example: '"Warrior II — 72% correct. Bend your front knee more."' },
  { key: 'te',   label: 'తెలుగు',         example: '"వీరభద్రాసన — 72% సరైనది. ముందు మోకాలును వంచండి."' },
  { key: 'both', label: 'English + తెలుగు', example: '"Warrior II — 72% correct. ముందు మోకాలును వంచండి."' },
];

const SettingsScreen = ({ navigation }) => {
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('yogaLanguage').then(v => { if (v) setSelected(v); });
  }, []);

  const pick = async (key) => {
    setSelected(key);
    await AsyncStorage.setItem('yogaLanguage', key);
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗣️ Voice Feedback Language</Text>
        <Text style={styles.sectionSub}>
          The app will speak your pose score and corrections in this language
        </Text>

        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.key}
            style={[styles.option, selected === lang.key && styles.optionSelected]}
            onPress={() => pick(lang.key)}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.radio, selected === lang.key && styles.radioSelected]}>
                {selected === lang.key && <View style={styles.radioDot} />}
              </View>
              <View>
                <Text style={[styles.optionLabel, selected === lang.key && styles.optionLabelSelected]}>
                  {lang.label}
                </Text>
                <Text style={styles.optionExample}>{lang.example}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧘 Supported Poses</Text>
        {[
          ['Tadasana', 'తాడాసన', 'Stand straight, arms at sides'],
          ['Urdhva Hastasana', 'ఊర్ధ్వ హస్తాసన', 'Stand straight, both arms raised'],
          ['Warrior II', 'వీరభద్రాసన II', 'Wide legs, front knee bent, arms spread'],
          ['Tree Pose', 'వృక్షాసన', 'One leg raised, arms above head'],
          ['Chair Pose', 'ఉత్కటాసన', 'Knees bent, arms raised forward'],
        ].map(([en, te, desc]) => (
          <View key={en} style={styles.poseRow}>
            <View>
              <Text style={styles.poseName}>{en} — {te}</Text>
              <Text style={styles.poseDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How scoring works</Text>
        <Text style={styles.infoText}>
          The app measures your exact joint angles using MediaPipe — knee angle, hip angle,
          shoulder angle etc. These are compared to ideal angles for each pose.
          {'\n\n'}
          Example: Warrior II needs your front knee at 90°. If your knee is at 145°,
          the app says "Bend your front knee more — aim for 90°".
          {'\n\n'}
          No internet required. No AI. Works instantly. 100% accurate.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#2E7D32',
  },
  back:  { color: '#fff', fontSize: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 6 },
  sectionSub:   { fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 20 },

  option: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
    elevation: 1,
  },
  optionSelected: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  optionLeft:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: '#4CAF50' },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },

  optionLabel:         { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  optionLabelSelected: { color: '#2E7D32' },
  optionExample:       { fontSize: 12, color: '#666', lineHeight: 18 },

  poseRow: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8, elevation: 1,
  },
  poseName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  poseDesc: { fontSize: 12, color: '#888' },

  infoBox: {
    margin: 16, marginTop: 20,
    backgroundColor: '#E8F5E9', borderRadius: 12,
    padding: 16, borderLeftWidth: 4, borderLeftColor: '#4CAF50',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },
  infoText:  { fontSize: 13, color: '#333', lineHeight: 22 },
});

export default SettingsScreen;