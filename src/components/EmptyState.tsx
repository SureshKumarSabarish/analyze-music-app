import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicItem, SearchType } from '../types/music';
import { MusicCard } from './MusicCard';
import { fetchCuratedIndex } from '../services/musicApi';

interface EmptyStateProps {
  hasSearched: boolean;
  query: string;
  type: SearchType;
  onSelectSample: (item: MusicItem) => void;
  playingPreviewId?: string | number | null;
  onTogglePreview?: (item: MusicItem, e: React.MouseEvent) => void;
}

// 8 Acclaimed and Atmospheric Albums for Instant 0ms Load
const INITIAL_CURATED_ALBUMS: MusicItem[] = [
  {
    id: 641551230,
    type: 'album',
    title: 'Ceres & Calypso in the Deep Time',
    artist: 'Candy Claws',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/27/ef/ce27eff1-0302-3c13-e4d6-fcfddbe23eb3/888174092102.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/27/ef/ce27eff1-0302-3c13-e4d6-fcfddbe23eb3/888174092102.jpg/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '2013',
    trackCount: 12,
  },
  {
    id: 887372274,
    type: 'album',
    title: 'Deathconsciousness',
    artist: 'Have a Nice Life',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d5/4b/c9/d54bc95d-dbff-49db-8d19-eeaa0f188265/798576974246.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d5/4b/c9/d54bc95d-dbff-49db-8d19-eeaa0f188265/798576974246.jpg/100x100bb.jpg',
    genre: 'Post-Punk',
    releaseYear: '2008',
    trackCount: 13,
  },
  {
    id: 1558555350,
    type: 'album',
    title: 'Loveless',
    artist: 'My Bloody Valentine',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/55/93/2c/55932c5e-8557-0a25-e51c-fca1218ff649/887830015967.rgb.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/55/93/2c/55932c5e-8557-0a25-e51c-fca1218ff649/887830015967.rgb.jpg/100x100bb.jpg',
    genre: 'Shoegaze',
    releaseYear: '1991',
    trackCount: 11,
  },
  {
    id: 292885238,
    type: 'album',
    title: 'Souvlaki',
    artist: 'Slowdive',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/100x100bb.jpg',
    genre: 'Shoegaze',
    releaseYear: '1993',
    trackCount: 10,
  },
  {
    id: 1440843808,
    type: 'album',
    title: 'Heaven or Las Vegas',
    artist: 'Cocteau Twins',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a4/be/81/a4be81dc-273b-55ea-30bc-2db5a31940e4/652637270253.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a4/be/81/a4be81dc-273b-55ea-30bc-2db5a31940e4/652637270253.png/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '1990',
    trackCount: 10,
  },
  {
    id: 1003737526,
    type: 'album',
    title: 'Depression Cherry',
    artist: 'Beach House',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6d/92/7d/6d927d6d-d1ef-feef-dbd0-b30f82c44933/098787110065.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6d/92/7d/6d927d6d-d1ef-feef-dbd0-b30f82c44933/098787110065.jpg/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '2015',
    trackCount: 9,
  },
  {
    id: 1146195596,
    type: 'album',
    title: 'Blonde',
    artist: 'Frank Ocean',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b8/93/ea/b893ea96-eb54-8c81-80a5-f86a24301546/888915277810.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b8/93/ea/b893ea96-eb54-8c81-80a5-f86a24301546/888915277810.jpg/100x100bb.jpg',
    genre: 'R&B/Soul',
    releaseYear: '2016',
    trackCount: 17,
  },
  {
    id: 1097861387,
    type: 'album',
    title: 'In Rainbows',
    artist: 'Radiohead',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/100x100bb.jpg',
    genre: 'Alternative',
    releaseYear: '2007',
    trackCount: 10,
  },
];

// 8 Distinct Acclaimed Tracks for Instant 0ms Load
const INITIAL_CURATED_SONGS: MusicItem[] = [
  {
    id: 641551235,
    type: 'song',
    title: 'Into the Heart of a Seed',
    artist: 'Candy Claws',
    album: 'Ceres & Calypso in the Deep Time',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/27/ef/ce27eff1-0302-3c13-e4d6-fcfddbe23eb3/888174092102.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/27/ef/ce27eff1-0302-3c13-e4d6-fcfddbe23eb3/888174092102.jpg/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '2013',
    durationMs: 198000,
  },
  {
    id: 887372275,
    type: 'song',
    title: 'Bloodhail',
    artist: 'Have a Nice Life',
    album: 'Deathconsciousness',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d5/4b/c9/d54bc95d-dbff-49db-8d19-eeaa0f188265/798576974246.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d5/4b/c9/d54bc95d-dbff-49db-8d19-eeaa0f188265/798576974246.jpg/100x100bb.jpg',
    genre: 'Post-Punk',
    releaseYear: '2008',
    durationMs: 342000,
  },
  {
    id: 1558555355,
    type: 'song',
    title: 'When You Sleep',
    artist: 'My Bloody Valentine',
    album: 'Loveless',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/55/93/2c/55932c5e-8557-0a25-e51c-fca1218ff649/887830015967.rgb.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/55/93/2c/55932c5e-8557-0a25-e51c-fca1218ff649/887830015967.rgb.jpg/100x100bb.jpg',
    genre: 'Shoegaze',
    releaseYear: '1991',
    durationMs: 251000,
  },
  {
    id: 292885240,
    type: 'song',
    title: 'Alison',
    artist: 'Slowdive',
    album: 'Souvlaki',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/100x100bb.jpg',
    genre: 'Shoegaze',
    releaseYear: '1993',
    durationMs: 232000,
  },
  {
    id: 1003737530,
    type: 'song',
    title: 'Space Song',
    artist: 'Beach House',
    album: 'Depression Cherry',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6d/92/7d/6d927d6d-d1ef-feef-dbd0-b30f82c44933/098787110065.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6d/92/7d/6d927d6d-d1ef-feef-dbd0-b30f82c44933/098787110065.jpg/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '2015',
    durationMs: 320000,
  },
  {
    id: 1440843812,
    type: 'song',
    title: 'Cherry-coloured Funk',
    artist: 'Cocteau Twins',
    album: 'Heaven or Las Vegas',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a4/be/81/a4be81dc-273b-55ea-30bc-2db5a31940e4/652637270253.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a4/be/81/a4be81dc-273b-55ea-30bc-2db5a31940e4/652637270253.png/100x100bb.jpg',
    genre: 'Dream Pop',
    releaseYear: '1990',
    durationMs: 192000,
  },
  {
    id: 1146195598,
    type: 'song',
    title: 'Nights',
    artist: 'Frank Ocean',
    album: 'Blonde',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b8/93/ea/b893ea96-eb54-8c81-80a5-f86a24301546/888915277810.jpg/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b8/93/ea/b893ea96-eb54-8c81-80a5-f86a24301546/888915277810.jpg/100x100bb.jpg',
    genre: 'R&B/Soul',
    releaseYear: '2016',
    durationMs: 307000,
  },
  {
    id: 1097861391,
    type: 'song',
    title: 'Nude',
    artist: 'Radiohead',
    album: 'In Rainbows',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/1000x1000bb.jpg',
    artworkUrlSmall: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/3c/6e/8e3c6ea6-213d-551a-7b3b-313d528b184f/634904032488.png/100x100bb.jpg',
    genre: 'Alternative',
    releaseYear: '2007',
    durationMs: 255000,
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasSearched,
  query,
  type,
  onSelectSample,
  playingPreviewId,
  onTogglePreview,
}) => {
  const [curatedAlbums, setCuratedAlbums] = useState<MusicItem[]>(INITIAL_CURATED_ALBUMS);
  const [curatedSongs, setCuratedSongs] = useState<MusicItem[]>(INITIAL_CURATED_SONGS);
  const [isLoadingCurated, setIsLoadingCurated] = useState<boolean>(false);

  // Fetch dynamic randomized dual lists (albums & songs) from server on load
  const loadRandomizedCurated = async () => {
    setIsLoadingCurated(true);
    try {
      const data = await fetchCuratedIndex(8);
      if (data.albums && data.albums.length > 0) {
        setCuratedAlbums(data.albums);
      }
      if (data.songs && data.songs.length > 0) {
        setCuratedSongs(data.songs);
      }
    } catch (err) {
      console.warn('Could not load dynamic curated index:', err);
    } finally {
      setIsLoadingCurated(false);
    }
  };

  useEffect(() => {
    loadRandomizedCurated();
  }, []);

  if (hasSearched) {
    return (
      <div className="w-full max-w-xl mx-auto py-24 text-center font-mono text-xs text-zinc-500">
        <p>no entries located matching &ldquo;{query}&rdquo; in {type}s.</p>
        <p className="mt-2 text-zinc-600">refine artist or recording spelling above.</p>
      </div>
    );
  }

  // Active list based on interactive song/album toggle
  const activeCuratedList = type === 'album' ? curatedAlbums : curatedSongs;

  return (
    <div className="w-full select-none pt-4">
      {/* Alabaster Editorial Typography Header */}
      <div className="flex items-baseline justify-between mb-8 border-b border-black/5 pb-3 text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
        <span className="flex items-center gap-2">
          <span className="text-zinc-800 font-semibold">curated index</span>
          <span className="text-zinc-400 font-normal">
            [{activeCuratedList.length} {type === 'album' ? 'albums' : 'tracks'}]
          </span>
        </span>

        <div className="flex items-center gap-4 lowercase">
          <span>select to analyze</span>
          <button
            onClick={loadRandomizedCurated}
            disabled={isLoadingCurated}
            className="text-zinc-600 hover:text-black transition-colors cursor-pointer disabled:opacity-40"
            title="Randomize curated catalog"
          >
            {isLoadingCurated ? 'shuffling...' : 'shuffle ↻'}
          </button>
        </div>
      </div>

      {/* Smooth AnimatePresence sliding glass transition between Album & Song indices */}
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 sm:gap-y-16"
        >
          {activeCuratedList.map((item, idx) => (
            <MusicCard
              key={`${type}-${item.id}-${idx}`}
              item={item}
              onSelect={onSelectSample}
              isPlayingPreview={playingPreviewId === item.id}
              onTogglePreview={onTogglePreview}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

