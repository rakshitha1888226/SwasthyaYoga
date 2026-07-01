import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, FlatList, ScrollView, Dimensions, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { POSE_LIST, CATEGORIES, LEVEL_COLORS } from './poseList';
import { saveTodayPose, markTodayDone } from './StreakService';

const { width } = Dimensions.get('window');
const HOLD_SECONDS = 20; // seconds to hold pose

// ── Smart image with emoji fallback ──────────────────────────────────────────
const SmartImage = ({ uri, emoji, style }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' }]}>
        <Text style={{ fontSize: (style?.height || 60) * 0.45 }}>{emoji || '🧘'}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
};

// ── Practice Screen HTML — camera + 20 sec timer + voice ─────────────────────
const makePracticeHTML = (poseImageUrl, poseName, poseEmoji) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;width:100vw;height:100vh;overflow:hidden;font-family:sans-serif}
video{position:absolute;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
canvas{position:absolute;top:0;left:0;width:100%;height:100%}

/* Reference image — top left corner */
#refImg{
  position:absolute;top:10px;left:10px;
  width:110px;height:140px;border-radius:12px;
  object-fit:cover;border:2px solid #4CAF50;
  z-index:20;background:#1a1a1a;
}
#refLabel{
  position:absolute;top:155px;left:10px;
  background:rgba(76,175,80,0.9);color:#fff;
  font-size:11px;font-weight:bold;
  padding:3px 8px;border-radius:8px;z-index:20;
}

/* Status */
#status{
  position:absolute;top:10px;left:50%;
  transform:translateX(-50%);
  background:rgba(0,0,0,0.75);color:#4CAF50;
  font-size:13px;padding:6px 16px;border-radius:20px;
  z-index:20;white-space:nowrap;
}

/* Timer ring */
#timerWrap{
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);
  z-index:20;align-items:center;
  display:flex;flex-direction:column;align-items:center;gap:8px;
}
#timerCircle{
  width:120px;height:120px;border-radius:60px;
  background:rgba(0,0,0,0.7);
  border:5px solid #4CAF50;
  display:flex;align-items:center;justify-content:center;
  flex-direction:column;
}
#timerNum{color:#fff;font-size:44px;font-weight:bold;line-height:1}
#timerLbl{color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px}
#timerMsg{color:#fff;font-size:13px;background:rgba(0,0,0,0.6);
  padding:5px 14px;border-radius:14px;text-align:center}

/* Voice badge */
#voiceBadge{
  position:absolute;bottom:120px;left:50%;
  transform:translateX(-50%);
  background:rgba(33,150,243,0.9);color:#fff;
  font-size:13px;font-weight:bold;
  padding:6px 18px;border-radius:20px;z-index:20;
  display:none;white-space:nowrap;
}
#voiceBadge.show{display:block}

/* Bottom bar */
#bar{
  position:absolute;bottom:0;left:0;right:0;
  padding:12px 16px 32px;background:rgba(0,0,0,0.7);
  display:flex;flex-direction:column;align-items:center;gap:10px;z-index:20;
}
#captureBtn{
  width:100%;padding:14px;font-size:16px;font-weight:bold;
  background:#2E7D32;color:#fff;border:none;border-radius:28px;cursor:pointer;
}
#captureBtn:disabled{background:#333;color:#666}
#micLabel{color:rgba(255,255,255,0.55);font-size:12px;text-align:center}

/* Completion overlay */
#doneOverlay{
  position:absolute;top:0;left:0;right:0;bottom:0;
  background:rgba(0,0,0,0.88);z-index:30;
  display:none;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;
}
#doneOverlay.show{display:flex}
#doneEmoji{font-size:80px}
#doneTxt{color:#fff;font-size:24px;font-weight:bold;text-align:center}
#doneSubTxt{color:#4CAF50;font-size:15px;text-align:center}
</style>
</head>
<body>

<!-- Reference pose image top-left -->
<img id="refImg" src="${poseImageUrl}" onerror="this.style.display='none'" />
<div id="refLabel">${poseEmoji} Copy this!</div>

<div id="status">Starting camera...</div>

<!-- Timer shown in center -->
<div id="timerWrap">
  <div id="timerCircle">
    <span id="timerNum">${HOLD_SECONDS}</span>
    <span id="timerLbl">seconds</span>
  </div>
  <div id="timerMsg">Hold ${poseName} pose 🧘</div>
</div>

<div id="voiceBadge">🎤 Say "capture" to finish early</div>

<video id="v" autoplay playsinline muted></video>
<canvas id="c"></canvas>

<!-- Completion overlay -->
<div id="doneOverlay">
  <div id="doneEmoji">🔥</div>
  <div id="doneTxt">Amazing! Streak Saved!</div>
  <div id="doneSubTxt">You held ${poseName} for ${HOLD_SECONDS} seconds</div>
</div>

<div id="bar">
  <button id="captureBtn" onclick="captureNow()" disabled>📸 Capture Now (or say "capture")</button>
  <div id="micLabel">🎙️ Say "capture" anytime to save streak early</div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js"></script>

<script>
const v = document.getElementById('v');
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const statusEl = document.getElementById('status');
const timerNum = document.getElementById('timerNum');
const timerMsg = document.getElementById('timerMsg');
const captureBtn = document.getElementById('captureBtn');
const voiceBadge = document.getElementById('voiceBadge');
const micLabel = document.getElementById('micLabel');
const doneOverlay = document.getElementById('doneOverlay');

let poseDetected = false;
let timeLeft = ${HOLD_SECONDS};
let timerInterval = null;
let done = false;
let SR = null;

function resize(){ c.width=window.innerWidth; c.height=window.innerHeight; }
resize(); window.addEventListener('resize', resize);

function toRN(data){ try{window.ReactNativeWebView.postMessage(JSON.stringify(data));}catch(e){} }

// MediaPipe
const poseDetector = new Pose({
  locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/' + f
});
poseDetector.setOptions({
  modelComplexity:0, smoothLandmarks:true,
  minDetectionConfidence:0.5, minTrackingConfidence:0.5
});
poseDetector.onResults(r => {
  ctx.clearRect(0,0,c.width,c.height);
  ctx.save(); ctx.scale(-1,1); ctx.translate(-c.width,0);
  ctx.drawImage(r.image,0,0,c.width,c.height); ctx.restore();

  if(r.poseLandmarks){
    const m = r.poseLandmarks.map(lm=>({...lm,x:1-lm.x}));
    drawConnectors(ctx,m,POSE_CONNECTIONS,{color:'#00E676',lineWidth:3});
    drawLandmarks(ctx,m,{color:'#FFEB3B',fillColor:'#FF6F00',radius:4});
    poseDetected = true;
    captureBtn.disabled = false;
    if(!done) statusEl.textContent = '✅ Hold the pose! Timer running...';
    statusEl.style.color = '#4CAF50';
  } else {
    poseDetected = false;
    if(!done){
      statusEl.textContent = '👤 Step into frame...';
      statusEl.style.color = '#FFC107';
    }
  }
});

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false
    });
    v.srcObject = stream;
    await new Promise(res=>{ v.onloadedmetadata=res; });
    v.play();
    statusEl.textContent = 'Loading pose model...';
    async function loop(){ if(v.readyState>=2) await poseDetector.send({image:v}); requestAnimationFrame(loop); }
    loop();
    startTimer();
    setupVoice();
    toRN({type:'ready'});
  }catch(e){
    statusEl.textContent='Camera error: '+e.message;
    statusEl.style.color='#F44336';
    toRN({type:'error',message:e.message});
  }
}
startCamera();

// Timer — counts down, saves streak when done
function startTimer(){
  timerInterval = setInterval(()=>{
    if(done) return;
    timeLeft--;
    timerNum.textContent = timeLeft;
    // Color changes as timer progresses
    if(timeLeft <= 5){
      document.getElementById('timerCircle').style.borderColor = '#FF9800';
      timerNum.style.color = '#FF9800';
    }
    if(timeLeft <= 0){
      clearInterval(timerInterval);
      finishPose('timer');
    }
  }, 1000);
}

// Finish — capture snapshot and save streak
function captureNow(){
  if(done) return;
  clearInterval(timerInterval);
  finishPose('manual');
}

function finishPose(method){
  if(done) return;
  done = true;
  captureBtn.disabled = true;

  // Take snapshot
  const s = document.createElement('canvas');
  s.width=480; s.height=360;
  s.getContext('2d').drawImage(c,0,0,480,360);
  const img = s.toDataURL('image/jpeg',0.7);

  // Show done overlay
  doneOverlay.classList.add('show');

  // Send to React Native
  toRN({
    type: 'done',
    imageData: img,
    method: method,
    secondsHeld: ${HOLD_SECONDS} - timeLeft,
  });
}

// Voice — say "capture" to finish early
function setupVoice(){
  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SRClass){ micLabel.textContent='🎙️ Tap button to capture'; return; }

  SR = new SRClass();
  SR.lang='en-IN'; SR.continuous=false;
  SR.interimResults=false; SR.maxAlternatives=5;

  SR.onstart=()=>{ voiceBadge.classList.add('show'); };
  SR.onresult=(e)=>{
    const words=['capture','cap','take','done','go','finish','stop','save'];
    for(let i=0;i<e.results[0].length;i++){
      const w=e.results[0][i].transcript.toLowerCase().trim();
      if(words.some(k=>w.includes(k))){
        voiceBadge.classList.remove('show');
        captureNow();
        return;
      }
    }
    if(!done) startListening();
  };
  SR.onerror=(e)=>{ voiceBadge.classList.remove('show'); if(e.error!=='not-allowed'&&!done) setTimeout(startListening,1000); };
  SR.onend=()=>{ voiceBadge.classList.remove('show'); if(!done) setTimeout(startListening,600); };
  startListening();
}

function startListening(){
  if(done||!SR) return;
  try{ SR.start(); }catch(e){ setTimeout(startListening,1000); }
}
</script>
</body>
</html>`;

// ── Pose Practice Screen (full screen modal with camera) ──────────────────────
const PosePracticeScreen = ({ visible, pose, lang, onDone, onClose }) => {
  if (!pose) return null;
  const t = (obj) => obj?.[lang] || obj?.en || '';

  const handleMessage = async (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'done') {
        // Save streak!
        await markTodayDone(pose.id, t(pose.name), 100);
        onDone(data);
      }
    } catch (err) {}
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Close button */}
        <TouchableOpacity style={st.closeBtn} onPress={onClose}>
          <Text style={st.closeTxt}>✕</Text>
        </TouchableOpacity>

        <WebView
          source={{ html: makePracticeHTML(pose.image, t(pose.name), pose.emoji), baseUrl: 'http://localhost' }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          domStorageEnabled
          mediaCapturePermissionGrantType="grant"
          onPermissionRequest={(req) => req.grant(req.resources)}
        />
      </View>
    </Modal>
  );
};

// ── Pose detail modal ─────────────────────────────────────────────────────────
const PoseDetailModal = ({ visible, pose, lang, onStartPractice, onClose }) => {
  if (!pose) return null;
  const t = (obj) => obj?.[lang] || obj?.en || '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.detailOverlay}>
        <View style={st.detailCard}>
          <SmartImage uri={pose.image} emoji={pose.emoji} style={st.detailImage} />
          <ScrollView style={st.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={st.detailContent}>
              <Text style={st.detailEmoji}>{pose.emoji}</Text>
              <Text style={st.detailName}>{t(pose.name)}</Text>
              <Text style={st.detailSanskrit}>{pose.sanskritName}</Text>

              <View style={st.detailMetaRow}>
                <View style={[st.levelBadge, { backgroundColor: LEVEL_COLORS[pose.level]?.bg || '#E8F5E9' }]}>
                  <Text style={[st.levelText, { color: LEVEL_COLORS[pose.level]?.text || '#2E7D32' }]}>
                    {pose.level}
                  </Text>
                </View>
                <Text style={st.detailDuration}>⏱ {pose.duration}</Text>
              </View>

              <Text style={st.detailBenefit}>{t(pose.benefit)}</Text>

              {/* How it works */}
              <View style={st.howBox}>
                <Text style={st.howTitle}>📋 How streak works</Text>
                <Text style={st.howText}>
                  1. Camera opens with reference image{'\n'}
                  2. Do the pose in front of camera{'\n'}
                  3. Say "capture" OR hold for 20 seconds{'\n'}
                  4. Streak saved automatically! 🔥
                </Text>
              </View>

              <TouchableOpacity style={st.startBtn} onPress={onStartPractice}>
                <Text style={st.startBtnTxt}>🧘 Start Practice → Save Streak</Text>
              </TouchableOpacity>

              <TouchableOpacity style={st.closeDetailBtn} onPress={onClose}>
                <Text style={st.closeDetailTxt}>← Change Pose</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Pose picker modal ─────────────────────────────────────────────────────────
const PosePickerModal = ({ visible, lang, onSelect, onClose }) => {
  const [selectedCat, setSelectedCat] = useState('All');
  const t = (obj) => obj?.[lang] || obj?.en || '';
  const filtered = selectedCat === 'All' ? POSE_LIST : POSE_LIST.filter(p => p.category === selectedCat);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={st.pickerRoot}>
        <View style={st.pickerHeader}>
          <TouchableOpacity onPress={onClose}><Text style={st.pickerClose}>✕</Text></TouchableOpacity>
          <Text style={st.pickerTitle}>
            {lang === 'te' ? 'నేటి ఆసన ఎంచుకోండి' : lang === 'hi' ? 'आज का आसन चुनें' : "Pick Today's Pose"}
          </Text>
          <Text style={st.pickerCount}>{filtered.length} poses</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll} contentContainerStyle={st.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[st.catPill, selectedCat === cat && st.catPillActive]} onPress={() => setSelectedCat(cat)}>
              <Text style={[st.catText, selectedCat === cat && st.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={st.poseRow} onPress={() => onSelect(item)} activeOpacity={0.82}>
              <SmartImage uri={item.image} emoji={item.emoji} style={st.poseRowImg} />
              <View style={st.poseRowInfo}>
                <Text style={st.poseRowName}>{t(item.name)}</Text>
                <Text style={st.poseRowSanskrit}>{item.sanskritName}</Text>
                <Text style={st.poseRowBenefit} numberOfLines={1}>{t(item.benefit)}</Text>
                <View style={st.poseRowMeta}>
                  <View style={[st.levelBadge, { backgroundColor: LEVEL_COLORS[item.level]?.bg }]}>
                    <Text style={[st.levelText, { color: LEVEL_COLORS[item.level]?.text }]}>{item.level}</Text>
                  </View>
                  <Text style={st.poseRowDur}>⏱ {item.duration}</Text>
                </View>
              </View>
              <Text style={st.poseRowArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

// ── Main Pose of the Day card ─────────────────────────────────────────────────
const PoseOfTheDay = ({ streakData, lang = 'en', navigation, onStreakUpdate }) => {
  const [showPicker,   setShowPicker]   = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [selectedPose, setSelectedPose] = useState(streakData?.todayPose || null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const todayDone = streakData?.todayDone || false;
  const t = (obj) => obj?.[lang] || obj?.en || '';

  const handlePoseSelect = async (pose) => {
    setSelectedPose(pose);
    await saveTodayPose(pose);
    setShowPicker(false);
    setShowDetail(true);
  };

  const handleStartPractice = () => {
    setShowDetail(false);
    setShowPractice(true);
  };

  const handlePracticeDone = async (data) => {
    setShowPractice(false);
    // Pulse animation on streak board
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.0, duration: 200, useNativeDriver: true }),
    ]).start();
    // Tell dashboard to reload streak
    onStreakUpdate?.();
  };

  return (
    <>
      <View style={st.card}>
        {/* Header */}
        <View style={st.cardHeader}>
          <Text style={st.cardTitle}>
            {lang === 'te' ? '📅 నేటి ఆసన' : lang === 'hi' ? '📅 आज का आसन' : '📅 Pose of the Day'}
          </Text>
          {!todayDone && (
            <TouchableOpacity style={st.changeBtn} onPress={() => setShowPicker(true)}>
              <Text style={st.changeBtnText}>{selectedPose ? 'Change' : 'Pick Pose'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* No pose selected */}
        {!selectedPose && (
          <TouchableOpacity style={st.emptyCard} onPress={() => setShowPicker(true)}>
            <Text style={st.emptyEmoji}>🧘</Text>
            <Text style={st.emptyTitle}>
              {lang === 'te' ? 'నేటి ఆసన ఎంచుకోండి' : lang === 'hi' ? 'आज का आसन चुनें' : "Pick today's pose"}
            </Text>
            <Text style={st.emptySub}>
              {lang === 'te' ? '30 ఆసనాల నుండి ఎంచుకోండి' : lang === 'hi' ? '30 आसनों में से चुनें' : 'Choose from 30 asanas'}
            </Text>
            <View style={st.pickBtn}>
              <Text style={st.pickBtnText}>
                {lang === 'te' ? 'ఆసన ఎంచుకోండి →' : lang === 'hi' ? 'आसन चुनें →' : 'Select Pose →'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Pose selected */}
        {selectedPose && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={st.selectedCard}
              onPress={() => !todayDone && setShowDetail(true)}
              activeOpacity={todayDone ? 1 : 0.85}
            >
              <SmartImage uri={selectedPose.image} emoji={selectedPose.emoji} style={st.selectedImage} />

              {todayDone && (
                <View style={st.doneOverlay}>
                  <Text style={st.doneCheck}>✅</Text>
                  <Text style={st.doneText}>Done Today! 🔥</Text>
                  <Text style={st.doneStreak}>Streak continues!</Text>
                </View>
              )}

              <View style={st.selectedInfo}>
                <Text style={st.selectedEmoji}>{selectedPose.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.selectedName}>{t(selectedPose.name)}</Text>
                  <Text style={st.selectedSanskrit}>{selectedPose.sanskritName}</Text>
                  <Text style={st.selectedBenefit} numberOfLines={1}>{t(selectedPose.benefit)}</Text>
                </View>
                {!todayDone && (
                  <View style={st.startBtnSmall}>
                    <Text style={st.startBtnSmallTxt}>Start →</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <PosePickerModal visible={showPicker} lang={lang} onSelect={handlePoseSelect} onClose={() => setShowPicker(false)} />
      <PoseDetailModal visible={showDetail} pose={selectedPose} lang={lang} onStartPractice={handleStartPractice} onClose={() => setShowDetail(false)} />
      <PosePracticeScreen visible={showPractice} pose={selectedPose} lang={lang} onDone={handlePracticeDone} onClose={() => setShowPractice(false)} />
    </>
  );
};

const st = StyleSheet.create({
  // Main card
  card: { backgroundColor:'#fff', marginHorizontal:16, marginTop:16, borderRadius:20, elevation:3, overflow:'hidden' },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, paddingBottom:10 },
  cardTitle:  { fontSize:15, fontWeight:'bold', color:'#1B5E20' },
  changeBtn:  { backgroundColor:'#E8F5E9', paddingHorizontal:12, paddingVertical:5, borderRadius:12 },
  changeBtnText: { fontSize:12, color:'#2E7D32', fontWeight:'600' },

  // Empty state
  emptyCard:  { padding:24, alignItems:'center', gap:8 },
  emptyEmoji: { fontSize:48 },
  emptyTitle: { fontSize:16, fontWeight:'bold', color:'#222' },
  emptySub:   { fontSize:13, color:'#888' },
  pickBtn:    { backgroundColor:'#2E7D32', paddingHorizontal:24, paddingVertical:10, borderRadius:20, marginTop:4 },
  pickBtnText:{ color:'#fff', fontWeight:'bold', fontSize:14 },

  // Selected
  selectedCard:  { overflow:'hidden' },
  selectedImage: { width:'100%', height:200 },
  doneOverlay: { position:'absolute', top:0, left:0, right:0, height:200, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'center', alignItems:'center', gap:6 },
  doneCheck:  { fontSize:48 },
  doneText:   { color:'#fff', fontSize:20, fontWeight:'bold' },
  doneStreak: { color:'#FF9800', fontSize:14, fontWeight:'600' },
  selectedInfo: { flexDirection:'row', alignItems:'center', padding:14, gap:12 },
  selectedEmoji:   { fontSize:32 },
  selectedName:    { fontSize:15, fontWeight:'bold', color:'#222', marginBottom:2 },
  selectedSanskrit:{ fontSize:12, color:'#888', fontStyle:'italic', marginBottom:2 },
  selectedBenefit: { fontSize:12, color:'#555' },
  startBtnSmall:   { backgroundColor:'#2E7D32', paddingHorizontal:14, paddingVertical:8, borderRadius:12 },
  startBtnSmallTxt:{ color:'#fff', fontWeight:'bold', fontSize:13 },

  // Close button for practice screen
  closeBtn:{ position:'absolute', top:48, right:16, zIndex:50, backgroundColor:'rgba(0,0,0,0.5)', width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  closeTxt:{ color:'#fff', fontSize:18 },

  // Detail modal
  detailOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  detailCard:    { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden', maxHeight:'90%' },
  detailScroll:  { },
  detailImage:   { width:'100%', height:240 },
  detailContent: { padding:20 },
  detailEmoji:   { fontSize:36, marginBottom:6 },
  detailName:    { fontSize:24, fontWeight:'bold', color:'#222', marginBottom:4 },
  detailSanskrit:{ fontSize:15, color:'#888', fontStyle:'italic', marginBottom:12 },
  detailMetaRow: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  detailDuration:{ fontSize:13, color:'#555' },
  detailBenefit: { fontSize:15, color:'#333', lineHeight:22, marginBottom:16 },
  howBox: { backgroundColor:'#F0F4F0', borderRadius:12, padding:14, marginBottom:16 },
  howTitle:{ fontSize:13, fontWeight:'bold', color:'#1B5E20', marginBottom:8 },
  howText: { fontSize:13, color:'#444', lineHeight:22 },
  startBtn:      { backgroundColor:'#2E7D32', padding:16, borderRadius:14, alignItems:'center', marginBottom:10 },
  startBtnTxt:   { color:'#fff', fontWeight:'bold', fontSize:16 },
  closeDetailBtn:{ alignItems:'center', padding:10 },
  closeDetailTxt:{ color:'#888', fontSize:14 },

  // Level badge
  levelBadge:{ paddingHorizontal:8, paddingVertical:3, borderRadius:8, alignSelf:'flex-start' },
  levelText: { fontSize:10, fontWeight:'bold' },

  // Picker
  pickerRoot:  { flex:1, backgroundColor:'#F0F4F0' },
  pickerHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1B5E20', paddingTop:52, paddingBottom:16, paddingHorizontal:16 },
  pickerClose: { color:'#fff', fontSize:18 },
  pickerTitle: { color:'#fff', fontSize:17, fontWeight:'bold' },
  pickerCount: { color:'rgba(255,255,255,0.7)', fontSize:12 },
  catScroll:   { backgroundColor:'#fff', maxHeight:50 },
  catRow:      { flexDirection:'row', padding:8, gap:8 },
  catPill:     { paddingHorizontal:14, paddingVertical:6, borderRadius:16, backgroundColor:'#F0F0F0' },
  catPillActive:{ backgroundColor:'#2E7D32' },
  catText:     { fontSize:12, color:'#555', fontWeight:'500' },
  catTextActive:{ color:'#fff', fontWeight:'bold' },
  poseRow:     { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:16, marginBottom:10, overflow:'hidden', elevation:2 },
  poseRowImg:  { width:90, height:90 },
  poseRowInfo: { flex:1, padding:12 },
  poseRowName: { fontSize:14, fontWeight:'bold', color:'#222', marginBottom:2 },
  poseRowSanskrit:{ fontSize:11, color:'#888', fontStyle:'italic', marginBottom:3 },
  poseRowBenefit: { fontSize:12, color:'#555', marginBottom:6 },
  poseRowMeta: { flexDirection:'row', alignItems:'center', gap:8 },
  poseRowDur:  { fontSize:11, color:'#888' },
  poseRowArrow:{ fontSize:24, color:'#2E7D32', paddingRight:12 },
});

export default PoseOfTheDay;