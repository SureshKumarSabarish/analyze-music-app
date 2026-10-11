import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Disc } from 'lucide-react';

export interface RecommendationItemProps {
  title: string;
  artist: string;
  reason: string;
  onSelect?: () => void;
}

// Module-level in-memory cache to prevent redundant fetches
const artworkCache = new Map<string, string>();

export const RecommendationItem: React.FC<RecommendationItemProps> = ({
  title,
  artist,
  reason,
  onSelect,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Trigger only when both title and artist are fully defined
    // (prevents fetching partial streamed words during AI generation)
    const cleanTitle = title?.trim();
    const cleanArtist = artist?.trim();

    if (!cleanTitle || !cleanArtist) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `${cleanTitle.toLowerCase()}:::${cleanArtist.toLowerCase()}`;

    if (artworkCache.has(cacheKey)) {
      setImageUrl(artworkCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchArtwork = async () => {
      setIsLoading(true);
      setHasError(false);

      const queryTerm = `${cleanTitle} ${cleanArtist}`;

      try {
        // First try local proxy /api/search with album type and limit=1
        let candidateArt: string | null = null;

        try {
          const res = await fetch(
            `/api/search?query=${encodeURIComponent(queryTerm)}&type=album&limit=1`,
            { signal: controller.signal }
          );

          if (res.ok) {
            const data = await res.json();
            const first = data?.results?.[0];
            if (first && (first.artworkUrl || first.artworkUrl100)) {
              candidateArt = first.artworkUrl || first.artworkUrl100;
            }
          }
        } catch {
          // Ignore and proceed to song search or direct iTunes
        }

        // If no album artwork found, try song type
        if (!candidateArt) {
          try {
            const resSong = await fetch(
              `/api/search?query=${encodeURIComponent(queryTerm)}&type=song&limit=1`,
              { signal: controller.signal }
            );

            if (resSong.ok) {
              const dataSong = await resSong.json();
              const firstSong = dataSong?.results?.[0];
              if (firstSong && (firstSong.artworkUrl || firstSong.artworkUrl100)) {
                candidateArt = firstSong.artworkUrl || firstSong.artworkUrl100;
              }
            }
          } catch {
            // Ignore
          }
        }

        // If proxy failed, direct fallback to iTunes API
        if (!candidateArt) {
          const itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=album&limit=1`,
            { signal: controller.signal }
          );

          if (itunesRes.ok) {
            const itunesData = await itunesRes.json();
            const first = itunesData?.results?.[0];
            if (first?.artworkUrl100) {
              candidateArt = first.artworkUrl100;
            }
          }
        }

        if (candidateArt && isMounted) {
          // Apply high-res 1000x1000bb.jpg replacement
          const highResUrl = candidateArt
            .replace(/\/\d+x\d+bb\.(jpg|png)/i, '/1000x1000bb.$1')
            .replace('100x100bb.jpg', '1000x1000bb.jpg')
            .replace('100x100bb.png', '1000x1000bb.png')
            .replace('600x600bb.jpg', '1000x1000bb.jpg');

          artworkCache.set(cacheKey, highResUrl);
          setImageUrl(highResUrl);
        } else if (isMounted) {
          setHasError(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchArtwork();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [title, artist]);

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-start gap-4 p-3.5 -mx-3.5 rounded-2xl transition-all duration-200 cursor-pointer hover:bg-black/[0.04] active:bg-black/[0.06]"
    >
      {/* Album Artwork Square with Framer Motion Spring Scale */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border border-black/5 bg-zinc-100 shadow-sm"
      >
        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center">
            <Disc className="w-5 h-5 text-zinc-300 animate-spin" strokeWidth={1.5} />
          </div>
        )}

        {/* Rendered Artwork */}
        {imageUrl && !hasError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-zinc-100 animate-pulse rounded-lg" />
            )}
            <img
              src={imageUrl}
              alt={`${title} by ${artist}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setHasError(true);
                setImageLoaded(false);
              }}
              className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : !isLoading ? (
          /* Subtle fallback icon when artwork is unavailable */
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <Disc className="w-5 h-5 opacity-40" strokeWidth={1.5} />
          </div>
        ) : null}
      </motion.div>

      {/* Editorial Typography & Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-serif text-sm sm:text-base text-zinc-900 group-hover:text-black transition-colors font-medium truncate">
            <span className="italic mr-1.5">{title}</span>
            <span className="text-xs font-sans not-italic text-zinc-500 font-normal">
              by {artist}
            </span>
          </div>

          <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0">
            analyze →
          </span>
        </div>

        {reason && (
          <p className="text-xs text-zinc-500 leading-relaxed mt-1 font-light line-clamp-2 sm:line-clamp-none">
            {reason}
          </p>
        )}
      </div>
    </div>
  );
};
