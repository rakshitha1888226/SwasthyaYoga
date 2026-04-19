import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Dimensions, Image,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const LANG_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'te', label: 'తె', flag: '🇮🇳' },
  { code: 'hi', label: 'हि', flag: '🇮🇳' },
];

// ── Yoga Styles ───────────────────────────────────────────────────────────────
const YOGA_STYLES = [
  {
    id: 'hatha',
    emoji: '🧘',
    color: '#2E7D32',
    lightColor: '#E8F5E9',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Silhouette_syavasana.jpg/640px-Silhouette_syavasana.jpg',
    name: { en: 'Hatha Yoga', te: 'హఠ యోగా', hi: 'हठ योग' },
    desc: { en: 'Slow, foundational, perfect for beginners', te: 'నెమ్మదిగా, ప్రారంభకులకు అనువైన', hi: 'धीमा, शुरुआती लोगों के लिए' },
    difficulty: { en: 'Beginner', te: 'ప్రారంభం', hi: 'शुरुआती' },
    type: 'style',
  },
  {
    id: 'vinyasa',
    emoji: '🌊',
    color: '#1565C0',
    lightColor: '#E3F2FD',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Yoga_Vinyasa_Flow.jpg/640px-Yoga_Vinyasa_Flow.jpg',
    name: { en: 'Vinyasa Yoga', te: 'వినియాసా యోగా', hi: 'विन्यास योग' },
    desc: { en: 'Flowing movement, breath-synced sequences', te: 'శ్వాసతో సమన్వయమైన కదలికలు', hi: 'सांस के साथ प्रवाहमान गतिविधि' },
    difficulty: { en: 'Intermediate', te: 'మధ్యస్థం', hi: 'मध्यम' },
    type: 'style',
  },
  {
    id: 'ashtanga',
    emoji: '🔥',
    color: '#C62828',
    lightColor: '#FFEBEE',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Ashtanga_Yoga.jpg/640px-Ashtanga_Yoga.jpg',
    name: { en: 'Ashtanga Yoga', te: 'అష్టాంగ యోగా', hi: 'अष्टांग योग' },
    desc: { en: 'Intense fixed sequences, builds strength', te: 'తీవ్రమైన నిర్ణీత క్రమాలు', hi: 'तीव्र अनुक्रम, शक्ति बढ़ाता है' },
    difficulty: { en: 'Advanced', te: 'అధునాతన', hi: 'उन्नत' },
    type: 'style',
  },
  {
    id: 'yin',
    emoji: '🌙',
    color: '#6A1B9A',
    lightColor: '#F3E5F5',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Yin_Yoga.jpg/640px-Yin_Yoga.jpg',
    name: { en: 'Yin Yoga', te: 'యిన్ యోగా', hi: 'यिन योग' },
    desc: { en: 'Deep stretches held for 3-5 minutes', te: '3-5 నిమిషాలు లోతైన సాగదీతలు', hi: '3-5 मिनट तक गहरी स्ट्रेच' },
    difficulty: { en: 'Beginner', te: 'ప్రారంభం', hi: 'शुरुआती' },
    type: 'style',
  },
  {
    id: 'power',
    emoji: '💪',
    color: '#E65100',
    lightColor: '#FBE9E7',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Bhujangasana_Yoga-Asana_Nina-Mel.jpg/640px-Bhujangasana_Yoga-Asana_Nina-Mel.jpg',
    name: { en: 'Power Yoga', te: 'పవర్ యోగా', hi: 'पावर योग' },
    desc: { en: 'Strength and cardio focused yoga', te: 'బలం మరియు కార్డియో కేంద్రీకృత', hi: 'शक्ति और कार्डियो केंद्रित' },
    difficulty: { en: 'Advanced', te: 'అధునాతన', hi: 'उन्नत' },
    type: 'style',
  },
  {
    id: 'kundalini',
    emoji: '✨',
    color: '#F57F17',
    lightColor: '#FFFDE7',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pranayama.jpg/640px-Pranayama.jpg',
    name: { en: 'Kundalini Yoga', te: 'కుండలిని యోగా', hi: 'कुंडलिनी योग' },
    desc: { en: 'Breathing, chanting, energy awakening', te: 'శ్వాస, జపం, శక్తి జాగృతి', hi: 'सांस, जप, ऊर्जा जागरण' },
    difficulty: { en: 'Intermediate', te: 'మధ్యస్థం', hi: 'मध्यम' },
    type: 'style',
  },
];

// ── Yoga Goals ────────────────────────────────────────────────────────────────
const YOGA_GOALS = [
  {
    id: 'weight_loss',
    emoji: '⚖️',
    color: '#00695C',
    lightColor: '#E0F2F1',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Dhanurasana_Yoga-Asana_Nina-Mel.jpg/640px-Dhanurasana_Yoga-Asana_Nina-Mel.jpg',
    name: { en: 'Weight Loss', te: 'బరువు తగ్గడం', hi: 'वजन घटाना' },
    desc: { en: 'Burn calories, boost metabolism', te: 'కేలరీలు కాల్చండి, జీవక్రియ పెంచండి', hi: 'कैलोरी जलाएं, मेटाबॉलिज्म बढ़ाएं' },
    calories: '200-400 cal/hr',
    type: 'goal',
  },
  {
    id: 'flexibility',
    emoji: '🤸',
    color: '#AD1457',
    lightColor: '#FCE4EC',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Paschimottanasana_Yoga-Asana_Nina-Mel.jpg/640px-Paschimottanasana_Yoga-Asana_Nina-Mel.jpg',
    name: { en: 'Flexibility', te: 'వశ్యత', hi: 'लचीलापन' },
    desc: { en: 'Increase range of motion, loosen tight muscles', te: 'కండరాల వశ్యత పెంచండి', hi: 'मांसपेशियों का लचीलापन बढ़ाएं' },
    calories: '120-180 cal/hr',
    type: 'goal',
  },
  {
    id: 'strength',
    emoji: '🏋️',
    color: '#1565C0',
    lightColor: '#E3F2FD',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Setubandhasana_yoga_pose.jpg/640px-Setubandhasana_yoga_pose.jpg',
    name: { en: 'Strength', te: 'బలం', hi: 'ताकत' },
    desc: { en: 'Build muscle, core strength, endurance', te: 'కండరాలు నిర్మించండి, కోర్ బలం', hi: 'मांसपेशी बनाएं, कोर मजबूत करें' },
    calories: '180-300 cal/hr',
    type: 'goal',
  },
  {
    id: 'stress_relief',
    emoji: '😌',
    color: '#6A1B9A',
    lightColor: '#F3E5F5',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Shavasana_2.jpg/640px-Shavasana_2.jpg',
    name: { en: 'Stress Relief', te: 'ఒత్తిడి నివారణ', hi: 'तनाव से राहत' },
    desc: { en: 'Calm mind, reduce anxiety, deep relaxation', te: 'మనసు శాంతం, ఆందోళన తగ్గించు', hi: 'मन शांत करें, चिंता कम करें' },
    calories: '80-120 cal/hr',
    type: 'goal',
  },
  {
    id: 'better_sleep',
    emoji: '😴',
    color: '#283593',
    lightColor: '#E8EAF6',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Viparita_Karani_Yoga-Asana_Nina-Mel.jpg/640px-Viparita_Karani_Yoga-Asana_Nina-Mel.jpg',
    name: { en: 'Better Sleep', te: 'మంచి నిద్ర', hi: 'बेहतर नींद' },
    desc: { en: 'Improve sleep quality, relax body and mind', te: 'నిద్ర నాణ్యత మెరుగుపరచు', hi: 'नींद की गुणवत्ता सुधारें' },
    calories: '60-100 cal/hr',
    type: 'goal',
  },
  {
    id: 'back_pain',
    emoji: '🔙',
    color: '#E53935',
    lightColor: '#FFEBEE',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Childs_pose.jpg/640px-Childs_pose.jpg',
    name: { en: 'Back Pain Relief', te: 'వీపు నొప్పి నివారణ', hi: 'पीठ दर्द से राहत' },
    desc: { en: 'Strengthen spine, relieve back pain', te: 'వెన్నెముక బలపరచు, వీపు నొప్పి తగ్గించు', hi: 'रीढ़ मजबूत करें, पीठ दर्द से राहत' },
    calories: '100-150 cal/hr',
    type: 'goal',
  },
];

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DifficultyBadge = ({ level }) => {
  const colors = {
    Beginner: '#4CAF50',
    Intermediate: '#FF9800',
    Advanced: '#F44336',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[level] || '#888' }]}>
      <Text style={styles.badgeText}>{level}</Text>
    </View>
  );
};

// ── Smart image with fallback ─────────────────────────────────────────────────
const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

// ── Main screen ───────────────────────────────────────────────────────────────
const YogaLibraryScreen = ({ navigation }) => {
  const [lang, setLang] = useState('en');
  const t = (obj) => obj?.[lang] || obj?.en || '';

  const handleCategoryPress = (item) => {
    navigation.navigate('YogaCategory', { category: item, lang });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {lang === 'te' ? 'యోగా లైబ్రరీ' : lang === 'hi' ? 'योग पुस्तकालय' : 'Yoga Library'}
          </Text>
          <Text style={styles.headerSub}>
            {lang === 'te' ? 'స్టైల్స్ & లక్ష్యాల ద్వారా అన్వేషించండి' :
             lang === 'hi' ? 'शैलियों और लक्ष्यों द्वारा खोजें' :
             'Explore by styles & goals'}
          </Text>
        </View>
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

        {/* ── YOGA STYLES ──────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {lang === 'te' ? '🧘 యోగా స్టైల్స్' : lang === 'hi' ? '🧘 योग शैलियां' : '🧘 Yoga Styles'}
          </Text>
          <Text style={styles.sectionSub}>
            {lang === 'te' ? 'మీ పద్ధతి ఎంచుకోండి' : lang === 'hi' ? 'अपनी शैली चुनें' : 'Choose your style'}
          </Text>
        </View>

        <View style={styles.grid}>
          {YOGA_STYLES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.lightColor }]}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.82}
            >
              <SmartImage uri={item.image} emoji={item.emoji} style={styles.cardImage} />
              <View style={[styles.cardOverlay, { backgroundColor: item.color + 'CC' }]} />
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardName}>{t(item.name)}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{t(item.desc)}</Text>
                {item.difficulty && (
                  <DifficultyBadge level={item.difficulty[lang] || item.difficulty.en} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── YOGA GOALS ───────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {lang === 'te' ? '🎯 లక్ష్యాల వారీగా' : lang === 'hi' ? '🎯 लक्ष्य के अनुसार' : '🎯 By Goal'}
          </Text>
          <Text style={styles.sectionSub}>
            {lang === 'te' ? 'మీ లక్ష్యానికి సరైన యోగా' : lang === 'hi' ? 'अपने लक्ष्य के लिए योग' : 'Yoga for your specific goal'}
          </Text>
        </View>

        <View style={styles.grid}>
          {YOGA_GOALS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.lightColor }]}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.82}
            >
              <SmartImage uri={item.image} emoji={item.emoji} style={styles.cardImage} />
              <View style={[styles.cardOverlay, { backgroundColor: item.color + 'CC' }]} />
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardName}>{t(item.name)}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{t(item.desc)}</Text>
                {item.calories && (
                  <View style={styles.calorieBadge}>
                    <Text style={styles.calorieText}>🔥 {item.calories}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

  header: {
    backgroundColor: '#1B5E20',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  headerSub:   { color: 'rgba(255,255,255,0.72)', fontSize: 13 },

  langRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  langActive:     { backgroundColor: '#fff' },
  langText:       { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  langTextActive: { color: '#1B5E20', fontWeight: 'bold' },

  sectionHeader: { paddingHorizontal: 16, marginTop: 24, marginBottom: 14 },
  sectionTitle:  { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginBottom: 4 },
  sectionSub:    { fontSize: 13, color: '#666' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 12 },

  card: {
    width: CARD_W, height: 190, borderRadius: 20,
    overflow: 'hidden', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  cardImage:   { position: 'absolute', width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', width: '100%', height: '100%' },
  cardContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12,
  },
  cardEmoji: { fontSize: 28, marginBottom: 4 },
  cardName:  { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  cardDesc:  { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 16, marginBottom: 6 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  calorieBadge: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  calorieText:  { color: '#fff', fontSize: 10, fontWeight: '600' },
});

export default YogaLibraryScreen;