import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MusicItem } from '../types/music';
import { Play, Pause } from 'lucide-react';
import { AlbumArt } from './AlbumArt';

interface MusicCardProps {
  item: MusicItem;
  onSelect: (item: MusicItem) => void;
  isPlayingPreview?: boolean;
  onTogglePreview?: (item: MusicItem, e: React.MouseEvent) => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  item,
  onSelect,
  isPlayingPreview = false,
  onTogglePreview,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const isAlbum = item.type === 'album';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Strict clamping within ±10 degrees
    const tiltX = Math.max(-10, Math.min(10, ((centerY - y) / centerY) * 10));
    const tiltY = Math.max(-10, Math.min(10, ((x - centerX) / centerX) * 10));

    setRotateX(tiltX);
    setRotateY(tiltY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.6 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(item)}
      className="group flex flex-col cursor-pointer select-none perspective-1000"
    >
      {/* 3D Tilt Alabaster Glass Card with Glare Reflection */}
      <motion.div
        animate={{
          rotateX,
          rotateY,
          scale: glarePosition.opacity > 0 ? 1.03 : 1,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative p-2.5 rounded-2xl backdrop-blur-2xl bg-white/70 border border-black/5 border-t-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)] group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)] transition-shadow duration-300"
      >
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
          <AlbumArt
            src={item.artworkUrl}
            fallbackSrc={item.artworkUrlSmall}
            alt={item.title}
            isAlbum={isAlbum}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Interactive Glossy Glare Reflection Overlay */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: glarePosition.opacity,
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 75%)`,
            }}
          />

          {/* Alabaster Glass Play Preview Button Overlay */}
          {item.previewUrl && onTogglePreview && (
            <button
              onClick={(e) => onTogglePreview(item, e)}
              className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-xl bg-white/80 border border-white/90 text-zinc-900 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer ${
                isPlayingPreview
                  ? 'opacity-100 scale-100 bg-zinc-900 text-white'
                  : 'opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
              }`}
              title={isPlayingPreview ? 'Pause' : 'Listen 30s preview'}
            >
              {isPlayingPreview ? (
                <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Typography directly beneath 3D card */}
      <div className="pt-3 px-1 text-left">
        <h4 className="text-sm font-medium tracking-tight text-zinc-900 group-hover:text-black transition-colors truncate">
          {item.title}
        </h4>
        <p className="text-xs text-zinc-500 mt-0.5 truncate font-normal lowercase">
          {item.artist}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
          <span>{item.type}</span>
          {item.genre && (
            <>
              <span>•</span>
              <span className="truncate max-w-[100px]">{item.genre}</span>
            </>
          )}
          {item.releaseYear && (
            <>
              <span>•</span>
              <span>{item.releaseYear}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
