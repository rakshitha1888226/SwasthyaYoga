import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, StatusBar,
} from 'react-native';

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
        <Text style={{ fontSize: 80 }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

const YogaAsanaDetailScreen = ({ navigation, route }) => {
  const { asana, color = '#2E7D32', lightColor = '#E8F5E9', lang: initLang = 'en' } = route.params || {};
  const [lang, setLang] = useState(initLang);

  const t    = (obj) => obj?.[lang] || obj?.en || '';
  const tArr = (obj) => obj?.[lang] || obj?.en || [];

  if (!asana) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={color} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.langRow}>
          {LANG_OPTIONS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, lang === l.code && styles.langActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── POSE IMAGE ─────────────────────────────────────────────────────── */}
        <View style={styles.imageWrap}>
          <SmartImage uri={asana.image} emoji="🧘" style={styles.poseImage} />
          {asana.image && (
            <View style={styles.wikiTag}>
              <Text style={styles.wikiTagText}>📷 Wikipedia</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>

          {/* ── NAME & SANSKRIT ──────────────────────────────────────────────── */}
          <Text style={[styles.poseName, { color }]}>{t(asana.name)}</Text>
          <Text style={styles.poseSanskrit}>{asana.sanskritName}</Text>

          {/* ── META ROW ─────────────────────────────────────────────────────── */}
          <View style={styles.metaRow}>
            <View style={[styles.metaCard, { backgroundColor: lightColor }]}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={[styles.metaValue, { color }]}>{t(asana.duration)}</Text>
              <Text style={styles.metaLabel}>
                {lang === 'te' ? 'వ్యవధి' : lang === 'hi' ? 'समय' : 'Duration'}
              </Text>
            </View>
            {asana.calories && (
              <View style={[styles.metaCard, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.metaIcon}>🔥</Text>
                <Text style={[styles.metaValue, { color: '#E65100' }]}>{asana.calories}</Text>
                <Text style={styles.metaLabel}>
                  {lang === 'te' ? 'కేలరీలు' : lang === 'hi' ? 'कैलोरी' : 'Calories'}
                </Text>
              </View>
            )}
          </View>

          {/* ── BENEFIT ──────────────────────────────────────────────────────── */}
          <View style={[styles.benefitCard, { borderLeftColor: color }]}>
            <Text style={[styles.benefitTitle, { color }]}>
              ✨ {lang === 'te' ? 'లాభం' : lang === 'hi' ? 'फायदा' : 'Key Benefit'}
            </Text>
            <Text style={styles.benefitText}>{t(asana.benefit)}</Text>
          </View>

          {/* ── STEPS ────────────────────────────────────────────────────────── */}
          <Text style={[styles.stepsTitle, { color }]}>
            📋 {lang === 'te' ? 'చేయు విధానం' : lang === 'hi' ? 'कैसे करें' : 'How To Do'}
          </Text>

          {tArr(asana.steps).map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: color }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {/* ── START POSE CHECK ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.poseBtn, { backgroundColor: color }]}
            onPress={() => navigation.navigate('Pose')}
            activeOpacity={0.85}
          >
            <Text style={styles.poseBtnText}>
              📸 {lang === 'te' ? 'ఈ పోజ్ AI తో చెక్ చేయండి' :
                  lang === 'hi' ? 'AI से इस पोज़ की जांच करें' :
                  'Check This Pose with AI'}
            </Text>
          </TouchableOpacity>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0F4F0' },
  content: { padding: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
  },
  backText: { color: '#fff', fontSize: 14 },
  langRow:  { flexDirection: 'row', gap: 6 },
  langBtn:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  langActive:     { backgroundColor: '#fff' },
  langText:       { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  langTextActive: { color: '#333', fontWeight: 'bold' },

  imageWrap:   { position: 'relative' },
  poseImage:   { width: '100%', height: 280 },
  wikiTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  wikiTagText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  poseName:    { fontSize: 26, fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  poseSanskrit:{ fontSize: 16, color: '#888', fontStyle: 'italic', marginBottom: 16 },

  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metaCard: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: 'center', elevation: 1,
  },
  metaIcon:  { fontSize: 22, marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  metaLabel: { fontSize: 11, color: '#888' },

  benefitCard: {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 14, borderLeftWidth: 4,
    marginBottom: 20, elevation: 1,
  },
  benefitTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  benefitText:  { fontSize: 15, color: '#333', lineHeight: 22 },

  stepsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', padding: 14,
    borderRadius: 12, marginBottom: 10, gap: 12, elevation: 1,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  stepText:    { flex: 1, fontSize: 15, color: '#333', lineHeight: 23 },

  poseBtn: {
    padding: 18, borderRadius: 16, alignItems: 'center',
    marginTop: 8, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  poseBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default YogaAsanaDetailScreen;