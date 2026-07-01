/**
 * PoseCameraScreen.js
 *
 * Re-exports SmartPoseCameraScreen so that App.js can import it as 'PoseCamera'.
 * The actual implementation lives in Smartposecamerascreen · JS
 * (which has a non-standard filename due to how it was created).
 *
 * If that file was renamed to SmartPoseCameraScreen.js this shim can be deleted
 * and App.js updated accordingly.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// ── Inline HTML for MediaPipe landmark extraction ─────────────────────────────
const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; width: 100vw; height: 100vh; overflow: hidden; }
    #video  { position: absolute; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
    #canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    #status {
      position: absolute; top: 10px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: #4CAF50; font-size: 13px;
      padding: 5px 16px; border-radius: 16px;
      font-family: sans-serif; white-space: nowrap;
    }
  </style>
</head>
<body>
<div id="status">Loading...</div>
<video id="video" autoplay playsinline muted></video>
<canvas id="canvas"></canvas>
<script>
const video  = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let lastLandmarks = null;
let frameCount    = 0;

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function sendToRN(data) {
  try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); }
  catch(e) {}
}

const pose = new Pose({
  locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/' + f
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});

pose.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00E676', lineWidth: 3
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: '#FFEB3B', fillColor: '#FF6F00',
      lineWidth: 2, radius: 5
    });

    lastLandmarks = results.poseLandmarks;
    statusEl.textContent = '✅ Pose detected!';
    statusEl.style.color = '#4CAF50';

    frameCount++;
    if (frameCount % 10 === 0) {
      const lmArray = results.poseLandmarks.map(lm => ({
        x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility
      }));
      sendToRN({ type: 'landmarks', landmarks: lmArray });
    }
  } else {
    lastLandmarks = null;
    statusEl.textContent = '👤 Stand in frame...';
    statusEl.style.color = '#FFC107';
    sendToRN({ type: 'nopose' });
  }
});

function capture() {
  if (!lastLandmarks) return;
  const small = document.createElement('canvas');
  small.width  = 480;
  small.height = 360;
  small.getContext('2d').drawImage(canvas, 0, 0, 480, 360);
  const imageData = small.toDataURL('image/jpeg', 0.7);
  const lmArray = lastLandmarks.map(lm => ({
    x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility
  }));
  sendToRN({ type: 'capture', imageData, landmarks: lmArray });
}

async function startCamera() {
  try {
    const camera = new Camera(video, {
      onFrame: async () => { await pose.send({ image: video }); },
      width: 640, height: 480,
    });
    await camera.start();
    sendToRN({ type: 'ready' });
  } catch(e) {
    statusEl.textContent = 'Camera error: ' + e.message;
    statusEl.style.color = '#F44336';
    sendToRN({ type: 'error', message: e.message });
  }
}
startCamera();

document.addEventListener('message', e => {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'capture') capture();
  } catch(e) {}
});
window.addEventListener('message', e => {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'capture') capture();
  } catch(e) {}
});
</script>
</body>
</html>
`;

// ── Lazy-load the pose detection service (guards against missing file) ─────────
let loadPoseModel = async () => false;
let predictPose   = async () => null;
let generateFeedback = () => ({ grade: 'B', tips: [] });

try {
  const svc = require('./PoseDetectionService');
  if (svc.loadPoseModel)    loadPoseModel    = svc.loadPoseModel;
  if (svc.predictPose)      predictPose      = svc.predictPose;
  if (svc.generateFeedback) generateFeedback = svc.generateFeedback;
} catch (_) {}

// Also try streak service
let markTodayDone = async () => {};
try {
  const streak = require('../streak/StreakService');
  if (streak.markTodayDone) markTodayDone = streak.markTodayDone;
} catch (_) {}

const PoseCameraScreen = ({ navigation, route }) => {
  const { poseOfDay } = route.params || {};

  const webRef    = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [modelReady,   setModelReady]   = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [prediction,   setPrediction]   = useState(null);
  const [capturing,    setCapturing]    = useState(false);
  const [status,       setStatus]       = useState('Loading AI model...');
  const lang = 'en';

  useEffect(() => {
    loadPoseModel().then(loaded => {
      if (loaded) {
        setModelReady(true);
        setStatus('Show your pose to the camera!');
      } else {
        setModelReady(true); // Allow capture even without TFLite
        setStatus('Show your pose to the camera!');
      }
    });
  }, []);

  useEffect(() => {
    if (poseDetected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [poseDetected]);

  const onWebViewMessage = useCallback(async (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === 'landmarks' && modelReady) {
        const result = await predictPose(msg.landmarks);
        if (result && result.isConfident) {
          setPrediction(result);
          setPoseDetected(true);
          setStatus(`${result.display?.emoji || '🧘'} ${result.display?.[lang] || result.pose} — ${result.confidence}%`);
        } else {
          setPoseDetected(false);
          if (result) setStatus(`Detecting... (${result.pose} ${result.confidence}%)`);
        }
      }

      if (msg.type === 'nopose') {
        setPoseDetected(false);
        setPrediction(null);
        setStatus('Stand fully in frame...');
      }

      if (msg.type === 'capture') {
        if (!prediction) return;
        setCapturing(false);
        const feedback = generateFeedback(prediction, lang);
        try {
          await markTodayDone(
            prediction.pose,
            prediction.display?.[lang] || prediction.pose,
            prediction.confidence,
          );
        } catch (_) {}

        navigation.navigate('PoseFeedback', {
          score:    prediction.confidence,
          feedback: { grade: feedback.grade, tips: feedback.tips },
          imageData: msg.imageData,
          pose: {
            id:    prediction.pose,
            name:  prediction.display?.[lang] || prediction.pose,
            emoji: prediction.display?.emoji || '🧘',
          },
          group:        route.params?.group || null,
          poses:        route.params?.poses || [prediction.pose],
          currentIndex: route.params?.currentIndex || 0,
        });
      }

      if (msg.type === 'ready') {
        setStatus(modelReady ? 'Show your pose!' : 'Loading AI...');
      }
    } catch (err) {
      console.error('WebView msg error:', err);
    }
  }, [modelReady, prediction, lang, navigation, route.params]);

  const handleCapture = () => {
    if (capturing) return;
    setCapturing(true);
    webRef.current?.postMessage(JSON.stringify({ type: 'capture' }));
  };

  const predColor =
    !prediction                      ? '#888' :
    prediction.confidence >= 85      ? '#4CAF50' :
    prediction.confidence >= 70      ? '#8BC34A' :
    prediction.confidence >= 55      ? '#FFC107' : '#F44336';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {poseOfDay ? `Today: ${poseOfDay.name}` : 'AI Pose Check'}
          </Text>
          <View style={[styles.modelBadge, { backgroundColor: modelReady ? '#1B5E20' : '#333' }]}>
            <Text style={styles.modelBadgeText}>
              {modelReady ? '🤖 AI Ready' : '⏳ Loading...'}
            </Text>
          </View>
        </View>
      </View>

      <WebView
        ref={webRef}
        source={{ html: MEDIAPIPE_HTML }}
        style={styles.webview}
        onMessage={onWebViewMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        domStorageEnabled
        cacheEnabled={false}
      />

      {prediction && (
        <Animated.View style={[styles.predictionBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.predEmoji}>{prediction.display?.emoji || '🧘'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.predPose}>{prediction.display?.[lang] || prediction.pose}</Text>
            <View style={styles.confBar}>
              <View style={[styles.confFill, {
                width: `${prediction.confidence}%`,
                backgroundColor: predColor,
              }]} />
            </View>
          </View>
          <Text style={[styles.predConf, { color: predColor }]}>{prediction.confidence}%</Text>
        </Animated.View>
      )}

      {prediction && (
        <View style={styles.allPreds}>
          {(prediction.allPredictions || []).slice(0, 3).map((p, i) => (
            <View key={p.pose} style={styles.predRow}>
              <Text style={styles.predRowEmoji}>{p.display?.emoji}</Text>
              <Text style={styles.predRowName}>{p.display?.[lang] || p.pose}</Text>
              <Text style={[styles.predRowConf, { color: i === 0 ? predColor : '#888' }]}>
                {p.confidence}%
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity
          style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={capturing}
        >
          <Text style={styles.captureBtnText}>
            {capturing ? '⏳ Analyzing...' : '📸 Capture Pose'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },

  header: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    zIndex: 10,
  },
  closeBtn:      { padding: 6 },
  closeTxt:      { color: '#fff', fontSize: 18 },
  headerCenter:  { flex: 1, gap: 4 },
  headerTitle:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  modelBadge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modelBadgeText:{ color: '#fff', fontSize: 11, fontWeight: '600' },

  predictionBox: {
    position: 'absolute', top: 80, left: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  predEmoji: { fontSize: 28 },
  predPose:  { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  confBar:   { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  confFill:  { height: '100%', borderRadius: 3 },
  predConf:  { fontSize: 18, fontWeight: 'bold' },

  allPreds: {
    position: 'absolute', top: 160, right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12, padding: 10, gap: 6,
    minWidth: 160,
  },
  predRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  predRowEmoji:{ fontSize: 14 },
  predRowName: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  predRowConf: { fontSize: 12, fontWeight: 'bold' },

  bottomBar: { backgroundColor: 'rgba(0,0,0,0.92)', padding: 16, gap: 10 },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  captureBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 28, alignItems: 'center' },
  captureBtnDisabled: { backgroundColor: '#333' },
  captureBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default PoseCameraScreen;
