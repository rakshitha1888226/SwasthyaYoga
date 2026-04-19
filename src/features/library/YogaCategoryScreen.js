import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { fetchYogaCategory } from './yogaLibraryService';

const { width } = Dimensions.get('window');

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
        <Text style={{ fontSize: (style?.height || 80) * 0.45 }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

const YogaCategoryScreen = ({ navigation, route }) => {
  const { category, lang: initLang = 'en' } = route.params || {};
  const [lang,    setLang]    = useState(initLang);
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);

  const t    = (obj) => obj?.[lang] || obj?.en || '';
  const tArr = (obj) => obj?.[lang] || obj?.en || [];

  useEffect(() => {
    loadCategory();
  }, []);

  const loadCategory = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchYogaCategory(t(category.name), category.type);
    setLoading(false);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
  };

  const color      = category.color      || '#2E7D32';
  const lightColor = category.lightColor || '#E8F5E9';

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

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: color }]}>
        <Text style={styles.heroEmoji}>{category.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroName}>{t(category.name)}</Text>
          <Text style={styles.heroDesc}>{t(category.desc)}</Text>
          {data && (
            <View style={styles.heroMeta}>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>⏰ {t(data.duration)}</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>📊 {data.difficulty}</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>🧘 {data.asanas?.length || 0} asanas</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── LOADING ────────────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.loadingText}>
            {lang === 'te' ? 'AI ఆసనాలు తయారు చేస్తోంది...' :
             lang === 'hi' ? 'AI आसन तैयार कर रहा है...' :
             'AI is preparing asanas...'}
          </Text>
        </View>
      )}

      {/* ── ERROR ──────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <View style={styles.errorWrap}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: color }]} onPress={loadCategory}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      {data && !loading && (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>
              ✨ {lang === 'te' ? 'లాభాలు' : lang === 'hi' ? 'फायदे' : 'Benefits'}
            </Text>
            <View style={styles.benefitsRow}>
              {tArr(data.benefits).map((b, i) => (
                <View key={i} style={[styles.benefitChip, { borderColor: color }]}>
                  <Text style={[styles.benefitChipText, { color }]}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Asanas */}
          <Text style={[styles.sectionTitle, { color, marginHorizontal: 16, marginTop: 8 }]}>
            🧘 {lang === 'te' ? 'ఆసనాలు' : lang === 'hi' ? 'आसन' : 'Asanas'}
          </Text>

          {(data.asanas || []).map((asana, i) => (
            <TouchableOpacity
              key={asana.id || i}
              style={styles.asanaCard}
              onPress={() => navigation.navigate('YogaAsanaDetail', { asana, color, lightColor, lang })}
              activeOpacity={0.85}
            >
              <SmartImage uri={asana.image} emoji="🧘" style={styles.asanaImage} />

              {/* Wikipedia badge */}
              {asana.image && (
                <View style={styles.wikiTag}>
                  <Text style={styles.wikiTagText}>📷 Wikipedia</Text>
                </View>
              )}

              <View style={styles.asanaInfo}>
                <View style={styles.asanaNumWrap}>
                  <View style={[styles.asanaNum, { backgroundColor: color }]}>
                    <Text style={styles.asanaNumText}>{i + 1}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.asanaName, { color }]}>{t(asana.name)}</Text>
                  <Text style={styles.asanaSanskrit}>{asana.sanskritName}</Text>
                  <Text style={styles.asanaBenefit} numberOfLines={2}>{t(asana.benefit)}</Text>
                  <View style={styles.asanaMeta}>
                    <Text style={styles.asanaMetaText}>⏱ {t(asana.duration)}</Text>
                    {asana.calories && (
                      <Text style={styles.asanaMetaText}>🔥 {asana.calories}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.asanaArrow, { color }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

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

  hero: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4, gap: 14,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroEmoji: { fontSize: 52 },
  heroName:  { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  heroDesc:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  heroMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPill:  { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metaText:  { color: '#fff', fontSize: 11, fontWeight: '500' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#666' },

  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorEmoji: { fontSize: 48 },
  errorText:  { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  retryBtn:   { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText:  { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },

  benefitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  benefitChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  benefitChipText: { fontSize: 12, fontWeight: '600' },

  asanaCard: {
    backgroundColor: '#fff', marginHorizontal: 16,
    marginBottom: 12, borderRadius: 18, overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  asanaImage: { width: '100%', height: 180 },
  wikiTag: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  wikiTagText: { color: '#fff', fontSize: 9, fontWeight: '600' },

  asanaInfo: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  asanaNumWrap: { alignSelf: 'flex-start', marginTop: 2 },
  asanaNum: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  asanaNumText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  asanaName:    { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  asanaSanskrit:{ fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  asanaBenefit: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 6 },
  asanaMeta:    { flexDirection: 'row', gap: 12 },
  asanaMetaText:{ fontSize: 12, color: '#888' },
  asanaArrow:   { fontSize: 28, fontWeight: '300' },
});

export default YogaCategoryScreen;