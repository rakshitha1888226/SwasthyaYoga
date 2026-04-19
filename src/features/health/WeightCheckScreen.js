// SwasthyaYoga — Healthy Weight Check
// Inputs: Gender, Age, Height, Weight only (waist removed)
// Uses South Asian BMI cutoffs (ICMR + WHO Asia-Pacific guidelines)
// BMI formula: weight(kg) / height(m)²
// South Asian cutoffs: <18.5 underweight, 18.5-22.9 normal, 23-27.4 overweight, ≥27.5 obese

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, StatusBar,
} from 'react-native';

// ── All strings in 3 languages ────────────────────────────────────────────
const STR = {
  en: {
    screenTitle: 'Healthy Weight Check',
    heroTitle:   'Know your healthy weight',
    heroSub:     'Enter your details below. We use Indian health standards (South Asian BMI cutoffs) to give you an accurate result.',
    howTitle:    'How is this calculated?',
    howText:     'BMI = your weight (kg) ÷ your height (m)². For Indians the healthy range is 18.5–22.9, not 25 like Western standards. This is because South Asians develop health risks at lower BMI values — confirmed by ICMR and WHO guidelines.',
    gender: 'Gender', male: 'Male', female: 'Female',
    age:    'Age (years)',   agePh:    'e.g. 35',
    height: 'Height (cm)',  heightPh: 'e.g. 165',
    weight: 'Weight (kg)',  weightPh: 'e.g. 68',
    checkBtn: 'Check My Health',
    errFill:   'Please fill in all fields.',
    errAge:    'Age must be between 5 and 80.',
    errHeight: 'Height must be between 80 and 220 cm.',
    errWeight: 'Weight must be between 10 and 200 kg.',
    yourBMI:   'Your BMI',
    bmiRange:  'Indian healthy BMI range: 18.5 – 22.9',
    idealRange: 'Ideal weight for your height',
    toGain:  'Need to gain', toLose: 'Need to lose',
    atIdeal: 'You are at a healthy weight ✓',
    yogaTitle: 'Recommended Yoga',
    dietTitle: 'Diet Tips',
    startYoga:  'Start Yoga',
    checkAgain: 'Check Again',
    disclaimer: '* General health guide only. Not a substitute for medical advice. Consult your doctor.',
    categories: {
      under:  { label: 'Underweight',    emoji: '📉', advice: 'Your BMI is below the healthy range for Indians. Focus on building strength with yoga and eating more nutritious food.' },
      normal: { label: 'Healthy Weight', emoji: '✅', advice: 'Your BMI is in the healthy range for Indians. Keep practising yoga regularly to stay here.' },
      over:   { label: 'Overweight',     emoji: '⚠️', advice: 'Your BMI is slightly above the healthy range. Daily yoga and a balanced diet will help bring it down.' },
      obese:  { label: 'High Weight',    emoji: '🔴', advice: 'Your BMI is significantly above the healthy range. Start with gentle yoga daily and consult a doctor.' },
    },
  },
  te: {
    screenTitle: 'ఆరోగ్యకరమైన బరువు తనిఖీ',
    heroTitle:   'మీ ఆరోగ్యకరమైన బరువు తెలుసుకోండి',
    heroSub:     'దిగువ వివరాలు నమోదు చేయండి. మేము భారతీయ ఆరోగ్య ప్రమాణాలు (దక్షిణ ఆసియా BMI) ఉపయోగిస్తాం.',
    howTitle:    'ఇది ఎలా లెక్కిస్తారు?',
    howText:     'BMI = మీ బరువు (కేజీ) ÷ మీ ఎత్తు (మీటర్)². భారతీయులకు ఆరోగ్యకరమైన పరిధి 18.5–22.9 — పాశ్చాత్య ప్రమాణం 25 కంటే తక్కువ. ఎందుకంటే దక్షిణ ఆసియన్లకు తక్కువ BMI వద్దే ఆరోగ్య ప్రమాదాలు వస్తాయి — ICMR మరియు WHO మార్గదర్శకాలు ధృవీకరించాయి.',
    gender: 'లింగం', male: 'మగ', female: 'ఆడ',
    age:    'వయసు (సంవత్సరాలు)', agePh:    'ఉదా: 35',
    height: 'ఎత్తు (సెం.మీ)',   heightPh: 'ఉదా: 165',
    weight: 'బరువు (కేజీ)',      weightPh: 'ఉదా: 68',
    checkBtn: 'నా ఆరోగ్యం తనిఖీ చేయి',
    errFill:   'దయచేసి అన్ని ఖాళీలు పూరించండి.',
    errAge:    'వయసు 5 నుండి 80 మధ్య ఉండాలి.',
    errHeight: 'ఎత్తు 80 నుండి 220 సెం.మీ మధ్య ఉండాలి.',
    errWeight: 'బరువు 10 నుండి 200 కేజీ మధ్య ఉండాలి.',
    yourBMI:   'మీ BMI',
    bmiRange:  'భారతీయులకు ఆరోగ్యకరమైన BMI పరిధి: 18.5 – 22.9',
    idealRange: 'మీ ఎత్తుకు ఆదర్శ బరువు',
    toGain:  'పెరగాల్సింది', toLose: 'తగ్గాల్సింది',
    atIdeal: 'మీరు ఆరోగ్యకరమైన బరువులో ఉన్నారు ✓',
    yogaTitle: 'సిఫారసు చేయబడిన యోగా',
    dietTitle: 'ఆహార సూచనలు',
    startYoga:  'యోగా ప్రారంభించు',
    checkAgain: 'మళ్ళీ తనిఖీ చేయి',
    disclaimer: '* ఇది సాధారణ ఆరోగ్య మార్గదర్శకం మాత్రమే. వైద్య సలహా కోసం డాక్టర్‌ను సంప్రదించండి.',
    categories: {
      under:  { label: 'తక్కువ బరువు',       emoji: '📉', advice: 'మీ BMI ఆరోగ్యకరమైన పరిధి కంటే తక్కువగా ఉంది. యోగా మరియు పోషకాహారంపై దృష్టి పెట్టండి.' },
      normal: { label: 'ఆరోగ్యకరమైన బరువు',  emoji: '✅', advice: 'చాలా బాగుంది! మీ BMI ఆరోగ్యకరమైన పరిధిలో ఉంది. దీన్ని నిలుపుకోవడానికి నియమితంగా యోగా చేయండి.' },
      over:   { label: 'అధిక బరువు',          emoji: '⚠️', advice: 'మీ BMI కొద్దిగా ఎక్కువగా ఉంది. రోజువారీ యోగా మరియు సమతుల్య ఆహారం సహాయపడతాయి.' },
      obese:  { label: 'చాలా అధిక బరువు',     emoji: '🔴', advice: 'మీ BMI గణనీయంగా ఎక్కువగా ఉంది. మెల్లటి యోగాతో ప్రారంభించి డాక్టర్‌ను సంప్రదించండి.' },
    },
  },
  hi: {
    screenTitle: 'स्वस्थ वजन जांच',
    heroTitle:   'अपना स्वस्थ वजन जानें',
    heroSub:     'नीचे अपना विवरण दर्ज करें। हम भारतीय स्वास्थ्य मानकों (दक्षिण एशियाई BMI) का उपयोग करते हैं।',
    howTitle:    'यह कैसे गणना की जाती है?',
    howText:     'BMI = आपका वजन (किग्रा) ÷ आपकी ऊंचाई (मीटर)². भारतीयों के लिए स्वस्थ सीमा 18.5–22.9 है, पश्चिमी मानक 25 नहीं। क्योंकि दक्षिण एशियाई लोगों में कम BMI पर ही स्वास्थ्य जोखिम होते हैं — ICMR और WHO दिशानिर्देशों द्वारा पुष्टि।',
    gender: 'लिंग', male: 'पुरुष', female: 'महिला',
    age:    'उम्र (वर्ष)',    agePh:    'जैसे: 35',
    height: 'ऊंचाई (सेमी)', heightPh: 'जैसे: 165',
    weight: 'वजन (किग्रा)', weightPh: 'जैसे: 68',
    checkBtn: 'मेरा स्वास्थ्य जांचें',
    errFill:   'कृपया सभी फ़ील्ड भरें।',
    errAge:    'उम्र 5 से 80 के बीच होनी चाहिए।',
    errHeight: 'ऊंचाई 80 से 220 सेमी के बीच होनी चाहिए।',
    errWeight: 'वजन 10 से 200 किग्रा के बीच होना चाहिए।',
    yourBMI:   'आपका BMI',
    bmiRange:  'भारतीयों के लिए स्वस्थ BMI सीमा: 18.5 – 22.9',
    idealRange: 'आपकी ऊंचाई के लिए आदर्श वजन',
    toGain:  'बढ़ाना है', toLose: 'घटाना है',
    atIdeal: 'आप स्वस्थ वजन पर हैं ✓',
    yogaTitle: 'अनुशंसित योग आसन',
    dietTitle: 'आहार सुझाव',
    startYoga:  'योग शुरू करें',
    checkAgain: 'फिर से जांचें',
    disclaimer: '* केवल सामान्य स्वास्थ्य मार्गदर्शिका। चिकित्सा सलाह के लिए डॉक्टर से मिलें।',
    categories: {
      under:  { label: 'कम वजन',         emoji: '📉', advice: 'आपका BMI स्वस्थ सीमा से कम है। योग और पोषक भोजन पर ध्यान दें।' },
      normal: { label: 'स्वस्थ वजन',     emoji: '✅', advice: 'बहुत अच्छा! आपका BMI स्वस्थ सीमा में है। इसे बनाए रखने के लिए नियमित योग करें।' },
      over:   { label: 'अधिक वजन',       emoji: '⚠️', advice: 'आपका BMI थोड़ा अधिक है। रोज़ योग और संतुलित आहार से सुधार होगा।' },
      obese:  { label: 'बहुत अधिक वजन', emoji: '🔴', advice: 'आपका BMI काफी अधिक है। हल्के योग से शुरू करें और डॉक्टर से मिलें।' },
    },
  },
};

// ── Yoga recommendations per BMI category ─────────────────────────────────
const YOGA = {
  under: [
    { pose: 'Virabhadrasana I',  emoji: '⚔️', en: 'Builds muscle and body strength',   te: 'కండరాల బలం పెంచుతుంది',           hi: 'मांसपेशियां मजबूत करे' },
    { pose: 'Utkatasana',        emoji: '🪑', en: 'Strengthens legs and core',          te: 'కాలు మరియు కోర్ బలం పెంచుతుంది',  hi: 'पैर और कोर मजबूत करे' },
    { pose: 'Bhujangasana',      emoji: '🐍', en: 'Strengthens spine and back',         te: 'వెన్నెముక బలపడుతుంది',              hi: 'रीढ़ और पीठ मजबूत करे' },
    { pose: 'Setu Bandhasana',   emoji: '🌉', en: 'Strengthens glutes and hips',        te: 'పిరుదులు మరియు తుంటి బలపడతాయి',   hi: 'कूल्हे मजबूत करे' },
    { pose: 'Balasana',          emoji: '🙇', en: 'Calms mind and aids digestion',      te: 'మనసు శాంతిస్తుంది, జీర్ణక్రియ మెరుగవుతుంది', hi: 'मन शांत, पाचन सुधारे' },
  ],
  normal: [
    { pose: 'Surya Namaskar',    emoji: '☀️', en: 'Full body maintenance',              te: 'శరీరమంతా సక్రియంగా ఉంటుంది',        hi: 'पूरे शरीर की देखभाल' },
    { pose: 'Vrikshasana',       emoji: '🌳', en: 'Improves balance and focus',         te: 'సమతుల్యత మరియు ఏకాగ్రత పెరుగుతాయి', hi: 'संतुलन और एकाग्रता' },
    { pose: 'Trikonasana',       emoji: '🔺', en: 'Stretches and tones the body',       te: 'శరీరం సాగి టోన్ అవుతుంది',          hi: 'शरीर टोन करे' },
    { pose: 'Tadasana',          emoji: '🧍', en: 'Maintains good posture',             te: 'సరైన భంగిమ నిలుస్తుంది',            hi: 'सही मुद्रा बनाए' },
    { pose: 'Savasana',          emoji: '😌', en: 'Deep rest and stress relief',        te: 'లోతైన విశ్రాంతి, ఒత్తిడి తగ్గుతుంది', hi: 'गहरा आराम, तनाव कम' },
  ],
  over: [
    { pose: 'Surya Namaskar',         emoji: '☀️', en: 'Burns calories, boosts metabolism', te: 'కేలరీలు తగ్గి జీవక్రియ పెరుగుతుంది', hi: 'कैलोरी घटाए, चयापचय बढ़ाए' },
    { pose: 'Trikonasana',            emoji: '🔺', en: 'Reduces belly fat',                  te: 'పొట్ట కొవ్వు తగ్గుతుంది',           hi: 'पेट की चर्बी कम करे' },
    { pose: 'Paschimottanasana',      emoji: '🙆', en: 'Stimulates abdominal organs',        te: 'పొట్ట అవయవాలు సక్రియమవుతాయి',      hi: 'पेट के अंग सक्रिय करे' },
    { pose: 'Ardha Matsyendrasana',   emoji: '🔄', en: 'Improves digestion and detox',       te: 'జీర్ణక్రియ మెరుగవుతుంది, విషపదార్థాలు తొలగుతాయి', hi: 'पाचन और डिटॉक्स सुधारे' },
    { pose: 'Dhanurasana',            emoji: '🏹', en: 'Tones belly and back muscles',       te: 'పొట్ట, వీపు కండరాలు టోన్ అవుతాయి', hi: 'पेट और पीठ टोन करे' },
  ],
  obese: [
    { pose: 'Tadasana',               emoji: '🧍', en: 'Gentle start, improves posture',     te: 'మెల్లగా ప్రారంభం, భంగిమ మెరుగవుతుంది', hi: 'हल्की शुरुआत, मुद्रा सुधारे' },
    { pose: 'Surya Namaskar (slow)',   emoji: '☀️', en: 'Burns fat gently',                   te: 'మెల్లగా కొవ్వు తగ్గిస్తుంది',          hi: 'धीरे-धीरे चर्बी घटाए' },
    { pose: 'Vakrasana',              emoji: '🌀', en: 'Reduces waist, aids digestion',       te: 'నడుము తగ్గి జీర్ణక్రియ మెరుగవుతుంది',  hi: 'कमर घटाए, पाचन सुधारे' },
    { pose: 'Setu Bandhasana',        emoji: '🌉', en: 'Gentle back and hip strengthener',   te: 'వీపు, తుంటి మెల్లగా బలపడుతాయి',       hi: 'पीठ और कूल्हे धीरे मजबूत करे' },
    { pose: 'Balasana',               emoji: '🙇', en: 'Rest pose, relieves stress',         te: 'విశ్రాంతి భంగిమ, ఒత్తిడి తగ్గుతుంది', hi: 'विश्राम मुद्रा, तनाव कम' },
  ],
};

// ── Diet tips per category ────────────────────────────────────────────────
const DIET = {
  under: {
    en: '• Eat 5–6 small meals daily\n• Include rice, dal, milk, eggs, nuts, bananas\n• Add 1 tsp ghee per meal\n• Never skip meals\n• Drink whole milk daily',
    te: '• రోజుకు 5–6 చిన్న పూటలు తినండి\n• అన్నం, పప్పు, పాలు, గుడ్లు, కాయలు, అరటిపండ్లు తినండి\n• ప్రతి పూటలో 1 చెంచా నెయ్యి తినండి\n• పూట మానకండి\n• రోజూ పూర్తి పాలు తాగండి',
    hi: '• दिन में 5–6 बार छोटे भोजन करें\n• चावल, दाल, दूध, अंडे, मेवे, केले खाएं\n• हर भोजन में 1 चम्मच घी लें\n• खाना न छोड़ें\n• रोज़ पूरा दूध पिएं',
  },
  normal: {
    en: '• Eat balanced meals with vegetables, fruits, whole grains\n• Adequate protein at each meal\n• Drink 2–3 litres of water daily\n• Limit sugar and fried food\n• Keep evening meals light',
    te: '• కూరగాయలు, పండ్లు, ధాన్యాలు తినండి\n• ప్రతి పూటలో సరైన ప్రోటీన్ తీసుకోండి\n• రోజూ 2–3 లీటర్ల నీరు తాగండి\n• చక్కెర మరియు వేయించిన ఆహారం తగ్గించండి\n• రాత్రి భోజనం తేలికగా ఉంచండి',
    hi: '• सब्जियां, फल, साबुत अनाज खाएं\n• हर भोजन में पर्याप्त प्रोटीन लें\n• रोज़ 2–3 लीटर पानी पिएं\n• चीनी और तला हुआ कम करें\n• रात का खाना हल्का रखें',
  },
  over: {
    en: '• Reduce fried food, sugar, and white rice\n• Eat more vegetables, fruits, and fibre\n• Avoid eating after 8 PM\n• Drink 2–3 litres of water daily\n• Replace white rice with millets or brown rice',
    te: '• వేయించిన ఆహారం, చక్కెర, తెల్ల అన్నం తగ్గించండి\n• కూరగాయలు, పండ్లు, నారు ఎక్కువగా తినండి\n• రాత్రి 8 తర్వాత తినకండి\n• రోజూ 2–3 లీటర్ల నీరు తాగండి\n• తెల్ల అన్నం బదులు జొన్నలు లేదా బ్రౌన్ రైస్ తినండి',
    hi: '• तला हुआ, चीनी और सफेद चावल कम करें\n• सब्जियां, फल और फाइबर ज्यादा खाएं\n• रात 8 बजे के बाद न खाएं\n• रोज़ 2–3 लीटर पानी पिएं\n• सफेद चावल की जगह बाजरा या ब्राउन राइस खाएं',
  },
  obese: {
    en: '• Strictly avoid sugar, fried food, and packaged food\n• Eat small portions every 3 hours\n• Drink warm water every morning on empty stomach\n• No food after 7 PM\n• Consult a dietitian for a personalised plan',
    te: '• చక్కెర, వేయించిన ఆహారం, ప్యాకేజ్డ్ ఆహారం పూర్తిగా మానండి\n• ప్రతి 3 గంటలకు చిన్న పూట తినండి\n• ప్రతి ఉదయం ఖాళీ కడుపుతో వేడి నీరు తాగండి\n• రాత్రి 7 తర్వాత ఏమీ తినకండి\n• వ్యక్తిగత ప్రణాళిక కోసం పోషకాహార నిపుణుడిని సంప్రదించండి',
    hi: '• चीनी, तला हुआ और पैकेज्ड खाना पूरी तरह बंद करें\n• हर 3 घंटे में थोड़ा खाएं\n• हर सुबह खाली पेट गर्म पानी पिएं\n• रात 7 बजे के बाद कुछ न खाएं\n• व्यक्तिगत योजना के लिए डाइटिशियन से मिलें',
  },
};

const CAT_COLORS = {
  under:  { main: '#1565C0', bg: '#E3F2FD', border: '#1565C0' },
  normal: { main: '#2E7D32', bg: '#E8F5E9', border: '#2E7D32' },
  over:   { main: '#E65100', bg: '#FFF3E0', border: '#E65100' },
  obese:  { main: '#B71C1C', bg: '#FFEBEE', border: '#B71C1C' },
};

// ── BMI calculation (South Asian cutoffs) ─────────────────────────────────
function calcBMI(age, heightCm, weightKg) {
  const hm  = heightCm / 100;
  const bmi = weightKg / (hm * hm);

  // South Asian / Indian cutoffs from WHO Asia-Pacific + ICMR guidelines
  let cat;
  if (age < 18) {
    // Children — adjusted cutoffs
    const t = age < 10
      ? { under: 14.0, normal: 21.0, over: 25.0 }
      : { under: 15.5, normal: 22.5, over: 27.0 };
    cat = bmi < t.under ? 'under' : bmi < t.normal ? 'normal' : bmi < t.over ? 'over' : 'obese';
  } else {
    // Adults — South Asian cutoffs
    cat = bmi < 18.5 ? 'under' : bmi < 23.0 ? 'normal' : bmi < 27.5 ? 'over' : 'obese';
  }

  // Ideal weight range using South Asian healthy BMI 18.5–22.9
  const idealMin = +(18.5 * hm * hm).toFixed(1);
  const idealMax = +(22.9 * hm * hm).toFixed(1);

  return {
    bmi:      +bmi.toFixed(1),
    cat,
    idealMin,
    idealMax,
    weightKg,
    diff: +(weightKg - idealMax).toFixed(1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
const WeightCheckScreen = ({ navigation }) => {
  const [lang,       setLang]       = useState(null);
  const [gender,     setGender]     = useState('male');
  const [age,        setAge]        = useState('');
  const [height,     setHeight]     = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');  // 'cm' | 'in'
  const [weight,     setWeight]     = useState('');
  const [error,      setError]      = useState('');
  const [result,     setResult]     = useState(null);

  const s = STR[lang || 'en'];

  // height in cm — converts from total inches if needed
  const heightCm = () => {
    const v = parseFloat(height);
    return heightUnit === 'in' ? +(v * 2.54).toFixed(1) : v;
  };

  // live hint for height field
  const heightHint = () => {
    const v = parseFloat(height);
    if (isNaN(v)) return null;
    if (heightUnit === 'in') {
      const cm = (v * 2.54).toFixed(1);
      const ft = Math.floor(v / 12);
      const inc = Math.round(v % 12);
      return `= ${cm} cm  (${ft}'${inc}")`;
    }
    const totalIn = v / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inc = Math.round(totalIn % 12);
    return `= ${ft}'${inc}"  (${totalIn.toFixed(1)} in)`;
  };

  const validate = () => {
    const a = parseFloat(age), w = parseFloat(weight);
    const hcm = heightCm();
    if (isNaN(a) || isNaN(hcm) || isNaN(w)) return s.errFill;
    if (a < 5    || a > 80)    return s.errAge;
    if (hcm < 80 || hcm > 220) return s.errHeight;
    if (w < 10   || w > 200)   return s.errWeight;
    return null;
  };

  const handleCheck = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setResult(calcBMI(parseFloat(age), heightCm(), parseFloat(weight)));
  };

  const handleReset = () => {
    setResult(null);
    setAge(''); setHeight(''); setHeightUnit('cm'); setWeight(''); setError('');
  };

  // ── Language picker ────────────────────────────────────────────────────
  if (!lang) {
    return (
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
            <Text style={st.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Healthy Weight Check</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={st.langScreen}>
          <Text style={st.langEmoji}>⚖️</Text>
          <Text style={st.langHeading}>Choose your language</Text>
          <Text style={st.langSub}>మీ భాషను ఎంచుకోండి  /  अपनी भाषा चुनें</Text>
          <View style={st.langList}>
            {[
              { k: 'en', label: 'English', desc: 'Continue in English' },
              { k: 'te', label: 'తెలుగు',  desc: 'తెలుగులో కొనసాగించు' },
              { k: 'hi', label: 'हिंदी',   desc: 'हिंदी में जारी रखें' },
            ].map(l => (
              <TouchableOpacity key={l.k} style={st.langBtn} onPress={() => setLang(l.k)} activeOpacity={0.8}>
                <Text style={st.langBtnLabel}>{l.label}</Text>
                <Text style={st.langBtnDesc}>{l.desc}</Text>
                <Text style={st.langBtnArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── Form + Results ─────────────────────────────────────────────────────
  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={result ? handleReset : () => setLang(null)}>
          <Text style={st.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>{s.screenTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 56 }}>

        {!result ? (
          <>
            {/* Hero */}
            <View style={st.hero}>
              <Text style={st.heroEmoji}>⚖️</Text>
              <Text style={st.heroTitle}>{s.heroTitle}</Text>
              <Text style={st.heroSub}>{s.heroSub}</Text>
            </View>

            {/* How it's calculated — transparent explanation */}
            <View style={st.infoBox}>
              <Text style={st.infoTitle}>📊 {s.howTitle}</Text>
              <Text style={st.infoTxt}>{s.howText}</Text>
              {/* Visual BMI scale */}
              <View style={st.bmiScale}>
                {[
                  { label: '< 18.5', color: '#1565C0', name: lang === 'te' ? 'తక్కువ' : lang === 'hi' ? 'कम' : 'Under' },
                  { label: '18.5–22.9', color: '#2E7D32', name: lang === 'te' ? 'ఆరోగ్యం' : lang === 'hi' ? 'स्वस्थ' : 'Healthy' },
                  { label: '23–27.4', color: '#E65100', name: lang === 'te' ? 'అధికం' : lang === 'hi' ? 'अधिक' : 'Over' },
                  { label: '≥ 27.5', color: '#B71C1C', name: lang === 'te' ? 'చాలా' : lang === 'hi' ? 'बहुत' : 'Obese' },
                ].map((b, i) => (
                  <View key={i} style={st.bmiScaleItem}>
                    <View style={[st.bmiScaleDot, { backgroundColor: b.color }]} />
                    <Text style={[st.bmiScaleLabel, { color: b.color }]}>{b.label}</Text>
                    <Text style={st.bmiScaleName}>{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Form */}
            <View style={st.card}>

              {/* Gender */}
              <Text style={st.label}>{s.gender}</Text>
              <View style={st.gRow}>
                {[{ k: 'male', lbl: s.male, e: '👨' }, { k: 'female', lbl: s.female, e: '👩' }].map(g => (
                  <TouchableOpacity
                    key={g.k}
                    style={[st.gBtn, gender === g.k && st.gBtnOn]}
                    onPress={() => setGender(g.k)}
                    activeOpacity={0.8}
                  >
                    <Text style={st.gEmoji}>{g.e}</Text>
                    <Text style={[st.gLbl, gender === g.k && st.gLblOn]}>{g.lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age */}
              <Text style={st.label}>{s.age}</Text>
              <View style={st.inputRow}>
                <TextInput style={st.input} placeholder={s.agePh} placeholderTextColor="#bbb"
                  keyboardType="decimal-pad" value={age} onChangeText={setAge} />
                <View style={st.unit}><Text style={st.unitTxt}>yrs</Text></View>
              </View>

              {/* Height — with cm / in toggle */}
              <Text style={st.label}>{s.height}</Text>
              <View style={st.unitToggleRow}>
                {['cm', 'in'].map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[st.unitToggleBtn, heightUnit === u && st.unitToggleBtnOn]}
                    onPress={() => { setHeightUnit(u); setHeight(''); setError(''); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[st.unitToggleTxt, heightUnit === u && st.unitToggleTxtOn]}>{u}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={st.unitToggleHint}>
                  {heightUnit === 'cm' ? 'centimetres' : "total inches  (5'7\" = 67 in)"}
                </Text>
              </View>
              <View style={st.inputRow}>
                <TextInput style={st.input}
                  placeholder={heightUnit === 'cm' ? 'e.g.  165' : 'e.g.  67'}
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
                <View style={st.unit}><Text style={st.unitTxt}>{heightUnit}</Text></View>
              </View>
              {!!heightHint() && (
                <Text style={st.convHint}>⇔  {heightHint()}</Text>
              )}

              {/* Weight */}
              <Text style={st.label}>{s.weight}</Text>
              <View style={st.inputRow}>
                <TextInput style={st.input} placeholder={s.weightPh} placeholderTextColor="#bbb"
                  keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
                <View style={st.unit}><Text style={st.unitTxt}>kg</Text></View>
              </View>

              {!!error && <Text style={st.errTxt}>{error}</Text>}

              <TouchableOpacity style={st.checkBtn} onPress={handleCheck} activeOpacity={0.85}>
                <Text style={st.checkBtnTxt}>{s.checkBtn}</Text>
              </TouchableOpacity>
            </View>
          </>

        ) : (() => {
          const cc   = CAT_COLORS[result.cat];
          const cat  = s.categories[result.cat];
          const poses = YOGA[result.cat];
          const diet  = DIET[result.cat][lang];

          return (
            <>
              {/* Result banner */}
              <View style={[st.resultBanner, { backgroundColor: cc.bg, borderLeftColor: cc.border }]}>
                <Text style={[st.resultEmoji]}>{cat.emoji}</Text>
                <Text style={[st.resultLabel, { color: cc.main }]}>{cat.label}</Text>
                <Text style={[st.resultAdvice, { color: cc.main }]}>{cat.advice}</Text>
              </View>

              {/* BMI card — shows formula clearly */}
              <View style={st.bmiCard}>
                <View style={st.bmiTop}>
                  <View>
                    <Text style={st.bmiSmall}>{s.yourBMI}</Text>
                    <Text style={[st.bmiValue, { color: cc.main }]}>{result.bmi}</Text>
                  </View>
                  <View style={[st.bmiStatusPill, { backgroundColor: cc.bg, borderColor: cc.border }]}>
                    <Text style={[st.bmiStatusText, { color: cc.main }]}>{cat.label}</Text>
                  </View>
                </View>
                {/* Formula shown */}
                <View style={st.formulaRow}>
                  <Text style={st.formulaTxt}>
                    BMI = {result.weightKg} ÷ ({(parseFloat(height)/100).toFixed(2)})² = {result.bmi}
                  </Text>
                </View>
                <Text style={st.bmiRangeNote}>📌 {s.bmiRange}</Text>
              </View>

              {/* Ideal weight */}
              <View style={st.idealCard}>
                <Text style={st.idealLbl}>{s.idealRange}</Text>
                <Text style={[st.idealVal, { color: cc.main }]}>
                  {result.idealMin} – {result.idealMax} kg
                </Text>
                {result.cat === 'normal'
                  ? <Text style={[st.idealDiff, { color: '#2E7D32' }]}>{s.atIdeal}</Text>
                  : result.cat === 'under'
                  ? <Text style={[st.idealDiff, { color: '#1565C0' }]}>
                      {s.toGain}: {Math.max(0, result.idealMin - result.weightKg).toFixed(1)} kg
                    </Text>
                  : <Text style={[st.idealDiff, { color: '#E65100' }]}>
                      {s.toLose}: {Math.abs(result.diff).toFixed(1)} kg
                    </Text>
                }
              </View>

              {/* Yoga */}
              <View style={st.section}>
                <Text style={st.sectionTitle}>🧘 {s.yogaTitle}</Text>
                {poses.map((p, i) => (
                  <View key={i} style={st.poseRow}>
                    <View style={[st.poseNum, { backgroundColor: cc.main }]}>
                      <Text style={st.poseNumTxt}>{i + 1}</Text>
                    </View>
                    <Text style={st.poseEmoji}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={st.poseName}>{p.pose}</Text>
                      <Text style={st.poseBenefit}>
                        {lang === 'te' ? p.te : lang === 'hi' ? p.hi : p.en}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Diet */}
              <View style={st.dietCard}>
                <Text style={st.dietTitle}>🥗 {s.dietTitle}</Text>
                <Text style={st.dietTxt}>{diet}</Text>
              </View>

              {/* Buttons */}
              <View style={st.ctaRow}>
                <TouchableOpacity style={[st.ctaYoga, { backgroundColor: cc.main }]}
                  onPress={() => navigation.navigate('Pose')} activeOpacity={0.85}>
                  <Text style={st.ctaYogaTxt}>🧘 {s.startYoga}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.ctaAgain, { borderColor: cc.main }]}
                  onPress={handleReset} activeOpacity={0.85}>
                  <Text style={[st.ctaAgainTxt, { color: cc.main }]}>{s.checkAgain}</Text>
                </TouchableOpacity>
              </View>

              <Text style={st.disclaimer}>{s.disclaimer}</Text>
            </>
          );
        })()}
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#1565C0', paddingTop: 52,
    paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn:     { width: 60 },
  backTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  langScreen:  { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  langEmoji:   { fontSize: 64, marginBottom: 18 },
  langHeading: { fontSize: 22, fontWeight: 'bold', color: '#1565C0', textAlign: 'center', marginBottom: 6 },
  langSub:     { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 32 },
  langList:    { width: '100%', gap: 14 },
  langBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', elevation: 2,
  },
  langBtnLabel: { fontSize: 20, fontWeight: 'bold', color: '#1565C0', width: 80 },
  langBtnDesc:  { flex: 1, fontSize: 14, color: '#666' },
  langBtnArrow: { fontSize: 18, color: '#1565C0' },

  hero: {
    backgroundColor: '#1565C0', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 26, paddingTop: 10,
  },
  heroEmoji: { fontSize: 50, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 19, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  heroSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', lineHeight: 19 },

  infoBox: {
    backgroundColor: '#E3F2FD', marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#1565C0',
  },
  infoTitle: { fontSize: 13, fontWeight: 'bold', color: '#0D47A1', marginBottom: 8 },
  infoTxt:   { fontSize: 12, color: '#1A237E', lineHeight: 20, marginBottom: 12 },

  bmiScale:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  bmiScaleItem: { alignItems: 'center', flex: 1 },
  bmiScaleDot:  { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  bmiScaleLabel:{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  bmiScaleName: { fontSize: 9, color: '#666', textAlign: 'center', marginTop: 2 },

  card: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, elevation: 3 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 16 },

  gRow: { flexDirection: 'row', gap: 12 },
  gBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  gBtnOn:  { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
  gEmoji:  { fontSize: 26, marginBottom: 4 },
  gLbl:    { fontSize: 14, fontWeight: 'bold', color: '#888' },
  gLblOn:  { color: '#1565C0' },

  inputRow: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, overflow: 'hidden', marginBottom: 4,
  },
  input: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 18, color: '#222', fontWeight: 'bold',
  },
  unit: {
    width: 52, backgroundColor: '#F5F5F5',
    borderLeftWidth: 1, borderLeftColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  unitTxt: { fontSize: 12, color: '#888', fontWeight: '600' },

  // unit toggle pill (used by height & any future unit-switchable fields)
  unitToggleRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  unitToggleBtn:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#BDBDBD', backgroundColor: '#F5F5F5' },
  unitToggleBtnOn: { borderColor: '#1565C0', backgroundColor: '#1565C0' },
  unitToggleTxt:   { fontSize: 13, fontWeight: 'bold', color: '#888' },
  unitToggleTxtOn: { color: '#fff' },
  unitToggleHint:  { fontSize: 11, color: '#888', flex: 1 },
  convHint:        { fontSize: 12, color: '#1565C0', fontWeight: 'bold', marginTop: 2, marginBottom: 6, marginLeft: 4 },

  errTxt:      { color: '#E53935', fontSize: 13, marginTop: 10, textAlign: 'center' },
  checkBtn:    { backgroundColor: '#1565C0', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 22 },
  checkBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  resultBanner: { margin: 16, borderRadius: 16, padding: 18, borderLeftWidth: 5, alignItems: 'flex-start' },
  resultEmoji:  { fontSize: 36, marginBottom: 6 },
  resultLabel:  { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  resultAdvice: { fontSize: 13, lineHeight: 21 },

  bmiCard: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 16, padding: 18, elevation: 3, marginBottom: 10,
  },
  bmiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bmiSmall: { fontSize: 12, color: '#888', marginBottom: 2 },
  bmiValue: { fontSize: 42, fontWeight: 'bold' },
  bmiStatusPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  bmiStatusText: { fontSize: 14, fontWeight: 'bold' },
  formulaRow: {
    backgroundColor: '#F5F5F5', borderRadius: 8,
    padding: 10, marginBottom: 10,
  },
  formulaTxt:   { fontSize: 13, color: '#444', fontFamily: 'monospace', textAlign: 'center' },
  bmiRangeNote: { fontSize: 12, color: '#666', lineHeight: 18 },

  idealCard: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 14, padding: 16, elevation: 2, marginBottom: 10,
  },
  idealLbl:  { fontSize: 12, color: '#888', marginBottom: 4 },
  idealVal:  { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  idealDiff: { fontSize: 14, fontWeight: 'bold' },

  section:      { marginHorizontal: 16, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  poseRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 13, marginBottom: 8, elevation: 1, gap: 10,
  },
  poseNum:    { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  poseNumTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  poseEmoji:  { fontSize: 22 },
  poseName:   { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  poseBenefit:{ fontSize: 12, color: '#666', lineHeight: 18 },

  dietCard: {
    backgroundColor: '#E8F5E9', marginHorizontal: 16,
    marginTop: 10, borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#2E7D32',
  },
  dietTitle: { fontSize: 14, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8 },
  dietTxt:   { fontSize: 13, color: '#2E7D32', lineHeight: 24 },

  ctaRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, gap: 12 },
  ctaYoga: { flex: 2, borderRadius: 14, padding: 15, alignItems: 'center' },
  ctaYogaTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  ctaAgain: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1.5 },
  ctaAgainTxt: { fontWeight: 'bold', fontSize: 15 },

  disclaimer: { margin: 16, marginTop: 14, fontSize: 11, color: '#aaa', lineHeight: 18, textAlign: 'center' },
});


export default WeightCheckScreen;