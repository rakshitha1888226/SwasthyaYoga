// ── SwasthyaYoga Pose Detection Service ──────────────────────────────────────
// Pose classification service — MediaPipe landmarks → pose label
// Model: yoga_pose_model.tflite (5 classes: downdog, goddess, plank, tree, warrior2)
//
// NOTE: bundleResourceIO from @tensorflow/tfjs-react-native requires expo-asset
// which is not available in bare React Native. We load via RNFS instead and run
// inference with the standard @tensorflow/tfjs CPU backend.

import * as tf from '@tensorflow/tfjs';
import RNFS from 'react-native-fs';

// ── Pose class labels ─────────────────────────────────────────────────────────
export const POSE_CLASSES = ['downdog', 'goddess', 'plank', 'tree', 'warrior2'];

export const POSE_DISPLAY = {
  downdog:  { en: 'Downward Dog',  te: 'అధో ముఖ శ్వానాసన', hi: 'अधो मुख श्वानासन', emoji: '🐕' },
  goddess:  { en: 'Goddess Pose',  te: 'దేవి ఆసన',          hi: 'देवी आसन',          emoji: '🧘' },
  plank:    { en: 'Plank Pose',    te: 'ఫలకాసన',            hi: 'फलकासन',            emoji: '💪' },
  tree:     { en: 'Tree Pose',     te: 'వృక్షాసన',           hi: 'वृक्षासन',           emoji: '🌳' },
  warrior2: { en: 'Warrior II',    te: 'వీరభద్రాసన II',      hi: 'वीरभद्रासन II',      emoji: '⚔️' },
};

let model        = null;
let scalerParams = null;
let isLoaded     = false;

// ── Load model and scaler ─────────────────────────────────────────────────────
export async function loadPoseModel() {
  if (isLoaded) return true;

  try {
    await tf.ready();
    console.log('TF backend:', tf.getBackend());

    // ── Load scaler params ───────────────────────────────────────────────────
    // On Android, files in /assets must be copied to a readable path first.
    const scalerDest = `${RNFS.DocumentDirectoryPath}/scaler_params.json`;
    if (!(await RNFS.exists(scalerDest))) {
      await RNFS.copyFileAssets('scaler_params.json', scalerDest);
    }
    const scalerJson = await RNFS.readFile(scalerDest, 'utf8');
    scalerParams     = JSON.parse(scalerJson);
    console.log('✅ Scaler loaded');

    // ── Load model weights ───────────────────────────────────────────────────
    // The .tflite binary is not directly usable with tf.loadLayersModel.
    // Copy it to DocumentDirectory so it is accessible via a file:// URI,
    // then load it as a binary artifact.  If loading fails the app continues
    // without AI classification (MediaPipe detection still works).
    const modelDest = `${RNFS.DocumentDirectoryPath}/yoga_pose_model.tflite`;
    if (!(await RNFS.exists(modelDest))) {
      await RNFS.copyFileAssets('yoga_pose_model.tflite', modelDest);
    }

    // tf.loadLayersModel expects a TF.js SavedModel (JSON + bin shards).
    // A raw .tflite file cannot be loaded this way; treat this as a graceful
    // no-op so the rest of the app works while a proper TFLite runtime
    // (react-native-fast-tflite) is integrated in a future sprint.
    console.warn('⚠️  TFLite runtime not yet integrated — AI classification disabled. MediaPipe detection still active.');
    isLoaded = false;
    return false;
  } catch (err) {
    console.error('Model load error:', err);
    return false;
  }
}


// ── Scale landmarks using saved scaler params ─────────────────────────────────
function scaleLandmarks(landmarks) {
  const mean  = scalerParams.mean;
  const scale = scalerParams.scale;
  return landmarks.map((val, i) => (val - mean[i]) / scale[i]);
}

// ── Convert MediaPipe landmarks to flat array ─────────────────────────────────
export function landmarksToArray(poseLandmarks) {
  if (!poseLandmarks || poseLandmarks.length < 33) return null;
  const arr = [];
  for (const lm of poseLandmarks) {
    arr.push(lm.x, lm.y, lm.z, lm.visibility || 0);
  }
  return arr; // 132 values
}

// ── Predict pose from landmarks ───────────────────────────────────────────────
export async function predictPose(poseLandmarks) {
  if (!isLoaded || !model || !scalerParams) {
    console.warn('Model not loaded yet');
    return null;
  }

  try {
    const landmarkArray = landmarksToArray(poseLandmarks);
    if (!landmarkArray) return null;

    const scaled = scaleLandmarks(landmarkArray);

    const inputTensor  = tf.tensor2d([scaled], [1, 132]);
    const outputTensor = model.predict(inputTensor);
    const predictions  = await outputTensor.data();

    inputTensor.dispose();
    outputTensor.dispose();

    const maxIdx     = predictions.indexOf(Math.max(...predictions));
    const poseClass  = POSE_CLASSES[maxIdx];
    const confidence = Math.round(predictions[maxIdx] * 100);

    const allPreds = POSE_CLASSES.map((cls, i) => ({
      pose:       cls,
      confidence: Math.round(predictions[i] * 100),
      display:    POSE_DISPLAY[cls],
    })).sort((a, b) => b.confidence - a.confidence);

    return {
      pose:           poseClass,
      confidence,
      display:        POSE_DISPLAY[poseClass],
      allPredictions: allPreds,
      isConfident:    confidence >= 70,
    };
  } catch (err) {
    console.error('Prediction error:', err);
    return null;
  }
}

// ── Generate feedback based on pose and confidence ────────────────────────────
export function generateFeedback(prediction, lang = 'en') {
  if (!prediction) return null;

  const { pose, confidence, display } = prediction;

  const feedbackMap = {
    downdog: {
      en: ['Push hips up higher', 'Press heels toward floor', 'Straighten your legs', 'Let head hang between arms'],
      te: ['పోపులు పైకి ఎత్తండి', 'మడమలు నేలకు నెట్టండి', 'కాళ్ళు నిటారుగా ఉంచండి'],
      hi: ['कूल्हे ऊपर उठाएं', 'एड़ियां जमीन की ओर दबाएं', 'पैर सीधे रखें'],
    },
    goddess: {
      en: ['Bend knees deeper', 'Open arms wider', 'Keep spine straight', 'Feet turned out 45°'],
      te: ['మోకాళ్ళు లోతుగా వంచండి', 'చేతులు వెడల్పుగా చాచండి', 'వెన్నెముక నిటారుగా ఉంచండి'],
      hi: ['घुटने गहरे मोड़ें', 'बाहें चौड़ी फैलाएं', 'रीढ़ सीधी रखें'],
    },
    plank: {
      en: ['Keep body in straight line', "Don't let hips sag", 'Engage your core', 'Arms straight under shoulders'],
      te: ['శరీరం నేరుగా ఉంచండి', 'పోపులు వంగనీయకండి', 'కోర్ బిగించండి'],
      hi: ['शरीर सीधा रखें', 'कूल्हे न झुकने दें', 'कोर मजबूत करें'],
    },
    tree: {
      en: ['Fix gaze on one point', 'Press foot into thigh', 'Raise arms overhead', 'Stand tall'],
      te: ['ఒక బిందువుపై దృష్టి నిలపండి', 'పాదాన్ని తొడకు నొక్కండి', 'చేతులు పైకి ఎత్తండి'],
      hi: ['एक बिंदु पर नजर रखें', 'पैर जांघ पर दबाएं', 'हाथ ऊपर उठाएं'],
    },
    warrior2: {
      en: ['Extend arms parallel to floor', 'Front knee over ankle', 'Look over front hand', 'Open hips sideways'],
      te: ['చేతులు నేలకు సమాంతరంగా చాచండి', 'ముందు మోకాలు చీలమండ పైన ఉంచండి'],
      hi: ['बाहें जमीन के समानांतर फैलाएं', 'सामने का घुटना टखने के ऊपर रखें'],
    },
  };

  const tips = feedbackMap[pose]?.[lang] || feedbackMap[pose]?.en || [];

  const gradeMsg = {
    en: confidence >= 90 ? '🏆 Excellent form!' :
        confidence >= 75 ? '👍 Good pose!'      :
        confidence >= 60 ? '💪 Keep practicing!' : '🔄 Adjust your pose',
    te: confidence >= 90 ? '🏆 అద్భుతమైన భంగిమ!' :
        confidence >= 75 ? '👍 మంచి భంగిమ!'       :
        confidence >= 60 ? '💪 అభ్యాసం కొనసాగించండి!' : '🔄 భంగిమను సరిచేయండి',
    hi: confidence >= 90 ? '🏆 शानदार मुद्रा!' :
        confidence >= 75 ? '👍 अच्छी मुद्रा!'  :
        confidence >= 60 ? '💪 अभ्यास जारी रखें!' : '🔄 मुद्रा ठीक करें',
  };

  return {
    grade:    gradeMsg[lang] || gradeMsg.en,
    tips:     tips.slice(0, 3),
    score:    confidence,
    poseName: display?.[lang] || display?.en || pose,
  };
}
