// ── SwasthyaYoga Streak Service ───────────────────────────────────────────────
// Primary: Firebase Firestore
// Fallback: AsyncStorage (when Firestore is unavailable / offline)

import firestore from '@react-native-firebase/firestore';
import auth      from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_KEY = 'swasthya_streak_v1';

const todayStr = () => new Date().toISOString().split('T')[0];

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export function getTodayString() { return todayStr(); }

export function getWeekDates() {
  const now  = new Date();
  const day  = now.getDay();
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - day + i);
    week.push(d.toISOString().split('T')[0]);
  }
  return week;
}

// ── Default empty streak ──────────────────────────────────────────────────────
function defaultStreak() {
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

// ── AsyncStorage helpers ──────────────────────────────────────────────────────
async function localLoad() {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_KEY);
    return raw ? JSON.parse(raw) : defaultStreak();
  } catch { return defaultStreak(); }
}

async function localSave(data) {
  try {
    await AsyncStorage.setItem(ASYNC_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('AsyncStorage save error:', e);
  }
}

// ── Firestore doc ref ─────────────────────────────────────────────────────────
function getUserDoc() {
  const uid = auth().currentUser?.uid;
  if (!uid) return null;
  return firestore().collection('streaks').doc(uid);
}

// ── Load streak (Firestore first, AsyncStorage fallback) ──────────────────────
export async function loadStreakData() {
  try {
    const doc = getUserDoc();
    if (!doc) return await localLoad();

    const snap = await doc.get();
    const data = snap.exists ? snap.data() : defaultStreak();

    // Reset streak if missed yesterday
    const last = data.lastDoneDate;
    const tod  = todayStr();
    const yest = yesterdayStr();
    let streakCount = data.streakCount || 0;
    if (last && last !== tod && last !== yest) {
      streakCount = 0;
      doc.update({ streakCount: 0 }).catch(() => {});
    }

    const result = {
      streakCount,
      lastDoneDate:  data.lastDoneDate  || null,
      weekHistory:   data.weekHistory   || {},
      totalSessions: data.totalSessions || 0,
      todayPose:     data.todayPose     || null,
      todayDone:     data.lastDoneDate  === tod,
      longestStreak: data.longestStreak || 0,
      gems:          data.gems          || [],
    };

    // Sync to local as cache
    await localSave(result);
    return result;

  } catch (e) {
    console.log('Firestore unavailable, using local:', e.message);
    // Firestore offline — use AsyncStorage
    const local = await localLoad();
    const tod   = todayStr();
    const yest  = yesterdayStr();
    const last  = local.lastDoneDate;
    if (last && last !== tod && last !== yest) {
      local.streakCount = 0;
      await localSave(local);
    }
    local.todayDone = local.lastDoneDate === tod;
    return local;
  }
}

// ── Mark today done ───────────────────────────────────────────────────────────
export async function markTodayDone(poseId, poseName, score) {
  const tod  = todayStr();
  const yest = yesterdayStr();

  // Load current data
  let data;
  try {
    const doc  = getUserDoc();
    const snap = doc ? await doc.get() : null;
    data = snap?.exists ? snap.data() : await localLoad();
  } catch {
    data = await localLoad();
  }

  const last = data.lastDoneDate;
  let newStreak = 1;
  if (last === yest)  newStreak = (data.streakCount || 0) + 1;
  else if (last === tod) newStreak = data.streakCount || 1;

  const weekHistory = { ...(data.weekHistory || {}), [tod]: { poseId, poseName, score, done: true } };
  const gems = [...(data.gems || [])];
  [7, 30, 100, 365].forEach(m => { if (newStreak >= m && !gems.includes(m)) gems.push(m); });

  const longestStreak  = Math.max(newStreak, data.longestStreak || 0);
  const totalSessions  = (data.totalSessions || 0) + (last === tod ? 0 : 1);

  const updated = {
    streakCount:   newStreak,
    lastDoneDate:  tod,
    weekHistory,
    totalSessions,
    longestStreak,
    gems,
    todayDone: true,
    todayPose: data.todayPose || null,
  };

  // Save locally always
  await localSave(updated);

  // Try Firestore
  try {
    const doc = getUserDoc();
    if (doc) {
      const snap = await doc.get();
      const fsUpdate = { ...updated, updatedAt: firestore.FieldValue.serverTimestamp() };
      if (snap.exists) await doc.update(fsUpdate);
      else await doc.set(fsUpdate);
    }
  } catch (e) {
    console.log('Firestore save failed, kept local:', e.message);
  }

  return updated;
}

// ── Save today's selected pose ────────────────────────────────────────────────
export async function saveTodayPose(pose) {
  const tod = todayStr();

  // Save locally first
  try {
    const local = await localLoad();
    if (local.lastDoneDate === tod) return; // already done
    local.todayPose = { ...pose, selectedDate: tod };
    await localSave(local);
  } catch (e) {}

  // Try Firestore
  try {
    const doc = getUserDoc();
    if (!doc) return;
    const snap = await doc.get();
    const data = snap.exists ? snap.data() : {};
    if (data.lastDoneDate === tod) return;
    const update = { todayPose: { ...pose, selectedDate: tod } };
    if (snap.exists) await doc.update(update);
    else await doc.set(update);
  } catch (e) {
    console.log('saveTodayPose Firestore failed, kept local:', e.message);
  }
}