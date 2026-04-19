import React from 'react';
import {
  View, Text, Image, StyleSheet,
  ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const PoseResultScreen = ({ navigation, route }) => {
  const { image, analysis } = route.params || {};

  const score      = analysis?.score      ?? 0;
  const poseName   = analysis?.poseName   ?? 'Yoga Pose';
  const whatIsGood = analysis?.whatIsGood ?? '';
  const feedback   = analysis?.feedback   ?? '';
  const tips       = Array.isArray(analysis?.tips) ? analysis.tips : [];
  const telugu     = analysis?.teluguTip  ?? '';

  const scoreColor =
    score >= 85 ? '#4CAF50' :
    score >= 70 ? '#8BC34A' :
    score >= 50 ? '#FFC107' : '#F44336';

  const scoreLabel =
    score >= 85 ? '🌟 Excellent!' :
    score >= 70 ? '👍 Good' :
    score >= 50 ? '⚠️ Fair' : '🔴 Needs Work';

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pose Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Pose image */}
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#666' }}>No image</Text>
        </View>
      )}

      {/* Score card */}
      <View style={styles.scoreCard}>
        <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.scoreOf}>/100</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
          <Text style={styles.poseName}>{poseName}</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: scoreColor }]} />
      </View>

      {/* What you did well */}
      {whatIsGood ? (
        <View style={styles.goodBox}>
          <Text style={styles.goodIcon}>✅</Text>
          <Text style={styles.goodText}>{whatIsGood}</Text>
        </View>
      ) : null}

      {/* AI feedback — main result */}
      {feedback ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧘 AI Yoga Teacher Says</Text>
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        </View>
      ) : null}

      {/* Pose-specific corrections */}
      {tips.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Corrections for {poseName.split('(')[0].trim()}</Text>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipNum, { backgroundColor: scoreColor }]}>
                <Text style={styles.tipNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Telugu tip */}
      {telugu ? (
        <View style={styles.teluguCard}>
          <Text style={styles.teluguLabel}>తెలుగు సూచన</Text>
          <Text style={styles.teluguText}>{telugu}</Text>
        </View>
      ) : null}

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.tryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.tryText}>📸 Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.homeText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
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
  back:        { color: '#fff', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  image: { width, height: width * 0.65, backgroundColor: '#111' },

  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 16,
    padding: 20, borderRadius: 16,
    elevation: 3, gap: 20,
  },
  scoreRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, justifyContent: 'center', alignItems: 'center',
  },
  scoreNum:   { fontSize: 26, fontWeight: 'bold' },
  scoreOf:    { fontSize: 11, color: '#999' },
  scoreLabel: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  poseName:   { fontSize: 14, color: '#4CAF50', fontWeight: '600' },

  barBg: {
    height: 8, backgroundColor: '#E0E0E0',
    marginHorizontal: 16, borderRadius: 4,
    marginTop: -8, marginBottom: 8, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },

  goodBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#E8F5E9', marginHorizontal: 16,
    marginTop: 12, padding: 14, borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#4CAF50', gap: 10,
  },
  goodIcon: { fontSize: 16 },
  goodText: { flex: 1, fontSize: 14, color: '#1B5E20', lineHeight: 22 },

  section:      { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },

  feedbackBox: {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 12, elevation: 2,
  },
  feedbackText: { fontSize: 15, color: '#222', lineHeight: 24 },

  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', padding: 13,
    borderRadius: 10, marginBottom: 8,
    elevation: 1, gap: 12,
  },
  tipNum: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1,
  },
  tipNumText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tipText:    { flex: 1, fontSize: 14, color: '#333', lineHeight: 21 },

  teluguCard: {
    backgroundColor: '#E8F5E9', marginHorizontal: 16,
    marginTop: 16, padding: 16, borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#4CAF50',
  },
  teluguLabel: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold', marginBottom: 6 },
  teluguText:  { fontSize: 16, color: '#1B5E20', lineHeight: 26 },

  buttons: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 24, gap: 12,
  },
  tryBtn: {
    flex: 1, backgroundColor: '#4CAF50',
    padding: 15, borderRadius: 12, alignItems: 'center',
  },
  tryText:  { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  homeBtn: {
    flex: 1, backgroundColor: '#fff',
    padding: 15, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#4CAF50',
  },
  homeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 15 },
});

export default PoseResultScreen;