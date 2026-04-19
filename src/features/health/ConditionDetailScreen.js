import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Dimensions, Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

// ── Smart image with emoji fallback ──────────────────────────────────────────
const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  const fontSize = Math.round((style?.height || 80) * 0.45);

  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
        <Text style={{ fontSize }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setFailed(true)}
      resizeMode="cover"
    />
  );
};

// ── Collapsible section ───────────────────────────────────────────────────────
const Section = ({ title, color, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: open ? 0 : 1, duration: 220, useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[sStyles.wrap, { borderLeftColor: color }]}>
      <TouchableOpacity style={sStyles.header} onPress={toggle} activeOpacity={0.7}>
        <Text style={[sStyles.title, { color }]}>{title}</Text>
        <Animated.Text style={[sStyles.arrow, { transform: [{ rotate }] }]}>▼</Animated.Text>
      </TouchableOpacity>
      {open && <View style={sStyles.body}>{children}</View>}
    </View>
  );
};

const sStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff', borderRadius: 16,
    marginBottom: 12, elevation: 2,
    borderLeftWidth: 4, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  title: { fontSize: 15, fontWeight: 'bold' },
  arrow: { fontSize: 13, color: '#888' },
  body:  { paddingHorizontal: 16, paddingBottom: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
const ConditionDetailScreen = ({ navigation, route }) => {
  const { condition, lang: initLang = 'en' } = route.params || {};
  const [lang,        setLang]        = useState(initLang);
  const [activeAsana, setActiveAsana] = useState(null);

  if (!condition) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No data found.</Text>
      </View>
    );
  }

  const color      = condition.color      || '#2E7D32';
  const lightColor = condition.lightColor || '#E8F5E9';

  const t    = (obj) => obj?.[lang] || obj?.en || '';
  const tArr = (obj) => Array.isArray(obj) ? obj : (obj?.[lang] || obj?.en || []);

  return (
    <View style={[styles.root, { backgroundColor: lightColor }]}>
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
              <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO CARD ──────────────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: color }]}>
          <Text style={styles.heroEmoji}>{condition.emoji || '🧘'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{t(condition.name)}</Text>
            <Text style={styles.heroDesc}>{t(condition.desc)}</Text>
            <View style={styles.durationRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  ⏰ {condition.duration?.minutes || 20}
                  {lang === 'te' ? ' నిమి/రోజు' : lang === 'hi' ? ' मिनट/दिन' : ' min/day'}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  📅 {condition.duration?.weeks || 4}
                  {lang === 'te' ? ' వారాలు' : lang === 'hi' ? ' सप्ताह' : ' weeks'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── ASANAS ────────────────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color }]}>
            🧘 {lang === 'te' ? 'సిఫారసు చేసిన ఆసనాలు' : lang === 'hi' ? 'अनुशंसित आसन' : 'Recommended Asanas'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
              {(condition.asanas || []).map((asana, i) => (
                <TouchableOpacity
                  key={asana.id || i}
                  style={[
                    styles.asanaCard,
                    activeAsana === i && { borderColor: color, borderWidth: 2.5 },
                  ]}
                  onPress={() => setActiveAsana(activeAsana === i ? null : i)}
                  activeOpacity={0.85}
                >
                  <SmartImage uri={asana.image} emoji="🧘" style={styles.asanaImg} />

                  {/* Wikipedia badge */}
                  {asana.image && (
                    <View style={styles.wikiTag}>
                      <Text style={styles.wikiTagText}>📷 Wikipedia</Text>
                    </View>
                  )}

                  <View style={styles.asanaBody}>
                    <Text style={[styles.asanaName, { color }]} numberOfLines={2}>
                      {t(asana.name)}
                    </Text>
                    <Text style={styles.asanaDur}>{t(asana.duration)}</Text>
                    <Text style={styles.asanaBenefit} numberOfLines={2}>
                      {t(asana.benefit)}
                    </Text>
                  </View>
                  <View style={[styles.asanaToggle, { backgroundColor: lightColor }]}>
                    <Text style={[styles.asanaToggleText, { color }]}>
                      {activeAsana === i
                        ? (lang === 'te' ? '▲ దాచు' : lang === 'hi' ? '▲ छुपाएं' : '▲ Hide Steps')
                        : (lang === 'te' ? '▼ దశలు చూపు' : lang === 'hi' ? '▼ चरण दिखाएं' : '▼ Show Steps')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ── EXPANDED STEPS ──────────────────────────────────────────────── */}
          {activeAsana !== null && condition.asanas?.[activeAsana] && (
            <View style={[styles.stepsCard, { borderLeftColor: color }]}>
              <Text style={[styles.stepsTitle, { color }]}>
                📋 {t(condition.asanas[activeAsana].name)}
              </Text>
              {tArr(condition.asanas[activeAsana].steps).map((step, si) => (
                <View key={si} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: color }]}>
                    <Text style={styles.stepNumText}>{si + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── FOOD TO EAT ─────────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: '#2E7D32' }]}>
            🥗 {lang === 'te' ? 'తినవలసిన ఆహారం' : lang === 'hi' ? 'खाने योग्य भोजन' : 'Food to Eat'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}>
              {(condition.foodEat || []).map((food, i) => (
                <View key={i} style={[styles.foodCard, { borderBottomColor: '#4CAF50' }]}>
                  <SmartImage uri={food.image} emoji={food.emoji || '🥗'} style={styles.foodImg} />
                  <View style={styles.foodBadgeGreen}>
                    <Text style={styles.foodBadgeText}>✓</Text>
                  </View>
                  <Text style={styles.foodName} numberOfLines={2}>{t(food.name)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* ── FOOD TO AVOID ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: '#C62828' }]}>
            🚫 {lang === 'te' ? 'మానవలసిన ఆహారం' : lang === 'hi' ? 'परहेज़ करें' : 'Food to Avoid'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}>
              {(condition.foodAvoid || []).map((food, i) => (
                <View key={i} style={[styles.foodCard, { borderBottomColor: '#F44336' }]}>
                  <SmartImage uri={food.image} emoji={food.emoji || '🚫'} style={styles.foodImg} />
                  <View style={styles.foodBadgeRed}>
                    <Text style={styles.foodBadgeText}>✕</Text>
                  </View>
                  <Text style={styles.foodName} numberOfLines={2}>{t(food.name)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* ── DO'S ────────────────────────────────────────────────────────── */}
          <Section
            title={`✅ ${lang === 'te' ? 'చేయవలసినవి' : lang === 'hi' ? 'करें' : "Do's"}`}
            color="#2E7D32"
          >
            {tArr(condition.dos).map((item, i) => (
              <View key={i} style={styles.listRow}>
                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </Section>

          {/* ── DON'TS ──────────────────────────────────────────────────────── */}
          <Section
            title={`❌ ${lang === 'te' ? 'చేయకూడనివి' : lang === 'hi' ? 'न करें' : "Don'ts"}`}
            color="#C62828"
          >
            {tArr(condition.donts).map((item, i) => (
              <View key={i} style={styles.listRow}>
                <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </Section>

          {/* ── RECOVERY ADVICE ─────────────────────────────────────────────── */}
          <View style={[styles.recoveryCard, { borderLeftColor: color }]}>
            <Text style={[styles.recoveryTitle, { color }]}>
              🩺 {lang === 'te' ? 'కోలుకునే సలహా' : lang === 'hi' ? 'रिकवरी सलाह' : 'Recovery Advice'}
            </Text>
            <Text style={styles.recoveryText}>{t(condition.recovery)}</Text>
          </View>

          {/* ── START POSE CHECK ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: color }]}
            onPress={() => navigation.navigate('Pose')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>
              📸 {lang === 'te' ? 'AI పోజ్ చెక్ ప్రారంభించండి' :
                  lang === 'hi' ? 'AI पोज़ चेक शुरू करें' :
                  'Start AI Pose Check'}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
  },
  backText: { color: '#fff', fontSize: 14 },
  langRow:  { flexDirection: 'row', gap: 6 },
  langBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  langActive:     { backgroundColor: '#fff' },
  langText:       { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  langTextActive: { color: '#333', fontWeight: 'bold' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, gap: 16,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroEmoji: { fontSize: 54 },
  heroName:  { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  heroDesc:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  durationRow: { flexDirection: 'row', gap: 8 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 15, fontWeight: 'bold',
    marginTop: 20, marginBottom: 12,
  },

  // ── Asana cards ───────────────────────────────────────────────────────────
  asanaCard: {
    width: 180, backgroundColor: '#fff',
    borderRadius: 18, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  asanaImg:    { width: '100%', height: 130 },
  wikiTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  wikiTagText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  asanaBody:   { padding: 12 },
  asanaName:   { fontSize: 13, fontWeight: 'bold', lineHeight: 18, marginBottom: 3 },
  asanaDur:    { fontSize: 11, color: '#888', marginBottom: 4 },
  asanaBenefit:{ fontSize: 11, color: '#555', lineHeight: 16 },
  asanaToggle: {
    margin: 10, marginTop: 0,
    padding: 8, borderRadius: 10, alignItems: 'center',
  },
  asanaToggleText: { fontSize: 12, fontWeight: 'bold' },

  // ── Steps card ────────────────────────────────────────────────────────────
  stepsCard: {
    backgroundColor: '#fff', marginTop: 12,
    padding: 16, borderRadius: 16,
    elevation: 2, borderLeftWidth: 4,
    marginBottom: 4,
  },
  stepsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 10, gap: 12,
  },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepText:    { flex: 1, fontSize: 14, color: '#333', lineHeight: 21 },

  // ── Food cards ────────────────────────────────────────────────────────────
  foodCard: {
    width: 110, backgroundColor: '#fff',
    borderRadius: 16, elevation: 3,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 3,
  },
  foodImg: { width: '100%', height: 85 },
  foodBadgeGreen: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  foodBadgeRed: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F44336',
    justifyContent: 'center', alignItems: 'center',
  },
  foodBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  foodName: {
    fontSize: 11, color: '#333', fontWeight: '500',
    textAlign: 'center', padding: 7, lineHeight: 15,
  },

  // ── Do/Don't list ─────────────────────────────────────────────────────────
  listRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 9, gap: 10,
  },
  dot:      { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  listText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 21 },

  // ── Recovery ──────────────────────────────────────────────────────────────
  recoveryCard: {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 16, elevation: 2,
    borderLeftWidth: 4, marginBottom: 12,
  },
  recoveryTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  recoveryText:  { fontSize: 14, color: '#444', lineHeight: 22 },

  // ── Start button ──────────────────────────────────────────────────────────
  startBtn: {
    padding: 18, borderRadius: 16,
    alignItems: 'center', elevation: 4, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ConditionDetailScreen;