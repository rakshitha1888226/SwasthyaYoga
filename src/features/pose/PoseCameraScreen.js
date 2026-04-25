import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { markTodayDone } from '../streak/StreakService';  // ✅ fixed path

const { width, height } = Dimensions.get('window');

const DETECTOR_HTML = require('./pose_detector.html');

const PoseCameraScreen = ({ navigation, route }) => {
  const { group, poses, currentIndex = 0, onPoseDone } = route.params || {};

  const webRef      = useRef(null);
  const [poseIdx,   setPoseIdx]   = useState(currentIndex);
  const [listening, setListening] = useState(false);
  const [status,    setStatus]    = useState('Loading detector...');
  const [isReady,   setIsReady]   = useState(false);

  const currentPose = poses?.[poseIdx] || null;

  // ── TTS setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    return () => {
      Tts.stop();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // ── Voice recognition setup ─────────────────────────────────────────────────
  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const words = (e.value || []).join(' ').toLowerCase();
      if (words.includes('capture') || words.includes('click') || words.includes('take')) {
        triggerCapture();
      }
      if (words.includes('next') || words.includes('skip')) {
        goNextPose();
      }
    };
    Voice.onSpeechError = () => {
      setListening(false);
      setTimeout(startListening, 1000);
    };
    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, [poseIdx]);

  // ── When pose changes, inject into WebView and speak instructions ───────────
  useEffect(() => {
    if (!currentPose || !isReady) return;
    injectPose(currentPose);
    speakPoseInstruction(currentPose);
  }, [poseIdx, isReady]);

  const injectPose = useCallback((pose) => {
    const msg = JSON.stringify({ type: 'setPose', pose });
    webRef.current?.postMessage(msg);
  }, []);

  const triggerCapture = useCallback(() => {
    Tts.speak('Capturing your pose now!');
    webRef.current?.postMessage(JSON.stringify({ type: 'capture' }));
    stopListening();
  }, []);

  const speakPoseInstruction = (pose) => {
    const step = pose.step ? `Step ${pose.step}. ` : '';
    const speech = `${step}${pose.name}. ${pose.instruction} Get into position, then say Capture when ready.`;
    setTimeout(() => Tts.speak(speech), 500);
    setStatus(`Say "Capture" when ready! 🎙️`);
    setTimeout(startListening, 3000);
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setListening(true);
      setStatus('🎙️ Listening... say "Capture"');
    } catch(e) {
      setListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setListening(false);
    } catch(e) {}
  };

  // ── Handle messages from WebView ────────────────────────────────────────────
  const onWebViewMessage = useCallback(async (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === 'poseResult') {
        const { score, feedback, imageData } = msg;
        const tipsText = feedback.tips.slice(0, 2).join('. ');
        const gradeText = score >= 70 ? 'Well done!' : score >= 50 ? 'Good effort!' : 'Keep practising!';
        Tts.speak(`${gradeText} Your score is ${score} out of 100. ${tipsText}`);

        navigation.navigate('PoseFeedback', {
          score,
          feedback,
          imageData,
          pose: currentPose,
          group,
          poses,
          currentIndex: poseIdx,
        });
      }

      if (msg.type === 'retry') {
        speakPoseInstruction(currentPose);
      }

      if (msg.type === 'done') {
        if (currentPose) {
          await markTodayDone(currentPose.id, currentPose.name, msg.score);
          onPoseDone?.();
        }
        navigation.goBack();
      }

      if (msg.type === 'error') {
        Alert.alert('Camera Error', msg.message);
      }

    } catch(err) {}
  }, [poseIdx, currentPose]);

  const goNextPose = () => {
    if (poseIdx < poses.length - 1) {
      setPoseIdx(i => i + 1);
    } else {
      Tts.speak('You have completed all poses in this series. Amazing work!');
      setTimeout(() => navigation.goBack(), 2000);
    }
  };

  const goPrevPose = () => {
    if (poseIdx > 0) setPoseIdx(i => i - 1);
  };

  const onWebViewLoad = () => {
    setIsReady(true);
    setStatus('Detector ready!');
    if (currentPose) {
      setTimeout(() => {
        injectPose(currentPose);
        speakPoseInstruction(currentPose);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Tts.stop(); navigation.goBack(); }} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.stepsRow}>
          {poses?.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === poseIdx && styles.stepDotActive,
                i < poseIdx  && styles.stepDotDone,
              ]}
            />
          ))}
        </View>

        <Text style={styles.poseName}>
          {currentPose ? `${currentPose.step ? currentPose.step + '. ' : ''}${currentPose.name}` : ''}
        </Text>
      </View>

      {/* WebView detector */}
      <WebView
        ref={webRef}
        source={DETECTOR_HTML}
        style={styles.webview}
        onMessage={onWebViewMessage}
        onLoad={onWebViewLoad}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess
        domStorageEnabled
        cacheEnabled={false}
      />

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navBtn, poseIdx === 0 && styles.navBtnDisabled]}
          onPress={goPrevPose}
          disabled={poseIdx === 0}
        >
          <Text style={styles.navBtnTxt}>← Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.micBtn, listening && styles.micBtnActive]}
          onPress={listening ? stopListening : startListening}
        >
          <Text style={styles.micIcon}>{listening ? '🔴' : '🎙️'}</Text>
          <Text style={styles.micLabel}>{listening ? 'Listening...' : 'Tap to speak'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={goNextPose}>
          <Text style={styles.navBtnTxt}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTxt}>{status}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  header: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10,
  },
  closeBtn: { alignSelf: 'flex-start', padding: 4 },
  closeTxt: { color: '#fff', fontSize: 20 },
  stepsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepDotActive: { backgroundColor: '#4CAF50', width: 20 },
  stepDotDone:   { backgroundColor: 'rgba(76,175,80,0.5)' },
  poseName: { color: '#fff', fontSize: 14, fontWeight: '600' },

  webview: { flex: 1 },

  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 12,
  },
  navBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  micBtn: {
    flex: 1,
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderRadius: 16, paddingVertical: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)',
  },
  micBtnActive: {
    backgroundColor: 'rgba(244,67,54,0.2)',
    borderColor: '#F44336',
  },
  micIcon:  { fontSize: 24 },
  micLabel: { color: '#fff', fontSize: 11 },

  statusBar: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 6, paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});

export default PoseCameraScreen;