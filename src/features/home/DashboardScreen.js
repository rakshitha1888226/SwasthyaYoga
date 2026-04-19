import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Dimensions,
  StatusBar, Animated,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import StreakBoard  from '../streak/StreakBoard';
import PoseOfTheDay from '../streak/PoseOfTheDay';
import { loadStreakData, markTodayDone } from '../streak/StreakService';

const { width } = Dimensions.get('window');

/* ── QUOTES (merged — 8 entries) ─────────────────────────────────────── */
const QUOTES = [
  { text: 'Yoga is the journey of the self, through the self, to the self.', author: 'Bhagavad Gita' },
  { text: 'The body is your temple. Keep it pure and clean for the soul to reside in.', author: 'B.K.S. Iyengar' },
  { text: 'Inhale the future, exhale the past.', author: 'Yoga Proverb' },
  { text: 'Yoga does not just change the way we see things, it transforms the person who sees.', author: 'B.K.S. Iyengar' },
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
  { text: 'యోగా శరీరాన్ని, మనసును మరియు ఆత్మను ఒకటిగా చేస్తుంది.', author: 'యోగ సూత్రం' },
  { text: 'ప్రతి శ్వాసతో కొత్త జీవితం మొదలవుతుంది.', author: 'తెలుగు నానుడి' },
  { text: 'मन शांत हो तो योग स्वयं होता है।', author: 'योग दर्शन' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { en: 'Good Morning', te: 'శుభోదయం', emoji: '🌅' };
  if (h < 17) return { en: 'Good Afternoon', te: 'శుభ మధ్యాహ్నం', emoji: '☀️' };
  if (h < 20) return { en: 'Good Evening', te: 'శుభ సాయంత్రం', emoji: '🌤️' };
  return { en: 'Good Night', te: 'శుభ రాత్రి', emoji: '🌙' };
}

const DAILY_TIPS = [
  'Focus on your breathing today 🌬️',
  'Try holding each pose 5 seconds longer 💪',
  'Practice on an empty stomach for best results 🙏',
  'Start with Sun Salutation today ☀️',
  'Focus on balance poses today 🌳',
  'Try a meditation session after yoga 🧘',
  'Rest day — gentle stretching only 🤸',
];

/* ════════════════════════════════════════════════════════════════════════ */
const DashboardScreen = ({ navigation }) => {
  const user                        = auth().currentUser;
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [greeting,   setGreeting]   = useState(getGreeting());
  const [streakData, setStreakData] = useState(null);
  const fadeAnim                    = useRef(new Animated.Value(1)).current;
  const today                       = new Date().getDay();

  /* rotating quotes */
  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setQuoteIndex(i => (i + 1) % QUOTES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  /* live greeting update */
  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  /* load streak data */
  useEffect(() => {
    loadStreakData().then(setStreakData);
  }, []);

  const handlePoseDone = async (poseId, poseName, score) => {
    const updated = await markTodayDone(poseId, poseName, score);
    if (updated) setStreakData(updated);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => auth().signOut() },
    ]);
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Yogi';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greetEmoji}>{greeting.emoji}</Text>
              <Text style={styles.greetEn}>{greeting.en}</Text>
              <Text style={styles.greetTe}>{greeting.te}</Text>
              <Text style={styles.heroName}>{firstName} 🙏</Text>
            </View>
            <TouchableOpacity style={styles.logoutPill} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
            <Text style={styles.quoteIcon}>"</Text>
            <Text style={styles.quoteText}>{QUOTES[quoteIndex].text}</Text>
            <Text style={styles.quoteAuthor}>— {QUOTES[quoteIndex].author}</Text>
          </Animated.View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>{DAILY_TIPS[today]}</Text>
          </View>
        </View>

        {/* ── STREAK BOARD ─────────────────────────────────────────────────── */}
        <StreakBoard streakData={streakData} />

        {/* ── POSE OF THE DAY (streak-aware) ───────────────────────────────── */}
        <PoseOfTheDay
          streakData={streakData}
          lang="en"
          navigation={navigation}
          onStreakUpdate={handlePoseDone}
        />

        {/* ── AI POSE CARD ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.poseCard}
          onPress={() => navigation.navigate('Pose')}
          activeOpacity={0.85}
        >
          <View style={styles.poseCardLeft}>
            <Text style={styles.poseCardBadge}>⭐ MAIN FEATURE</Text>
            <Text style={styles.poseCardTitle}>AI Pose Check</Text>
            <Text style={styles.poseCardSub}>
              Real-time skeleton detection{'\n'}Voice feedback in Telugu & English
            </Text>
            <View style={styles.poseCardBtn}>
              <Text style={styles.poseCardBtnText}>Start Now →</Text>
            </View>
          </View>
          <Text style={styles.poseCardEmoji}>🧘‍♀️</Text>
        </TouchableOpacity>

        {/* ── HEALTH YOGA CARD ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.healthCard}
          onPress={() => navigation.navigate('HealthYoga')}
          activeOpacity={0.85}
        >
          <View style={styles.healthCardLeft}>
            <Text style={styles.healthCardBadge}>🌿 NEW FEATURE</Text>
            <Text style={styles.healthCardTitle}>Health Yoga</Text>
            <Text style={styles.healthCardSub}>
              Yoga for Back Pain, Diabetes, BP,{'\n'}Stress & more — in 3 languages 🌍
            </Text>
            <View style={styles.healthCardBtn}>
              <Text style={styles.healthCardBtnText}>Explore →</Text>
            </View>
          </View>
          <Text style={styles.healthCardEmoji}>🩺</Text>
        </TouchableOpacity>

        {/* ── HEALTHY WEIGHT CHECK CARD ─────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.weightCard}
          onPress={() => navigation.navigate('WeightCheck')}
          activeOpacity={0.85}
        >
          <View style={styles.weightCardLeft}>
            <Text style={styles.weightCardBadge}>⚖️ NEW FEATURE</Text>
            <Text style={styles.weightCardTitle}>Healthy Weight Check</Text>
            <Text style={styles.weightCardTitleTe}>ఆరోగ్యకరమైన బరువు తనిఖీ</Text>
            <Text style={styles.weightCardSub}>
              Check your BMI, ideal weight range{'\n'}+ personalised yoga plan 📊
            </Text>
            <View style={styles.weightCardBtn}>
              <Text style={styles.weightCardBtnText}>Check Now →</Text>
            </View>
          </View>
          <Text style={styles.weightCardEmoji}>⚖️</Text>
        </TouchableOpacity>

        {/* ── TODAY'S STATS (wired to streakData) ───────────────────────────── */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsRow}>
          {[
            { icon: '🔥', value: streakData?.streakCount   || 0,                         label: 'Streak'   },
            { icon: '⏱️', value: `${(streakData?.totalSessions || 0) * 20}m`,             label: 'Practice' },
            { icon: '📅', value: streakData?.totalSessions || 0,                         label: 'Sessions' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── EXPLORE GRID ─────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '📚', title: 'Yoga Library', sub: 'Styles & Goals',     color: '#E8F5E9', onPress: () => navigation.navigate('YogaLibrary') },
            { icon: '⏰', title: 'Sessions',      sub: '10, 20, 30 min',     color: '#E3F2FD', onPress: () => {} },
            { icon: '📊', title: 'Progress',      sub: 'Track your journey', color: '#FFF3E0', onPress: () => {} },
            { icon: '🎯', title: 'Goals',         sub: 'Set daily targets',  color: '#F3E5F5', onPress: () => {} },
          ].map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionCard, { backgroundColor: a.color }]}
              onPress={a.onPress}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            స్వాస్థ్య యోగా — యోగతో జీవితాన్ని మెరుగుపరచుకోండి 🙏
          </Text>
        </View>

      </ScrollView>
    </View>
  );
};

/* ════════════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

  /* ── Hero ─────────────────────────────────────────────────────────── */
  hero: {
    backgroundColor: '#1B5E20',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greetEmoji: { fontSize: 28, marginBottom: 4 },
  greetEn:    { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  greetTe:    { color: 'rgba(255,255,255,0.6)',  fontSize: 12, marginBottom: 4 },
  heroName:   { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  logoutPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 8 },
  logoutText: { color: '#fff', fontSize: 12 },

  quoteCard:   { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#A5D6A7' },
  quoteIcon:   { color: '#A5D6A7', fontSize: 28, lineHeight: 24, marginBottom: 4 },
  quoteText:   { color: '#fff', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8, textAlign: 'right' },

  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 },
  tipIcon: { fontSize: 16 },
  tipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },

  /* ── AI Pose card ─────────────────────────────────────────────────── */
  poseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2E7D32', margin: 16, marginBottom: 10,
    borderRadius: 20, padding: 20, elevation: 6,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  poseCardLeft:    { flex: 1 },
  poseCardBadge:   { color: '#A5D6A7', fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  poseCardTitle:   { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  poseCardSub:     { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  poseCardBtn:     { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  poseCardBtnText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },
  poseCardEmoji:   { fontSize: 64, marginLeft: 10 },

  /* ── Health Yoga card ─────────────────────────────────────────────── */
  healthCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#00695C', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 20, padding: 20, elevation: 6,
    shadowColor: '#004D40', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  healthCardLeft:    { flex: 1 },
  healthCardBadge:   { color: '#A5D6A7', fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  healthCardTitle:   { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  healthCardSub:     { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  healthCardBtn:     { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  healthCardBtnText: { color: '#00695C', fontWeight: 'bold', fontSize: 13 },
  healthCardEmoji:   { fontSize: 60, marginLeft: 10 },

  /* ── Healthy Weight Check card ────────────────────────────────────── */
  weightCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1565C0', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 20, padding: 20, elevation: 6,
    shadowColor: '#0D47A1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  weightCardLeft:    { flex: 1 },
  weightCardBadge:   { color: '#BBDEFB', fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  weightCardTitle:   { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  weightCardTitleTe: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 },
  weightCardSub:     { color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  weightCardBtn:     { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  weightCardBtnText: { color: '#1565C0', fontWeight: 'bold', fontSize: 13 },
  weightCardEmoji:   { fontSize: 60, marginLeft: 10 },

  /* ── Section title ────────────────────────────────────────────────── */
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginLeft: 16, marginTop: 20, marginBottom: 10 },

  /* ── Stats ────────────────────────────────────────────────────────── */
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10 },
  statCard:  { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2 },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  /* ── Explore grid ─────────────────────────────────────────────────── */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10 },
  actionCard:  { width: (width - 42) / 2, borderRadius: 14, padding: 16, elevation: 1 },
  actionIcon:  { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 3 },
  actionSub:   { fontSize: 12, color: '#666' },

  /* ── Footer ───────────────────────────────────────────────────────── */
  footer:     { margin: 20, marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center' },
  footerText: { color: '#2E7D32', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

export default DashboardScreen;