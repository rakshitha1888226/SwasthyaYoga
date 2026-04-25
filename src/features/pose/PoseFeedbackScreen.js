import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, StatusBar, ScrollView, Animated,
} from 'react-native';
import Tts from 'react-native-tts';
import { markTodayDone } from '../streak/StreakService';  // ✅ fixed path

const PoseFeedbackScreen = ({ navigation, route }) => {
  const {
    score, feedback, imageData,
    pose, group, poses, currentIndex, onPoseDone,
  } = route.params || {};

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const isLastPose = currentIndex >= (poses?.length || 1) - 1;
  const isPassed   = score >= 60;

  const scoreColor =
    score >= 80 ? '#4CAF50' :
    score >= 60 ? '#8BC34A' :
    score >= 40 ? '#FFB300' : '#F44336';

  const gradeEmoji =
    score >= 85 ? '🏆' :
    score >= 70 ? '🎉' :
    score >= 55 ? '👍' :
    score >= 40 ? '💪' : '🔄';

  // ── Animate in ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    navigation.replace('PoseCamera', {
      group, poses, currentIndex,
    });
  };

  const handleNext = async () => {
    if (isPassed && pose) {
      await markTodayDone(pose.id, pose.name, score);
      onPoseDone?.();
    }
    if (isLastPose) {
      Tts.speak('Congratulations! You have completed all poses. Great work!');
      navigation.popToTop();
    } else {
      navigation.replace('PoseCamera', {
        group, poses,
        currentIndex: currentIndex + 1,
      });
    }
  };

  const handleDone = async () => {
    if (pose) {
      await markTodayDone(pose.id, pose.name, score);
      onPoseDone?.();
    }
    Tts.speak('Well done! See you tomorrow!');
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.poseName}>{pose?.name || 'Pose'}</Text>
          <Text style={styles.poseStep}>
            Step {(currentIndex || 0) + 1} of {poses?.length || 1}
          </Text>
        </View>

        {/* Captured photo with skeleton */}
        {imageData ? (
          <View style={styles.photoBox}>
            <Image source={{ uri: imageData }} style={styles.photo} resizeMode="contain" />
            <View style={styles.photoLabel}>
              <Text style={styles.photoLabelTxt}>🦴 Skeleton overlay</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.photoBox, styles.noPhoto]}>
            <Text style={styles.noPhotoEmoji}>{pose?.emoji || '🧘'}</Text>
          </View>
        )}

        {/* Score circle */}
        <Animated.View style={[styles.scoreBox, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.gradeEmoji}>{gradeEmoji}</Text>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.scoreDenom}>/100</Text>
          <Text style={[styles.gradeLabel, { color: scoreColor }]}>
            {feedback?.grade ? `Grade ${feedback.grade}` : ''}
          </Text>
        </Animated.View>

        {/* Feedback tips */}
        <Animated.View style={[styles.tipsBox, { opacity: fadeAnim }]}>
          <Text style={styles.tipsTitle}>💡 Feedback</Text>
          {(feedback?.tips || []).map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipDot}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Key points reminder */}
        {pose?.keyPoints && (
          <View style={styles.keyBox}>
            <Text style={styles.keyTitle}>🎯 Key Points</Text>
            <Text style={styles.keyText}>{pose.keyPoints}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryTxt}>🔄 Retry</Text>
          </TouchableOpacity>

          {!isLastPose ? (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: scoreColor }]} onPress={handleNext}>
              <Text style={styles.nextTxt}>Next Pose →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneTxt}>✅ Complete!</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hear feedback again */}
        <TouchableOpacity style={styles.speakBtn} onPress={() => {
          const tipsText = (feedback?.tips || []).slice(0, 2).join('. ');
          Tts.speak(`Score: ${score} out of 100. ${tipsText}`);
        }}>
          <Text style={styles.speakTxt}>🔊 Hear feedback again</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#111' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  header: { alignItems: 'center', paddingVertical: 8 },
  poseName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  poseStep: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },

  photoBox: {
    width: '100%', height: 280,
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#1E1E1E', position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoLabel: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  photoLabelTxt: { color: '#4CAF50', fontSize: 11, fontWeight: '600' },
  noPhoto:       { justifyContent: 'center', alignItems: 'center' },
  noPhotoEmoji:  { fontSize: 72 },

  scoreBox: {
    backgroundColor: '#1E1E1E', borderRadius: 24,
    padding: 24, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  gradeEmoji: { fontSize: 40, marginBottom: 4 },
  scoreNum:   { fontSize: 72, fontWeight: 'bold', lineHeight: 76 },
  scoreDenom: { color: 'rgba(255,255,255,0.4)', fontSize: 20 },
  gradeLabel: { fontSize: 18, fontWeight: '600', marginTop: 4 },

  tipsBox: {
    backgroundColor: '#1E1E1E', borderRadius: 18,
    padding: 18, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tipsTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  tipRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipDot:    { color: '#4CAF50', fontSize: 16, lineHeight: 20 },
  tipText:   { color: 'rgba(255,255,255,0.85)', fontSize: 14, flex: 1, lineHeight: 20 },

  keyBox: {
    backgroundColor: 'rgba(255,213,0,0.1)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,213,0,0.2)', gap: 6,
  },
  keyTitle: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  keyText:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    flex: 1, paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  retryTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  nextBtn:  { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  nextTxt:  { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  doneBtn:  { flex: 2, paddingVertical: 16, backgroundColor: '#4CAF50', borderRadius: 16, alignItems: 'center' },
  doneTxt:  { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  speakBtn: {
    alignItems: 'center', paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
  },
  speakTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
});

export default PoseFeedbackScreen;