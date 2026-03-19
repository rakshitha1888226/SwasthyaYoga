import axios from 'axios';

// Fallback quotes in case API fails
const FALLBACK_QUOTES = [
  { en: "Yoga is the journey of the self, through the self, to the self.", te: "యోగమనేది ఆత్మ యొక్క ప్రయాణం" },
  { en: "Peace comes from within. Do not seek it without.", te: "శాంతి మనసులోనే ఉంటుంది" },
  { en: "Yoga is the practice of tolerating the consequences of being yourself.", te: "యోగా అంటే నీవు నీవుగా ఉండటమే" },
  { en: "Inhale the future, exhale the past.", te: "భవిష్యత్తును పీల్చు, గతాన్ని వదులు" },
  { en: "Yoga is not about touching your toes, it's about what you learn on the way down.", te: "యోగా అంటే శరీరాన్ని వంచడం కాదు, మనసును నేర్చుకోవడం" },
];

// Free Quote API
const QUOTE_APIS = [
  'https://api.quotable.io/random',
  'https://zenquotes.io/api/random',
  'https://api.adviceslip.com/advice'
];

// Simple Telugu translation (you can use Google Translate API later)
const translateToTelugu = (englishText) => {
  // For now, return a default Telugu message
  // Later we can integrate Google Translate API
  return "యోగా జీవితానికి మార్గం";
};

export const fetchDailyQuote = async () => {
  // Try each API until one works
  for (const api of QUOTE_APIS) {
    try {
      const response = await axios.get(api, { timeout: 3000 });
      
      // Handle different API response formats
      if (api.includes('quotable')) {
        return {
          en: response.data.content,
          te: translateToTelugu(response.data.content),
          author: response.data.author
        };
      } else if (api.includes('zenquotes')) {
        return {
          en: response.data[0].q,
          te: translateToTelugu(response.data[0].q),
          author: response.data[0].a
        };
      } else if (api.includes('adviceslip')) {
        return {
          en: response.data.slip.advice,
          te: translateToTelugu(response.data.slip.advice),
          author: 'Anonymous'
        };
      }
    } catch (error) {
      console.log(`API ${api} failed, trying next...`);
    }
  }
  
  // If all APIs fail, return random fallback quote
  const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  return fallback;
};