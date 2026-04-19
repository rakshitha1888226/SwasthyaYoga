import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, FlatList, ScrollView, Dimensions,
} from 'react-native';
import { POSE_LIST, CATEGORIES, LEVEL_COLORS } from './poseList';
import { saveTodayPose } from './StreakService';

const { width } = Dimensions.get('window');

// ── Smart image ───────────────────────────────────────────────────────────────
const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
        <Text style={{ fontSize: (style?.height || 60) * 0.5 }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

// ── Pose detail modal (shown before camera) ───────────────────────────────────
const PoseDetailModal = ({ visible, pose, lang, onStartCamera, onClose }) => {
  if (!pose) return null;
  const t = (obj) => obj?.[lang] || obj?.en || '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          <SmartImage uri={pose.image} emoji={pose.emoji} style={styles.detailImage} />

          <View style={styles.detailContent}>
            <Text style={styles.detailEmoji}>{pose.emoji}</Text>
            <Text style={styles.detailName}>{t(pose.name)}</Text>
            <Text style={styles.detailSanskrit}>{pose.sanskritName}</Text>

            <View style={styles.detailMetaRow}>
              <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[pose.level]?.bg || '#E8F5E9' }]}>
                <Text style={[styles.levelText, { color: LEVEL_COLORS[pose.level]?.text || '#2E7D32' }]}>
                  {pose.level}
                </Text>
              </View>
              <Text style={styles.detailDuration}>⏱ {pose.duration}</Text>
            </View>

            <Text style={styles.detailBenefit}>{t(pose.benefit)}</Text>

            <TouchableOpacity style={styles.startCamBtn} onPress={onStartCamera}>
              <Text style={styles.startCamText}>📸 Open Camera & Check Pose</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeDetailBtn} onPress={onClose}>
              <Text style={styles.closeDetailText}>← Change Pose</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Pose picker modal ─────────────────────────────────────────────────────────
const PosePickerModal = ({ visible, lang, onSelect, onClose }) => {
  const [selectedCat, setSelectedCat] = useState('All');
  const t = (obj) => obj?.[lang] || obj?.en || '';

  const filtered = selectedCat === 'All'
    ? POSE_LIST
    : POSE_LIST.filter(p => p.category === selectedCat);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.pickerRoot}>

        {/* Header */}
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.pickerClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>
            {lang === 'te' ? 'నేటి ఆసన ఎంచుకోండి' :
             lang === 'hi' ? 'आज का आसन चुनें' :
             "Pick Today's Pose"}
          </Text>
          <Text style={styles.pickerCount}>{filtered.length} poses</Text>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCat === cat && styles.catPillActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pose list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.poseRow}
              onPress={() => onSelect(item)}
              activeOpacity={0.82}
            >
              <SmartImage uri={item.image} emoji={item.emoji} style={styles.poseRowImg} />
              <View style={styles.poseRowInfo}>
                <Text style={styles.poseRowName}>{t(item.name)}</Text>
                <Text style={styles.poseRowSanskrit}>{item.sanskritName}</Text>
                <Text style={styles.poseRowBenefit} numberOfLines={1}>{t(item.benefit)}</Text>
                <View style={styles.poseRowMeta}>
                  <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level]?.bg }]}>
                    <Text style={[styles.levelText, { color: LEVEL_COLORS[item.level]?.text }]}>{item.level}</Text>
                  </View>
                  <Text style={styles.poseRowDur}>⏱ {item.duration}</Text>
                </View>
              </View>
              <Text style={styles.poseRowArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

// ── Main Pose of the Day card ─────────────────────────────────────────────────
const PoseOfTheDay = ({ streakData, lang = 'en', navigation, onStreakUpdate }) => {
  const [showPicker,  setShowPicker]  = useState(false);
  const [showDetail,  setShowDetail]  = useState(false);
  const [selectedPose, setSelectedPose] = useState(streakData?.todayPose || null);

  const todayDone = streakData?.todayDone || false;
  const t = (obj) => obj?.[lang] || obj?.en || '';

  const handlePoseSelect = async (pose) => {
    setSelectedPose(pose);
    await saveTodayPose(pose);
    setShowPicker(false);
    setShowDetail(true);
  };

  const handleStartCamera = () => {
    setShowDetail(false);
    // Navigate to pose screen with callback to update streak
    navigation.navigate('Pose', {
      poseOfDay: selectedPose,
      onPoseDone: onStreakUpdate,
    });
  };

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {lang === 'te' ? '📅 నేటి ఆసన' :
             lang === 'hi' ? '📅 आज का आसन' :
             '📅 Pose of the Day'}
          </Text>
          {!todayDone && (
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.changeBtnText}>
                {selectedPose ? 'Change' : 'Pick Pose'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* No pose selected */}
        {!selectedPose && (
          <TouchableOpacity style={styles.emptyCard} onPress={() => setShowPicker(true)}>
            <Text style={styles.emptyEmoji}>🧘</Text>
            <Text style={styles.emptyTitle}>
              {lang === 'te' ? 'నేటి ఆసన ఎంచుకోండి' :
               lang === 'hi' ? 'आज का आसन चुनें' :
               "Pick today's pose"}
            </Text>
            <Text style={styles.emptySub}>
              {lang === 'te' ? '20+ ఆసనాల నుండి ఎంచుకోండి' :
               lang === 'hi' ? '20+ आसनों में से चुनें' :
               'Choose from 20+ asanas'}
            </Text>
            <View style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>
                {lang === 'te' ? 'ఆసన ఎంచుకోండి →' :
                 lang === 'hi' ? 'आसन चुनें →' :
                 'Select Pose →'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Pose selected */}
        {selectedPose && (
          <TouchableOpacity
            style={styles.selectedCard}
            onPress={() => !todayDone && setShowDetail(true)}
            activeOpacity={todayDone ? 1 : 0.85}
          >
            <SmartImage
              uri={selectedPose.image}
              emoji={selectedPose.emoji}
              style={styles.selectedImage}
            />

            {/* Done overlay */}
            {todayDone && (
              <View style={styles.doneOverlay}>
                <Text style={styles.doneCheck}>✅</Text>
                <Text style={styles.doneText}>Done Today!</Text>
                <Text style={styles.doneStreak}>🔥 Streak continued!</Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedEmoji}>{selectedPose.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{t(selectedPose.name)}</Text>
                <Text style={styles.selectedSanskrit}>{selectedPose.sanskritName}</Text>
                <Text style={styles.selectedBenefit} numberOfLines={1}>
                  {t(selectedPose.benefit)}
                </Text>
              </View>
              {!todayDone && (
                <View style={styles.startBtn}>
                  <Text style={styles.startBtnTxt}>Start →</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <PosePickerModal
        visible={showPicker}
        lang={lang}
        onSelect={handlePoseSelect}
        onClose={() => setShowPicker(false)}
      />
      <PoseDetailModal
        visible={showDetail}
        pose={selectedPose}
        lang={lang}
        onStartCamera={handleStartCamera}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14, paddingBottom: 10,
  },
  cardTitle:  { fontSize: 15, fontWeight: 'bold', color: '#1B5E20' },
  changeBtn:  { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  changeBtnText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  // Empty state
  emptyCard: { padding: 24, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  emptySub:   { fontSize: 13, color: '#888' },
  pickBtn:    { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  pickBtnText:{ color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Selected pose
  selectedCard: { overflow: 'hidden' },
  selectedImage: { width: '100%', height: 200 },
  doneOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  doneCheck:  { fontSize: 48 },
  doneText:   { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  doneStreak: { color: '#FF9800', fontSize: 16, fontWeight: '600' },
  selectedInfo: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  selectedEmoji:   { fontSize: 32 },
  selectedName:    { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  selectedSanskrit:{ fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 2 },
  selectedBenefit: { fontSize: 12, color: '#555' },
  startBtn:    { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  startBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Level badge
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  levelText:  { fontSize: 10, fontWeight: 'bold' },

  // Pose detail modal
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28,
    borderTopRightRadius: 28, overflow: 'hidden',
    maxHeight: '90%',
  },
  detailImage:   { width: '100%', height: 260 },
  detailContent: { padding: 20 },
  detailEmoji:   { fontSize: 36, marginBottom: 6 },
  detailName:    { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  detailSanskrit:{ fontSize: 15, color: '#888', fontStyle: 'italic', marginBottom: 12 },
  detailMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailDuration:{ fontSize: 13, color: '#555' },
  detailBenefit: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 20 },
  startCamBtn: {
    backgroundColor: '#2E7D32', padding: 16,
    borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  startCamText:   { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeDetailBtn: { alignItems: 'center', padding: 10 },
  closeDetailText:{ color: '#888', fontSize: 14 },

  // Pose picker modal
  pickerRoot:   { flex: 1, backgroundColor: '#F0F4F0' },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B5E20', paddingTop: 52,
    paddingBottom: 16, paddingHorizontal: 16,
  },
  pickerClose: { color: '#fff', fontSize: 18 },
  pickerTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  pickerCount: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  catScroll: { backgroundColor: '#fff', maxHeight: 50 },
  catRow:    { flexDirection: 'row', padding: 8, gap: 8 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#F0F0F0',
  },
  catPillActive: { backgroundColor: '#2E7D32' },
  catText:       { fontSize: 12, color: '#555', fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: 'bold' },

  poseRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    marginBottom: 10, overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  poseRowImg:     { width: 90, height: 90 },
  poseRowInfo:    { flex: 1, padding: 12 },
  poseRowName:    { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  poseRowSanskrit:{ fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 3 },
  poseRowBenefit: { fontSize: 12, color: '#555', marginBottom: 6 },
  poseRowMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  poseRowDur:     { fontSize: 11, color: '#888' },
  poseRowArrow:   { fontSize: 24, color: '#2E7D32', paddingRight: 12 },
});

export default PoseOfTheDay;