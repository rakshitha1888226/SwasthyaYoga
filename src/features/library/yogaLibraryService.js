// ── Yoga Library AI Service ───────────────────────────────────────────────────
// Uses Gemini 2.0 / 1.5 Flash API

export let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export function setGeminiApiKey(key) {
  if (key) GEMINI_API_KEY = key.trim();
}

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const getGeminiUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// ── Fetch Wikipedia image by pose name ────────────────────────────────────────
export async function fetchWikipediaImage(poseName) {
  if (!poseName) return null;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(poseName)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
    );
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    if (page?.thumbnail?.source) return page.thumbnail.source;

    // Fallback: Wikimedia Commons
    const cRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(poseName + ' yoga pose')}&srnamespace=6&format=json&origin=*&srlimit=3`
    );
    const cData = await cRes.json();
    const hits = cData?.query?.search || [];
    for (const hit of hits) {
      const iRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(hit.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`
      );
      const iData = await iRes.json();
      const iPage = Object.values(iData?.query?.pages || {})[0];
      const url = iPage?.imageinfo?.[0]?.url;
      if (url && /\.(jpg|jpeg|png)$/i.test(url)) return url;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ── Build prompt ──────────────────────────────────────────────────────────────
const buildPrompt = (categoryName, categoryType) => `You are a certified yoga instructor. For the yoga category "${categoryName}" (type: ${categoryType}), return ONLY raw JSON, no markdown, no backticks.

Return this structure:
{
  "categoryName": "${categoryName}",
  "description": {"en":"...","te":"...","hi":"..."},
  "benefits": {"en":["benefit1","benefit2","benefit3"],"te":["లాభం1","లాభం2","లాభం3"],"hi":["लाभ1","लाभ2","लाభ3"]},
  "duration": {"en":"20-30 min","te":"20-30 నిమిషాలు","hi":"20-30 मिनट"},
  "difficulty": "Beginner",
  "asanas": [
    {
      "id": "asana_id",
      "sanskritName": "SanskritName",
      "name": {"en":"English Name","te":"తెలుగు పేరు","hi":"हिंदी नाम"},
      "duration": {"en":"30 sec","te":"30 సెకన్లు","hi":"30 सेकंड"},
      "steps": {
        "en": ["step1","step2","step3","step4"],
        "te": ["దశ1","దశ2","దశ3","దశ4"],
        "hi": ["चरण1","चरण2","चरण3","चरण4"]
      },
      "benefit": {"en":"...","te":"...","hi":"..."},
      "calories": "15-20 cal"
    }
  ]
}

Rules:
- Include exactly 8 asanas best suited for "${categoryName}"
- sanskritName must be clean Sanskrit only e.g. "Trikonasana"
- Telugu and Hindi in native script
- difficulty: one of Beginner, Intermediate, Advanced
- Return ONLY the JSON, nothing before { and nothing after }`;

// ── Main fetch function ───────────────────────────────────────────────────────
export async function fetchYogaCategory(categoryName, categoryType, retryCount = 0) {
  for (const model of MODELS) {
    try {
      const url = getGeminiUrl(model, GEMINI_API_KEY);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(categoryName, categoryType) }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 16384 },
        }),
      });

      if (response.status === 503 && retryCount < 2) {
        await new Promise((res) => setTimeout(res, 1500));
        return fetchYogaCategory(categoryName, categoryType, retryCount + 1);
      }

      if (!response.ok) {
        console.log(`Gemini library model ${model} status: HTTP ${response.status}`);
        continue;
      }

      const apiData = await response.json();
      let rawText = apiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      rawText = rawText
        .replace(/^```json\s*/im, '')
        .replace(/^```\s*/im, '')
        .replace(/\s*```\s*$/im, '')
        .trim();
      const firstBrace = rawText.indexOf('{');
      if (firstBrace > 0) rawText = rawText.substring(firstBrace);

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else continue;
      }

      const asanasWithImages = await Promise.all(
        (parsed.asanas || []).map(async (asana) => {
          const image = await fetchWikipediaImage(asana.sanskritName);
          return { ...asana, image: image || null };
        })
      );

      return { success: true, data: { ...parsed, asanas: asanasWithImages } };
    } catch (err) {
      console.log(`Gemini model ${model} category offline:`, err.message);
    }
  }

  return {
    success: false,
    error: 'Gemini API key is invalid or expired. Please update your API key.',
  };
}