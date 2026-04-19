// ── SwasthyaYoga Streak Service ───────────────────────────────────────────────
// Uses Firebase Firestore — already installed in your app
// Stores: streakCount, lastDoneDate, weekHistory, totalSessions, selectedPose

import firestore from '@react-native-firebase/firestore';
import auth      from '@react-native-firebase/auth';

const today = () => new Date().toISOString().split('T')[0]; // "2025-04-17"

const getUserDoc = () => {
  const uid = auth().currentUser?.uid;
  if (!uid) return null;
  return firestore().collection('streaks').doc(uid);
};

// ── Get today's date string ───────────────────────────────────────────────────
export function getTodayString() {
  return today();
}

// ── Get yesterday's date string ───────────────────────────────────────────────
function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── Get week dates (Sun–Sat of current week) ──────────────────────────────────
export function getWeekDates() {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - day + i);
    week.push(d.toISOString().split('T')[0]);
  }
  return week;
}

// ── Load streak data from Firestore ──────────────────────────────────────────
export async function loadStreakData() {
  try {
    const doc = getUserDoc();
    if (!doc) return getDefaultStreak();

    const snap = await doc.get();
    if (!snap.exists) return getDefaultStreak();

    const data = snap.data();

    // Check if streak should be reset (missed yesterday)
    const last = data.lastDoneDate;
    const yest = getYesterdayString();
    const tod  = today();

    let streakCount = data.streakCount || 0;

    // If last done is not today and not yesterday → reset streak
    if (last && last !== tod && last !== yest) {
      streakCount = 0;
      await doc.update({ streakCount: 0 });
    }

    return {
      streakCount,
      lastDoneDate:   data.lastDoneDate   || null,
      weekHistory:    data.weekHistory    || {},
      totalSessions:  data.totalSessions  || 0,
      todayPose:      data.todayPose      || null,
      todayDone:      data.lastDoneDate   === tod,
      longestStreak:  data.longestStreak  || 0,
      gems:           data.gems           || [],
    };
  } catch (e) {
    console.error('loadStreakData error:', e);
    return getDefaultStreak();
  }
}

// ── Mark today's pose as done ─────────────────────────────────────────────────
export async function markTodayDone(poseId, poseName, score) {
  try {
    const doc = getUserDoc();
    if (!doc) return;

    const snap = await doc.get();
    const data = snap.exists ? snap.data() : {};

    const tod  = today();
    const yest = getYesterdayString();
    const last = data.lastDoneDate;

    // Calculate new streak
    let newStreak = 1;
    if (last === yest) {
      newStreak = (data.streakCount || 0) + 1;
    } else if (last === tod) {
      newStreak = data.streakCount || 1; // already done today
    }

    // Update week history
    const weekHistory = data.weekHistory || {};
    weekHistory[tod] = { poseId, poseName, score, done: true };

    // Check new gems earned
    const gems = data.gems || [];
    const milestones = [7, 30, 100, 365];
    milestones.forEach(m => {
      if (newStreak >= m && !gems.includes(m)) gems.push(m);
    });

    const longestStreak = Math.max(newStreak, data.longestStreak || 0);
    const totalSessions = (data.totalSessions || 0) + (last === tod ? 0 : 1);

    const update = {
      streakCount:   newStreak,
      lastDoneDate:  tod,
      weekHistory,
      totalSessions,
      longestStreak,
      gems,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    if (snap.exists) {
      await doc.update(update);
    } else {
      await doc.set(update);
    }

    return {
      streakCount:  newStreak,
      lastDoneDate: tod,
      weekHistory,
      totalSessions,
      longestStreak,
      gems,
      todayDone: true,
    };
  } catch (e) {
    console.error('markTodayDone error:', e);
    return null;
  }
}

// ── Save today's selected pose ────────────────────────────────────────────────
export async function saveTodayPose(pose) {
  try {
    const doc = getUserDoc();
    if (!doc) return;

    const snap = await doc.get();
    const data = snap.exists ? snap.data() : {};

    // Only allow changing pose if not yet done today
    const tod = today();
    if (data.lastDoneDate === tod) return; // already done, can't change

    const update = { todayPose: { ...pose, selectedDate: tod } };
    if (snap.exists) await doc.update(update);
    else await doc.set(update);
  } catch (e) {
    console.error('saveTodayPose error:', e);
  }
}

// ── Default empty streak ──────────────────────────────────────────────────────
function getDefaultStreak() {
  return {
    streakCount:   0,
    lastDoneDate:  null,
    weekHistory:   {},
    totalSessions: 0,
    todayPose:     null,
    todayDone:     false,
    longestStreak: 0,
    gems:          [],
  };
}