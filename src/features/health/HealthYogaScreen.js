import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator,
  Dimensions, Alert, Modal,
} from 'react-native';
import { fetchConditionData } from './healthAIService';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 3;

// ── All config inline — no separate file needed ───────────────────────────────
const CONDITION_GRID = [
  { id: 'back_pain',     emoji: '🔙', color: '#E53935', lightColor: '#FFEBEE', query: 'Back Pain',          name: { en: 'Back Pain',        te: 'వీపు నొప్పి',       hi: 'पीठ दर्द' } },
  { id: 'neck_pain',     emoji: '🦒', color: '#FB8C00', lightColor: '#FFF3E0', query: 'Neck Pain',          name: { en: 'Neck Pain',        te: 'మెడ నొప్పి',        hi: 'गर्दन दर्द' } },
  { id: 'diabetes',      emoji: '🩺', color: '#1565C0', lightColor: '#E3F2FD', query: 'Diabetes',           name: { en: 'Diabetes',         te: 'మధుమేహం',           hi: 'मधुमेह' } },
  { id: 'high_bp',       emoji: '❤️', color: '#C62828', lightColor: '#FFEBEE', query: 'High Blood Pressure',name: { en: 'High BP',          te: 'అధిక రక్తపోటు',    hi: 'उच्च रक्तचाप' } },
  { id: 'stress',        emoji: '🧠', color: '#6A1B9A', lightColor: '#F3E5F5', query: 'Stress and Anxiety', name: { en: 'Stress & Anxiety', te: 'ఒత్తిడి & ఆందోళన', hi: 'तनाव और चिंता' } },
  { id: 'headache',      emoji: '🤕', color: '#00695C', lightColor: '#E0F2F1', query: 'Headache Migraine',  name: { en: 'Headache',         te: 'తలనొప్పి',          hi: 'सिरदर्द' } },
  { id: 'knee_pain',     emoji: '🦵', color: '#2E7D32', lightColor: '#E8F5E9', query: 'Knee Pain',          name: { en: 'Knee Pain',        te: 'మోకాలి నొప్పి',    hi: 'घुटने का दर्द' } },
  { id: 'pcod',          emoji: '🌸', color: '#AD1457', lightColor: '#FCE4EC', query: 'PCOD PCOS',          name: { en: 'PCOD / PCOS',      te: 'పీసీఓడీ',           hi: 'पीसीओडी' } },
  { id: 'shoulder_pain', emoji: '💪', color: '#E65100', lightColor: '#FBE9E7', query: 'Shoulder Pain',      name: { en: 'Shoulder Pain',    te: 'భుజం నొప్పి',       hi: 'कंधे का दर्द' } },
];

const SEARCH_SUGGESTIONS = [
  'Arthritis', 'Sciatica', 'Insomnia', 'Thyroid',
  'Obesity', 'Asthma', 'Hip Pain', 'Frozen Shoulder',
  'Cervical Spondylosis', 'Constipation', 'GERD', 'Anxiety',
];

const LANG_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'te', label: 'తె', flag: '🇮🇳' },
  { code: 'hi', label: 'हि', flag: '🇮🇳' },
];

// ── Loading overlay ───────────────────────────────────────────────────────────
const LoadingOverlay = ({ visible, conditionName, lang }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.overlayTitle}>
          {lang === 'te' ? 'AI విశ్లేషిస్తోంది...' :
           lang === 'hi' ? 'AI विश्लेषण कर रहा है...' :
           'AI is analyzing...'}
        </Text>
        <Text style={styles.overlayCondition}>{conditionName}</Text>
        <Text style={styles.overlaySub}>
          {lang === 'te' ? 'యోగా ఆసనాలు, ఆహారం మరియు సలహాలు తయారవుతున్నాయి' :
           lang === 'hi' ? 'योग आसन, भोजन और सुझाव तैयार हो रहे हैं' :
           'Fetching asanas, food tips & recovery advice'}
        </Text>
      </View>
    </View>
  </Modal>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const HealthYogaScreen = ({ navigation }) => {
  const [lang,       setLang]       = useState('en');
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [loadingFor, setLoadingFor] = useState('');

  const t = (obj) => obj?.[lang] || obj?.en || '';

  const goToCondition = useCallback(async (queryText, displayName, color, emoji, lightColor) => {
    if (loading) return;
    setLoadingFor(displayName);
    setLoading(true);

    const result = await fetchConditionData(queryText);
    setLoading(false);
    setLoadingFor('');

    if (result.success) {
      const data = {
        color:      color      || result.data.color,
        lightColor: lightColor || result.data.lightColor,
        emoji:      emoji      || result.data.emoji,
        ...result.data,
      };
      navigation.navigate('ConditionDetail', { condition: data, lang });
    } else {
      Alert.alert('Error', result.error || 'Could not load data. Check your API key and internet.');
    }
  }, [loading, lang, navigation]);

  const handleGridTap = (item) => {
    goToCondition(item.query, t(item.name), item.color, item.emoji, item.lightColor);
  };

  const handleSearch = (overrideQuery) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q) return;
    goToCondition(q, q, '#2E7D32', '🔍', '#E8F5E9');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <LoadingOverlay visible={loading} conditionName={loadingFor} lang={lang} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>
          {lang === 'te' ? 'ఆరోగ్య యోగా' : lang === 'hi' ? 'स्वास्थ्य योग' : 'Health Yoga'}
        </Text>
        <Text style={styles.heroSub}>
          {lang === 'te' ? 'AI-శక్తితో కూడిన యోగా చికిత్స' :
           lang === 'hi' ? 'AI-संचालित योग चिकित्सा' :
           'AI-powered yoga therapy in 3 languages'}
        </Text>

        {/* Language switcher */}
        <View style={styles.langRow}>
          {LANG_OPTIONS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, lang === l.code && styles.langActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>
                {l.flag} {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              lang === 'te' ? 'వ్యాధి వెతకండి — Arthritis, Sciatica...' :
              lang === 'hi' ? 'बीमारी खोजें — गठिया, साइटिका...' :
              'Search any condition — Arthritis, Sciatica...'
            }
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            editable={!loading}
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.goBtn} onPress={() => handleSearch()} disabled={loading}>
              <Text style={styles.goBtnText}>GO →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── SUGGESTION PILLS ─────────────────────────────────────────────── */}
        <View style={styles.pillWrap}>
          <Text style={styles.pillLabel}>
            {lang === 'te' ? '💡 వెతకండి:' : lang === 'hi' ? '💡 खोजें:' : '💡 Try searching:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillRow}>
              {SEARCH_SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.pill}
                  onPress={() => { setQuery(s); handleSearch(s); }}
                  disabled={loading}
                >
                  <Text style={styles.pillText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── SECTION LABEL ───────────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {lang === 'te' ? '🌿 సాధారణ వ్యాధులు' :
             lang === 'hi' ? '🌿 सामान्य बीमारियां' : '🌿 Common Conditions'}
          </Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🤖 AI Powered</Text>
          </View>
        </View>

        {/* ── 9-CONDITION GRID ─────────────────────────────────────────────── */}
        <View style={styles.grid}>
          {CONDITION_GRID.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.lightColor }, loading && styles.cardDisabled]}
              onPress={() => handleGridTap(item)}
              activeOpacity={0.78}
              disabled={loading}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </View>
              <Text style={[styles.cardName, { color: item.color }]} numberOfLines={2}>
                {t(item.name)}
              </Text>
              <Text style={styles.cardTap}>
                {loading && loadingFor === t(item.name) ? '⏳' : '→ Tap'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── INFO BANNER ─────────────────────────────────────────────────── */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>ℹ️</Text>
          <Text style={styles.infoBannerText}>
            {lang === 'te'
              ? 'ప్రతి వ్యాధిని తట్టండి — AI 5 ఆసనాలు, ఆహారం, dos & don\'ts ఇస్తుంది'
              : lang === 'hi'
              ? 'किसी भी बीमारी पर टैप करें — AI 5 आसन, भोजन, dos & don\'ts देगा'
              : "Tap any condition — AI gives 5 asanas with Wikipedia images, food guide, dos & don'ts"}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  overlayCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', marginHorizontal: 40, elevation: 20 },
  overlayTitle:     { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginTop: 16, marginBottom: 8 },
  overlayCondition: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 8 },
  overlaySub:       { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  hero: { backgroundColor: '#1B5E20', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backText:  { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  heroSub:   { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 16 },

  langRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  langActive:     { backgroundColor: '#fff', borderColor: '#fff' },
  langText:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  langTextActive: { color: '#1B5E20', fontWeight: 'bold' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', gap: 10 },
  searchIcon:  { fontSize: 18 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 13 },
  goBtn:       { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  goBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  pillWrap:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  pillLabel: { fontSize: 13, color: '#666', marginBottom: 10 },
  pillRow:   { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pill:      { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, elevation: 1, borderWidth: 1, borderColor: '#E0E0E0' },
  pillText:  { fontSize: 13, color: '#2E7D32', fontWeight: '500' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  aiBadge:      { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A5D6A7' },
  aiBadgeText:  { fontSize: 11, color: '#2E7D32', fontWeight: '600' },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 10 },
  card:         { width: CARD_W, borderRadius: 16, padding: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  cardDisabled: { opacity: 0.6 },
  iconCircle:   { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
  cardEmoji:    { fontSize: 26 },
  cardName:     { fontSize: 12, fontWeight: 'bold', textAlign: 'center', lineHeight: 16, marginBottom: 4 },
  cardTap:      { fontSize: 10, color: '#999' },

  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#E3F2FD', marginHorizontal: 16, marginTop: 20, padding: 14, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: '#90CAF9' },
  infoBannerIcon: { fontSize: 18 },
  infoBannerText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 20 },
});

export default HealthYogaScreen;