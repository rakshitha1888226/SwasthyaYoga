import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { getWeekDates } from './StreakService';

const { width } = Dimensions.get('window');
const DAY_LABELS = ['S', 'S', 'M', 'T', 'W', 'T', 'F'];

const GEM_MILESTONES = [
  { days: 7,   emoji: '🥉', label: '7 days',   color: '#CD7F32' },
  { days: 30,  emoji: '🥈', label: '30 days',  color: '#A8A9AD' },
  { days: 100, emoji: '🥇', label: '100 days', color: '#FFD700' },
  { days: 365, emoji: '💎', label: '1 year',   color: '#00BFFF' },
];

// ── Animated fire ─────────────────────────────────────────────────────────────
const FireIcon = ({ lit, size = 52 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacAnim  = useRef(new Animated.Value(lit ? 1 : 0.25)).current;

  useEffect(() => {
    if (lit) {
      // Pulsing fire animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(opacAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(1);
      Animated.timing(opacAnim, { toValue: 0.25, duration: 400, useNativeDriver: true }).start();
    }
  }, [lit]);

  return (
    <Animated.Text
      style={{
        fontSize: size,
        transform: [{ scale: scaleAnim }],
        opacity: opacAnim,
      }}
    >
      🔥
    </Animated.Text>
  );
};

// ── Week day cell ─────────────────────────────────────────────────────────────
const DayCell = ({ dateStr, label, done, isToday }) => (
  <View style={styles.dayCell}>
    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
    {done ? (
      <Text style={styles.dayFire}>🔥</Text>
    ) : (
      <View style={[styles.dayDot, isToday && { borderColor: '#FF6D00', borderWidth: 2 }]} />
    )}
    {isToday && <Text style={styles.todayDot}>●</Text>}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
const StreakBoard = ({ streakData }) => {
  if (!streakData) return null;

  const {
    streakCount   = 0,
    weekHistory   = {},
    totalSessions = 0,
    longestStreak = 0,
    gems          = [],
    todayDone     = false,
  } = streakData;

  const today     = new Date().toISOString().split('T')[0];
  const weekDates = getWeekDates();

  const streakLabel =
    streakCount === 0 ? 'Start your streak today!' :
    streakCount === 1 ? '1 day strong! 💪' :
    `${streakCount} days strong! 🎉`;

  return (
    <View style={styles.card}>

      {/* ── Fire + Count ─────────────────────────────────────────────────── */}
      <View style={styles.fireRow}>
        <FireIcon lit={todayDone} size={56} />
        <View style={styles.fireInfo}>
          <Text style={styles.streakCount}>{streakCount}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statVal}>{totalSessions}</Text>
          <Text style={styles.statLbl}>total</Text>
          <Text style={styles.statVal}>{longestStreak}</Text>
          <Text style={styles.statLbl}>best</Text>
        </View>
      </View>

      {/* ── Streak message ───────────────────────────────────────────────── */}
      <Text style={styles.streakMsg}>{streakLabel}</Text>

      {/* ── Gems ─────────────────────────────────────────────────────────── */}
      <View style={styles.gemsRow}>
        {GEM_MILESTONES.map((gem) => {
          const earned = gems.includes(gem.days) || streakCount >= gem.days;
          return (
            <View key={gem.days} style={[styles.gemWrap, !earned && styles.gemDim]}>
              <Text style={[styles.gemEmoji, !earned && { opacity: 0.3 }]}>{gem.emoji}</Text>
              <Text style={[styles.gemLabel, { color: earned ? gem.color : '#999' }]}>{gem.label}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Week calendar ────────────────────────────────────────────────── */}
      <View style={styles.weekWrap}>
        <View style={styles.weekRow}>
          {weekDates.map((dateStr, i) => (
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              label={DAY_LABELS[i]}
              done={!!weekHistory[dateStr]?.done}
              isToday={dateStr === today}
            />
          ))}
        </View>
      </View>

      {/* ── Motivational tip ─────────────────────────────────────────────── */}
      {!todayDone && (
        <View style={styles.tipRow}>
          <Text style={styles.tipText}>
            🌟 Do today's pose to keep your streak alive!
          </Text>
        </View>
      )}
      {todayDone && (
        <View style={[styles.tipRow, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.tipText, { color: '#2E7D32' }]}>
            ✅ Amazing! Today's pose done. Come back tomorrow!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 24, padding: 20,
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },

  fireRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, gap: 16,
  },
  fireInfo: { alignItems: 'center' },
  streakCount: { color: '#FF6D00', fontSize: 40, fontWeight: 'bold', lineHeight: 44 },
  streakLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  statsCol: { marginLeft: 'auto', alignItems: 'center', gap: 2 },
  statVal:  { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLbl:  { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 6 },

  streakMsg: {
    color: '#fff', fontSize: 16, fontWeight: '600',
    textAlign: 'center', marginBottom: 16,
  },

  gemsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 16, marginBottom: 20,
  },
  gemWrap:  { alignItems: 'center', gap: 4 },
  gemDim:   {},
  gemEmoji: { fontSize: 28 },
  gemLabel: { fontSize: 9, fontWeight: '600' },

  weekWrap: {
    backgroundColor: '#16213E', borderRadius: 16, padding: 14,
    marginBottom: 12,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 6, width: (width - 32 - 40 - 28) / 7 },
  dayLabel:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  dayLabelToday: { color: '#FF6D00', fontWeight: 'bold' },
  dayFire:  { fontSize: 20 },
  dayDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#2A2A4A', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  todayDot: { color: '#FF6D00', fontSize: 8, marginTop: -2 },

  tipRow: {
    backgroundColor: 'rgba(255,109,0,0.12)',
    borderRadius: 10, padding: 10,
  },
  tipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' },
});

export default StreakBoard;