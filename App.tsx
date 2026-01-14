import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  BookOpen, 
  Moon, 
  Sun, 
  Home, 
  MapPin, 
  Play, 
  Pause, 
  ChevronRight, 
  Search,
  Bookmark,
  Heart,
  X,
  Sparkles,
  Download,
  Send,
  Mic,
  Maximize2,
  Minimize2,
  CalendarCheck,
  Book,
  ScrollText
} from 'lucide-react';

import { Surah, ViewState, AudioState, Ayah, KhatmaPlan, ChatMessage, HabitLog } from './types';
import { QuranService, PrayerService, AIService, HadithService } from './services/api';
import { useFetch } from './hooks/useFetch';
import { ADHKAR_DATA, toArabicNumerals, GHAREEB_DATA, normalizeArabic } from './constants';

// --- Context & Store ---
interface AppContextType {
  view: ViewState;
  setView: (v: ViewState) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  location: { lat: number; lng: number } | null;
  audioState: AudioState;
  playSurah: (surah: Surah, ayahs: Ayah[]) => void;
  togglePlay: () => void;
  setAudioIndex: (index: number) => void;
  bookmarks: number[];
  toggleBookmark: (surahNumber: number) => void;
  khatma: KhatmaPlan | null;
  updateKhatma: (k: KhatmaPlan) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (role: 'user' | 'model', text: string) => void;
  habits: HabitLog[];
  toggleHabit: (habitId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
  </div>
);

const Navbar = () => {
  const { view, setView, darkMode, toggleDarkMode } = useContext(AppContext)!;

  const NavItem = ({ v, icon: Icon, label }: { v: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setView(v)}
      className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-all ${
        view === v 
        ? 'text-primary-700 dark:text-accent-400 bg-primary-50 dark:bg-primary-900/30' 
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] md:text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold font-serif shadow-lg shadow-primary-500/20">
              ن
            </div>
            <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white hidden md:block">نور الهدى</h1>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-accent-500" /> : <Moon size={20} className="text-primary-700" />}
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
        <div className="container mx-auto px-2 h-16 flex items-center justify-around">
          <NavItem v="home" icon={Home} label="الرئيسية" />
          <NavItem v="quran" icon={BookOpen} label="القرآن" />
          <NavItem v="hadith" icon={Book} label="الحديث" />
          <NavItem v="assistant" icon={Mic} label="المساعد" />
          <NavItem v="adhkar" icon={Heart} label="الأذكار" />
        </div>
      </nav>
    </>
  );
};

const PrayerTimesCard = () => {
    const { location } = useContext(AppContext)!;
    const [nextPrayer, setNextPrayer] = useState<string>('');
    const [countdown, setCountdown] = useState<string>('...');
  
    const { data, isLoading } = useFetch(
      ['prayer', location?.lat, location?.lng],
      () => location ? PrayerService.getTimes(location.lat, location.lng) : Promise.reject('No location'),
      !!location
    );
  
    useEffect(() => {
      if (!data) return;
      const interval = setInterval(() => {
        const now = new Date();
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        let upcoming = null;
        let upcomingTime = null;
        for (const p of prayers) {
          const timeStr = (data.timings as any)[p];
          const [hours, minutes] = timeStr.split(':').map(Number);
          const pDate = new Date();
          pDate.setHours(hours, minutes, 0);
          if (pDate > now) { upcoming = p; upcomingTime = pDate; break; }
        }
        if (!upcoming) {
          upcoming = 'Fajr';
          const timeStr = data.timings.Fajr;
          const [hours, minutes] = timeStr.split(':').map(Number);
          const pDate = new Date();
          pDate.setDate(pDate.getDate() + 1);
          pDate.setHours(hours, minutes, 0);
          upcomingTime = pDate;
        }
        setNextPrayer(upcoming === 'Fajr' ? 'الفجر' : upcoming === 'Dhuhr' ? 'الظهر' : upcoming === 'Asr' ? 'العصر' : upcoming === 'Maghrib' ? 'المغرب' : 'العشاء');
        if (upcomingTime) {
          const diff = upcomingTime.getTime() - now.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [data]);
  
    if (!location) return <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 mb-6"><div className="flex items-center space-x-2 space-x-reverse text-orange-700 dark:text-orange-400"><MapPin size={20} /><p>يرجى تفعيل الموقع</p></div></div>;
    if (isLoading) return <div className="h-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mb-6"></div>;
  
    const prayers = [
      { name: 'الفجر', time: data?.timings.Fajr },
      { name: 'الظهر', time: data?.timings.Dhuhr },
      { name: 'العصر', time: data?.timings.Asr },
      { name: 'المغرب', time: data?.timings.Maghrib },
      { name: 'العشاء', time: data?.timings.Isha },
    ];
  
    return (
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden ring-1 ring-white/10">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-lg font-medium opacity-90">{data?.date.hijri.weekday.ar}</h2><p className="text-sm opacity-75">{data?.date.hijri.date}</p></div>
            <div className="text-left"><p className="text-xs opacity-75 mb-1 text-accent-200">الصلاة القادمة: {nextPrayer}</p><p className="text-2xl font-bold font-mono text-accent-300">{toArabicNumerals(countdown)}</p></div>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {prayers.map((p) => (
              <div key={p.name} className={`flex flex-col items-center p-2 rounded-lg transition-all ${nextPrayer === p.name ? 'bg-white/10 ring-1 ring-accent-400/50 shadow-inner' : ''}`}>
                <span className={`text-xs mb-1 ${nextPrayer === p.name ? 'text-accent-200' : 'opacity-80'}`}>{p.name}</span>
                <span className="text-sm font-bold font-mono">{toArabicNumerals(p.time?.split(' ')[0] || '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
};

const QuoteGenerator = ({ text, source, onClose }: { text: string, source: string, onClose: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTheme, setCurrentTheme] = useState(THEMES[0]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0,0, 600, 600);

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 600, 600);
      gradient.addColorStop(0, currentTheme.colors[0]); 
      gradient.addColorStop(1, currentTheme.colors[1]);
      ctx.fillStyle = gradient; 
      ctx.fillRect(0, 0, 600, 600);

      // Decorative Elements (Corner decorations)
      ctx.strokeStyle = currentTheme.accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      // Top Left
      ctx.beginPath(); ctx.moveTo(20, 100); ctx.lineTo(20, 20); ctx.lineTo(100, 20); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(580, 500); ctx.lineTo(580, 580); ctx.lineTo(500, 580); ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Inner Border
      ctx.strokeStyle = currentTheme.accent; 
      ctx.lineWidth = 2; 
      ctx.strokeRect(40, 40, 520, 520);

      // Text Config
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      
      // Calculate Wrap
      ctx.font = 'normal 32px Amiri';
      const maxWidth = 480;
      const words = text.split(' '); 
      let lines = [];
      let currentLine = words[0];

      for(let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxWidth) { 
           lines.push(currentLine);
           currentLine = words[i];
        } else { 
           currentLine = testLine; 
        }
      }
      lines.push(currentLine);

      // Centering Logic
      const lineHeight = 55;
      const totalTextHeight = lines.length * lineHeight;
      const startY = (600 - totalTextHeight) / 2 - 30; 

      // Draw Main Text
      ctx.fillStyle = currentTheme.text;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      lines.forEach((line, i) => {
          ctx.fillText(line, 300, startY + (i * lineHeight));
      });
      ctx.shadowBlur = 0;

      // Source
      ctx.font = '22px Cairo'; 
      ctx.fillStyle = currentTheme.accent; 
      ctx.fillText(source, 300, 500);

      // Footer
      ctx.font = 'bold 14px Cairo'; 
      ctx.fillStyle = currentTheme.text; 
      ctx.globalAlpha = 0.6;
      ctx.fillText('تطبيق نور الهدى', 300, 560);
      ctx.globalAlpha = 1.0;

    }, [text, source, currentTheme]);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full flex flex-col items-center shadow-2xl border border-gray-700">
          <div className="flex justify-between w-full mb-4 items-center">
              <h3 className="font-bold text-lg">تصميم بطاقة</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} /></button>
          </div>
          
          <div className="relative w-full aspect-square mb-6 rounded-lg overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-100 dark:bg-gray-800">
              <canvas ref={canvasRef} width={600} height={600} className="w-full h-full object-contain" />
          </div>

          <div className="w-full space-y-4">
              <div className="flex gap-2 justify-center">
                  {THEMES.map(theme => (
                      <button 
                        key={theme.id} 
                        onClick={() => setCurrentTheme(theme)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${currentTheme.id === theme.id ? 'border-white ring-2 ring-primary-500 scale-110' : 'border-transparent'}`}
                        style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                      />
                  ))}
              </div>
              
              <button 
                onClick={() => {
                    const canvas = canvasRef.current;
                    if(!canvas) return;
                    const link = document.createElement('a'); 
                    link.download = `quote-${Date.now()}.png`; 
                    link.href = canvas.toDataURL('image/png'); 
                    link.click();
                }} 
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Download size={20} />
                <span>حفظ الصورة</span>
              </button>
          </div>
        </div>
      </div>
    );
};

const AyahTextRenderer = ({ text }: { text: string }) => {
    const words = text.split(' ');
    return (
      <span className="leading-loose">
        {words.map((word, idx) => {
          const cleanWord = normalizeArabic(word).replace(/[^\u0600-\u06FF]/g, ''); 
          const meaning = GHAREEB_DATA[cleanWord];
          if (meaning) {
            return (
              <span key={idx} className="relative group inline-block mx-0.5">
                <span className="text-primary-800 dark:text-primary-300 border-b-2 border-accent-400 border-dotted cursor-help">{word}</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-gray-800 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-center">{meaning}</span>
              </span>
            );
          }
          return <span key={idx} className="mx-0.5">{word}</span>;
        })}
      </span>
    );
};

const THEMES = [
  { id: 'emerald', colors: ['#0f766e', '#115e59'], text: '#ffffff', accent: '#fbbf24' },
  { id: 'midnight', colors: ['#1e1b4b', '#312e81'], text: '#e0e7ff', accent: '#818cf8' },
  { id: 'sunset', colors: ['#7c2d12', '#9a3412'], text: '#ffedd5', accent: '#fb923c' },
  { id: 'royal', colors: ['#4c1d95', '#5b21b6'], text: '#fae8ff', accent: '#d8b4fe' },
  { id: 'dark', colors: ['#18181b', '#27272a'], text: '#f4f4f5', accent: '#a1a1aa' },
];

  
const QuranView = () => {
    const { playSurah, bookmarks, toggleBookmark, audioState } = useContext(AppContext)!;
    const [searchTerm, setSearchTerm] = useState('');
    const { data: surahs, isLoading } = useFetch('surahs', QuranService.getAllSurahs);
    
    // Read initial surah from URL if available
    const [selectedSurah, setSelectedSurah] = useState<number | null>(() => {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('surah');
        return s ? parseInt(s) : null;
    });

    const [readingMode, setReadingMode] = useState(false);
    const [activeAyah, setActiveAyah] = useState<Ayah | null>(null);
    const [tafseerText, setTafseerText] = useState<string>('');
    const [showQuoteGen, setShowQuoteGen] = useState(false);
    const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [insightsText, setInsightsText] = useState('');
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [aiContextLoading, setAiContextLoading] = useState(false);
    const [aiContextResult, setAiContextResult] = useState('');
    const [aiContextType, setAiContextType] = useState<'kids'|'benefits'|null>(null);
  
    const { data: surahDetail, isLoading: isLoadingDetail } = useFetch(
      ['surah', selectedSurah],
      () => selectedSurah ? QuranService.getSurahDetails(selectedSurah) : Promise.reject('No surah'),
      !!selectedSurah
    );

    // Sync selected surah with URL for SEO
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (selectedSurah) {
            params.set('view', 'quran');
            params.set('surah', selectedSurah.toString());
        } else if (params.get('view') === 'quran') {
            params.delete('surah');
        }
        window.history.pushState({}, '', `?${params.toString()}`);
    }, [selectedSurah]);
  
    const activeAyahRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (audioState.isPlaying && audioState.currentSurah?.number === selectedSurah && activeAyahRef.current) {
          activeAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, [audioState.currentAyahIndex, audioState.isPlaying, selectedSurah]);
  
    const handleAISearch = async () => { if (!searchTerm.trim()) return; setIsSearchingAI(true); setAiSearchResults([]); const results = await AIService.searchQuran(searchTerm); setAiSearchResults(results); setIsSearchingAI(false); };
    const handleAyahClick = async (ayah: Ayah) => { setActiveAyah(ayah); setTafseerText('جاري التفسير...'); setAiContextResult(''); setAiContextType(null); if (selectedSurah) { try { const text = await QuranService.getTafseer(selectedSurah, ayah.numberInSurah); setTafseerText(text); } catch (e) { setTafseerText('خطأ'); } } };
    const handleAiContext = async (type: 'kids' | 'benefits') => { if (!activeAyah) return; setAiContextLoading(true); setAiContextType(type); setAiContextResult(''); const result = await AIService.getAyahInsights(activeAyah.text, type); setAiContextResult(result); setAiContextLoading(false); };
    const loadInsights = async () => { if (!selectedSurah) return; setShowInsights(true); setLoadingInsights(true); const surahName = surahs?.find(s => s.number === selectedSurah)?.name || ""; const text = await AIService.getSurahInsights(surahName); setInsightsText(text); setLoadingInsights(false); };
  
    if (selectedSurah) {
      return (
        <div className={`pb-24 animate-in fade-in slide-in-from-bottom-4 ${readingMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto p-4' : ''}`}>
          <div className="sticky top-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur z-20 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
              <div className="flex justify-between py-2">
                  <div className="flex items-center space-x-2 space-x-reverse"><button onClick={() => readingMode ? setReadingMode(false) : setSelectedSurah(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">{readingMode ? <Minimize2 size={20} /> : <ChevronRight size={20} />}</button><h2 className="text-xl font-bold font-serif">{surahs?.find(s => s.number === selectedSurah)?.name}</h2></div>
                  <div className="flex space-x-2 space-x-reverse"><button onClick={() => setReadingMode(!readingMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"><Maximize2 size={20} /></button><button onClick={loadInsights} className="p-2 bg-purple-50 text-purple-600 rounded-full"><Sparkles size={20} /></button></div>
              </div>
              {!readingMode && <div className="flex justify-center mt-2"><button onClick={() => { const s = surahs?.find(sr => sr.number === selectedSurah); if (s && surahDetail) playSurah(s, surahDetail.ayahs); }} className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm"><Play size={14} /><span>استماع</span></button></div>}
          </div>
          {showInsights && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInsights(false)}><div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-lg w-full max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>{loadingInsights ? <LoadingSpinner /> : <div className="prose dark:prose-invert text-sm whitespace-pre-wrap">{insightsText}</div>}</div></div>}
          {activeAyah && (
              <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 p-4" onClick={() => setActiveAyah(null)}>
                  <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 border border-primary-100 dark:border-primary-800 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <p className="font-serif text-xl mb-4 text-center">{activeAyah.text}</p>
                      <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"><h4 className="font-bold text-sm text-primary-600 mb-1">التفسير:</h4><p className="text-sm">{tafseerText}</p></div>
                      <div className="grid grid-cols-2 gap-2 mb-4"><button onClick={() => handleAiContext('kids')} className={`p-3 rounded-xl text-sm font-bold ${aiContextType === 'kids' ? 'bg-pink-100 text-pink-700' : 'bg-pink-50 text-pink-600'}`}>شرح للأطفال</button><button onClick={() => handleAiContext('benefits')} className={`p-3 rounded-xl text-sm font-bold ${aiContextType === 'benefits' ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600'}`}>فوائد</button></div>
                      {(aiContextLoading || aiContextResult) && <div className="mb-6 p-4 rounded-xl text-sm bg-gray-50">{aiContextLoading ? <Sparkles size={16} className="animate-spin" /> : <div className="whitespace-pre-wrap">{aiContextResult}</div>}</div>}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t"><button onClick={() => { setShowQuoteGen(true); setActiveAyah(null); }} className="p-3 bg-primary-50 text-primary-700 rounded-xl">تصميم صورة</button><button onClick={() => setActiveAyah(null)} className="p-3 bg-gray-100 text-gray-700 rounded-xl">إغلاق</button></div>
                  </div>
              </div>
          )}
          {showQuoteGen && <QuoteGenerator text={activeAyah?.text || tafseerText} source={`سورة ${surahs?.find(s => s.number === selectedSurah)?.name}`} onClose={() => setShowQuoteGen(false)} />}
          {isLoadingDetail ? <LoadingSpinner /> : (
            <div className="space-y-6">
              {selectedSurah !== 1 && selectedSurah !== 9 && <div className="text-center font-serif text-2xl mb-8 mt-4">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>}
              <div className={`space-y-6 ${readingMode ? 'max-w-3xl mx-auto' : ''}`}>
                {surahDetail?.ayahs?.map((ayah, idx) => {
                  const isActive = audioState.isPlaying && audioState.currentSurah?.number === selectedSurah && audioState.currentAyahIndex === idx;
                  return (
                      <div key={ayah.number} ref={isActive ? activeAyahRef : null} className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border font-serif text-right transition-all cursor-pointer ${isActive ? 'border-accent-400 ring-2 ring-accent-400/20 bg-accent-50/30 dark:bg-accent-900/10' : 'border-gray-100 dark:border-gray-800'} ${readingMode ? 'text-3xl leading-[2.8]' : 'text-2xl leading-[2.5]'}`} onClick={() => handleAyahClick(ayah)}>
                          <AyahTextRenderer text={ayah.text} />
                          <span className={`mr-2 inline-flex items-center justify-center w-8 h-8 text-sm border rounded-full ${isActive ? 'bg-accent-500 text-white' : 'border-accent-400 text-accent-600'}`}>{toArabicNumerals(ayah.numberInSurah)}</span>
                      </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }
  
    const filteredSurahs = surahs?.filter(s => s.name.includes(searchTerm) || s.englishName.toLowerCase().includes(searchTerm.toLowerCase())) || [];
    return (
      <div className="pb-24">
        <div className="space-y-3 mb-6">
            <div className="relative"><input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary-500 outline-none" /><Search className="absolute right-3 top-3.5 text-gray-400" size={20} /></div>
            {searchTerm.length > 2 && <button onClick={handleAISearch} disabled={isSearchingAI} className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center space-x-2 space-x-reverse text-sm font-bold shadow-lg">{isSearchingAI ? <LoadingSpinner /> : <><Sparkles size={16} /> <span>بحث ذكي</span></>}</button>}
        </div>
        {aiSearchResults.length > 0 && <div className="mb-8 space-y-3">{aiSearchResults.map((res, idx) => <div key={idx} onClick={() => setSelectedSurah(res.surah)} className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 cursor-pointer"><h4 className="font-bold">سورة {surahs?.find(s => s.number === res.surah)?.name} - آية {res.ayah}</h4><p className="text-xs">{res.reason}</p></div>)}</div>}
        {isLoading ? <LoadingSpinner /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{filteredSurahs.map((surah) => <div key={surah.number} onClick={() => setSelectedSurah(surah.number)} className="group bg-white dark:bg-gray-900 p-4 rounded-xl border hover:border-primary-500 transition-all cursor-pointer flex items-center justify-between shadow-sm"><div className="flex items-center space-x-3 space-x-reverse"><div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center font-bold text-gray-500">{surah.number}</div><div><h3 className="font-bold font-serif text-lg">{surah.name}</h3><p className="text-xs text-gray-500">{surah.englishName} • {surah.numberOfAyahs} آية</p></div></div><button onClick={(e) => { e.stopPropagation(); toggleBookmark(surah.number); }} className={`p-2 rounded-full ${bookmarks.includes(surah.number) ? 'text-accent-500 fill-accent-500' : 'text-gray-300'}`}><Bookmark size={18} className={bookmarks.includes(surah.number) ? 'fill-current' : ''} /></button></div>)}</div>}
      </div>
    );
};

const HadithView = () => {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data: books } = useFetch('hadith-books', HadithService.getBooks);
  
  const { data: hadiths, isLoading } = useFetch(
    ['hadiths', selectedBook, page],
    () => selectedBook ? HadithService.getHadithsByBook(selectedBook, page) : Promise.resolve([]),
    !!selectedBook
  );

  if (!selectedBook) {
    return (
      <div className="pb-24">
        <h2 className="text-2xl font-bold font-serif mb-6">كتب الحديث</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books?.map((book: any) => (
             <div key={book.id} onClick={() => setSelectedBook(book.id)} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary-500 transition-all flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><ScrollText size={24} /></div>
                <h3 className="font-bold text-lg">{book.name}</h3>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setSelectedBook(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><ChevronRight size={20}/></button>
        <h2 className="text-xl font-bold font-serif">{books?.find((b:any) => b.id === selectedBook)?.name}</h2>
      </div>
      
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
           {hadiths?.map((h) => (
             <div key={h.hadithNumber} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-xs text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded mb-3 inline-block">حديث {toArabicNumerals(h.hadithNumber)}</span>
                <p className="font-serif text-xl leading-loose">{h.body}</p>
             </div>
           ))}
           <div className="flex justify-center gap-4 mt-8">
             <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg disabled:opacity-50">السابق</button>
             <span className="px-4 py-2 font-bold">{toArabicNumerals(page)}</span>
             <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">التالي</button>
           </div>
        </div>
      )}
    </div>
  );
};

const AssistantView = () => {
    const { chatHistory, addChatMessage } = useContext(AppContext)!;
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput('');
        addChatMessage('user', msg);
        setLoading(true);
        const response = await AIService.chatWithSheikh(msg, chatHistory);
        addChatMessage('model', response);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600"><Mic size={32} /></div>
                        <p>مرحباً! أنا "الشيخ الذكي". كيف يمكنني مساعدتك اليوم؟</p>
                    </div>
                )}
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex justify-end"><div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none"><LoadingSpinner /></div></div>}
                <div ref={endRef} />
            </div>
            <div className="p-2 border-t dark:border-gray-800 bg-white dark:bg-gray-950 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="اكتب سؤالك هنا..." 
                    className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button onClick={handleSend} disabled={loading} className="p-3 bg-primary-600 text-white rounded-xl disabled:opacity-50"><Send size={20} /></button>
            </div>
        </div>
    );
};

const AdhkarView = () => {
    return (
        <div className="space-y-4 pb-20">
            {ADHKAR_DATA.map(dhikr => (
                <div key={dhikr.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${dhikr.category === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{dhikr.category === 'morning' ? 'الصباح' : dhikr.category === 'evening' ? 'المساء' : 'عام'}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{dhikr.count} مرة</span>
                    </div>
                    <p className="text-lg font-serif leading-loose mb-2">{dhikr.text}</p>
                    {dhikr.benefit && <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">{dhikr.benefit}</p>}
                </div>
            ))}
        </div>
    );
};

const App = () => {
  // Read initial view from URL
  const [view, setView] = useState<ViewState>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('view') as ViewState) || 'home';
  });

  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, currentSurah: null, currentAyahIndex: 0, playlist: [] });
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [habits, setHabits] = useState<HabitLog[]>([]);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Dark Mode & Location
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      );
    }
  }, []);

  // Sync View to URL (SEO)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') !== view) {
      params.set('view', view);
      // Remove surah param if we navigate away from quran
      if (view !== 'quran') params.delete('surah');
      window.history.pushState({}, '', `?${params.toString()}`);
    }

    // Dynamic SEO Tags
    const titles: Record<string, string> = {
        'home': 'نور الهدى - الرئيسية',
        'quran': 'القرآن الكريم - تلاوة وتفسير',
        'hadith': 'الحديث الشريف - كتب السنة',
        'assistant': 'المساعد الإسلامي الذكي',
        'adhkar': 'أذكار الصباح والمساء',
        'tracker': 'متابعة العبادات'
    };
    document.title = titles[view] || 'نور الهدى';
    
    // Update Meta Description dynamically
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
    }
    const descriptions: Record<string, string> = {
        'home': 'تطبيق إسلامي شامل: قرآن، حديث، أذكار، ومواقيت صلاة.',
        'quran': 'اقرأ واستمع للقرآن الكريم مع التفسير والبحث الذكي.',
        'hadith': 'تصفح أحاديث النبي صلى الله عليه وسلم من الصحاح والسنن.',
        'assistant': 'اسأل الشيخ الذكي عن أمور دينك.',
        'adhkar': 'حصن المسلم وأذكار اليوم والليلة.',
    };
    metaDescription.setAttribute('content', descriptions[view] || 'تطبيق نور الهدى');

  }, [view]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Audio Logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        setAudioState(prev => {
          if (prev.currentAyahIndex < prev.playlist.length - 1) {
            return { ...prev, currentAyahIndex: prev.currentAyahIndex + 1 };
          } else {
            return { ...prev, isPlaying: false };
          }
        });
      };
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioState.currentSurah || audioState.playlist.length === 0) return;

    const ayah = audioState.playlist[audioState.currentAyahIndex];
    if (ayah && audio.src !== ayah.audio) {
      audio.src = ayah.audio;
      if (audioState.isPlaying) audio.play();
    } else if (audioState.isPlaying) {
        audio.play();
    } else {
        audio.pause();
    }
  }, [audioState.currentAyahIndex, audioState.currentSurah, audioState.playlist, audioState.isPlaying]);


  const toggleDarkMode = () => setDarkMode(!darkMode);
  const playSurah = (surah: Surah, ayahs: Ayah[]) => {
    setAudioState({ isPlaying: true, currentSurah: surah, currentAyahIndex: 0, playlist: ayahs });
  };
  const togglePlay = () => setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  const setAudioIndex = (index: number) => setAudioState(prev => ({ ...prev, currentAyahIndex: index }));
  const toggleBookmark = (surahNumber: number) => {
    setBookmarks(prev => prev.includes(surahNumber) ? prev.filter(b => b !== surahNumber) : [...prev, surahNumber]);
  };
  const updateKhatma = (k: KhatmaPlan) => setKhatma(k);
  const addChatMessage = (role: 'user' | 'model', text: string) => {
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role, text, timestamp: new Date() }]);
  };
  const toggleHabit = (habitId: string) => {
      // simplified habit logic
      console.log('toggle habit', habitId);
  };

  const contextValue = {
    view, setView, darkMode, toggleDarkMode, location, audioState, playSurah, togglePlay, setAudioIndex, bookmarks, toggleBookmark, khatma, updateKhatma, chatHistory, addChatMessage, habits, toggleHabit
  };

  const renderView = () => {
      switch(view) {
          case 'home': return <div className="p-4"><PrayerTimesCard /><div className="text-center text-gray-500 mt-10">مرحباً بك في نور الهدى</div></div>;
          case 'quran': return <QuranView />;
          case 'hadith': return <HadithView />;
          case 'assistant': return <AssistantView />;
          case 'adhkar': return <AdhkarView />;
          case 'tracker': return <div className="p-4 text-center">عباداتي (قيد التطوير)</div>;
          default: return <div className="p-4">View not found</div>;
      }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 pb-20`}>
        <Navbar />
        <main className="container mx-auto px-2 py-4">
            {renderView()}
        </main>
        {/* Mini Player */}
        {audioState.currentSurah && (
            <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between px-4 z-40">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="text-sm">
                        <p className="font-bold">{audioState.currentSurah.name}</p>
                        <p className="text-xs text-gray-500">آية {toArabicNumerals(audioState.playlist[audioState.currentAyahIndex]?.numberInSurah || 0)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                    <button onClick={() => setAudioIndex(Math.max(0, audioState.currentAyahIndex - 1))}><ChevronRight className="rotate-180" size={24}/></button>
                    <button onClick={togglePlay} className="p-2 bg-primary-600 rounded-full text-white">
                        {audioState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={() => setAudioIndex(Math.min(audioState.playlist.length - 1, audioState.currentAyahIndex + 1))}><ChevronRight size={24}/></button>
                </div>
            </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;