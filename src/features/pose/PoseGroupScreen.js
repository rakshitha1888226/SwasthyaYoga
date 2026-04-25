import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, StatusBar, SafeAreaView, Image,
} from 'react-native';
import { POSE_GROUPS, GROUP_LEVELS } from './poseGroups';

const PoseGroupScreen = ({ navigation }) => {
  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('PoseSequence', { group: item })}
    >
      <View style={styles.cardTop}>
        <View style={[styles.emojiBox, { backgroundColor: item.bgColor }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={[
          styles.levelBadge,
          { backgroundColor: GROUP_LEVELS[item.level]?.bg || '#E8F5E9' }
        ]}>
          <Text style={[
            styles.levelText,
            { color: GROUP_LEVELS[item.level]?.text || '#2E7D32' }
          ]}>
            {item.level}
          </Text>
        </View>
        <Text style={styles.duration}>⏱ {item.totalDuration}</Text>
        <Text style={[styles.startArrow, { color: item.color }]}>Start →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🧘 Yoga Practice</Text>
          <Text style={styles.headerSub}>Choose your series</Text>
        </View>
      </View>

      {/* Groups list */}
      <FlatList
        data={POSE_GROUPS}
        keyExtractor={g => g.id}
        contentContainerStyle={styles.list}
        renderItem={renderGroup}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

  header: {
    backgroundColor: '#1B5E20',
    paddingTop: 16, paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

  list: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emojiBox: {
    width: 64, height: 64,
    borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 32 },
  cardInfo: { flex: 1 },
  groupName:   { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  subtitle:    { fontSize: 12, color: '#888', marginBottom: 6 },
  description: { fontSize: 13, color: '#555', lineHeight: 18 },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
  },
  levelText:  { fontSize: 11, fontWeight: 'bold' },
  duration:   { fontSize: 12, color: '#888', flex: 1 },
  startArrow: { fontSize: 14, fontWeight: 'bold' },
});

export default PoseGroupScreen;