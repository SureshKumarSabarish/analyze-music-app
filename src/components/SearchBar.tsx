import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchType, MusicItem } from '../types/music';
import { AlbumArt } from './AlbumArt';
import { ArrowRight, Loader2, X, Search, ChevronDown, Check } from 'lucide-react';

export const GENRE_OPTIONS = [
  { label: 'All Genres', value: 'all' },
  { label: 'Alternative', value: 'Alternative' },
  { label: 'Ambient', value: 'Ambient' },
  { label: 'Classical', value: 'Classical' },
  { label: 'Electronic', value: 'Electronic' },
  { label: 'Folk / Acoustic', value: 'Folk' },
  { label: 'Hip-Hop / Rap', value: 'Hip-Hop' },
  { label: 'Indie Rock', value: 'Indie' },
  { label: 'Jazz', value: 'Jazz' },
  { label: 'Metal', value: 'Metal' },
  { label: 'Pop', value: 'Pop' },
  { label: 'Punk', value: 'Punk' },
  { label: 'R&B / Soul', value: 'R&B' },
  { label: 'Rock', value: 'Rock' },
  { label: 'Shoegaze / Dream Pop', value: 'Shoegaze' },
];

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  type: SearchType;
  setType: (t: SearchType) => void;
  genre?: string;
  setGenre?: (g: string) => void;
  onSearch: (overrideQuery?: string, overrideType?: SearchType, overrideGenre?: string) => void;
  isLoading: boolean;
  onSelectPreset: (preset: { query: string; type: SearchType }) => void;
  onSelectSuggestion?: (item: MusicItem) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  setQuery,
  type,
  setType,
  genre = 'all',
  setGenre,
  onSearch,
  isLoading,
  onSelectSuggestion,
}) => {
  const [suggestions, setSuggestions] = useState<MusicItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isGenreOpen, setIsGenreOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const genreDropdownRef = useRef<HTMLDivElement | null>(null);

  // Debounced live suggestions with optional genre
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const genreParam = genre && genre !== 'all' ? `&genre=${encodeURIComponent(genre)}` : '';
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query.trim())}&type=${type}${genreParam}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.results || []).slice(0, 5));
        }
      } catch (err) {
        console.warn('Suggestions fetch notice:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, type, genre]);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setIsGenreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearch();
  };

  const handlePickSuggestion = (item: MusicItem) => {
    setShowDropdown(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    } else {
      setQuery(`${item.title} ${item.artist}`);
      onSearch(`${item.title} ${item.artist}`, item.type, genre);
    }
  };

  const handleSelectGenre = (selectedGenre: string) => {
    setIsGenreOpen(false);
    if (setGenre) {
      setGenre(selectedGenre);
    }
    if (query.trim()) {
      onSearch(query, type, selectedGenre);
    }
  };

  const handleClearGenre = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setGenre) {
      setGenre('all');
    }
    if (query.trim()) {
      onSearch(query, type, 'all');
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto flex flex-col relative select-none">
      {/* Magnetic Alabaster Glass Search Container */}
      <form onSubmit={handleSubmit} className="w-full relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
            boxShadow: isFocused
              ? '0 20px 48px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
              : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full rounded-full px-6 py-4 flex items-center justify-between backdrop-blur-2xl bg-white/60 border border-black/5 border-t-white/95 transition-colors focus-within:border-zinc-300"
        >
          {/* Subtle Search Icon */}
          <div className="text-zinc-400 pl-1 pr-3 flex items-center shrink-0">
            <Search className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
          </div>

          <input
            type="text"
            value={query}
            onFocus={() => {
              setIsFocused(true);
              setShowDropdown(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder={
              type === 'song'
                ? 'search any song title or artist...'
                : 'search any album catalog...'
            }
            className="w-full bg-transparent border-none text-zinc-900 font-serif tracking-tight text-xl sm:text-2xl lg:text-3xl focus:outline-none placeholder:text-zinc-400 placeholder:font-serif placeholder:italic transition-all px-2"
            autoFocus
          />

          {/* Interactive Clear Button revealed only when typing, and Loading/Submit */}
          <div className="flex items-center gap-2 pr-1 shrink-0">
            {isSuggesting && (
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" strokeWidth={1.5} />
            )}

            {/* Revealed Clear button ('X') */}
            <AnimatePresence>
              {query.trim().length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setShowDropdown(false);
                  }}
                  className="w-7 h-7 rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!query.trim() || isLoading}
              className="text-[11px] uppercase font-mono tracking-[0.2em] px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-black text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              {isLoading ? 'decoding' : 'return ↵'}
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* Floating Alabaster Controls: Type Toggle & Genre Filter Dropdown */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 text-xs font-mono">
        {/* Type Toggle: song • album */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-full backdrop-blur-xl bg-white/70 border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setType('song');
              setShowDropdown(false);
              if (query.trim()) {
                onSearch(query, 'song', genre);
              }
            }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer lowercase ${
              type === 'song'
                ? 'bg-zinc-900 text-white font-medium shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            song
          </motion.button>

          <span className="text-zinc-300 select-none">•</span>

          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setType('album');
              setShowDropdown(false);
              if (query.trim()) {
                onSearch(query, 'album', genre);
              }
            }}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer lowercase ${
              type === 'album'
                ? 'bg-zinc-900 text-white font-medium shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            album
          </motion.button>
        </div>

        {/* Tactile Genre Filter Dropdown */}
        <div ref={genreDropdownRef} className="relative inline-block text-left">
          <div className="inline-flex items-center gap-1 p-1 rounded-full backdrop-blur-xl bg-white/70 border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsGenreOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isGenreOpen}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                genre && genre !== 'all'
                  ? 'bg-zinc-900 text-white font-medium shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider ${genre && genre !== 'all' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                genre:
              </span>
              <span className="font-mono lowercase">
                {GENRE_OPTIONS.find((g) => g.value === genre)?.label.toLowerCase() || 'all'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isGenreOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.5}
              />
            </motion.button>

            {genre && genre !== 'all' && (
              <button
                type="button"
                onClick={handleClearGenre}
                className="w-5 h-5 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center mr-1 transition-colors cursor-pointer"
                title="Reset genre filter to All"
              >
                <X className="w-3 h-3" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Animated Alabaster Dropdown Menu */}
          <AnimatePresence>
            {isGenreOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 w-56 rounded-2xl overflow-hidden backdrop-blur-2xl bg-white/95 border border-black/10 shadow-[0_20px_48px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)] divide-y divide-black/5"
              >
                <div className="px-4 py-2 text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-400 bg-zinc-50/50 flex items-center justify-between">
                  <span>filter by genre</span>
                  {genre && genre !== 'all' && (
                    <button
                      type="button"
                      onClick={handleClearGenre}
                      className="text-zinc-500 hover:text-zinc-900 lowercase cursor-pointer hover:underline"
                    >
                      reset
                    </button>
                  )}
                </div>

                <div className="py-1 max-h-64 overflow-y-auto">
                  {GENRE_OPTIONS.map((g) => {
                    const isSelected = (genre || 'all') === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => handleSelectGenre(g.value)}
                        className={`w-full px-4 py-2 text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-medium'
                            : 'text-zinc-700 hover:bg-black/5 hover:text-zinc-950'
                        }`}
                      >
                        <span className="truncate">{g.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" strokeWidth={1.5} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Alabaster Glass Dropdown Autocomplete Matches */}
      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute top-full left-0 right-0 z-40 mt-3 rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/90 border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] divide-y divide-black/5 max-h-96 overflow-y-auto"
          >
            <div className="px-5 py-2.5 text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-500 bg-zinc-50/50">
              instant matches
            </div>

            {suggestions.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                onClick={() => handlePickSuggestion(item)}
                className="px-5 py-3.5 flex items-center gap-4 transition-colors cursor-pointer group"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden border border-black/10 bg-zinc-100 shadow-sm">
                  <AlbumArt
                    src={item.artworkUrl}
                    fallbackSrc={item.artworkUrlSmall}
                    alt={item.title}
                    isAlbum={item.type === 'album'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-serif text-zinc-900 group-hover:text-black font-medium truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono lowercase truncate mt-0.5">
                    {item.artist} {item.releaseYear ? `(${item.releaseYear})` : ''}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-900 flex items-center gap-1.5 shrink-0">
                  <span>inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
