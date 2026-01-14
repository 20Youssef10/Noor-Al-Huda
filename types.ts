export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  audio: string; // URL to audio
  audioSecondary?: string[];
}

export interface QuranEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface PrayerData {
  timings: PrayerTimings;
  date: {
    readable: string;
    hijri: {
      date: string;
      month: {
        en: string;
        ar: string;
      };
      weekday: {
        en: string;
        ar: string;
      };
    };
  };
}

export interface Hadith {
  hadithNumber: string;
  heading?: string;
  body: string; // The text
  book: string;
}

export interface Dhikr {
  id: number;
  category: 'morning' | 'evening' | 'prayer' | 'absolute';
  text: string;
  count: number; // Target count
  currentCount?: number; // Local state
  reference?: string;
  benefit?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizConfig {
  type: 'general' | 'prophets' | 'surah';
  target?: string; // e.g. surah name
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface KhatmaPlan {
  days: number;
  currentPage: number;
  totalPages: number;
  dailyTarget: number;
  startDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ViewState = 'home' | 'quran' | 'hadith' | 'adhkar' | 'quiz' | 'khatma' | 'assistant' | 'tracker' | 'qibla';

export type AudioState = {
  isPlaying: boolean;
  currentSurah: Surah | null;
  currentAyahIndex: number; // Index in the playlist array
  playlist: Ayah[]; // The queue of ayahs to play
}

export interface HabitLog {
  date: string; // ISO date string YYYY-MM-DD
  completed: string[]; // Array of habit IDs (e.g., 'fajr', 'quran')
}