import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, StatusBar, SafeAreaView, Image,
} from 'react-native';

const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = React.useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
        <Text style={{ fontSize: 28 }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

const PoseSequenceScreen = ({ navigation, route }) => {
  const { group } = route.params || {};
  if (!group) return null;

  const startFromPose = (index) => {
    navigation.navigate('PoseCamera', {
      group,
      poses: group.poses,
      currentIndex: index,
    });
  };

  const startAll = () => startFromPose(0);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={group.color} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: group.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{group.emoji} {group.name}</Text>
          <Text style={styles.headerSub}>{group.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.startAllBtn} onPress={startAll}>
          <Text style={styles.startAllTxt}>Start All →</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.descBox}>
        <Text style={styles.descText}>{group.description}</Text>
        <View style={styles.descMeta}>
          <Text style={styles.descMetaItem}>⏱ {group.totalDuration}</Text>
          <Text style={styles.descMetaItem}>📊 {group.level}</Text>
          <Text style={styles.descMetaItem}>🧘 {group.poses?.length} poses</Text>
        </View>
      </View>

      {/* Poses list */}
      <FlatList
        data={group.poses || []}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.poseCard}
            onPress={() => startFromPose(index)}
            activeOpacity={0.85}
          >
            <SmartImage uri={item.image} emoji={item.emoji} style={styles.poseImg} />
            <View style={styles.poseInfo}>
              <View style={styles.poseTopRow}>
                <View style={[styles.stepBadge, { backgroundColor: group.color }]}>
                  <Text style={styles.stepBadgeTxt}>{item.step || index + 1}</Text>
                </View>
                <Text style={styles.poseName}>{item.name}</Text>
                <Text style={styles.poseDuration}>{item.duration}</Text>
              </View>
              <Text style={styles.poseInstruction} numberOfLines={2}>{item.instruction}</Text>
              {item.keyPoints && (
                <Text style={styles.poseKeyPoints} numberOfLines={1}>
                  🎯 {item.keyPoints}
                </Text>
              )}
            </View>
            <Text style={[styles.goArrow, { color: group.color }]}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F0' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16, gap: 12,
  },
  backBtn:    { padding: 4 },
  backArrow:  { color: '#fff', fontSize: 22 },
  headerTitle:{ color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  startAllBtn:{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  startAllTxt:{ color: '#fff', fontWeight: 'bold', fontSize: 13 },

  descBox: {
    backgroundColor: '#fff', margin: 12, borderRadius: 14,
    padding: 14, elevation: 2, gap: 10,
  },
  descText: { fontSize: 14, color: '#444', lineHeight: 20 },
  descMeta: { flexDirection: 'row', gap: 16 },
  descMetaItem: { fontSize: 12, color: '#888' },

  list: { padding: 12, gap: 10 },

  poseCard: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  poseImg:    { width: 90, height: 90 },
  poseInfo:   { flex: 1, padding: 12, gap: 5 },
  poseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBadge:  { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  poseName:     { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#222' },
  poseDuration: { fontSize: 11, color: '#888' },
  poseInstruction: { fontSize: 12, color: '#555', lineHeight: 17 },
  poseKeyPoints:   { fontSize: 11, color: '#888' },
  goArrow: { fontSize: 28, paddingRight: 12 },
});

export default PoseSequenceScreen;