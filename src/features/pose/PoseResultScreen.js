import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';

const PoseResultScreen = ({ navigation, route }) => {
  const {
    score = 0,
    pose = {},
    feedback = {},
    imageData,
  } = route.params || {};

  const grade = feedback.grade || (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D');
  const tips  = feedback.tips  || [];

  const gradeColor =
    grade === 'A' ? '#4CAF50' :
    grade === 'B' ? '#8BC34A' :
    grade === 'C' ? '#FFC107' : '#F44336';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{pose.emoji || '🧘'}</Text>
          <Text style={styles.poseName}>{pose.name || 'Yoga Pose'}</Text>
          <Text style={styles.subtitle}>Pose Result</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={[styles.grade, { color: gradeColor }]}>{grade}</Text>
          <Text style={styles.scoreLabel}>Grade</Text>
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: gradeColor }]} />
          </View>
          <Text style={[styles.scoreValue, { color: gradeColor }]}>{score}% accuracy</Text>
        </View>

        {/* Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Feedback</Text>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.primaryBtnText}>🏠 Back to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Try Again</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, alignItems: 'center', gap: 20 },

  header:   { alignItems: 'center', marginTop: 16 },
  emoji:    { fontSize: 64, marginBottom: 8 },
  poseName: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },

  scoreCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, padding: 24, alignItems: 'center', gap: 8,
  },
  grade:      { fontSize: 72, fontWeight: 'bold' },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  scoreBarBg: {
    width: '100%', height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5, overflow: 'hidden',
    marginTop: 8,
  },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreValue:   { fontSize: 18, fontWeight: '600', marginTop: 4 },

  tipsCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 20, gap: 10,
  },
  tipsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  tipRow:    { flexDirection: 'row', gap: 8 },
  tipBullet: { color: '#4CAF50', fontSize: 16, lineHeight: 22 },
  tipText:   { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 },

  primaryBtn: {
    width: '100%', backgroundColor: '#2E7D32',
    borderRadius: 28, padding: 16, alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn:     { paddingVertical: 12 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});

export default PoseResultScreen;
