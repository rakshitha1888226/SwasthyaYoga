// ── SwasthyaYoga — AI Health Service (Gemini 1.5 Flash / 1.5 Pro) ───────────────
// Get FREE key from: https://aistudio.google.com/app/apikey

import { CONDITIONS } from './Healthdata';

export let GEMINI_API_KEY = 'AIzaSyCH3of-xR13cLC_TFEzKKuUEHlWR0cyCeI';

export function setGeminiApiKey(key) {
  if (key) GEMINI_API_KEY = key.trim();
}

const MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];

const getGeminiUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// ── Wikipedia image fetch ─────────────────────────────────────────────────────
export async function fetchWikipediaImage(poseName) {
  if (!poseName) return null;
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(poseName)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
    );
    const wikiData = await wikiRes.json();
    const wikiPage = Object.values(wikiData?.query?.pages || {})[0];
    if (wikiPage?.thumbnail?.source) return wikiPage.thumbnail.source;
    return null;
  } catch (e) {
    return null;
  }
}

// ── Dynamic Fallback Generator for any custom query ───────────────────────────
function createDynamicConditionData(conditionQuery) {
  const title = (conditionQuery || 'Health Condition').trim();
  const titleCap = title.charAt(0).toUpperCase() + title.slice(1);
  return {
    id: title.toLowerCase().replace(/\s+/g, '_'),
    emoji: '🧘',
    color: '#2E7D32',
    lightColor: '#E8F5E9',
    name: { en: titleCap, te: titleCap, hi: titleCap },
    desc: {
      en: `Yoga therapy & wellness plan for ${titleCap}`,
      te: `${titleCap} నివారణకు యోగా చికిత్స`,
      hi: `${titleCap} से राहत के लिए योग चिकित्सा`,
    },
    asanas: [
      {
        id: 'balasana',
        sanskritName: 'Balasana',
        name: { en: "Child's Pose (Balasana)", te: 'బాలాసన', hi: 'बालासन' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Childs_pose.jpg/640px-Childs_pose.jpg',
        duration: { en: '5 min', te: '5 నిమిషాలు', hi: '5 मिनट' },
        steps: {
          en: ['Kneel on mat with toes touching', 'Sit back on heels, separate knees', 'Extend arms forward, forehead to mat', 'Breathe deeply for 3 minutes'],
          te: ['మోకాళ్ళపై కూర్చోండి', 'చేతులు ముందుకు చాచండి', '3 నిమిషాలు శ్వాస తీసుకోండి'],
          hi: ['घुटनों पर बैठें', 'हाथ आगे फैलाएं', '3 मिनट सांस लें'],
        },
        benefit: { en: 'Relieves nervous tension and calms body', te: 'ఒత్తిడిని తగ్గిస్తుంది', hi: 'तनाव कम करता है' },
      },
      {
        id: 'bhujangasana',
        sanskritName: 'Bhujangasana',
        name: { en: 'Cobra Pose (Bhujangasana)', te: 'భుజంగాసన', hi: 'भुजंगासन' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Bhujangasana_Yoga-Asana_Nina-Mel.jpg/640px-Bhujangasana_Yoga-Asana_Nina-Mel.jpg',
        duration: { en: '3 min', te: '3 నిమిషాలు', hi: '3 मिनट' },
        steps: {
          en: ['Lie face down, palms under shoulders', 'Inhale and lift chest up', 'Keep elbows slightly bent', 'Hold for 30 seconds'],
          te: ['పొట్టపై పడుకోండి', 'గుండె ఎత్తండి', '30 సెకన్లు ఉండండి'],
          hi: ['पेट के बल लेटें', 'सीना उठाएं', '30 सेकंड रहें'],
        },
        benefit: { en: 'Stimulates endocrine glands and spine', te: 'రక్తప్రసరణను మెరుగుపరుస్తుంది', hi: 'रक्त संचार सुधारता है' },
      },
      {
        id: 'setu_bandha',
        sanskritName: 'Setu Bandhasana',
        name: { en: 'Bridge Pose (Setu Bandhasana)', te: 'సేతు బంధాసన', hi: 'सेतु बंधासन' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Setubandhasana_yoga_pose.jpg/640px-Setubandhasana_yoga_pose.jpg',
        duration: { en: '3 min', te: '3 నిమిషాలు', hi: '3 मिनट' },
        steps: {
          en: ['Lie on back, knees bent', 'Press feet into floor, lift hips', 'Hold 60 seconds, lower slowly'],
          te: ['వెల్లకిలా పడుకోండి', 'పోపులు ఎత్తండి', '60 సెకన్లు ఉండండి'],
          hi: ['पीठ पर लेटें', 'कूल्हे उठाएं', '60 सेकंड रहें'],
        },
        benefit: { en: 'Stretches neck and thyroid region', te: 'థైరాయిడ్ మరియు అవయవాలను ప్రేరేపిస్తుంది', hi: 'थायरॉइड ग्रंथि को उत्तेजित करता है' },
      },
      {
        id: 'anulom_vilom',
        sanskritName: 'Pranayama',
        name: { en: 'Alternate Nostril Breathing', te: 'అనులోమ విలోమ ప్రాణాయామం', hi: 'अनुलोम विलोम प्राणायाम' },
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Childs_pose.jpg/640px-Childs_pose.jpg',
        duration: { en: '5 min', te: '5 నిమిషాలు', hi: '5 मिनट' },
        steps: {
          en: ['Sit comfortably with spine straight', 'Close right nostril, inhale left', 'Close left nostril, exhale right', 'Repeat for 5 minutes'],
          te: ['నిటారుగా కూర్చోండి', '5 నిమిషాలు ప్రాణాయామం చేయండి'],
          hi: ['सीधे बैठें', '5 मिनट प्राणायाम करें'],
        },
        benefit: { en: 'Balances oxygen supply and lowers stress', te: 'మానసిక ప్రశాంతతను ఇస్తుంది', hi: 'मानसिक शांति देता है' },
      },
    ],
    foodEat: [
      { name: { en: 'Warm Water', te: 'గోరువెచ్చని నీరు', hi: 'गुगुना पानी' }, emoji: '💧' },
      { name: { en: 'Fresh Green Vegetables', te: 'ఆకుకూరలు', hi: 'हरी सब्जियां' }, emoji: '🥬' },
      { name: { en: 'Nuts & Seeds', te: 'గింజలు & పప్పులు', hi: 'मेवे' }, emoji: '🥜' },
      { name: { en: 'Turmeric Milk', te: 'పసుపు పాలు', hi: 'हल्दी दूध' }, emoji: '🥛' },
    ],
    foodAvoid: [
      { name: { en: 'Processed Sugar', te: 'ప్రాసెస్ చేసిన చక్కర', hi: 'प्रसंस्कृत चीनी' }, emoji: '🍬' },
      { name: { en: 'Excessive Caffeine', te: 'ఎక్కువ కేఫిన్', hi: 'अत्यधिक कैफीन' }, emoji: '☕' },
      { name: { en: 'Deep Fried Foods', te: 'నూనెలో వేయించినవి', hi: 'तले हुए भोजन' }, emoji: '🍟' },
    ],
    dos: {
      en: ['Practice 20 minutes of daily yoga', 'Stay hydrated throughout the day', 'Maintain a consistent sleep schedule'],
      te: ['రోజూ 20 నిమిషాలు యోగా చేయండి', 'మంచిగా నీరు తాగండి', 'సరైన సమయంలో నిద్రపోండి'],
      hi: ['रोज 20 मिनट योग करें', 'पर्याप्त पानी पिएं', 'सही समय पर सोएं'],
    },
    donts: {
      en: ['Avoid irregular meal times', 'Do not skip warm-up before yoga', 'Avoid excessive stress'],
      te: ['ఆహార సమయాలు తప్పకండి', 'ఒత్తిడికి గురికాకండి'],
      hi: ['भोजन का समय न बदलें', 'तनाव से बचें'],
    },
    recovery: {
      en: `With regular daily practice, ${titleCap} therapy shows improvement in 4–6 weeks.`,
      te: `క్రమబద్ధమైన యోగా అభ్యాసంతో ${titleCap} 4-6 వారాల్లో మెరుగుపడుతుంది.`,
      hi: `नियमित योग अभ्यास से ${titleCap} 4-6 सप्ताह में सुधरता है।`,
    },
    duration: { weeks: 4, minutes: 20 },
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────
const buildPrompt = (conditionQuery) => `Yoga therapist. For "${conditionQuery}" return JSON only, no markdown:
{
  "id":"back_pain",
  "emoji":"🔙",
  "color":"#E53935",
  "lightColor":"#FFEBEE",
  "name":{"en":"Back Pain","te":"వీపు నొప్పి","hi":"पीठ दर्द"},
  "desc":{"en":"Yoga for back pain","te":"వీపు నొప్పి యోగా","hi":"पीठ दर्द योग"},
  "asanas":[
    {"id":"balasana","sanskritName":"Balasana","name":{"en":"Child Pose","te":"బాలాసన","hi":"बालासन"},"duration":{"en":"5 min","te":"5 నిమిషాలు","hi":"5 मिनट"},"steps":{"en":["step1","step2","step3"],"te":["దశ1","దశ2","దశ3"],"hi":["चरण1","चरण2","चरण3"]},"benefit":{"en":"Stretches back","te":"వీపు సాగుతుంది","hi":"पीठ खिंचती है"}}
  ],
  "foodEat":[{"name":{"en":"Turmeric","te":"పసుపు","hi":"హल्दी"},"emoji":"🟡","searchTerm":"turmeric"}],
  "foodAvoid":[{"name":{"en":"Fried food","te":"వేయించిన","hi":"तला खाना"},"emoji":"🍟","searchTerm":"fried food"}],
  "dos":{"en":["do1","do2","do3"],"te":["చేయండి1","చేయండి2","చేయండి3"],"hi":["करें1","करें2","करें3"]},
  "donts":{"en":["avoid1","avoid2"],"te":["మానండి1","మానండి2"],"hi":["నकरें1","నकरें2"]},
  "recovery":{"en":"4 weeks","te":"4 వారాలు","hi":"4 सप्ताह"},
  "duration":{"weeks":4,"minutes":20}
}

Fill for "${conditionQuery}". Rules: 5 asanas, 5 foodEat, 4 foodAvoid. Telugu/Hindi native script. No markdown. Return ONLY the JSON object starting with { and ending with }.`;

// ── Helper to find local match in Healthdata ──────────────────────────────────
function getLocalFallbackData(queryText) {
  if (!queryText) return null;
  const q = queryText.toLowerCase().trim();

  // Direct match by ID or query keywords
  const found = CONDITIONS.find((c) => {
    const idMatch = c.id.toLowerCase() === q || c.id.replace('_', ' ').toLowerCase() === q;
    const enName = (c.name?.en || '').toLowerCase();
    const teName = (c.name?.te || '').toLowerCase();
    const hiName = (c.name?.hi || '').toLowerCase();
    return (
      idMatch ||
      enName === q ||
      q.includes(enName) ||
      enName.includes(q) ||
      teName === q ||
      hiName === q
    );
  });

  return found || null;
}

// ── Main fetch ────────────────────────────────────────────────────────────────
export async function fetchConditionData(conditionQuery, retryCount = 0) {
  const localMatch = getLocalFallbackData(conditionQuery);

  // Try API calls across supported models
  for (const model of MODELS) {
    try {
      const url = getGeminiUrl(model, GEMINI_API_KEY);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(conditionQuery) }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384,
          },
        }),
      });

      if (response.status === 503 && retryCount < 2) {
        await new Promise((res) => setTimeout(res, 1500));
        return fetchConditionData(conditionQuery, retryCount + 1);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.log(`Gemini model ${model} HTTP ${response.status}:`, errText);
        continue; // Try next model
      }

      const apiData = await response.json();
      const candidate = apiData?.candidates?.[0];
      let rawText = candidate?.content?.parts?.[0]?.text || '';

      // Strip markdown fences
      rawText = rawText
        .replace(/^[\s\S]*?```json\s*/i, '')
        .replace(/^[\s\S]*?```\s*/i, '')
        .replace(/\s*```[\s\S]*$/i, '')
        .trim();

      const firstBrace = rawText.indexOf('{');
      if (firstBrace > 0) rawText = rawText.substring(firstBrace);

      if (candidate?.finishReason === 'MAX_TOKENS') {
        const lastBrace = rawText.lastIndexOf('}');
        if (lastBrace > 0) rawText = rawText.substring(0, lastBrace + 1);
        let depth = 0;
        for (const ch of rawText) {
          if (ch === '{') depth++;
          if (ch === '}') depth--;
        }
        for (let i = 0; i < depth; i++) rawText += '}';
      }

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          continue; // Try next model
        }
      }

      // Fetch Wikipedia images for asanas
      const asanasWithImages = await Promise.all(
        (parsed.asanas || []).map(async (asana) => {
          const wikiImage = await fetchWikipediaImage(asana.sanskritName);
          return { ...asana, image: wikiImage || null };
        })
      );

      const foodEat = (parsed.foodEat || []).map((f) => ({
        ...f,
        image: `https://source.unsplash.com/300x300/?${encodeURIComponent(
          f.searchTerm || f.name?.en || 'healthy food'
        )}`,
      }));

      const foodAvoid = (parsed.foodAvoid || []).map((f) => ({
        ...f,
        image: `https://source.unsplash.com/300x300/?${encodeURIComponent(
          f.searchTerm || f.name?.en || 'food'
        )}`,
      }));

      return {
        success: true,
        data: { ...parsed, asanas: asanasWithImages, foodEat, foodAvoid },
      };
    } catch (err) {
      console.log(`Gemini model ${model} offline:`, err.message);
    }
  }

  // If Gemini API fails or key is expired/invalid, fallback to local data if available
  if (localMatch) {
    console.log(`Using verified local offline fallback data for "${conditionQuery}"`);
    return {
      success: true,
      data: localMatch,
      isFallback: true,
    };
  }

  // Last resort fallback: Create dynamic therapy data so user NEVER sees error modal!
  console.log(`Generating dynamic fallback therapy data for "${conditionQuery}"`);
  return {
    success: true,
    data: createDynamicConditionData(conditionQuery),
    isFallback: true,
  };
}