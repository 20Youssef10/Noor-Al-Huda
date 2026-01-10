import { Surah, PrayerData, Ayah, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

// Simple Cache implementation to avoid hitting APIs too often
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export const QuranService = {
  getAllSurahs: async (): Promise<Surah[]> => {
    return fetchWithCache('surahs', async () => {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const json = await response.json();
      return json.data;
    });
  },

  getSurahDetails: async (number: number): Promise<{ ayahs: Ayah[] }> => {
    // Fetching Arabic text + Audio for each Ayah (using Alafasy as default)
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`);
    const json = await response.json();
    return { ayahs: json.data.ayahs };
  },

  getTafseer: async (surahNumber: number, ayahNumberInSurah: number): Promise<string> => {
     // Fetch Muyassar Tafseer
     const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumberInSurah}/ar.muyassar`);
     const json = await response.json();
     return json.data.text;
  }
};

export const PrayerService = {
  getTimes: async (lat: number, lng: number): Promise<PrayerData> => {
    // Get today's timestamp
    const date = new Date();
    const timestamp = Math.floor(date.getTime() / 1000);
    const key = `prayer-${lat.toFixed(2)}-${lng.toFixed(2)}-${date.getDate()}`;
    
    return fetchWithCache(key, async () => {
        const response = await fetch(
            `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=4` // Method 4 is Umm al-Qura
        );
        const json = await response.json();
        return json.data;
    });
  }
};

export const AIService = {
  // Semantic search using Gemini
  searchQuran: async (query: string): Promise<{surah: number, ayah: number, reason: string}[]> => {
    try {
      if (!process.env.API_KEY) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are an Islamic scholar assistant. The user is searching for: "${query}".
        Find up to 5 most relevant Ayahs from the Quran.
        Return ONLY a raw JSON array (no markdown) with objects: { "surah": number, "ayah": number, "reason": "brief explanation in Arabic" }.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text || "[]";
      // Clean markdown if present
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("AI Search failed", e);
      return [];
    }
  },

  getSurahInsights: async (surahName: string): Promise<string> => {
     try {
      if (!process.env.API_KEY) return "AI Service not available";
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Provide a concise structured summary (Mind Map style text) for Surah ${surahName} in Arabic.
        Include:
        1. Meaning of the name.
        2. Main themes (bullet points).
        3. Key benefits/lessons.
        Keep it visually formatted with bullet points.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || "Could not generate insights.";
    } catch (e) {
      return "Service unavailable.";
    }
  },

  generateDuaByEmotion: async (emotion: string): Promise<string> => {
    try {
      if (!process.env.API_KEY) return "Service unavailable";
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        The user is feeling: "${emotion}".
        Provide a comforting Dua (Supplication) from the Quran or Sunnah in Arabic that is suitable for this feeling.
        Then provide a very brief translation/meaning in Arabic.
        Make it short and touching.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "اللهم اشرح لي صدري ويسر لي أمري";
    } catch (e) {
      return "اللهم إني أسألك العفو والعافية";
    }
  },

  chatWithSheikh: async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
      if (!process.env.API_KEY) return "عذراً، الخدمة غير متاحة حالياً.";
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const systemPrompt = `
        You are "Sheikh AI", a knowledgeable, empathetic, and polite Islamic assistant embedded in the "Noor Al-Huda" app.
        Your goal is to help users with general Islamic inquiries, history, or advice based on Quran and Sunnah.
        
        Rules:
        1. Answer in Arabic.
        2. Be concise and direct.
        3. If asked about specific Fatwas (Halal/Haram) for complex modern issues, kindly advise them to consult a local scholar or Dar al-Ifta, while providing general principles if applicable.
        4. Cite Quran or Hadith where possible.
        5. Tone: Gentle, wise, and encouraging.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: systemPrompt,
        },
        history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }))
      });

      const result = await chat.sendMessage({ message: message });
      return result.text || "";
    } catch (e) {
      console.error(e);
      return "حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.";
    }
  }
};