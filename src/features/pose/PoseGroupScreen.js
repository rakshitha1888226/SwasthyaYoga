import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, FlatList,
} from 'react-native';

// ── Pose groups data ────────────────────────────────────────────────────────────
const POSE_GROUPS = [
  {
    id: 'beginner',
    name: 'Beginner',
    emoji: '🌱',
    description: 'Simple poses for those just starting their yoga journey',
    color: '#4CAF50',
    poseCount: 6,
    poses: ['mountain', 'tree', 'warrior1', 'child', 'cat', 'downdog'],
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    emoji: '🔥',
    description: 'Build strength and flexibility with these flowing poses',
    color: '#FF9800',
    poseCount: 6,
    poses: ['warrior2', 'warrior3', 'triangle', 'chair', 'bridge', 'pigeon'],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    emoji: '⚡',
    description: 'Challenge yourself with these demanding poses',
    color: '#9C27B0',
    poseCount: 4,
    poses: ['crow', 'headstand', 'side_plank', 'wheel'],
  },
  {
    id: 'morning',
    name: 'Morning Flow',
    emoji: '🌅',
    description: 'Energising sequence to start your day right',
    color: '#FF5722',
    poseCount: 5,
    poses: ['mountain', 'warrior1', 'downdog', 'cobra', 'child'],
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    emoji: '😌',
    description: 'Gentle poses to unwind and reduce stress',
    color: '#2196F3',
    poseCount: 5,
    poses: ['child', 'pigeon', 'supine_twist', 'legs_up', 'savasana'],
  },
  {
    id: 'core',
    name: 'Core Strength',
    emoji: '💪',
    description: 'Target your core muscles with these powerful poses',
    color: '#F44336',
    poseCount: 5,
    poses: ['plank', 'side_plank', 'boat', 'chair', 'warrior3'],
  },
];

const PoseGroupScreen = ({ navigation }) => {
  const handleGroupPress = (group) => {
    navigation.navigate('PoseSequence', { group });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Yoga Poses</Text>
          <Text style={styles.headerSub}>Choose a group to practise</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsTxt}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {POSE_GROUPS.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => handleGroupPress(group)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBadge, { backgroundColor: group.color + '22' }]}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDesc} numberOfLines={2}>{group.description}</Text>
              <View style={styles.groupMeta}>
                <View style={[styles.badge, { backgroundColor: group.color + '33' }]}>
                  <Text style={[styles.badgeText, { color: group.color }]}>
                    {group.poseCount} poses
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.arrow, { borderColor: group.color }]}>
              <Text style={[styles.arrowText, { color: group.color }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick AI Pose Check */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => navigation.navigate('PoseCamera', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.aiEmoji}>🤖</Text>
          <View style={styles.aiInfo}>
            <Text style={styles.aiTitle}>Quick AI Pose Check</Text>
            <Text style={styles.aiDesc}>Detect and classify any pose instantly</Text>
          </View>
          <Text style={styles.aiArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a1a2e' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn:     { width: 40 },
  backTxt:     { color: '#fff', fontSize: 28, lineHeight: 28 },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  settingsBtn: { width: 40, alignItems: 'flex-end' },
  settingsTxt: { fontSize: 20 },

  content: { padding: 16, gap: 12 },

  groupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 16, gap: 14,
  },
  iconBadge: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  groupEmoji:{ fontSize: 26 },
  groupInfo: { flex: 1, gap: 4 },
  groupName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  groupDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 },
  groupMeta: { flexDirection: 'row', marginTop: 4 },
  badge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  arrow:     { width: 32, height: 32, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 20, lineHeight: 22 },

  aiCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46,125,50,0.25)',
    borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)',
    marginTop: 4,
  },
  aiEmoji: { fontSize: 30 },
  aiInfo:  { flex: 1 },
  aiTitle: { color: '#4CAF50', fontSize: 16, fontWeight: '700' },
  aiDesc:  { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  aiArrow: { color: '#4CAF50', fontSize: 24 },
});

export default PoseGroupScreen;
