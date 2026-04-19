// ── SwasthyaYoga — AI Health Service (Gemini 2.5 Flash — FREE) ───────────────
// Get FREE key from: https://aistudio.google.com/app/apikey

const GEMINI_API_KEY = 'AIzaSyAHHPiosVFM8bsp7uYq5wafKgQR_JuH4T8';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
  "foodEat":[{"name":{"en":"Turmeric","te":"పసుపు","hi":"हल्दी"},"emoji":"🟡","searchTerm":"turmeric"}],
  "foodAvoid":[{"name":{"en":"Fried food","te":"వేయించిన","hi":"तला खाना"},"emoji":"🍟","searchTerm":"fried food"}],
  "dos":{"en":["do1","do2","do3"],"te":["చేయండి1","చేయండి2","చేయండి3"],"hi":["करें1","करें2","करें3"]},
  "donts":{"en":["avoid1","avoid2"],"te":["మానండి1","మానండి2"],"hi":["नकरें1","नकरें2"]},
  "recovery":{"en":"4 weeks","te":"4 వారాలు","hi":"4 सप्ताह"},
  "duration":{"weeks":4,"minutes":20}
}

Fill for "${conditionQuery}". Rules: 5 asanas, 5 foodEat, 4 foodAvoid. Telugu/Hindi native script. No markdown. Return ONLY the JSON object starting with { and ending with }.`;

// ── Main fetch ────────────────────────────────────────────────────────────────
export async function fetchConditionData(conditionQuery) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    return {
      success: false,
      error: 'Gemini API key missing!\n\nGet FREE key from:\nhttps://aistudio.google.com/app/apikey\n\nPaste it in healthAIService.js line 5.',
    };
  }

  try {
    const response = await fetch(GEMINI_URL, {
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errText}`);
    }

    const apiData = await response.json();
    const candidate = apiData?.candidates?.[0];
    let rawText = candidate?.content?.parts?.[0]?.text || '';

    // ── Strip ALL forms of markdown fences ───────────────────────────────
    rawText = rawText
      .replace(/^[\s\S]*?```json\s*/i, '')  // remove everything before ```json
      .replace(/^[\s\S]*?```\s*/i, '')      // remove everything before ```
      .replace(/\s*```[\s\S]*$/i, '')        // remove ``` and everything after
      .trim();

    // If still has leading non-JSON, extract from first {
    const firstBrace = rawText.indexOf('{');
    if (firstBrace > 0) rawText = rawText.substring(firstBrace);

    // If cut off (MAX_TOKENS), close the JSON properly
    if (candidate?.finishReason === 'MAX_TOKENS') {
      const lastBrace = rawText.lastIndexOf('}');
      if (lastBrace > 0) rawText = rawText.substring(0, lastBrace + 1);
      // Count and close missing braces
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
      // Last resort — find largest JSON object in text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { throw new Error('Response parse failed. Please try again.'); }
      } else {
        throw new Error('No valid JSON in response. Please try again.');
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
      image: `https://source.unsplash.com/300x300/?${encodeURIComponent(f.searchTerm || f.name?.en || 'healthy food')}`,
    }));

    const foodAvoid = (parsed.foodAvoid || []).map((f) => ({
      ...f,
      image: `https://source.unsplash.com/300x300/?${encodeURIComponent(f.searchTerm || f.name?.en || 'food')}`,
    }));

    return {
      success: true,
      data: { ...parsed, asanas: asanasWithImages, foodEat, foodAvoid },
    };

  } catch (err) {
    console.error('fetchConditionData error:', err);
    return { success: false, error: err.message };
  }
}