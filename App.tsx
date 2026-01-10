import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  BookOpen, 
  Moon, 
  Sun, 
  Volume2, 
  Home, 
  AlignRight, 
  MapPin, 
  Play, 
  Pause, 
  ChevronRight, 
  Search,
  Bookmark,
  Heart,
  X,
  Brain,
  Target,
  Share2,
  Maximize2,
  Minimize2,
  Info,
  Sparkles,
  Download,
  MessageCircle,
  Send,
  RefreshCw,
  Frown,
  Smile,
  Meh,
  AlertCircle
} from 'lucide-react';

import { Surah, ViewState, AudioState, Ayah, KhatmaPlan, QuizQuestion, ChatMessage } from './types';
import { QuranService, PrayerService, AIService } from './services/api';
import { useFetch } from './hooks/useFetch';
import { ADHKAR_DATA, toArabicNumerals } from './constants';

// --- Context & Store ---
interface AppContextType {
  view: ViewState;
  setView: (v: ViewState) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  location: { lat: number; lng: number } | null;
  audioState: AudioState;
  playSurah: (surah: Surah) => void;
  togglePlay: () => void;
  bookmarks: number[];
  toggleBookmark: (surahNumber: number) => void;
  khatma: KhatmaPlan | null;
  updateKhatma: (k: KhatmaPlan) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (role: 'user' | 'model', text: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

const Navbar = () => {
  const { view, setView, darkMode, toggleDarkMode } = useContext(AppContext)!;

  const NavItem = ({ v, icon: Icon, label }: { v: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setView(v)}
      className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-all ${
        view === v 
        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
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
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold font-serif">
              ن
            </div>
            <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white hidden md:block">نور الهدى</h1>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
        <div className="container mx-auto px-2 h-16 flex items-center justify-around">
          <NavItem v="home" icon={Home} label="الرئيسية" />
          <NavItem v="quran" icon={BookOpen} label="القرآن" />
          <NavItem v="assistant" icon={MessageCircle} label="المساعد" />
          <NavItem v="adhkar" icon={Heart} label="الأذكار" />
          <NavItem v="khatma" icon={Target} label="الختمة" />
        </div>
      </nav>
    </>
  );
};

const PrayerTimesCard = () => {
  const { location } = useContext(AppContext)!;
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('...');

  const { data, isLoading, error } = useFetch(
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
        
        if (pDate > now) {
          upcoming = p;
          upcomingTime = pDate;
          break;
        }
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

  if (!location) return (
    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 mb-6">
      <div className="flex items-center space-x-2 space-x-reverse text-orange-700 dark:text-orange-400">
        <MapPin size={20} />
        <p>يرجى تفعيل الموقع لعرض مواقيت الصلاة</p>
      </div>
    </div>
  );

  if (isLoading) return <div className="h-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mb-6"></div>;
  if (error) return <div className="text-red-500">حدث خطأ في تحميل المواقيت</div>;

  const prayers = [
    { name: 'الفجر', time: data?.timings.Fajr },
    { name: 'الظهر', time: data?.timings.Dhuhr },
    { name: 'العصر', time: data?.timings.Asr },
    { name: 'المغرب', time: data?.timings.Maghrib },
    { name: 'العشاء', time: data?.timings.Isha },
  ];

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-4 -mb-4 blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-medium opacity-90">{data?.date.hijri.weekday.ar}</h2>
            <p className="text-sm opacity-75">{data?.date.hijri.date} {data?.date.hijri.month.ar}</p>
          </div>
          <div className="text-left">
            <p className="text-xs opacity-75 mb-1">الصلاة القادمة: {nextPrayer}</p>
            <p className="text-2xl font-bold font-mono">{toArabicNumerals(countdown)}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {prayers.map((p) => (
            <div key={p.name} className={`flex flex-col items-center p-2 rounded-lg ${nextPrayer === p.name ? 'bg-white/20 ring-1 ring-white/50' : ''}`}>
              <span className="text-xs opacity-80 mb-1">{p.name}</span>
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#064e3b');
    gradient.addColorStop(1, '#10b981');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    // Decorative
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 560, 560);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Arabic text handling (simple wrapping)
    ctx.font = 'normal 32px Amiri';
    const words = text.split(' ');
    let line = '';
    let y = 200;
    const maxWidth = 500;
    const lineHeight = 50;

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 300, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 300, y);

    // Source
    ctx.font = '20px Cairo';
    ctx.fillText(source, 300, 500);

    // Brand
    ctx.font = 'bold 16px Cairo';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('تطبيق نور الهدى', 300, 550);

  }, [text, source]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'noor-alhuda-quote.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 max-w-lg w-full flex flex-col items-center">
        <div className="flex justify-between w-full mb-4">
          <h3 className="font-bold">مشاركة آية</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <canvas ref={canvasRef} width={600} height={600} className="w-full h-auto rounded-lg shadow-lg mb-4 max-h-[50vh] object-contain" />
        <button onClick={downloadImage} className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700">
          <Download size={18} />
          <span>حفظ الصورة</span>
        </button>
      </div>
    </div>
  );
};

const QuranView = () => {
  const { playSurah, bookmarks, toggleBookmark } = useContext(AppContext)!;
  const [searchTerm, setSearchTerm] = useState('');
  const { data: surahs, isLoading } = useFetch('surahs', QuranService.getAllSurahs);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  
  // New features state
  const [readingMode, setReadingMode] = useState(false);
  const [activeAyah, setActiveAyah] = useState<Ayah | null>(null); // For Tafseer/Quote modal
  const [tafseerText, setTafseerText] = useState<string>('');
  const [showQuoteGen, setShowQuoteGen] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsText, setInsightsText] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data: surahDetail, isLoading: isLoadingDetail } = useFetch(
    ['surah', selectedSurah],
    () => selectedSurah ? QuranService.getSurahDetails(selectedSurah) : Promise.reject('No surah'),
    !!selectedSurah
  );

  const handleAISearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingAI(true);
    setAiSearchResults([]);
    const results = await AIService.searchQuran(searchTerm);
    setAiSearchResults(results);
    setIsSearchingAI(false);
  };

  const handleAyahClick = async (ayah: Ayah) => {
    setActiveAyah(ayah);
    setTafseerText('جاري تحميل التفسير...');
    if (selectedSurah) {
        try {
            const text = await QuranService.getTafseer(selectedSurah, ayah.numberInSurah);
            setTafseerText(text);
        } catch (e) {
            setTafseerText('تعذر تحميل التفسير');
        }
    }
  };

  const loadInsights = async () => {
    if (!selectedSurah) return;
    setShowInsights(true);
    setLoadingInsights(true);
    const surahName = surahs?.find(s => s.number === selectedSurah)?.name || "";
    const text = await AIService.getSurahInsights(surahName);
    setInsightsText(text);
    setLoadingInsights(false);
  };

  // Detail View
  if (selectedSurah) {
    return (
      <div className={`pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300 ${readingMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto p-4' : ''}`}>
        
        {/* Navigation & Toolbar */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur z-20 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <button 
                        onClick={() => readingMode ? setReadingMode(false) : setSelectedSurah(null)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200"
                    >
                        {readingMode ? <Minimize2 size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <h2 className="text-xl font-bold font-serif">
                        {surahs?.find(s => s.number === selectedSurah)?.name}
                    </h2>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                    <button 
                        onClick={() => setReadingMode(!readingMode)}
                        className={`p-2 rounded-full ${readingMode ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 dark:bg-gray-800'}`}
                        title="الوضع القرائي"
                    >
                        <Maximize2 size={20} />
                    </button>
                    <button 
                        onClick={loadInsights}
                        className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 rounded-full"
                        title="مقاصد السورة (AI)"
                    >
                        <Sparkles size={20} />
                    </button>
                </div>
            </div>
            
            {!readingMode && (
                <div className="flex justify-center mt-2">
                     <button 
                        onClick={() => {
                        const s = surahs?.find(sr => sr.number === selectedSurah);
                        if (s) playSurah(s);
                        }}
                        className="flex items-center space-x-2 space-x-reverse bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full text-sm"
                    >
                        <Play size={14} className="fill-current" />
                        <span>استماع</span>
                    </button>
                </div>
            )}
        </div>

        {/* AI Insights Modal */}
        {showInsights && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInsights(false)}>
                 <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-lg w-full max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={18} className="text-purple-500"/> مقاصد السورة</h3>
                         <button onClick={() => setShowInsights(false)}><X size={20} /></button>
                     </div>
                     {loadingInsights ? <LoadingSpinner /> : (
                         <div className="prose dark:prose-invert text-sm leading-relaxed whitespace-pre-wrap font-sans">
                             {insightsText}
                         </div>
                     )}
                 </div>
             </div>
        )}

        {/* Tafseer/Options Modal */}
        {activeAyah && (
            <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 p-4" onClick={() => setActiveAyah(null)}>
                <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                    <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-serif text-xl leading-loose mb-2 text-center">
                            {activeAyah.text}
                        </p>
                    </div>
                    
                    <h4 className="font-bold text-sm text-primary-600 mb-2">التفسير الميسر:</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {tafseerText}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setShowQuoteGen(true); setActiveAyah(null); }}
                            className="flex items-center justify-center space-x-2 space-x-reverse p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-xl font-medium"
                        >
                            <Share2 size={18} />
                            <span>تصميم صورة</span>
                        </button>
                         <button 
                            onClick={() => setActiveAyah(null)}
                            className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                        >
                            <X size={18} />
                            <span>إغلاق</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Canvas Quote Gen */}
        {showQuoteGen && (
            <QuoteGenerator 
                text={activeAyah?.text || tafseerText} // Fallback logic is fuzzy here due to state clearing, but simplified for XML limits
                source={`سورة ${surahs?.find(s => s.number === selectedSurah)?.name} - آية ${activeAyah?.numberInSurah || ''}`} 
                onClose={() => setShowQuoteGen(false)} 
            />
        )}

        {isLoadingDetail ? <LoadingSpinner /> : (
          <div className="space-y-6">
            {/* Bismillah */}
            {selectedSurah !== 1 && selectedSurah !== 9 && (
               <div className="text-center font-serif text-2xl mb-8 mt-4 text-gray-800 dark:text-gray-200">
                 بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
               </div>
            )}

            <div className={`space-y-6 ${readingMode ? 'max-w-3xl mx-auto' : ''}`}>
              {surahDetail?.ayahs.map((ayah) => (
                <div key={ayah.number} className="relative group cursor-pointer" onClick={() => handleAyahClick(ayah)}>
                   <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 font-serif text-right text-gray-800 dark:text-gray-100 transition-colors hover:border-primary-300 ${readingMode ? 'text-3xl leading-[2.8]' : 'text-2xl leading-[2.5]'}`}>
                     {ayah.text} 
                     <span className="mr-2 inline-flex items-center justify-center w-8 h-8 text-sm border border-primary-500 rounded-full text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-transparent">
                       {toArabicNumerals(ayah.numberInSurah)}
                     </span>
                   </div>
                   {!readingMode && (
                       <div className="hidden group-hover:flex absolute top-2 left-2 space-x-2 space-x-reverse bg-white dark:bg-gray-800 p-1 rounded-lg shadow-md">
                           <Info size={16} className="text-gray-500" />
                       </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredSurahs = surahs?.filter(s => 
    s.name.includes(searchTerm) || 
    s.englishName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-serif">القرآن الكريم</h2>
      </div>
      
      <div className="space-y-3 mb-6">
          <div className="relative">
            <input
            type="text"
            placeholder="ابحث باسم السورة أو الموضوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
            <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
          </div>
          {/* AI Search Trigger */}
          {searchTerm.length > 2 && (
             <button 
                onClick={handleAISearch}
                disabled={isSearchingAI}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg flex items-center justify-center space-x-2 space-x-reverse text-sm font-bold shadow-lg shadow-purple-500/20"
             >
                 {isSearchingAI ? <LoadingSpinner /> : <><Sparkles size={16} /> <span>بحث ذكي (عن الموضوع)</span></>}
             </button>
          )}
      </div>

      {/* AI Results */}
      {aiSearchResults.length > 0 && (
          <div className="mb-8 animate-in slide-in-from-top-4">
              <h3 className="text-sm font-bold text-gray-500 mb-3">نتائج البحث الذكي:</h3>
              <div className="space-y-3">
                  {aiSearchResults.map((res, idx) => (
                      <div key={idx} onClick={() => setSelectedSurah(res.surah)} className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 cursor-pointer hover:bg-purple-100 transition-colors">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-purple-800 dark:text-purple-300">سورة {surahs?.find(s => s.number === res.surah)?.name} - آية {res.ayah}</h4>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{res.reason}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSurahs.map((surah) => (
            <div 
              key={surah.number}
              onClick={() => setSelectedSurah(surah.number)}
              className="group bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md"
            >
               <div className="flex items-center space-x-3 space-x-reverse">
                 <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                   {surah.number}
                 </div>
                 <div>
                   <h3 className="font-bold font-serif text-lg group-hover:text-primary-600 transition-colors">{surah.name}</h3>
                   <p className="text-xs text-gray-500">{surah.englishName} • {surah.numberOfAyahs} آية</p>
                 </div>
               </div>
               <div className="flex items-center space-x-2 space-x-reverse">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(surah.number);
                    }}
                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${bookmarks.includes(surah.number) ? 'text-primary-500 fill-primary-500' : 'text-gray-300'}`}
                  >
                    <Bookmark size={18} className={bookmarks.includes(surah.number) ? 'fill-current' : ''} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const QuizView = () => {
    const [score, setScore] = useState(0);
    const [currentQ, setCurrentQ] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Sample data - in a real app, fetch from AI or DB
    const questions: QuizQuestion[] = [
        { id: 1, question: "ما هي أول سورة نزلت في القرآن الكريم؟", options: ["الفاتحة", "العلق", "المدثر", "البقرة"], correctIndex: 1, explanation: "نزلت سورة العلق أولاً في غار حراء." },
        { id: 2, question: "كم عدد سور القرآن الكريم؟", options: ["110", "112", "114", "116"], correctIndex: 2, explanation: "عدد سور القرآن الكريم 114 سورة." },
        { id: 3, question: "في أي سنة كانت الهجرة النبوية؟", options: ["620 م", "622 م", "624 م", "630 م"], correctIndex: 1, explanation: "هاجر النبي ﷺ في عام 622 ميلادية." },
        { id: 4, question: "من هو الصحابي الملقب بذي النورين؟", options: ["عمر بن الخطاب", "علي بن أبي طالب", "عثمان بن عفان", "أبو بكر الصديق"], correctIndex: 2, explanation: "لقب عثمان بن عفان بذي النورين لزواجه من ابنتي الرسول ﷺ." },
    ];

    const handleAnswer = (index: number) => {
        setSelectedOption(index);
        if (index === questions[currentQ].correctIndex) {
            setScore(score + 10);
        }
        
        setTimeout(() => {
            if (currentQ < questions.length - 1) {
                setCurrentQ(currentQ + 1);
                setSelectedOption(null);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    const resetQuiz = () => {
        setScore(0);
        setCurrentQ(0);
        setShowResult(false);
        setSelectedOption(null);
    };

    if (showResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <Target size={64} className="text-primary-500 mb-6" />
                <h2 className="text-3xl font-bold mb-2">النتيجة النهائية</h2>
                <p className="text-xl text-gray-600 mb-6">لقد حصلت على {score} من {questions.length * 10} نقطة</p>
                <button onClick={resetQuiz} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors">
                    إعادة الاختبار
                </button>
            </div>
        );
    }

    const q = questions[currentQ];

    return (
        <div className="pb-24 max-w-2xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold font-serif">اختبر معلوماتك</h2>
                 <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                     {currentQ + 1} / {questions.length}
                 </span>
             </div>

             <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
                 <h3 className="text-xl font-bold mb-8 leading-relaxed">{q.question}</h3>
                 
                 <div className="space-y-3">
                     {q.options.map((opt, idx) => {
                         let statusClass = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                         if (selectedOption !== null) {
                             if (idx === q.correctIndex) statusClass = "bg-green-100 border-green-500 text-green-800";
                             else if (idx === selectedOption) statusClass = "bg-red-100 border-red-500 text-red-800";
                         }

                         return (
                            <button
                                key={idx}
                                disabled={selectedOption !== null}
                                onClick={() => handleAnswer(idx)}
                                className={`w-full p-4 rounded-xl border text-right font-medium transition-all ${statusClass} hover:shadow-md`}
                            >
                                {opt}
                            </button>
                         );
                     })}
                 </div>

                 {selectedOption !== null && (
                     <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg">
                         <Info size={16} className="inline ml-2" />
                         {q.explanation}
                     </div>
                 )}
             </div>
        </div>
    );
};

const KhatmaView = () => {
    const { khatma, updateKhatma } = useContext(AppContext)!;
    const [daysInput, setDaysInput] = useState(30);

    const createPlan = () => {
        const totalPages = 604;
        const daily = Math.ceil(totalPages / daysInput);
        updateKhatma({
            days: daysInput,
            currentPage: 1,
            totalPages: totalPages,
            dailyTarget: daily,
            startDate: new Date().toISOString()
        });
    };

    if (!khatma) {
        return (
            <div className="pb-24 flex flex-col items-center text-center p-6">
                <BookOpen size={64} className="text-primary-500 mb-6" />
                <h2 className="text-2xl font-bold font-serif mb-2">ختمة القرآن الكريم</h2>
                <p className="text-gray-500 mb-8 max-w-md">خطط لختمتك بسهولة. حدد عدد الأيام التي تريد ختم القرآن فيها، وسنقوم بحساب الورد اليومي لك.</p>
                
                <div className="w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-bold mb-2">مدة الختمة (بالأيام)</label>
                    <input 
                        type="number" 
                        value={daysInput} 
                        onChange={(e) => setDaysInput(parseInt(e.target.value))}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 text-center text-xl font-bold border border-gray-200 dark:border-gray-700"
                    />
                    <button onClick={createPlan} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors">
                        بدء الختمة
                    </button>
                </div>
            </div>
        );
    }

    const progress = (khatma.currentPage / khatma.totalPages) * 100;

    return (
        <div className="pb-24">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold font-serif">متابعة الختمة</h2>
                 <button onClick={() => updateKhatma(null as any)} className="text-red-500 text-sm">إلغاء</button>
             </div>

             <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="text-4xl font-bold font-mono mb-2">{khatma.dailyTarget}</div>
                      <div className="text-sm opacity-90 mb-6">صفحة يومياً</div>
                      
                      <div className="w-full bg-black/20 rounded-full h-3 mb-2">
                          <div className="bg-white h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between w-full text-xs opacity-75">
                          <span>الصفحة {khatma.currentPage}</span>
                          <span>{Math.round(progress)}%</span>
                          <span>{khatma.totalPages}</span>
                      </div>
                  </div>
             </div>

             <div className="flex gap-4">
                 <button 
                    onClick={() => updateKhatma({ ...khatma, currentPage: Math.min(khatma.totalPages, khatma.currentPage + 1) })}
                    className="flex-1 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:border-primary-500 transition-colors"
                 >
                     أتممت صفحة
                 </button>
                 <button 
                     onClick={() => updateKhatma({ ...khatma, currentPage: Math.min(khatma.totalPages, khatma.currentPage + khatma.dailyTarget) })}
                    className="flex-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 p-4 rounded-xl border border-primary-100 dark:border-primary-800 font-bold"
                 >
                     أتممت الورد اليومي
                 </button>
             </div>
        </div>
    );
};

const AdhkarView = () => {
  const [activeTab, setActiveTab] = useState<'morning'|'evening'|'prayer'>('morning');
  const [counts, setCounts] = useState<Record<number, number>>({});

  const handleCount = (id: number, target: number) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    setCounts(prev => {
      const current = prev[id] || 0;
      if (current >= target) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const filtered = ADHKAR_DATA.filter(d => d.category === activeTab);

  return (
    <div className="pb-24">
      <h2 className="text-2xl font-bold mb-6 font-serif">الأذكار</h2>
      
      <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6">
        {[
          { id: 'morning', label: 'الصباح' },
          { id: 'evening', label: 'المساء' },
          { id: 'prayer', label: 'الصلاة' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
              ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm' 
              : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(dhikr => {
          const count = counts[dhikr.id] || 0;
          const progress = (count / dhikr.count) * 100;
          const isDone = count >= dhikr.count;

          return (
            <div 
              key={dhikr.id}
              onClick={() => handleCount(dhikr.id, dhikr.count)}
              className={`relative overflow-hidden bg-white dark:bg-gray-900 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                isDone 
                ? 'border-primary-500/50 bg-primary-50/50 dark:bg-primary-900/20' 
                : 'border-gray-100 dark:border-gray-800 shadow-sm'
              }`}
            >
              <div 
                className="absolute bottom-0 right-0 top-0 bg-primary-100 dark:bg-primary-900/30 transition-all duration-300"
                style={{ width: `${progress}%`, zIndex: 0 }}
              />
              
              <div className="relative z-10 p-5">
                <p className="text-lg font-serif leading-loose mb-3 text-gray-800 dark:text-gray-100">
                  {dhikr.text}
                </p>
                
                <div className="flex justify-between items-end">
                   <div className="text-xs text-gray-500">
                     {dhikr.reference && <span className="block mb-1">{dhikr.reference}</span>}
                     {dhikr.benefit && <span className="text-primary-600">{dhikr.benefit}</span>}
                   </div>
                   
                   <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-xs text-gray-400">اضغط للعد</span>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-colors ${
                        isDone ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}>
                        {toArabicNumerals(dhikr.count - count)}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AssistantView = () => {
    const { chatHistory, addChatMessage } = useContext(AppContext)!;
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const text = input;
        setInput('');
        addChatMessage('user', text);
        setLoading(true);

        const response = await AIService.chatWithSheikh(text, chatHistory);
        addChatMessage('model', response);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
                    <MessageCircle className="text-primary-600" />
                    المساعد الإسلامي الذكي
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-4" ref={scrollRef}>
                {chatHistory.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <Brain size={48} className="mx-auto mb-4 opacity-50" />
                        <p>مرحباً، أنا مساعدك الذكي.</p>
                        <p className="text-sm">يمكنك سؤالي عن التاريخ الإسلامي، تفسير آية، أو نصيحة عامة.</p>
                        <p className="text-xs mt-2 text-red-400">ملاحظة: للفتاوى الشرعية الدقيقة، يرجى مراجعة أهل العلم.</p>
                    </div>
                )}
                
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                            ? 'bg-primary-600 text-white rounded-tl-none' 
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tr-none shadow-sm'
                        }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                     <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tr-none border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex space-x-1 space-x-reverse">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="اكتب سؤالك هنا..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="absolute left-2 top-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                    <Send size={20} className={loading ? 'opacity-0' : ''} />
                </button>
            </div>
        </div>
    );
};

const EmotionDuaWidget = () => {
    const [selectedEmotion, setSelectedEmotion] = useState('');
    const [generatedDua, setGeneratedDua] = useState('');
    const [loading, setLoading] = useState(false);

    const emotions = [
        { label: 'حزين', icon: Frown, value: 'sadness' },
        { label: 'قلق', icon: AlertCircle, value: 'anxiety' },
        { label: 'سعيد', icon: Smile, value: 'gratitude' },
        { label: 'غاضب', icon: Meh, value: 'anger' },
    ];

    const handleEmotion = async (emotion: string) => {
        setSelectedEmotion(emotion);
        setLoading(true);
        const dua = await AIService.generateDuaByEmotion(emotion);
        setGeneratedDua(dua);
        setLoading(false);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Heart className="text-pink-500 fill-current" size={20} /> 
                مواساة - بماذا تشعر الآن؟
            </h3>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {emotions.map(e => (
                    <button
                        key={e.value}
                        onClick={() => handleEmotion(e.label)}
                        className={`flex flex-col items-center p-3 rounded-xl min-w-[4.5rem] transition-all border ${
                            selectedEmotion === e.label 
                            ? 'bg-primary-50 border-primary-500 text-primary-700' 
                            : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-gray-100'
                        }`}
                    >
                        <e.icon size={24} className="mb-2" />
                        <span className="text-xs font-medium">{e.label}</span>
                    </button>
                ))}
            </div>

            {(loading || generatedDua) && (
                <div className="mt-4 p-4 bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800 animate-in fade-in slide-in-from-top-2">
                    {loading ? (
                         <div className="flex items-center gap-2 text-primary-600 text-sm">
                             <RefreshCw size={16} className="animate-spin" /> جاري البحث عن دعاء مناسب...
                         </div>
                    ) : (
                        <p className="text-lg font-serif leading-loose text-center text-gray-800 dark:text-gray-100">
                            {generatedDua}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

const AudioPlayer = () => {
  const { audioState, togglePlay } = useContext(AppContext)!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioState.audioUrl && audioRef.current) {
      if (audioRef.current.src !== audioState.audioUrl) {
          audioRef.current.src = audioState.audioUrl;
      }
      
      if (audioState.isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioState.audioUrl, audioState.isPlaying]);

  const handleTimeUpdate = () => {
    if(audioRef.current) {
        const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(p || 0);
    }
  }

  if (!audioState.currentSurah) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-3 z-40 transition-transform duration-300 transform translate-y-0 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
       <audio 
         ref={audioRef} 
         onTimeUpdate={handleTimeUpdate}
         onEnded={() => togglePlay()} 
       />
       
       <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
       </div>

       <div className="container mx-auto flex items-center justify-between px-2">
         <div className="flex items-center space-x-3 space-x-reverse truncate">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Volume2 size={20} />
            </div>
            <div className="truncate">
                <p className="text-sm font-bold truncate">سورة {audioState.currentSurah.name}</p>
                <p className="text-xs text-gray-500">مشاري العفاسي</p>
            </div>
         </div>

         <div className="flex items-center space-x-4 space-x-reverse">
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 shadow-lg shadow-primary-500/30"
            >
                {audioState.isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
            </button>
            <button onClick={() => togglePlay()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
            </button>
         </div>
       </div>
    </div>
  );
};

const AppContent = () => {
  const { view, setView } = useContext(AppContext)!;

  return (
    <main className="container mx-auto px-4 pt-6 min-h-screen">
      {view === 'home' && (
        <div className="pb-24 animate-in fade-in duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-serif mb-2 text-gray-900 dark:text-white">السلام عليكم</h1>
              <p className="text-gray-500 dark:text-gray-400">فَاذْكُرُونِي أَذْكُرْكُمْ</p>
            </div>
            
            <PrayerTimesCard />

            <EmotionDuaWidget />
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                   onClick={() => setView('quran')}
                   className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                >
                    <BookOpen size={32} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-200">القرآن الكريم</span>
                </button>
                <button 
                   onClick={() => setView('adhkar')}
                   className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                >
                    <Heart size={32} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-blue-800 dark:text-blue-200">الأذكار</span>
                </button>
                <button 
                   onClick={() => setView('assistant')}
                   className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] transition-transform col-span-2"
                >
                    <MessageCircle size={32} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-indigo-800 dark:text-indigo-200">المساعد الذكي (جديد)</span>
                </button>
            </div>
            
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">آية اليوم</h3>
                </div>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xl font-serif leading-loose text-center mb-4">
                            "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ"
                        </p>
                        <p className="text-center text-sm opacity-70">سورة البقرة - الآية 201</p>
                    </div>
                </div>
            </div>
        </div>
      )}
      {view === 'quran' && <QuranView />}
      {view === 'adhkar' && <AdhkarView />}
      {view === 'quiz' && <QuizView />}
      {view === 'khatma' && <KhatmaView />}
      {view === 'assistant' && <AssistantView />}
    </main>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, currentSurah: null, currentAyahIndex: 0, audioUrl: null });
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Dark Mode Check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    // Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Geo error", err)
      );
    } else {
        setLocation({ lat: 21.3891, lng: 39.8579 }); 
    }
    
    // Load local storage
    const savedBookmarks = localStorage.getItem('bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedKhatma = localStorage.getItem('khatma');
    if (savedKhatma) setKhatma(JSON.parse(savedKhatma));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const toggleBookmark = (num: number) => {
      const newBookmarks = bookmarks.includes(num) 
        ? bookmarks.filter(b => b !== num)
        : [...bookmarks, num];
      setBookmarks(newBookmarks);
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
  };

  const updateKhatma = (k: KhatmaPlan) => {
      setKhatma(k);
      if (k) localStorage.setItem('khatma', JSON.stringify(k));
      else localStorage.removeItem('khatma');
  };

  const playSurah = (surah: Surah) => {
      const paddedNum = surah.number.toString().padStart(3, '0');
      const url = `https://server8.mp3quran.net/afs/${paddedNum}.mp3`;

      setAudioState({
          isPlaying: true,
          currentSurah: surah,
          currentAyahIndex: 0,
          audioUrl: url
      });
  };

  const togglePlay = () => {
      setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const addChatMessage = (role: 'user' | 'model', text: string) => {
      setChatHistory(prev => [...prev, {
          id: Date.now().toString(),
          role,
          text,
          timestamp: new Date()
      }]);
  };

  return (
    <AppContext.Provider value={{ 
      view, setView, 
      darkMode, toggleDarkMode, 
      location, 
      audioState, playSurah, togglePlay,
      bookmarks, toggleBookmark,
      khatma, updateKhatma,
      chatHistory, addChatMessage
    }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        <Navbar />
        <AppContent />
        <AudioPlayer />
      </div>
    </AppContext.Provider>
  );
}