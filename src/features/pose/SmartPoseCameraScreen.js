import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, PermissionsAndroid, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { markTodayDone } from '../streak/StreakService';
import { classifyPoseOnDevice } from './PoseDetectionService';

const SCALER_PARAMS = require('../../../android/app/src/main/assets/scaler_params.json');
const API_URL    = 'http://10.201.87.109:5000/predict';

const POSE_DISPLAY = {
  downdog:  { en: 'Downward Dog', te: 'అధో ముఖ శ్వానాసన', emoji: '🐕' },
  goddess:  { en: 'Goddess Pose', te: 'దేవి ఆసన',          emoji: '🧘' },
  plank:    { en: 'Plank Pose',   te: 'ఫలకాసన',             emoji: '💪' },
  tree:     { en: 'Tree Pose',    te: 'వృక్షాసన',            emoji: '🌳' },
  warrior2: { en: 'Warrior II',   te: 'వీరభద్రాసన II',      emoji: '⚔️' },
};

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) { return false; }
}

async function classifyPose(landmarks) {
  // 1. Try On-Device AI Classifier (Instant, 100% Offline)
  const localResult = classifyPoseOnDevice(landmarks);
  if (localResult) return localResult;

  // 2. Optional fallback to Python server if available
  try {
    const flat = [];
    for (const lm of landmarks) flat.push(lm.x, lm.y, lm.z, lm.visibility ?? 0);
    if (flat.length !== 132) return null;
    const scaled = flat.map((v, i) =>
      (v - SCALER_PARAMS.mean[i]) / SCALER_PARAMS.scale[i]
    );
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks: scaled }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

// ── HTML with voice + hand gesture capture ────────────────────────────────────
const CAMERA_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#000; width:100vw; height:100vh; overflow:hidden; font-family:sans-serif; }
video  { position:absolute; width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }
canvas { position:absolute; top:0; left:0; width:100%; height:100%; }

#msg {
  position:absolute; top:10px; left:50%;
  transform:translateX(-50%);
  background:rgba(0,0,0,0.75);
  color:#4CAF50; font-size:13px;
  padding:6px 18px; border-radius:20px;
  white-space:nowrap; z-index:10;
}

/* Gesture countdown ring */
#gestureRing {
  position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%);
  width:120px; height:120px;
  border-radius:60px;
  border:6px solid #4CAF50;
  display:none;
  z-index:20;
  align-items:center; justify-content:center;
  background:rgba(0,0,0,0.5);
}
#gestureRing.show { display:flex; }
#gestureCount { color:#fff; font-size:48px; font-weight:bold; }

/* Voice indicator */
#voiceBadge {
  position:absolute; top:48px; left:50%;
  transform:translateX(-50%);
  background:rgba(33,150,243,0.9);
  color:#fff; font-size:12px; font-weight:bold;
  padding:4px 14px; border-radius:20px;
  z-index:10; display:none;
}
#voiceBadge.show { display:block; }

/* Capture button */
#btn {
  position:absolute; bottom:20px; left:16px; right:16px;
  padding:16px; font-size:17px; font-weight:bold;
  background:#2E7D32; color:#fff;
  border:none; border-radius:30px; z-index:10; cursor:pointer;
}
#btn:disabled { background:#333; color:#666; }

/* Mic status */
#micRow {
  position:absolute; bottom:76px; left:50%;
  transform:translateX(-50%);
  color:rgba(255,255,255,0.55); font-size:12px;
  z-index:10; white-space:nowrap;
}
</style>
</head>
<body>
<div id="msg">Starting camera...</div>
<div id="voiceBadge">🎤 Listening... say "capture"</div>
<div id="gestureRing"><span id="gestureCount">3</span></div>
<video id="v" autoplay playsinline muted></video>
<canvas id="c"></canvas>
<div id="micRow">🎙️ Say "capture" or raise both hands</div>
<button id="btn" disabled onclick="capture()">📸 Capture Pose</button>

<script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js"></script>
<script>
const v    = document.getElementById('v');
const c    = document.getElementById('c');
const ctx  = c.getContext('2d');
const msg  = document.getElementById('msg');
const btn  = document.getElementById('btn');
const ring = document.getElementById('gestureRing');
const ringCount = document.getElementById('gestureCount');
const voiceBadge = document.getElementById('voiceBadge');
const micRow = document.getElementById('micRow');

let lastLM = null;
let gestureTimer = null;
let gestureTick  = 0;
let capturing    = false;
let SR = null;

function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

function rn(data) {
  try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch(e) {}
}

// ── MediaPipe pose ─────────────────────────────────────────────────────────
const poseDetector = new Pose({
  locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/' + f
});
poseDetector.setOptions({
  modelComplexity: 1, smoothLandmarks: true,
  minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
});

poseDetector.onResults(r => {
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-c.width, 0);
  ctx.drawImage(r.image, 0, 0, c.width, c.height);
  ctx.restore();

  if (r.poseLandmarks) {
    const mirrored = r.poseLandmarks.map(lm => ({ ...lm, x: 1 - lm.x }));
    drawConnectors(ctx, mirrored, POSE_CONNECTIONS, { color:'#00E676', lineWidth:3 });
    drawLandmarks(ctx, mirrored, { color:'#FFEB3B', fillColor:'#FF6F00', radius:5 });
    lastLM = r.poseLandmarks;
    btn.disabled = false;
    if (!capturing) {
      msg.textContent = '✅ Pose detected — say "capture" or raise hands!';
      msg.style.color = '#4CAF50';
    }

    // ── Hand gesture detection ─────────────────────────────────────────
    // Both wrists above both shoulders = gesture trigger
    const lw = r.poseLandmarks[15]; // left wrist
    const rw = r.poseLandmarks[16]; // right wrist
    const ls = r.poseLandmarks[11]; // left shoulder
    const rs = r.poseLandmarks[12]; // right shoulder

    const bothHandsUp = lw && rw && ls && rs
      && lw.y < ls.y - 0.05
      && rw.y < rs.y - 0.05;

    if (bothHandsUp && !capturing && !gestureTimer) {
      startGestureCountdown();
    } else if (!bothHandsUp && gestureTimer) {
      cancelGesture();
    }

  } else {
    lastLM = null;
    btn.disabled = true;
    cancelGesture();
    if (!capturing) {
      msg.textContent = '👤 Stand fully in frame...';
      msg.style.color = '#FFC107';
    }
  }
});

// ── Camera start ───────────────────────────────────────────────────────────
async function startCam() {
  try {
    msg.textContent = 'Requesting camera...';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not available');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:'user', width:{ ideal:640 }, height:{ ideal:480 } },
      audio: false,
    });
    v.srcObject = stream;
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; });
    v.play();
    msg.textContent = 'Loading pose model...';
    async function loop() {
      if (v.readyState >= 2) await poseDetector.send({ image:v });
      requestAnimationFrame(loop);
    }
    loop();
    rn({ type:'ready' });
    setupVoice();
  } catch(e) {
    msg.textContent = e.message;
    msg.style.color = '#F44336';
    rn({ type:'error', message:e.message });
  }
}
startCam();

// ── Capture ────────────────────────────────────────────────────────────────
function capture() {
  if (!lastLM || capturing) return;
  capturing = true;
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing...';
  msg.textContent = 'Sending to AI...';
  cancelGesture();

  const s = document.createElement('canvas');
  s.width = 480; s.height = 360;
  s.getContext('2d').drawImage(c, 0, 0, 480, 360);
  rn({
    type: 'capture',
    imageData: s.toDataURL('image/jpeg', 0.7),
    landmarks: lastLM.map(lm => ({ x:lm.x, y:lm.y, z:lm.z, visibility:lm.visibility })),
  });

  setTimeout(() => {
    capturing = false;
    btn.disabled = false;
    btn.textContent = '📸 Capture Pose';
    if (lastLM) {
      msg.textContent = '✅ Pose detected — say "capture" or raise hands!';
      msg.style.color = '#4CAF50';
    }
    if (SR) startVoice();
  }, 3000);
}

// ── Gesture countdown ──────────────────────────────────────────────────────
function startGestureCountdown() {
  gestureTick = 2; // count from 2
  ring.classList.add('show');
  ringCount.textContent = gestureTick + 1;
  msg.textContent = '🙌 Hold hands up...';

  gestureTimer = setInterval(() => {
    gestureTick--;
    ringCount.textContent = gestureTick + 1;
    if (gestureTick < 0) {
      clearInterval(gestureTimer);
      gestureTimer = null;
      ring.classList.remove('show');
      capture(); // ✅ AUTO CAPTURE via gesture!
    }
  }, 1000);
}

function cancelGesture() {
  if (gestureTimer) {
    clearInterval(gestureTimer);
    gestureTimer = null;
  }
  ring.classList.remove('show');
}

// ── Voice recognition ──────────────────────────────────────────────────────
function setupVoice() {
  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SRClass) {
    micRow.textContent = '🙌 Raise both hands to capture';
    return;
  }
  SR = new SRClass();
  SR.lang = 'en-IN';
  SR.continuous = false;
  SR.interimResults = false;
  SR.maxAlternatives = 5;

  SR.onstart = () => {
    voiceBadge.classList.add('show');
    micRow.textContent = '🔴 Listening... say "capture"';
  };

  SR.onresult = (e) => {
    const words = ['capture','cap','take','photo','go','snap','yes','ok'];
    for (let i = 0; i < e.results[0].length; i++) {
      const w = e.results[0][i].transcript.toLowerCase().trim();
      console.log('Heard:', w);
      if (words.some(k => w.includes(k))) {
        voiceBadge.classList.remove('show');
        capture(); // ✅ AUTO CAPTURE via voice!
        return;
      }
    }
    startVoice(); // restart if not matched
  };

  SR.onerror = (e) => {
    voiceBadge.classList.remove('show');
    if (e.error !== 'not-allowed') setTimeout(startVoice, 1000);
    else micRow.textContent = '🙌 Raise both hands to capture';
  };

  SR.onend = () => {
    voiceBadge.classList.remove('show');
    if (!capturing) setTimeout(startVoice, 600);
  };

  startVoice();
}

function startVoice() {
  if (capturing || !SR) return;
  try { SR.start(); } catch(e) { setTimeout(startVoice, 1000); }
}

// Listen from RN
window.addEventListener('message', e => {
  try { const m = JSON.parse(e.data); if (m.type === 'capture') capture(); } catch(err) {}
});
document.addEventListener('message', e => {
  try { const m = JSON.parse(e.data); if (m.type === 'capture') capture(); } catch(err) {}
});
</script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
const SmartPoseCameraScreen = ({ navigation, route }) => {
  const { poseOfDay, onPoseDone } = route.params || {};
  const webRef   = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [prediction,   setPrediction]   = useState(null);
  const [apiReady,     setApiReady]     = useState(true);
  const [status,       setStatus]       = useState('Requesting camera permission...');
  const [camPermitted, setCamPermitted] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestCameraPermission();
      if (granted) {
        setCamPermitted(true);
        setApiReady(true);
        setStatus('On-Device AI Ready! Say "capture" or raise hands 🧘');
      } else {
        setStatus('❌ Camera permission denied');
      }
    })();
  }, []);

  useEffect(() => {
    if (prediction) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.08, duration:700, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1.00, duration:700, useNativeDriver:true }),
      ])).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [prediction]);

  const onMessage = useCallback(async (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === 'capture') {
        setStatus('AI is analyzing...');
        const result = await classifyPose(msg.landmarks);

        if (!result) {
          setStatus('Could not classify — try again');
          return;
        }

        setPrediction(result);
        setStatus(`${result.display?.emoji || '🧘'} ${result.display?.en} — ${result.confidence}%`);

        // ✅ ALWAYS save streak and navigate — not just when confident
        // This ensures streak always counts when user captures
        const poseId   = result.pose || 'unknown';
        const poseName = result.display?.en || 'Yoga Pose';
        const score    = result.confidence || 50;

        await markTodayDone(poseId, poseName, score);
        console.log('✅ Streak saved:', poseName, score + '%');
        onPoseDone?.();

        // Navigate to feedback after short delay
        setTimeout(() => {
          navigation.navigate('PoseFeedback', {
            score,
            feedback: {
              grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
              tips: result.tips || [
                'Keep your back straight',
                'Breathe steadily',
                'Engage your core muscles',
              ],
            },
            imageData: msg.imageData,
            pose: {
              id:    poseId,
              name:  { en: poseName },
              emoji: result.display?.emoji || '🧘',
            },
            group: null, poses: [poseId], currentIndex: 0,
          });
        }, 1200);
      }

      if (msg.type === 'error') setStatus('Camera error — check permissions');
      if (msg.type === 'ready') setStatus('Say "capture" or raise both hands! 🧘');

    } catch (err) {
      console.error('onMessage error:', err);
    }
  }, [navigation, onPoseDone]);

  const predColor = !prediction ? '#888'
    : prediction.confidence >= 85 ? '#4CAF50'
    : prediction.confidence >= 70 ? '#8BC34A'
    : prediction.confidence >= 55 ? '#FFC107' : '#F44336';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex:1, marginLeft:12 }}>
          <Text style={styles.headerTitle}>
            {poseOfDay ? `Today: ${poseOfDay.name?.en || poseOfDay.name}` : 'AI Pose Detection'}
          </Text>
          <View style={[styles.badge, { backgroundColor: '#1B5E20' }]}>
            <Text style={styles.badgeText}>
              🤖 On-Device AI Active — 100% Offline
            </Text>
          </View>
        </View>
      </View>

      {camPermitted ? (
        <WebView
          ref={webRef}
          source={{ html: CAMERA_HTML, baseUrl: 'http://localhost' }}
          style={styles.webview}
          onMessage={onMessage}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          domStorageEnabled
          cacheEnabled={false}
          allowsProtectedMedia
          mediaCapturePermissionGrantType="grant"
          onPermissionRequest={(request) => request.grant(request.resources)}
        />
      ) : (
        <View style={styles.permDenied}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permSub}>
            Go to Settings → Apps → SwasthyaYoga → Permissions → Camera → Allow
          </Text>
        </View>
      )}

      {prediction && (
        <Animated.View style={[styles.predCard, { transform:[{ scale:pulseAnim }] }]}>
          <Text style={styles.predEmoji}>{prediction.display?.emoji}</Text>
          <View style={{ flex:1 }}>
            <Text style={styles.predName}>{prediction.display?.en}</Text>
            <View style={styles.confBar}>
              <View style={[styles.confFill, { width:`${prediction.confidence}%`, backgroundColor:predColor }]} />
            </View>
          </View>
          <Text style={[styles.predConf, { color:predColor }]}>{prediction.confidence}%</Text>
        </Animated.View>
      )}

      {prediction?.all_predictions && (
        <View style={styles.allPreds}>
          {prediction.all_predictions.slice(0, 3).map((p, i) => (
            <View key={p.pose} style={styles.predRow}>
              <Text style={styles.predRowEmoji}>{p.display?.emoji}</Text>
              <Text style={styles.predRowName}>{p.display?.en}</Text>
              <Text style={[styles.predRowConf, { color: i === 0 ? predColor : '#888' }]}>
                {p.confidence}%
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#000' },
  webview: { flex:1 },

  header: {
    backgroundColor:'rgba(0,0,0,0.9)',
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:16, paddingVertical:10,
  },
  closeTxt:    { color:'#fff', fontSize:20 },
  headerTitle: { color:'#fff', fontSize:14, fontWeight:'600', marginBottom:4 },
  badge:       { alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  badgeText:   { color:'#fff', fontSize:11, fontWeight:'600' },

  predCard: {
    position:'absolute', top:80, left:12, right:12,
    backgroundColor:'rgba(0,0,0,0.85)', borderRadius:16, padding:12,
    flexDirection:'row', alignItems:'center', gap:10,
    borderWidth:1, borderColor:'rgba(255,255,255,0.15)',
  },
  predEmoji: { fontSize:28 },
  predName:  { color:'#fff', fontSize:15, fontWeight:'bold', marginBottom:4 },
  confBar:   { height:6, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:3, overflow:'hidden' },
  confFill:  { height:'100%', borderRadius:3 },
  predConf:  { fontSize:20, fontWeight:'bold' },

  allPreds: {
    position:'absolute', top:160, right:12,
    backgroundColor:'rgba(0,0,0,0.78)',
    borderRadius:12, padding:10, gap:6, minWidth:170,
  },
  predRow:     { flexDirection:'row', alignItems:'center', gap:6 },
  predRowEmoji:{ fontSize:14 },
  predRowName: { flex:1, color:'rgba(255,255,255,0.8)', fontSize:12 },
  predRowConf: { fontSize:12, fontWeight:'bold' },

  statusBar: { backgroundColor:'rgba(0,0,0,0.9)', padding:12, alignItems:'center' },
  statusText:{ color:'rgba(255,255,255,0.8)', fontSize:13 },

  permDenied:{ flex:1, justifyContent:'center', alignItems:'center', padding:32 },
  permEmoji: { fontSize:64, marginBottom:16 },
  permTitle: { color:'#fff', fontSize:20, fontWeight:'bold', textAlign:'center', marginBottom:12 },
  permSub:   { color:'rgba(255,255,255,0.6)', fontSize:14, textAlign:'center', lineHeight:22 },
});

export default SmartPoseCameraScreen;