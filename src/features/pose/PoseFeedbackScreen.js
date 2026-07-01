import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, Image,
} from 'react-native';
import { markTodayDone } from '../streak/StreakService';

const GRADE_CONFIG = {
  A: { color: '#4CAF50', bg: 'rgba(76,175,80,0.15)',   label: 'Excellent!',   emoji: '🏆' },
  B: { color: '#8BC34A', bg: 'rgba(139,195,74,0.15)',  label: 'Great job!',   emoji: '⭐' },
  C: { color: '#FFC107', bg: 'rgba(255,193,7,0.15)',   label: 'Good effort!', emoji: '💪' },
  D: { color: '#F44336', bg: 'rgba(244,67,54,0.15)',   label: 'Keep trying!', emoji: '🎯' },
};

const PoseFeedbackScreen = ({ navigation, route }) => {
  const {
    score        = 75,
    feedback     = {},
    imageData,
    pose         = {},
    group,
    poses        = [],
    currentIndex = 0,
  } = route.params || {};

  const grade    = feedback.grade || (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D');
  const tips     = feedback.tips  || [];
  const cfg      = GRADE_CONFIG[grade] || GRADE_CONFIG.B;
  const isLast   = currentIndex >= poses.length - 1;
  const nextPose = !isLast ? poses[currentIndex + 1] : null;

  // ── Save streak when this screen loads ─────────────────────────────────────
  // This runs once when user reaches the feedback screen
  // meaning they successfully completed a pose
  useEffect(() => {
    const saveStreak = async () => {
      try {
        const poseId   = pose?.id   || pose?.sanskritName || 'unknown';
        const poseName = pose?.name?.en || pose?.name || pose?.sanskritName || 'Yoga Pose';
        await markTodayDone(poseId, poseName, score);
        console.log('✅ Streak saved — pose:', poseName, 'score:', score);
      } catch (e) {
        console.log('Streak save error:', e.message);
      }
    };
    saveStreak();
  }, []); // runs once on mount

  const handleNext = () => {
    if (isLast || !group) {
      navigation.navigate('Dashboard');
    } else {
      navigation.navigate('PoseSequence', {
        group,
        poses,
        currentIndex: currentIndex + 1,
      });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Grade badge */}
        <View style={[styles.gradeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={styles.gradeEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.gradeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Streak saved indicator */}
        <View style={styles.streakSavedBadge}>
          <Text style={styles.streakSavedText}>🔥 Streak updated!</Text>
        </View>

        {/* Pose info */}
        <View style={styles.poseHeader}>
          <Text style={styles.poseEmoji}>{pose.emoji || '🧘'}</Text>
          <Text style={styles.poseName}>{pose?.name?.en || pose?.name || 'Yoga Pose'}</Text>
        </View>

        {/* Score ring */}
        <View style={[styles.scoreCard, { borderColor: cfg.color }]}>
          <Text style={[styles.scoreGrade, { color: cfg.color }]}>{grade}</Text>
          <Text style={styles.scoreNum}>{score}%</Text>
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: cfg.color }]} />
          </View>
          <Text style={[styles.scoreSubtext, { color: cfg.color }]}>accuracy</Text>
        </View>

        {/* Snapshot */}
        {imageData ? (
          <Image
            source={{ uri: imageData }}
            style={styles.snapshot}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.snapshot, styles.snapshotPlaceholder]}>
            <Text style={styles.snapshotPlaceholderText}>📷 No snapshot</Text>
          </View>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 How to improve</Text>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={[styles.tipBullet, { color: cfg.color }]}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sequence progress */}
        {poses.length > 1 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Session Progress</Text>
            <View style={styles.dotsRow}>
              {poses.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < currentIndex   && styles.dotDone,
                    i === currentIndex && [styles.dotActive, { backgroundColor: cfg.color }],
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressLabel}>
              {currentIndex + 1} / {poses.length} poses completed
            </Text>
          </View>
        )}

        {/* CTA buttons */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: isLast ? '#1565C0' : '#2E7D32' }]}
          onPress={handleNext}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? '🏠 Finish Session' : `➡️ Next: ${nextPose || 'Pose'}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryBtnText}>🔄 Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashBtn}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.dashBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, alignItems: 'center', gap: 18 },

  gradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 28, marginTop: 8,
  },
  gradeEmoji: { fontSize: 24 },
  gradeLabel: { fontSize: 20, fontWeight: '800' },

  streakSavedBadge: {
    backgroundColor: 'rgba(255,109,0,0.15)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,109,0,0.3)',
  },
  streakSavedText: { color: '#FF6D00', fontSize: 14, fontWeight: '700' },

  poseHeader:  { alignItems: 'center', gap: 6 },
  poseEmoji:   { fontSize: 48 },
  poseName:    { color: '#fff', fontSize: 22, fontWeight: '700' },

  scoreCard: {
    width: '100%', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, padding: 28, gap: 8,
    borderWidth: 2,
  },
  scoreGrade:   { fontSize: 72, fontWeight: '900' },
  scoreNum:     { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -8 },
  scoreBarBg:   { width: '100%', height: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 5, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreSubtext: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  snapshot: { width: '100%', height: 200, borderRadius: 18, overflow: 'hidden' },
  snapshotPlaceholder:     { backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  snapshotPlaceholderText: { color: 'rgba(255,255,255,0.3)', fontSize: 16 },

  tipsCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 20, gap: 10,
  },
  tipsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tipRow:    { flexDirection: 'row', gap: 8 },
  tipBullet: { fontSize: 16, lineHeight: 22 },
  tipText:   { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 22 },

  progressCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 18, alignItems: 'center', gap: 10,
  },
  progressTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  dotsRow:       { flexDirection: 'row', gap: 8 },
  dot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotDone:       { backgroundColor: 'rgba(76,175,80,0.5)' },
  dotActive:     { width: 24 },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  primaryBtn:     { width: '100%', borderRadius: 28, padding: 18, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  retryBtn:     { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 28, padding: 14, alignItems: 'center' },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  dashBtn:     { paddingVertical: 10 },
  dashBtnText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});

export default PoseFeedbackScreen;