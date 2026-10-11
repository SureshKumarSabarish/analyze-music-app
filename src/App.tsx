import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { LiquidBackground } from './components/LiquidBackground';
import { SearchBar } from './components/SearchBar';
import { RecentSearches, RecentSearchItem } from './components/RecentSearches';
import { MusicCard } from './components/MusicCard';
import { CardSkeleton } from './components/CardSkeleton';
import { AnalysisModal } from './components/AnalysisModal';
import { EmptyState } from './components/EmptyState';
import { MusicItem, SearchType, AnalysisResult, Recommendation } from './types/music';
import { searchMusic, analyzeMusic } from './services/musicApi';

export default function App() {
  const [query, setQuery] = useState<string>('');
  const [type, setType] = useState<SearchType>('song');
  const [genre, setGenre] = useState<string>('all');
  const [results, setResults] = useState<MusicItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modal & AI Analysis state
  const [selectedItem, setSelectedItem] = useState<MusicItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // About info modal toggle
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // In-grid preview player state
  const [playingPreviewId, setPlayingPreviewId] = useState<string | number | null>(null);
  const gridAudioRef = useRef<HTMLAudioElement | null>(null);

  // Recent Searches state (persisted to localStorage, max 5 items)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('sonora_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse recent searches from localStorage:', e);
      return [];
    }
  });

  const saveRecentSearch = (searchQuery: string, searchType: SearchType) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => !(item.query.toLowerCase() === trimmed.toLowerCase() && item.type === searchType)
      );
      const newItem: RecentSearchItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        query: trimmed,
        type: searchType,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('sonora_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent search to localStorage:', e);
      }
      return updated;
    });
  };

  const handleRemoveRecentSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('sonora_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update recent searches:', e);
      }
      return updated;
    });
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('sonora_recent_searches');
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  };

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    setQuery(item.query);
    setType(item.type);
    handleSearch(item.query, item.type, genre);
  };

  // Execute Search
  const handleSearch = async (overrideQuery?: string, overrideType?: SearchType, overrideGenre?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const t = overrideType !== undefined ? overrideType : type;
    const g = overrideGenre !== undefined ? overrideGenre : genre;

    if (!q.trim()) return;

    saveRecentSearch(q, t);

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    if (gridAudioRef.current) {
      gridAudioRef.current.pause();
      setPlayingPreviewId(null);
    }

    try {
      const items = await searchMusic(q, t, g);
      setResults(items);
    } catch (err: any) {
      console.error('Search failed:', err);
      setSearchError(err.message || 'Unable to retrieve search results. Check network connection.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: { query: string; type: SearchType }) => {
    setQuery(preset.query);
    setType(preset.type);
    handleSearch(preset.query, preset.type, genre);
  };

  // Item Card clicked -> Open modal & Trigger Gemini Analysis
  const handleSelectItem = async (item: MusicItem) => {
    if (gridAudioRef.current) {
      gridAudioRef.current.pause();
      setPlayingPreviewId(null);
    }

    setSelectedItem(item);
    setIsModalOpen(true);
    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisError(null);

    try {
      const result = await analyzeMusic(item);
      setAnalysis(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Could not complete music analysis. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle audio preview directly on search grid card
  const handleTogglePreview = (item: MusicItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!item.previewUrl || !item.previewUrl.startsWith('http')) return;

    if (playingPreviewId === item.id) {
      if (gridAudioRef.current) {
        gridAudioRef.current.pause();
      }
      setPlayingPreviewId(null);
    } else {
      if (!gridAudioRef.current) {
        gridAudioRef.current = new Audio();
        gridAudioRef.current.preload = 'metadata';
        gridAudioRef.current.onended = () => setPlayingPreviewId(null);
        gridAudioRef.current.onerror = () => {
          setPlayingPreviewId(null);
        };
      }
      try {
        const secureSrc = item.previewUrl.replace(/^http:\/\//i, 'https://');
        gridAudioRef.current.src = secureSrc;
        gridAudioRef.current.play().then(() => {
          setPlayingPreviewId(item.id);
        }).catch((err) => {
          console.warn('Preview playback notice:', err);
          setPlayingPreviewId(null);
        });
      } catch (err) {
        console.warn('Audio setup notice:', err);
        setPlayingPreviewId(null);
      }
    }
  };

  const handleSelectSample = (item: MusicItem) => {
    handleSelectItem(item);
  };

  const handleSelectRecommendation = (rec: Recommendation) => {
    const newQuery = `${rec.title} ${rec.artist}`;
    const recType = rec.type || (type === 'album' ? 'album' : 'song');
    setQuery(newQuery);
    setType(recType);
    setIsModalOpen(false);
    handleSearch(newQuery, recType);
  };

  const handleReset = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
    setGenre('all');
    if (gridAudioRef.current) {
      gridAudioRef.current.pause();
      setPlayingPreviewId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-zinc-900 antialiased flex flex-col font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* Dynamic Liquid Refraction Canvas with Floating Fluid Pastel Orbs */}
      <LiquidBackground />

      {/* Ultra-subtle minimal top bar */}
      <Navbar onReset={handleReset} resultsCount={results.length} onOpenAbout={() => setShowAbout(true)} />

      {/* Main Vast Canvas Floating Over Refractive Background */}
      <main className="relative z-10 flex-1 flex flex-col px-6 sm:px-12 lg:px-16 py-12 sm:py-20 max-w-7xl w-full mx-auto">
        {/* The Centerpiece Search Section */}
        <section className="w-full mb-16 sm:mb-24">
          <SearchBar
            query={query}
            setQuery={(q) => {
              setQuery(q);
              if (!q.trim()) {
                setResults([]);
                setHasSearched(false);
              }
            }}
            type={type}
            setType={(t) => {
              setType(t);
              if (hasSearched && query.trim()) {
                handleSearch(query, t, genre);
              }
            }}
            genre={genre}
            setGenre={(g) => {
              setGenre(g);
              if (hasSearched && query.trim()) {
                handleSearch(query, type, g);
              }
            }}
            onSearch={handleSearch}
            isLoading={isSearching}
            onSelectPreset={handleSelectPreset}
            onSelectSuggestion={handleSelectItem}
          />

          {/* Minimal Recent Searches Line */}
          <RecentSearches
            recentSearches={recentSearches}
            onSelect={handleSelectRecentSearch}
            onRemove={handleRemoveRecentSearch}
            onClearAll={handleClearAllRecentSearches}
          />
        </section>

        {/* Search Error Notice */}
        {searchError && (
          <div className="w-full max-w-xl mx-auto mb-12 py-3 border-b border-rose-300 font-mono text-xs text-rose-600 flex items-center justify-between">
            <span>error: {searchError}</span>
            <button
              onClick={() => handleSearch()}
              className="text-zinc-900 hover:underline cursor-pointer lowercase"
            >
              retry
            </button>
          </div>
        )}

        {/* Naked Search Results Grid */}
        <section className="w-full flex-1">
          {isSearching ? (
            <div className="space-y-6">
              <div className="text-xs font-mono text-zinc-500 lowercase">
                fetching index...
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-8">
              {/* Minimal header */}
              <div className="flex items-baseline justify-between border-b border-black/5 pb-3 text-xs font-mono text-zinc-500 lowercase">
                <span>
                  &ldquo;{query}&rdquo; — {results.length} {type}s
                </span>
                <span>select to analyze</span>
              </div>

              {/* Naked Zero-Box Grid with Massive Breathing Room */}
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12"
              >
                <AnimatePresence mode="popLayout">
                  {results.map((item) => (
                    <MusicCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectItem}
                      isPlayingPreview={playingPreviewId === item.id}
                      onTogglePreview={handleTogglePreview}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          ) : (
            <EmptyState
              hasSearched={hasSearched}
              query={query}
              type={type}
              onSelectSample={handleSelectSample}
              playingPreviewId={playingPreviewId}
              onTogglePreview={handleTogglePreview}
            />
          )}
        </section>
      </main>

      {/* Alabaster Glass About Dialog */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-md">
          <div className="max-w-md w-full rounded-[32px] backdrop-blur-2xl bg-white/95 border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)] p-8 space-y-4 font-mono text-xs text-zinc-700">
            <div className="text-zinc-900 font-semibold text-sm">about auralyze</div>
            <p className="font-serif text-sm text-zinc-700 leading-relaxed font-light">
              An alabaster liquid glass editorial musicology instrument. Searches the Apple catalog and interrogates harmonic movements, production textures, and lyrical journeys through Gemini AI.
            </p>
            <div className="pt-4 border-t border-black/5 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="text-zinc-900 hover:underline cursor-pointer lowercase"
              >
                close [esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Minimal Editorial Slide-Over Overlay */}
      <AnalysisModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysis}
        isLoading={isAnalyzing}
        error={analysisError}
        onSelectRecommendation={handleSelectRecommendation}
      />
    </div>
  );
}
