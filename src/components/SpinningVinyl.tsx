import React from 'react';
import { motion } from 'framer-motion';
import { AlbumArt } from './AlbumArt';
import { Play, Pause } from 'lucide-react';

interface SpinningVinylProps {
  artworkUrl?: string;
  artworkUrlSmall?: string;
  title: string;
  artist: string;
  isPlaying: boolean;
  isLoadingAnalysis?: boolean;
  onTogglePlay?: () => void;
  hasAudio?: boolean;
  currentTime?: number;
  duration?: number;
}

export const SpinningVinyl: React.FC<SpinningVinylProps> = ({
  artworkUrl,
  artworkUrlSmall,
  title,
  artist,
  isPlaying,
  isLoadingAnalysis = false,
  onTogglePlay,
  hasAudio = true,
  currentTime = 0,
  duration = 30,
}) => {
  const shouldSpin = isPlaying || isLoadingAnalysis;

  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60);
    return `0:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center select-none py-2">
      {/* Interactive Clickable Alabaster Liquid Vinyl Container */}
      <div
        role={hasAudio ? 'button' : undefined}
        tabIndex={hasAudio ? 0 : undefined}
        onClick={hasAudio && onTogglePlay ? onTogglePlay : undefined}
        onKeyDown={(e) => {
          if (hasAudio && onTogglePlay && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onTogglePlay();
          }
        }}
        title={
          hasAudio
            ? isPlaying
              ? 'Click vinyl to pause preview'
              : 'Click vinyl to play 30s preview'
            : 'Audio preview unavailable for this recording'
        }
        className={`relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center group ${
          hasAudio ? 'cursor-pointer' : 'cursor-default'
        } focus:outline-none`}
      >
        {/* Continuous Delicate Rotating & Morphing Liquid Wireframe */}
        <motion.div
          animate={shouldSpin ? { rotate: 360 } : undefined}
          transition={
            shouldSpin
              ? {
                  repeat: Infinity,
                  ease: 'linear',
                  duration: 24,
                }
              : undefined
          }
          className={`relative w-full h-full flex items-center justify-center ${
            shouldSpin ? '' : 'spin-paused'
          }`}
        >
          {/* Native SVG with feDisplacementMap Liquid Ripple Filter (Light Palette) */}
          <svg
            viewBox="0 0 200 200"
            className={`absolute inset-0 w-full h-full pointer-events-none transition-colors duration-500 ${
              isPlaying
                ? 'text-zinc-900 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                : 'text-zinc-500/70 group-hover:text-zinc-800'
            }`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Dynamic Water Ripple Displacement Filter */}
              <filter id="liquid-ripple-filter-light" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.018"
                  numOctaves="2"
                  result="turbulence"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="10s"
                    values="0.015;0.024;0.015"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="turbulence"
                  scale={shouldSpin ? 5 : 2.5}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            {/* Ripple Surface Geometry */}
            <g filter="url(#liquid-ripple-filter-light)">
              {/* Concentric Undulating Liquid Circles */}
              <circle
                cx="100"
                cy="100"
                r="96"
                stroke="currentColor"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="100"
                cy="100"
                r="84"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="100"
                cy="100"
                r="72"
                stroke="currentColor"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="100"
                cy="100"
                r="60"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="100"
                cy="100"
                r="48"
                stroke="currentColor"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="100"
                cy="100"
                r="36"
                stroke="currentColor"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Water Spirograph Rosette Petals */}
              {[0, 30, 60, 90, 120, 150].map((deg) => (
                <ellipse
                  key={deg}
                  cx="100"
                  cy="100"
                  rx="92"
                  ry="34"
                  stroke="currentColor"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                  transform={`rotate(${deg} 100 100)`}
                  opacity={isPlaying ? 0.75 : 0.4}
                />
              ))}

              {/* Ripple Radial Rays */}
              <line
                x1="100"
                y1="4"
                x2="100"
                y2="196"
                stroke="currentColor"
                strokeWidth="0.35"
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
                opacity="0.35"
              />
              <line
                x1="4"
                y1="100"
                x2="196"
                y2="100"
                stroke="currentColor"
                strokeWidth="0.35"
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
                opacity="0.35"
              />
            </g>
          </svg>

          {/* Alabaster Glass Center Puddle embedding the Artwork */}
          <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-1 backdrop-blur-2xl bg-white/80 border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] flex items-center justify-center z-10">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
              <AlbumArt
                src={artworkUrl}
                fallbackSrc={artworkUrlSmall}
                alt={title}
                priority={true}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? 'scale-105' : 'group-hover:scale-105'
                }`}
              />

              {/* Center Spindle Hole */}
              <div
                className={`absolute w-3 h-3 rounded-full bg-white border border-zinc-400 z-10 transition-opacity ${
                  isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'
                }`}
              />

              {/* Center Play / Pause Alabaster Bead */}
              {hasAudio && (
                <div
                  className={`absolute inset-0 flex items-center justify-center text-zinc-900 transition-all z-20 ${
                    isPlaying
                      ? 'opacity-85 group-hover:opacity-100'
                      : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/90 border border-white/95 flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.15)] transform group-hover:scale-110 active:scale-95 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-zinc-900" strokeWidth={1.5} />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5 text-zinc-900" strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tactile Alabaster Badge directly below vinyl */}
      {hasAudio ? (
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onTogglePlay}
          className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl bg-white/80 border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] text-xs font-mono tracking-tight text-zinc-800 hover:text-black transition-all cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current text-zinc-900" strokeWidth={1.5} />
              <span>
                playing preview [{formatTime(currentTime)} / {formatTime(duration)}] • click to pause
              </span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-zinc-500 group-hover:text-black" strokeWidth={1.5} />
              <span className="text-zinc-600 hover:text-black">
                click vinyl to play 30s preview
              </span>
            </>
          )}
        </motion.button>
      ) : (
        <div className="mt-4 text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
          {isLoadingAnalysis ? 'decoding spectrum...' : 'audio preview unavailable'}
        </div>
      )}
    </div>
  );
};
