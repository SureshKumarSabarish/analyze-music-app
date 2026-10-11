import React, { useState } from 'react';
import { Disc, Music } from 'lucide-react';

interface AlbumArtProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  isAlbum?: boolean;
  priority?: boolean;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  src,
  fallbackSrc,
  alt,
  className = 'w-full h-full object-cover rounded-[2px]',
  isAlbum = false,
  priority = false,
}) => {
  // Priority stages:
  // 0: High-res direct (1000x1000 uncompressed)
  // 1: High-res server proxy
  // 2: Small thumbnail direct / proxy
  // 3: Graphical placeholder
  const [stage, setStage] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);

  if (!src && !fallbackSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-2 select-none rounded-[2px]">
        {isAlbum ? (
          <Disc className="w-6 h-6 opacity-40 mb-1" strokeWidth={1.25} />
        ) : (
          <Music className="w-6 h-6 opacity-40 mb-1" strokeWidth={1.25} />
        )}
        <span className="text-[10px] font-mono text-zinc-500 truncate max-w-full text-center px-1">
          {alt}
        </span>
      </div>
    );
  }

  const getSource = (): string => {
    const highRes = src || fallbackSrc || '';
    if (stage === 0) {
      return highRes;
    }
    if (stage === 1) {
      // Try high-res through server proxy
      return highRes ? `/api/artwork-proxy?url=${encodeURIComponent(highRes)}` : '';
    }
    if (stage === 2) {
      // Fallback thumbnail if high-res failed
      const small = fallbackSrc || highRes;
      return small ? `/api/artwork-proxy?url=${encodeURIComponent(small)}` : '';
    }
    return '';
  };

  const handleError = () => {
    if (stage < 3) {
      setStage((prev) => prev + 1);
    }
  };

  if (stage >= 3) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-2 select-none rounded-[2px]">
        {isAlbum ? (
          <Disc className="w-6 h-6 opacity-40 mb-1" strokeWidth={1.25} />
        ) : (
          <Music className="w-6 h-6 opacity-40 mb-1" strokeWidth={1.25} />
        )}
        <span className="text-[10px] font-mono text-zinc-500 truncate max-w-full text-center px-1">
          {alt}
        </span>
      </div>
    );
  }

  const currentSrc = getSource();

  return (
    <div className="relative w-full h-full aspect-square overflow-hidden bg-zinc-100 rounded-[2px]">
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-200/80 animate-pulse" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} ${
          loaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-200 aspect-square object-cover`}
      />
    </div>
  );
};
