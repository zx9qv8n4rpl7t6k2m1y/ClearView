import React, { useState, useEffect } from 'react';
import { Play, Search, History, Trash2, Youtube, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
  return (match && match[1].length === 11) ? match[1] : null;
}

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  color: string;
}

const CATEGORIES = ["All", "Network", "Study", "History", "Tech", "Science", "Web3", "New to you"];

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [libraryVideos, setLibraryVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState(""); // "" means trending
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('yt_proxy_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { }
    }
    fetchTrending(1, true);
  }, []);

  const fetchTrending = async (pageNum: number = 1, fresh: boolean = false) => {
    if (fresh) {
      setIsLoading(true);
      setPage(1);
      setCurrentQuery("");
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/trending?page=${pageNum}`);
      const data = await res.json();
      if (data.videos) {
        if (data.videos.length === 0) setHasMore(false);
        setLibraryVideos(prev => fresh ? data.videos : [...prev, ...data.videos]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const executeSearch = async (query: string, pageNum: number = 1, fresh: boolean = false) => {
    if (fresh) {
      setIsLoading(true);
      setPage(1);
      setCurrentQuery(query);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${pageNum}`);
      const data = await res.json();
      if (data.videos) {
        if (data.videos.length === 0) setHasMore(false);
        setLibraryVideos(prev => fresh ? data.videos : [...prev, ...data.videos]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "All" || cat === "New to you") {
      fetchTrending(1, true);
    } else {
      executeSearch(`${cat} trending`, 1, true);
    }
  };

  const loadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    if (currentQuery === "") {
      fetchTrending(nextPage, false);
    } else {
      executeSearch(currentQuery, nextPage, false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, isLoading, isLoadingMore, hasMore, currentQuery]);

  const addToHistory = (id: string) => {
    setHistory(prev => {
      const newHist = [id, ...prev.filter(x => x !== id)].slice(0, 20);
      localStorage.setItem('yt_proxy_history', JSON.stringify(newHist));
      return newHist;
    });
  };

  const handlePlay = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!inputUrl.trim()) return;

    let searchInput = inputUrl.trim();
    
    // Check if it's an exact 11 char ID (and no spaces)
    if (searchInput.length === 11 && !searchInput.includes(' ')) {
      setCurrentId(searchInput);
      addToHistory(searchInput);
      setInputUrl('');
      return;
    }

    // Check if it looks like a URL with video ID
    const extracted = extractVideoId(searchInput);
    if (extracted) {
      setCurrentId(extracted);
      addToHistory(extracted);
      setInputUrl('');
      return;
    }
    
    // Otherwise treat as a search query
    executeSearch(searchInput, 1, true);
    setCurrentId(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans flex flex-col items-center selection:bg-white/20">
      {/* Header */}
      <header className="w-full px-6 h-16 flex items-center justify-between border-b border-white/5 bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 group cursor-pointer">
            <div className="w-8 h-6 bg-red-600 rounded flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
            </div>
            <span className="text-xl font-bold tracking-tighter ml-2">ClearView</span>
            <span className="text-[10px] text-gray-500 self-start mt-1 ml-1 uppercase">PROXY</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full transition-all duration-200 ${showHistory ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10'}`}
            title="Watch History"
          >
            <History size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-6 lg:flex-row items-start relative pb-20">
        
        {/* Play Space */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handlePlay} 
            className="relative"
          >
            <div className="relative flex items-center w-full max-w-3xl mx-auto">
              <input 
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Search unblocked content..."
                className="w-full bg-[#121212] border border-white/10 rounded-full py-3 pl-6 pr-[60px] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="absolute right-0 h-full">
                <button 
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="h-full w-[60px] bg-white/5 border-l border-white/10 text-gray-300 rounded-r-full hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center p-0"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute -bottom-12 left-0 text-red-400 text-xs md:text-sm flex items-center gap-2 bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-xl"
                >
                  <Info size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Player Container */}
          <AnimatePresence initial={false}>
            {currentId && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full max-w-5xl mx-auto overflow-hidden block"
              >
                <div className="w-full aspect-video bg-[#222] rounded-xl overflow-hidden relative group border border-white/5 shadow-2xl shadow-indigo-900/10 mb-6">
                  <iframe
                    title="ClearView Player"
                    width="100%"
                    height="100%"
                    src={`https://www.youtube-nocookie.com/embed/${currentId}?autoplay=1&rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Library Section */}
          <div className="w-full max-w-5xl mx-auto mt-4 border-t border-white/5 pt-6">
            <h2 className="text-lg font-bold text-gray-200 mb-4 px-2">Recommended for you</h2>
            
            {/* Categories Chips */}
            <div className="flex gap-2.5 px-2 pb-4 overflow-x-auto custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-white text-black' 
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Video Grid */}
            {isLoading && libraryVideos.length === 0 ? (
              <div className="py-20 flex justify-center w-full">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 px-2 py-4">
                  {libraryVideos.map((video, idx) => (
                    <div 
                      key={`${video.id}-${idx}`} 
                      className="flex flex-col gap-3 group cursor-pointer"
                      onClick={() => {
                        setCurrentId(video.id);
                        addToHistory(video.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="relative aspect-video bg-[#222] rounded-xl overflow-hidden border border-transparent group-hover:border-white/10 transition-colors">
                        <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[11px] font-bold rounded">{video.duration}</div>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-full ${video.color || 'bg-indigo-500'} shrink-0 flex items-center justify-center text-[10px] font-bold uppercase text-white`}>
                          {video.channel.substring(0, 1)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-gray-200 group-hover:text-blue-400 transition-colors" title={video.title}>{video.title}</h3>
                          <span className="text-xs text-gray-400 mt-1 truncate">{video.channel}</span>
                          <span className="text-xs text-gray-500 truncate">{video.views}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {isLoadingMore && (
                  <div className="py-8 flex justify-center w-full">
                    <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  </div>
                )}
                
                {!hasMore && libraryVideos.length > 0 && (
                  <div className="py-8 text-center text-sm text-gray-500 w-full">
                    You've reached the end
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
              <motion.div 
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 340, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              className="hidden lg:flex flex-col bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden shrink-0 h-[calc(100vh-140px)]"
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <History size={16} className="text-gray-400" />
                  Library History
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                        setHistory([]);
                        localStorage.removeItem('yt_proxy_history');
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors tracking-wider font-semibold"
                  >
                    CLEAR
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3 text-gray-600">
                    <History size={24} strokeWidth={1} />
                    <p className="text-xs">No recent sessions</p>
                  </div>
                ) : (
                  history.map((id) => (
                    <div 
                      key={id} 
                      className="group relative bg-transparent hover:bg-white/5 transition-colors border border-transparent rounded-lg p-2 pr-10 cursor-pointer overflow-hidden flex flex-col gap-2"
                      onClick={() => setCurrentId(id)}
                    >
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-[#222] relative shrink-0">
                         <img 
                           src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} 
                           alt="Thumbnail" 
                           className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                           loading="lazy"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-semibold text-gray-200 truncate">{id}</div>
                         <div className="text-[11px] text-gray-400 mt-0.5 group-hover:text-blue-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0">
                            Play Video <Play size={10} className="fill-current" />
                         </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistory(prev => {
                            const newHist = prev.filter(x => x !== id);
                            localStorage.setItem('yt_proxy_history', JSON.stringify(newHist));
                            return newHist;
                          });
                        }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1.5 bg-black/60 hover:bg-black/90 rounded-full transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile History Toggle Panel */}
        <AnimatePresence>
            {showHistory && (
                 <motion.div 
                 initial={{ opacity: 0, y: "100%" }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] border-t border-white/10 rounded-t-2xl p-4 md:p-6 h-[75vh] flex flex-col shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.8)]"
               >
                 <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0" />
                 
                 <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 shrink-0">
                   <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                     <History size={16} className="text-gray-400" />
                     Library History
                   </div>
                   <button 
                     onClick={() => setShowHistory(false)}
                     className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                   >
                     <X size={16} />
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pb-10">
                   {history.length === 0 ? (
                     <div className="py-20 text-center flex flex-col items-center gap-3 text-gray-600">
                       <History size={24} strokeWidth={1} />
                       <p className="text-xs">No recent sessions</p>
                     </div>
                   ) : (
                     history.map((id) => (
                       <div 
                         key={id} 
                         className="flex flex-col gap-2 bg-[#121212] p-3 rounded-xl border border-white/5"
                       >
                            <div className="w-full aspect-video rounded-lg overflow-hidden bg-[#222] shrink-0 relative" onClick={() => { setCurrentId(id); setShowHistory(false); }}>
                                <img 
                                    src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} 
                                    alt="Thumbnail" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white bg-black/60 px-2 py-1 rounded text-[10px] font-bold">
                                  <Play size={10} className="fill-current" /> Tap to play
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <div className="text-sm font-semibold text-gray-300 truncate">{id}</div>
                                <button 
                                    onClick={() => {
                                        setHistory(prev => {
                                            const newHist = prev.filter(x => x !== id);
                                            localStorage.setItem('yt_proxy_history', JSON.stringify(newHist));
                                            return newHist;
                                        });
                                    }}
                                    className="text-gray-500 hover:text-white p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                       </div>
                     ))
                   )}
                 </div>
               </motion.div>
            )}
        </AnimatePresence>

      </main>
      
      <footer className="w-full text-center py-8 text-xs text-gray-500 max-w-5xl mx-auto px-4 mt-auto">
        <p>Videos are provided by YouTube. ClearView does not host or store any video content. All rights belong to their respective creators.</p>
      </footer>

      {/* Mobile overlay for history */}
      <AnimatePresence>
         {showHistory && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
             />
         )}
      </AnimatePresence>

    </div>
  );
}
