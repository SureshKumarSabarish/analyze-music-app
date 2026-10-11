import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MusicItem, AnalysisResult, Recommendation } from '../types/music';
import { SpinningVinyl } from './SpinningVinyl';
import { RecommendationItem } from './RecommendationItem';
import { Play, Pause } from 'lucide-react';

interface AnalysisModalProps {
  item: MusicItem | null;
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onSelectRecommendation: (rec: Recommendation) => void;
  onSelectTag?: (tag: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 24 },
  },
};

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  item,
  isOpen,
  onClose,
  analysis,
  isLoading,
  error,
  onSelectRecommendation,
  onSelectTag,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [hasAudioError, setHasAudioError] = useState<boolean>(false);

  const securePreviewUrl = item?.previewUrl && item.previewUrl.startsWith('http')
    ? item.previewUrl.replace(/^http:\/\//i, 'https://')
    : undefined;

  // Reset audio state whenever modal opens or item changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasAudioError(!securePreviewUrl);

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (securePreviewUrl) {
          audioRef.current.src = securePreviewUrl;
          audioRef.current.load();
        }
      } catch (e) {
        console.warn('Audio reset notice:', e);
      }
    }
  }, [securePreviewUrl, isOpen, item?.id]);

  // Pause audio when modal is closed
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle playback on the vinyl itself or audio controls
  const handleTogglePlay = () => {
    if (!audioRef.current || !securePreviewUrl || hasAudioError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasAudioError(false);
        })
        .catch((err) => {
          console.warn('Audio playback notice:', err);
          setHasAudioError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeekTime = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (duration || 30);
    handleSeekTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !item) return null;

  const spotifyLink =
    item.spotifyUrl ||
    `https://open.spotify.com/search/${encodeURIComponent(`${item.title} ${item.artist}`.trim())}`;

  // Extract interactive tags from genres, mood tags, and instrumentation highlights
  const interactiveTags: string[] = Array.from(
    new Set([
      ...(analysis?.mood_tags || []),
      ...(analysis?.instrumentation_highlights || []),
      ...(item.genre ? [item.genre] : []),
    ])
  ).filter(Boolean);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
        {/* Soft frosted dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Hidden native HTML5 audio element */}
        {securePreviewUrl && (
          <audio
            ref={audioRef}
            src={securePreviewUrl}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onError={() => {
              setHasAudioError(true);
              setIsPlaying(false);
            }}
          />
        )}

        {/* Alabaster Glass Slide-Over Panel on Right */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative w-full max-w-2xl h-full rounded-l-[40px] backdrop-blur-2xl bg-white/90 border-l border-black/10 shadow-[-16px_0_48px_rgba(0,0,0,0.08),inset_1px_0_2px_rgba(255,255,255,0.95)] flex flex-col z-10 overflow-hidden text-zinc-900"
        >
          {/* Top minimal header */}
          <div className="flex items-center justify-between px-8 md:px-12 py-6 border-b border-black/5 bg-white/40">
            <div className="text-xs font-mono text-zinc-500 lowercase">
              <span>{item.type}</span>
              <span className="mx-2">•</span>
              <span>musicology dossier</span>
            </div>

            <button
              onClick={onClose}
              className="text-xs font-mono text-zinc-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>close</span>
              <span className="text-[10px] text-zinc-400">[esc]</span>
            </button>
          </div>

          {/* Scrollable Editorial Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10">
            {/* Header: Title & Artist in Large High-Contrast Serif */}
            <div>
              <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-2">
                {item.genre || 'record catalog'} {item.releaseYear ? `— ${item.releaseYear}` : ''}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-zinc-900 leading-tight">
                {item.title}
              </h1>
              <p className="font-serif italic text-lg sm:text-xl text-zinc-600 mt-2">
                by {item.artist}
              </p>
            </div>

            {/* Geometric Wireframe Vinyl with Direct Vinyl Playback */}
            <div className="flex flex-col items-center py-6 border-y border-black/5 bg-zinc-50/40 rounded-3xl">
              <SpinningVinyl
                artworkUrl={item.artworkUrl}
                artworkUrlSmall={item.artworkUrlSmall}
                title={item.title}
                artist={item.artist}
                isPlaying={isPlaying}
                isLoadingAnalysis={isLoading}
                hasAudio={Boolean(securePreviewUrl && !hasAudioError)}
                onTogglePlay={handleTogglePlay}
                currentTime={currentTime}
                duration={duration}
              />
            </div>

            {/* Loading State with Bare Pulse */}
            {isLoading && (
              <div className="space-y-8 animate-pulse py-4 font-mono text-xs text-zinc-400">
                <div className="space-y-3">
                  <div className="h-3 bg-zinc-200/80 rounded w-24" />
                  <div className="h-4 bg-zinc-200/80 rounded w-full" />
                  <div className="h-4 bg-zinc-200/80 rounded w-5/6" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-zinc-200/80 rounded w-28" />
                  <div className="h-16 bg-zinc-200/80 rounded w-full" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-xs font-mono text-rose-500 py-4">
                error: {error}
              </div>
            )}

            {/* Staggered Text Reveal Animation Container */}
            {analysis && !isLoading && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-10"
              >
                {/* 1. Overview */}
                <motion.div variants={itemVariants}>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    OVERVIEW
                  </div>
                  <p className="font-serif text-base sm:text-lg text-zinc-800 leading-relaxed font-light">
                    {analysis.overview}
                  </p>
                </motion.div>

                {/* 2. Interactive Analysis Tags */}
                {interactiveTags.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-3">
                      EXPLORE SONIC TAGS (CLICK TO SEARCH)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interactiveTags.map((tag, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (onSelectTag) {
                              onSelectTag(tag);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-black/5 shadow-sm transition-colors cursor-pointer"
                        >
                          #{tag.toLowerCase()} →
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Sonic Blueprint Metrics */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-5 border-y border-black/5 font-mono text-xs bg-zinc-50/50 rounded-2xl p-4"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-1">
                      TONAL KEY
                    </span>
                    <span className="text-zinc-900 font-medium">
                      {analysis.key_signature || 'unspecified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-1">
                      TEMPO PULSE
                    </span>
                    <span className="text-zinc-900 font-medium">
                      {analysis.tempo_bpm || 'dynamic'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 block mb-1">
                      ATMOSPHERE
                    </span>
                    <span className="text-zinc-700">
                      {analysis.mood_tags?.join(', ') || 'expressive'}
                    </span>
                  </div>
                </motion.div>

                {/* 4. Thematic Analysis */}
                <motion.div variants={itemVariants}>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    THEMATIC ANALYSIS
                  </div>
                  <p className="font-serif text-sm sm:text-base text-zinc-700 leading-relaxed font-light">
                    {analysis.thematic_analysis}
                  </p>
                </motion.div>

                {/* 5. Production Style */}
                <motion.div variants={itemVariants}>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-2">
                    PRODUCTION ARCHITECTURE
                  </div>
                  <p className="font-serif text-sm sm:text-base text-zinc-700 leading-relaxed font-light">
                    {analysis.production_style}
                  </p>
                </motion.div>

                {/* 6. Notable Moment */}
                {analysis.notable_moments && (
                  <motion.div variants={itemVariants}>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-2">
                      DEFINING MOMENT
                    </div>
                    <p className="font-serif italic text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-black/5">
                      &ldquo;{analysis.notable_moments}&rdquo;
                    </p>
                  </motion.div>
                )}

                {/* 7. KINDRED RECORDINGS with Dynamic Album Cover Art */}
                <motion.div variants={itemVariants}>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-3">
                    KINDRED RECORDINGS
                  </div>

                  <div className="space-y-1.5">
                    {analysis.similar_recommendations?.map((rec, idx) => (
                      <RecommendationItem
                        key={`${rec.title}-${rec.artist}-${idx}`}
                        title={rec.title}
                        artist={rec.artist}
                        reason={rec.reason}
                        onSelect={() => onSelectRecommendation(rec)}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* 8. Interactive Scrubbable Audio Waveform Player */}
                <motion.div
                  variants={itemVariants}
                  className="pt-8 border-t border-black/10 flex flex-col gap-4 text-xs font-mono"
                >
                  {securePreviewUrl && !hasAudioError ? (
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-black/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleTogglePlay}
                          className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 hover:bg-black text-white cursor-pointer shadow-sm transition-all"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                              <span>pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
                              <span>preview</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] text-zinc-500 font-mono">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      {/* Interactive Scrubbable Waveform Bar */}
                      <div
                        onClick={handleProgressBarClick}
                        className="relative h-6 flex items-center gap-[3px] cursor-pointer group"
                        title="Click to scrub preview"
                      >
                        {Array.from({ length: 32 }).map((_, barIdx) => {
                          const barPercent = (barIdx / 32) * 100;
                          const isFilled = barPercent <= progressPercent;
                          // Aesthetic varied waveform bar heights
                          const heightMap = [
                            40, 60, 85, 45, 95, 70, 50, 80, 100, 65, 45, 90, 75, 55, 80, 95,
                            60, 75, 50, 85, 90, 65, 40, 80, 95, 55, 70, 85, 60, 45, 70, 50,
                          ];
                          const heightPercent = heightMap[barIdx % heightMap.length];

                          return (
                            <div
                              key={barIdx}
                              style={{ height: `${heightPercent}%` }}
                              className={`flex-1 rounded-full transition-colors duration-150 ${
                                isFilled
                                  ? 'bg-zinc-900 group-hover:bg-black'
                                  : 'bg-zinc-200 group-hover:bg-zinc-300'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      audio preview unavailable
                    </span>
                  )}

                  {/* Inline External Streaming Links */}
                  <div className="flex items-center gap-6 pt-2">
                    <a
                      href={spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-black transition-colors underline-offset-4 hover:underline"
                    >
                      listen on spotify →
                    </a>

                    {item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-black transition-colors underline-offset-4 hover:underline"
                      >
                        listen on apple music →
                      </a>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
