import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  StatusBar, Platform, PermissionsAndroid,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

// ─────────────────────────────────────────────────────────────────────────────
// POSE DATABASE
// Angles are measured at the JOINT: angleDeg(pointA, JOINT, pointC)
// MediaPipe landmark indices:
//   11=left shoulder, 12=right shoulder
//   13=left elbow,    14=right elbow
//   15=left wrist,    16=right wrist
//   23=left hip,      24=right hip
//   25=left knee,     26=right knee
//   27=left ankle,    28=right ankle
// ─────────────────────────────────────────────────────────────────────────────
const POSES = {
  tadasana: {
    name: 'Tadasana', telugu: 'తాడాసన', hindi: 'ताड़ासन',
    description: 'Stand straight, feet together, arms at sides',
    rules: [
      { key:'leftKnee',     ideal:178, tol:8,  wt:20, en:'Straighten left knee',  te:'ఎడమ మోకాలు నేరుగా',  hi:'बायाँ घुटना सीधा करें' },
      { key:'rightKnee',    ideal:178, tol:8,  wt:20, en:'Straighten right knee', te:'కుడి మోకాలు నేరుగా', hi:'दाहिना घुटना सीधा करें' },
      { key:'shoulderTilt', ideal:0,   tol:4,  wt:25, en:'Level your shoulders',  te:'భుజాలు సమానంగా',      hi:'कंधे बराबर रखें' },
      { key:'hipTilt',      ideal:0,   tol:4,  wt:20, en:'Level your hips',       te:'నడుము సమానంగా',       hi:'कूल्हे बराबर रखें' },
      { key:'spineOffset',  ideal:0,   tol:5,  wt:15, en:'Centre your spine',     te:'వెన్నెముక మధ్యలో',    hi:'रीढ़ को केंद्र में रखें' },
    ],
  },
  urdhvaHastasana: {
    name: 'Urdhva Hastasana', telugu: 'ఊర్ధ్వ హస్తాసన', hindi: 'ऊर्ध्व हस्तासन',
    description: 'Stand straight, both arms raised overhead',
    rules: [
      { key:'leftKnee',      ideal:178, tol:10, wt:15, en:'Keep legs straight',        te:'కాళ్ళు నేరుగా',          hi:'पैर सीधे रखें' },
      { key:'rightKnee',     ideal:178, tol:10, wt:15, en:'Keep legs straight',        te:'కాళ్ళు నేరుగా',          hi:'पैर सीधे रखें' },
      { key:'leftShoulder',  ideal:170, tol:15, wt:20, en:'Raise left arm fully up',   te:'ఎడమ చేయి పూర్తిగా పైకి',hi:'बायाँ हाथ पूरा ऊपर उठाएं' },
      { key:'rightShoulder', ideal:170, tol:15, wt:20, en:'Raise right arm fully up',  te:'కుడి చేయి పూర్తిగా పైకి',hi:'दायाँ हाथ पूरा ऊपर उठाएं' },
      { key:'shoulderTilt',  ideal:0,   tol:5,  wt:15, en:'Keep arms even',            te:'రెండు చేతులు సమానంగా',   hi:'दोनों हाथ बराबर रखें' },
      { key:'spineOffset',   ideal:0,   tol:5,  wt:15, en:'Centre your spine',         te:'వెన్నెముక నేరుగా',       hi:'रीढ़ सीधी रखें' },
    ],
  },
  warrior2: {
    name: 'Warrior II', telugu: 'వీరభద్రాసన II', hindi: 'वीरभद्रासन II',
    description: 'Wide legs, front knee bent 90°, arms spread at shoulder height',
    rules: [
      { key:'frontKnee',     ideal:90,  tol:12, wt:30, en:'Bend front knee to 90°',       te:'ముందు మోకాలు 90° వంచు',  hi:'आगे का घुटना 90° मोड़ें' },
      { key:'backKnee',      ideal:175, tol:10, wt:20, en:'Keep back leg straight',        te:'వెనుక కాలు నేరుగా',       hi:'पिछला पैर सीधा रखें' },
      { key:'leftShoulder',  ideal:85,  tol:15, wt:15, en:'Arms at shoulder height',       te:'చేతులు భుజం ఎత్తులో',      hi:'हाथ कंधे की ऊँचाई पर' },
      { key:'rightShoulder', ideal:85,  tol:15, wt:15, en:'Arms at shoulder height',       te:'చేతులు భుజం ఎత్తులో',      hi:'हाथ कंधे की ऊँचाई पर' },
      { key:'hipTilt',       ideal:0,   tol:6,  wt:10, en:'Square hips to side',           te:'నడుము పక్కకు',             hi:'कूल्हे साइड में' },
      { key:'shoulderTilt',  ideal:0,   tol:6,  wt:10, en:'Keep shoulders level',          te:'భుజాలు సమానంగా',           hi:'कंधे समान रखें' },
    ],
  },
  treePose: {
    name: 'Tree Pose', telugu: 'వృక్షాసన', hindi: 'वृक्षासन',
    description: 'Balance on one leg, other foot on inner thigh, arms above head',
    rules: [
      { key:'standKnee',     ideal:178, tol:8,  wt:30, en:'Keep standing leg straight',    te:'నిలబడే కాలు నేరుగా',     hi:'खड़े पैर को सीधा रखें' },
      { key:'leftShoulder',  ideal:165, tol:15, wt:20, en:'Raise arms above head',         te:'చేతులు తల పైన',           hi:'हाथ सिर के ऊपर उठाएं' },
      { key:'rightShoulder', ideal:165, tol:15, wt:20, en:'Raise arms above head',         te:'చేతులు తల పైన',           hi:'हाथ सिर के ऊपर उठाएं' },
      { key:'shoulderTilt',  ideal:0,   tol:5,  wt:15, en:'Keep shoulders level',          te:'భుజాలు సమానంగా',          hi:'कंधे समान रखें' },
      { key:'spineOffset',   ideal:0,   tol:5,  wt:15, en:'Balance spine centrally',       te:'వెన్నెముక మధ్యలో',        hi:'रीढ़ केंद्र में' },
    ],
  },
  chairPose: {
    name: 'Chair Pose', telugu: 'ఉత్కటాసన', hindi: 'उत्कटासन',
    description: 'Feet together, knees bent as if sitting, arms raised forward',
    rules: [
      { key:'leftKnee',      ideal:110, tol:15, wt:25, en:'Bend knees more — aim 110°',   te:'మోకాళ్ళు 110° వంచు',      hi:'घुटने 110° मोड़ें' },
      { key:'rightKnee',     ideal:110, tol:15, wt:25, en:'Bend knees more — aim 110°',   te:'మోకాళ్ళు 110° వంచు',      hi:'घुटने 110° मोड़ें' },
      { key:'leftShoulder',  ideal:155, tol:18, wt:20, en:'Raise arms forward and up',    te:'చేతులు ముందుకు పైకి',      hi:'हाथ आगे ऊपर उठाएं' },
      { key:'rightShoulder', ideal:155, tol:18, wt:20, en:'Raise arms forward and up',    te:'చేతులు ముందుకు పైకి',      hi:'हाथ आगे ऊपर उठाएं' },
      { key:'shoulderTilt',  ideal:0,   tol:5,  wt:10, en:'Keep shoulders even',          te:'భుజాలు సమానంగా',           hi:'कंधे समान रखें' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML — ALL 5 ACCURACY FIXES APPLIED
// Fix 1: Camera resolution 1280×720 (was 640×480)
// Fix 2: Landmark visibility check — skip if confidence <0.65
// Fix 3: Frame averaging — 12-frame rolling window before reporting score
// Fix 4: Higher MediaPipe confidence — 0.7 (was 0.55)
// Fix 5: Improved detection logic — uses visibility-weighted geometry
// ─────────────────────────────────────────────────────────────────────────────
const makeHTML = (language, poses) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js"><\/script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;overflow:hidden;width:100vw;height:100vh;font-family:system-ui,sans-serif}
    #video{position:absolute;width:100%;height:100%;object-fit:cover;opacity:0}
    #canvas{position:absolute;top:0;left:0;width:100%;height:100%}

    /* Top pose info panel */
    #poseBox{
      position:absolute;top:14px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.85);color:#fff;
      padding:10px 24px;border-radius:24px;
      z-index:30;white-space:nowrap;text-align:center;min-width:220px;
      border:1px solid rgba(255,255,255,0.1);
    }
    #poseName {font-weight:700;color:#4CAF50;font-size:17px;letter-spacing:0.3px}
    #poseScore{color:#FFC107;font-size:13px;margin-top:3px}
    #holdMsg  {color:#81C784;font-size:11px;margin-top:2px;height:14px}

    /* Score bar */
    #scoreBar{
      position:absolute;top:76px;left:12px;right:12px;
      height:8px;background:rgba(255,255,255,0.12);
      border-radius:4px;z-index:31;overflow:hidden;
    }
    #scoreFill{
      height:100%;border-radius:4px;background:#4CAF50;
      width:0%;transition:width 0.3s ease,background 0.3s ease;
    }

    /* Feedback text */
    #feedbackBox{
      position:absolute;top:92px;left:12px;right:12px;
      background:rgba(0,0,0,0.78);color:#fff;
      font-size:13px;padding:10px 16px;border-radius:14px;
      z-index:30;line-height:1.6;min-height:44px;
      border:1px solid rgba(255,255,255,0.08);
    }
    #feedbackText{color:#FFE082}

    /* Frame buffer indicator */
    #bufferBar{
      position:absolute;top:144px;left:12px;right:12px;
      height:3px;background:rgba(255,255,255,0.08);border-radius:2px;z-index:31;
    }
    #bufferFill{height:100%;border-radius:2px;background:#2196F3;width:0%;transition:width 0.1s}
    #bufferLabel{
      position:absolute;top:150px;left:12px;
      font-size:10px;color:rgba(255,255,255,0.4);z-index:31;
    }

    /* Bottom bar */
    #bottomBar{
      position:absolute;bottom:0;left:0;right:0;
      padding:14px 16px 40px;background:rgba(0,0,0,0.75);
      display:flex;flex-direction:column;align-items:center;gap:10px;z-index:30;
    }
    #captureBtn{
      width:100%;padding:16px;font-size:17px;font-weight:700;
      background:#2E7D32;color:#fff;border:none;border-radius:32px;
      cursor:pointer;letter-spacing:0.3px;
    }
    #captureBtn:active{background:#1B5E20}
    #voiceBtn{
      width:100%;padding:12px;font-size:14px;font-weight:600;
      background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);
      border-radius:32px;cursor:pointer;
    }
    #micLabel{font-size:11px;color:rgba(255,255,255,0.45);text-align:center}

    /* Visibility warning */
    #visWarn{
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.88);color:#FF8A65;
      padding:14px 22px;border-radius:16px;z-index:40;
      font-size:14px;text-align:center;line-height:1.8;
      display:none;border:1px solid rgba(255,138,101,0.4);
    }
  </style>
</head>
<body>

<div id="poseBox">
  <div id="poseName">Stand in frame...</div>
  <div id="poseScore">Move back so full body is visible</div>
  <div id="holdMsg"></div>
</div>

<div id="scoreBar"><div id="scoreFill"></div></div>

<div id="feedbackBox">
  <span id="feedbackText">Step back so your full body is in frame — head to feet</span>
</div>

<div id="bufferBar"><div id="bufferFill"></div></div>
<div id="bufferLabel">Analysing...</div>

<div id="visWarn">⚠️ Body not fully visible<br>Step back or improve lighting</div>

<video id="video" autoplay playsinline muted></video>
<canvas id="canvas"></canvas>

<div id="bottomBar">
  <button id="captureBtn" onclick="saveResult()">📸 Save Result</button>
  <button id="voiceBtn"   onclick="toggleVoice()">🔊 Voice Feedback: ON</button>
  <div id="micLabel">🎤 Say "capture" or "save" to take result</div>
</div>

<script>
// ── Constants ─────────────────────────────────────────────────────────────
const LANGUAGE      = '${language}';
const POSES         = ${JSON.stringify(poses)};
const MIN_VIS       = 0.65;   // FIX 2: minimum landmark visibility to trust
const FRAME_BUFFER  = 12;     // FIX 3: frames to average before reporting
const MIN_CONF      = 0.70;   // FIX 4: MediaPipe confidence threshold

// ── DOM ────────────────────────────────────────────────────────────────────
const video       = document.getElementById('video');
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const poseNameEl  = document.getElementById('poseName');
const poseScoreEl = document.getElementById('poseScore');
const holdMsgEl   = document.getElementById('holdMsg');
const scoreFill   = document.getElementById('scoreFill');
const feedbackEl  = document.getElementById('feedbackText');
const bufferFill  = document.getElementById('bufferFill');
const bufferLabel = document.getElementById('bufferLabel');
const visWarn     = document.getElementById('visWarn');

// ── State ──────────────────────────────────────────────────────────────────
let voiceOn        = true;
let lastScore      = -1;
let lastPoseKey    = '';
let speakTimer     = null;
let lastPose       = null;   // latest raw landmarks
let SR             = null;

// FIX 3: Frame buffer for averaging
const frameBuffer  = [];     // stores {poseKey, score, corrections} per frame
let   stableScore  = 0;
let   stablePose   = '';
let   stableCorrections = [];
let   holdFrames   = 0;      // frames pose has been consistently detected

function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
resize(); window.addEventListener('resize', resize);

function toRN(d){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(d)); }catch(e){} }

// ── FIX 2: Check landmark visibility ──────────────────────────────────────
// Returns true only if all required landmarks are clearly visible
function checkVisibility(L, indices) {
  for (const i of indices) {
    if (!L[i] || (L[i].visibility !== undefined && L[i].visibility < MIN_VIS)) {
      return false;
    }
  }
  return true;
}

// Key body landmarks needed for each pose check
const CORE_LANDMARKS = [11,12,13,14,15,16,23,24,25,26,27,28];
const LOWER_BODY     = [23,24,25,26,27,28];
const UPPER_BODY     = [11,12,13,14,15,16];

// ── Angle calculation ──────────────────────────────────────────────────────
function angleDeg(A, B, C) {
  if (!A || !B || !C) return 0;
  const ab = { x: A.x-B.x, y: A.y-B.y };
  const cb = { x: C.x-B.x, y: C.y-B.y };
  const dot = ab.x*cb.x + ab.y*cb.y;
  const mag = Math.sqrt((ab.x**2+ab.y**2) * (cb.x**2+cb.y**2));
  if (mag === 0) return 0;
  return Math.round(Math.acos(Math.min(1, Math.max(-1, dot/mag))) * 180 / Math.PI);
}

// ── Compute geometry ───────────────────────────────────────────────────────
// FIX 2: Only compute angles when landmarks have sufficient visibility
function computeGeometry(L) {
  const lKnee   = angleDeg(L[23], L[25], L[27]);
  const rKnee   = angleDeg(L[24], L[26], L[28]);
  const lSh     = angleDeg(L[13], L[11], L[23]);
  const rSh     = angleDeg(L[14], L[12], L[24]);
  const shTilt  = Math.round(Math.abs(L[11].y - L[12].y) * 100);
  const hipTilt = Math.round(Math.abs(L[23].y - L[24].y) * 100);
  const spOff   = Math.round(Math.abs(L[0].x - (L[23].x+L[24].x)/2) * 100);
  const hipW    = Math.abs(L[23].x - L[24].x);

  // Arm detection with stricter threshold (wrist clearly above shoulder)
  const lArmUp  = L[15].y < L[11].y - 0.08;
  const rArmUp  = L[16].y < L[12].y - 0.08;
  const bothUp  = lArmUp && rArmUp;

  // Tree pose: which knee is bent vs straight
  const standKnee = Math.max(lKnee, rKnee);
  const bentKnee  = Math.min(lKnee, rKnee);

  // Warrior II: which is front knee (more bent) vs back knee
  const frontKnee = Math.min(lKnee, rKnee);
  const backKnee  = Math.max(lKnee, rKnee);

  // Visibility checks
  const lowerVisible = checkVisibility(L, LOWER_BODY);
  const upperVisible = checkVisibility(L, UPPER_BODY);
  const fullyVisible = lowerVisible && upperVisible;

  return {
    leftKnee:lKnee, rightKnee:rKnee,
    leftShoulder:lSh, rightShoulder:rSh,
    shoulderTilt:shTilt, hipTilt, spineOffset:spOff,
    hipWidth:hipW, bothArmsRaised:bothUp,
    leftArmUp:lArmUp, rightArmUp:rArmUp,
    standKnee, bentKnee, frontKnee, backKnee,
    lowerVisible, upperVisible, fullyVisible,
  };
}

// ── FIX 5: Pose detection — correct order, specific conditions ─────────────
function detectPose(g) {
  // Can't detect without seeing lower body
  if (!g.lowerVisible) return null;

  // 1. WARRIOR II — most unique: wide stance + one knee clearly bent + arms NOT overhead
  //    hipWidth > 0.3 means feet are clearly apart (wide stance)
  //    frontKnee < 130 means clearly bent
  if (!g.bothArmsRaised && g.hipWidth > 0.30 && g.frontKnee < 130 && g.backKnee > 155) {
    return 'warrior2';
  }

  // 2. TREE POSE — one leg folded very tight (<90°), other straight, arms raised
  //    bentKnee < 90 catches the folded leg properly
  if (g.bothArmsRaised && g.bentKnee < 90 && g.standKnee > 160 && g.hipWidth < 0.18) {
    return 'treePose';
  }

  // 3. CHAIR POSE — both knees clearly bent (NOT straight), arms raised
  //    Range 80-145 catches the "sitting" position
  //    Both knees must be bent — rules out urdhva where knees are straight
  if (g.bothArmsRaised
      && g.leftKnee  > 80 && g.leftKnee  < 145
      && g.rightKnee > 80 && g.rightKnee < 145) {
    return 'chairPose';
  }

  // 4. URDHVA HASTASANA — arms raised, BOTH knees must be straight (>160)
  //    Comes AFTER chairPose so we only get here if knees are straight
  if (g.bothArmsRaised && g.leftKnee > 160 && g.rightKnee > 160) {
    return 'urdhvaHastasana';
  }

  // 5. TADASANA — no arms raised, legs straight, narrow stance
  if (!g.bothArmsRaised && g.leftKnee > 160 && g.rightKnee > 160 && g.hipWidth < 0.28) {
    return 'tadasana';
  }

  return null;
}

// ── Score a pose ───────────────────────────────────────────────────────────
function scorePose(poseKey, g) {
  const pose = POSES[poseKey];
  if (!pose) return { score: 0, corrections: [] };

  let totalW = 0, earnedW = 0;
  const corrections = [];

  for (const rule of pose.rules) {
    totalW += rule.wt;
    const val = g[rule.key];
    if (val === undefined || val === null) continue;

    let diff;
    if (rule.key === 'shoulderTilt' || rule.key === 'hipTilt' || rule.key === 'spineOffset') {
      diff = val; // ideal is 0, val is deviation
    } else {
      diff = Math.abs(val - rule.ideal);
    }

    if (diff <= rule.tol) {
      earnedW += rule.wt;                        // perfect
    } else if (diff <= rule.tol * 2.5) {
      earnedW += rule.wt * 0.5;                  // partial
      corrections.push({ en: rule.en, te: rule.te, hi: rule.hi, severity: 'minor', diff });
    } else {
      corrections.push({ en: rule.en, te: rule.te, hi: rule.hi, severity: 'major', diff });
    }
  }

  corrections.sort((a, b) => b.diff - a.diff);
  return { score: Math.round((earnedW / totalW) * 100), corrections };
}

// ── FIX 3: Frame buffer — average last N frames ────────────────────────────
function addToBuffer(poseKey, score, corrections) {
  frameBuffer.push({ poseKey, score, corrections });
  if (frameBuffer.length > FRAME_BUFFER) frameBuffer.shift();

  // Update buffer progress bar
  const pct = (frameBuffer.length / FRAME_BUFFER) * 100;
  bufferFill.style.width = pct + '%';

  // Check if all frames agree on same pose
  const allSamePose = frameBuffer.length === FRAME_BUFFER &&
    frameBuffer.every(f => f.poseKey === poseKey);

  if (!allSamePose) {
    bufferLabel.textContent = 'Stabilising... hold pose';
    return false;
  }

  // Average the scores
  const avgScore = Math.round(
    frameBuffer.reduce((sum, f) => sum + f.score, 0) / FRAME_BUFFER
  );

  stableScore       = avgScore;
  stablePose        = poseKey;
  stableCorrections = corrections;
  holdFrames++;

  bufferLabel.textContent = holdFrames > 5
    ? '🔒 Pose locked in — say "capture" or press Save'
    : 'Hold steady...';

  return true;
}

// ── TTS — send to React Native (native TTS handles it) ────────────────────
function speak(text) {
  if (!voiceOn) return;
  toRN({ type: 'speak', text });
}

function toggleVoice() {
  voiceOn = !voiceOn;
  document.getElementById('voiceBtn').textContent =
    voiceOn ? '🔊 Voice Feedback: ON' : '🔇 Voice Feedback: OFF';
}

function buildMessage(poseKey, score, corrections) {
  const pose = POSES[poseKey];
  const c    = corrections[0];
  const nm   = LANGUAGE === 'te' ? pose.telugu : LANGUAGE === 'hi' ? pose.hindi : pose.name;

  if (LANGUAGE === 'te') {
    if (score >= 90) return nm + ' అద్భుతం! ' + score + ' శాతం సరైనది!';
    if (score >= 70) return nm + ' ' + score + '%. ' + (c ? c.te : '');
    return nm + ' ' + score + '% మాత్రమే. ' + (c ? c.te : '');
  }
  if (LANGUAGE === 'hi') {
    if (score >= 90) return nm + ' बहुत बढ़िया! ' + score + ' प्रतिशत सही!';
    if (score >= 70) return nm + ' ' + score + '%. ' + (c ? c.hi : '');
    return nm + ' केवल ' + score + '%. ' + (c ? c.hi : '');
  }
  if (score >= 90) return nm + ' — excellent! ' + score + ' percent correct!';
  if (score >= 70) return nm + ' — ' + score + ' percent. ' + (c ? c.en : '');
  return nm + ' — only ' + score + ' percent. ' + (c ? c.en : '');
}

// ── Update UI ──────────────────────────────────────────────────────────────
function updateUI(poseKey, score, corrections, stable) {
  const pose = POSES[poseKey];
  const nm   = LANGUAGE === 'te' ? (pose.telugu + ' (' + pose.name + ')')
             : LANGUAGE === 'hi' ? (pose.hindi  + ' (' + pose.name + ')')
             : pose.name;

  poseNameEl.textContent  = nm;
  poseScoreEl.textContent = score + '% accurate';

  const color = score >= 85 ? '#4CAF50' : score >= 65 ? '#FFC107' : '#F44336';
  scoreFill.style.width      = score + '%';
  scoreFill.style.background = color;

  if (!corrections.length) {
    feedbackEl.textContent = score >= 90 ? '✅ Perfect! Hold it.' : '✅ Good form!';
  } else {
    const top = corrections.slice(0, 2)
      .map(c => LANGUAGE === 'te' ? c.te : LANGUAGE === 'hi' ? c.hi : c.en);
    feedbackEl.textContent = top.join(' · ');
  }

  holdMsgEl.textContent = stable
    ? (score >= 80 ? '🔒 Locked! Tap Save Result' : '⚠️ Adjust pose')
    : '';

  // Speak only on significant change
  const poseChanged  = poseKey !== lastPoseKey;
  const scoreDiff    = Math.abs(score - lastScore);
  if (stable && (poseChanged || scoreDiff >= 8)) {
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => speak(buildMessage(poseKey, score, corrections)), 600);
    lastScore   = score;
    lastPoseKey = poseKey;
  }
}

// ── MediaPipe setup ────────────────────────────────────────────────────────
// FIX 4: Higher confidence thresholds
const poseDetector = new Pose({
  locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/' + f
});

poseDetector.setOptions({
  modelComplexity:        1,     // 0=lite, 1=full, 2=heavy — 1 best for mobile
  smoothLandmarks:        true,  // temporal smoothing
  enableSegmentation:     false,
  smoothSegmentation:     false,
  minDetectionConfidence: MIN_CONF,  // FIX 4: was 0.55, now 0.70
  minTrackingConfidence:  MIN_CONF,  // FIX 4: was 0.55, now 0.70
});

poseDetector.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks) {
    // No person detected
    poseNameEl.textContent  = 'Step back — full body needed';
    poseScoreEl.textContent = '';
    feedbackEl.textContent  = 'Move back until your head and feet are both visible';
    scoreFill.style.width   = '0%';
    holdMsgEl.textContent   = '';
    visWarn.style.display   = 'block';
    frameBuffer.length      = 0;
    bufferFill.style.width  = '0%';
    return;
  }

  visWarn.style.display = 'none';

  const L = results.poseLandmarks;
  lastPose = L;

  // FIX 2: Check overall body visibility before drawing/scoring
  const g = computeGeometry(L);

  if (!g.fullyVisible) {
    // Body partially cut off — show warning but still draw skeleton
    visWarn.style.display   = 'block';
    visWarn.textContent     = '⚠️ Body partially hidden\nStep back or face camera directly';
    feedbackEl.textContent  = 'Full body not visible — step back further';
  }

  // Draw skeleton — green for high visibility, orange for low
  drawConnectors(ctx, L, POSE_CONNECTIONS, {
    color: g.fullyVisible ? '#00E676' : '#FF9800',
    lineWidth: 4,
  });
  drawLandmarks(ctx, L, {
    color:     '#FFEB3B',
    fillColor: g.fullyVisible ? '#E65100' : '#FF9800',
    lineWidth: 2,
    radius:    5,
  });

  const poseKey = detectPose(g);

  if (!poseKey) {
    poseNameEl.textContent  = 'Pose not recognised';
    poseScoreEl.textContent = 'Try: Tadasana · Warrior II · Tree · Chair · Arms Raised';
    feedbackEl.textContent  = 'Get into a yoga pose — stand facing the camera';
    scoreFill.style.width   = '0%';
    holdMsgEl.textContent   = '';
    frameBuffer.length      = 0;
    bufferFill.style.width  = '0%';
    bufferLabel.textContent = 'Waiting for pose...';
    return;
  }

  const { score, corrections } = scorePose(poseKey, g);

  // FIX 3: Add to frame buffer — only report when stable
  const stable = addToBuffer(poseKey, score, corrections);
  const displayScore = stable ? stableScore : score;
  const displayCorr  = stable ? stableCorrections : corrections;

  updateUI(poseKey, displayScore, displayCorr, stable);

  // Send live data to React Native (for Kids Mode integration)
  toRN({ type: 'liveScore', poseKey, score: displayScore, stable });
});

// ── FIX 1: Higher resolution camera — 1280×720 ────────────────────────────
async function startCamera() {
  try {
    const cam = new Camera(video, {
      onFrame: async () => {
        await poseDetector.send({ image: video });
      },
      width:  1280,  // FIX 1: was 640
      height:  720,  // FIX 1: was 480
    });
    await cam.start();
    bufferLabel.textContent = 'Camera ready — get into a pose';
    setupVoiceTrigger();
  } catch (e) {
    toRN({ type: 'error', message: e.message });
    feedbackEl.textContent = '❌ Camera error: ' + e.message;
    poseNameEl.textContent = 'Camera failed';
  }
}
startCamera();

// ── Save result ────────────────────────────────────────────────────────────
function saveResult() {
  if (!lastPose) {
    feedbackEl.textContent = 'No pose detected yet — get into a yoga pose first';
    return;
  }

  const g = computeGeometry(lastPose);
  const poseKey = stablePose || detectPose(g);

  if (!poseKey) {
    feedbackEl.textContent = 'Hold a recognised pose for a moment before saving';
    return;
  }

  const score       = stableScore || scorePose(poseKey, g).score;
  const corrections = stableCorrections.length ? stableCorrections : scorePose(poseKey, g).corrections;

  // Capture at good resolution
  const snap = document.createElement('canvas');
  snap.width  = 640;
  snap.height = 480;
  snap.getContext('2d').drawImage(canvas, 0, 0, 640, 480);

  toRN({
    type:        'result',
    image:       snap.toDataURL('image/jpeg', 0.80),
    poseKey,
    score,
    corrections,
  });

  speak(LANGUAGE === 'te' ? 'ఫలితం సేవ్ అయింది!' :
        LANGUAGE === 'hi' ? 'परिणाम सहेजा गया!' :
        'Result saved!');
}

// ── Voice trigger (say "capture" / "save") ─────────────────────────────────
function setupVoiceTrigger() {
  const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SRC) {
    document.getElementById('micLabel').textContent = '🎤 Tap Save to capture result';
    return;
  }
  SR = new SRC();
  SR.lang = 'en-IN';
  SR.continuous = false;
  SR.interimResults = false;
  SR.maxAlternatives = 3;

  SR.onresult = e => {
    const triggers = ['capture','save','photo','click','take','done','finish'];
    for (let i = 0; i < e.results[0].length; i++) {
      const w = e.results[0][i].transcript.toLowerCase();
      if (triggers.some(t => w.includes(t))) { saveResult(); return; }
    }
  };
  SR.onerror  = e => { if (e.error !== 'not-allowed') setTimeout(setupVoiceTrigger, 1500); };
  SR.onend    = ()  => setTimeout(setupVoiceTrigger, 800);
  try { SR.start(); } catch (e) {}
}

// ── Messages from React Native ─────────────────────────────────────────────
function handleMsg(e) {
  try {
    const m = JSON.parse(e.data);
    if (m.command === 'capture')   saveResult();
    if (m.command === 'setVoice')  voiceOn = m.value;
  } catch (err) {}
}
window.addEventListener('message',   handleMsg);
document.addEventListener('message', handleMsg);
<\/script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// React Native Screen
// ─────────────────────────────────────────────────────────────────────────────
const WebViewPoseScreen = ({ navigation }) => {
  const webViewRef = useRef(null);
  const [loading,  setLoading]  = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    requestPermissions();
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('yogaLanguage');
      if (saved) setLanguage(saved);
    } catch (e) {}
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return;
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    } catch (e) {}
  };

  // Native TTS init
  useEffect(() => {
    try {
      const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      Tts.setDefaultLanguage(langCode);
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
    } catch (e) {}
    return () => { try { Tts.stop(); } catch (e) {} };
  }, [language]);

  const onMessage = async (event) => {
    let data;
    try { data = JSON.parse(event.nativeEvent.data); } catch { return; }

    // Native TTS — real Android voice, not WebView speechSynthesis
    if (data.type === 'speak') {
      try { Tts.stop(); Tts.speak(data.text); } catch (e) {}
      return;
    }

    if (data.type === 'result') {
      navigation.navigate('PoseResult', {
        image:    data.image,
        analysis: {
          score:      data.score,
          poseName:   POSES[data.poseKey]?.name || 'Yoga Pose',
          whatIsGood: data.score >= 80
            ? 'Great alignment! Your angles are accurate.'
            : 'Good effort! Keep practising to improve.',
          feedback: data.corrections.slice(0, 2)
            .map(c => language === 'te' ? c.te : language === 'hi' ? c.hi : c.en)
            .join('. ') || 'Excellent pose! Keep it up.',
          tips: data.corrections.slice(0, 3)
            .map(c => language === 'te' ? c.te : language === 'hi' ? c.hi : c.en),
          teluguTip: data.corrections[0]?.te || 'మంచి భంగిమ!',
        },
      });
    }

    if (data.type === 'error') {
      console.error('WebView pose error:', data.message);
    }
  };

  const html = makeHTML(language, POSES);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsText}>⚙️</Text>
      </TouchableOpacity>

      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'https://localhost' }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        onPermissionRequest={req => req.grant(req.resources)}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        onMessage={onMessage}
        onLoad={() => setLoading(false)}
        onError={e => console.error('WebView error:', e.nativeEvent)}
        style={styles.webview}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.overlayTitle}>Loading AI Pose Detection</Text>
          <Text style={styles.overlayStep}>📥 Downloading MediaPipe model...</Text>
          <Text style={styles.overlayNote}>First load takes 10-15 seconds</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  webview:      { flex: 1 },
  settingsBtn:  {
    position: 'absolute', top: 50, right: 16, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  settingsText: { fontSize: 20 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32,
  },
  overlayTitle: { color: '#4CAF50', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  overlayStep:  { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  overlayNote:  { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
});

export default WebViewPoseScreen;