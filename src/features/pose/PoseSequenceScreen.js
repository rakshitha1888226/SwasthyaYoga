import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';

const POSE_DISPLAY = {
  mountain:     { en: 'Mountain',      emoji: '⛰️' },
  tree:         { en: 'Tree',          emoji: '🌳' },
  warrior1:     { en: 'Warrior I',     emoji: '⚔️' },
  warrior2:     { en: 'Warrior II',    emoji: '⚔️' },
  warrior3:     { en: 'Warrior III',   emoji: '⚔️' },
  child:        { en: "Child's Pose",  emoji: '🧸' },
  cat:          { en: 'Cat',           emoji: '🐱' },
  downdog:      { en: 'Down Dog',      emoji: '🐕' },
  triangle:     { en: 'Triangle',      emoji: '🔺' },
  chair:        { en: 'Chair',         emoji: '🪑' },
  bridge:       { en: 'Bridge',        emoji: '🌉' },
  pigeon:       { en: 'Pigeon',        emoji: '🕊️' },
  crow:         { en: 'Crow',          emoji: '🐦' },
  headstand:    { en: 'Headstand',     emoji: '🙃' },
  side_plank:   { en: 'Side Plank',    emoji: '💪' },
  wheel:        { en: 'Wheel',         emoji: '🎡' },
  cobra:        { en: 'Cobra',         emoji: '🐍' },
  plank:        { en: 'Plank',         emoji: '🏋️' },
  boat:         { en: 'Boat',          emoji: '⛵' },
  supine_twist: { en: 'Supine Twist',  emoji: '🌀' },
  legs_up:      { en: 'Legs Up Wall',  emoji: '🦵' },
  savasana:     { en: 'Savasana',      emoji: '😴' },
};

const PoseSequenceScreen = ({ navigation, route }) => {
  const { group } = route.params || {};
  const poses     = group?.poses || [];
  const [current, setCurrent] = useState(0);

  const pose     = poses[current];
  const display  = POSE_DISPLAY[pose] || { en: pose, emoji: '🧘' };
  const isLast   = current === poses.length - 1;

  const handleStart = () => {
    navigation.navigate('PoseCamera', {
      poseOfDay:    { id: pose, name: display.en, emoji: display.emoji },
      group,
      poses,
      currentIndex: current,
    });
  };

  const handleNext = () => {
    if (!isLast) setCurrent(c => c + 1);
    else navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name || 'Sequence'}</Text>
        <Text style={styles.progress}>{current + 1}/{poses.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${((current + 1) / poses.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Pose display */}
        <View style={styles.poseCard}>
          <Text style={styles.poseEmoji}>{display.emoji}</Text>
          <Text style={styles.poseName}>{display.en}</Text>
          <Text style={styles.poseId}>{pose}</Text>
        </View>

        {/* Steps list */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Upcoming poses</Text>
          {poses.map((p, i) => {
            const d = POSE_DISPLAY[p] || { en: p, emoji: '🧘' };
            const done    = i < current;
            const active  = i === current;
            return (
              <View key={p} style={[styles.stepRow, active && styles.stepRowActive]}>
                <Text style={styles.stepEmoji}>{done ? '✅' : active ? d.emoji : '○'}</Text>
                <Text style={[styles.stepName,
                  done   && styles.stepDone,
                  active && styles.stepActive,
                ]}>{d.en}</Text>
                {active && <View style={styles.activeDot} />}
              </View>
            );
          })}
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>📸 Practice This Pose</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
          <Text style={styles.skipBtnText}>{isLast ? '✅ Finish Session' : 'Skip → Next Pose'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a2e' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn:     { width: 40 },
  backTxt:     { color: '#fff', fontSize: 28, lineHeight: 28 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  progress:    { width: 40, color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'right' },

  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 2 },

  content: { padding: 20, gap: 16 },

  poseCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, padding: 40,
    alignItems: 'center', gap: 10,
  },
  poseEmoji: { fontSize: 72 },
  poseName:  { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  poseId:    { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

  stepsCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 18, gap: 10,
  },
  stepsTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  stepRowActive: { backgroundColor: 'rgba(76,175,80,0.12)', borderRadius: 10, padding: 8, marginHorizontal: -8 },
  stepEmoji: { fontSize: 18, width: 24, textAlign: 'center' },
  stepName:  { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  stepDone:  { color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  stepActive:{ color: '#fff', fontWeight: '700' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },

  startBtn: {
    backgroundColor: '#2E7D32', borderRadius: 28,
    padding: 18, alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  skipBtn:      { alignItems: 'center', paddingVertical: 10 },
  skipBtnText:  { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});

export default PoseSequenceScreen;
