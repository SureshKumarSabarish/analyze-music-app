import { MusicItem, AnalysisResult, SearchType } from '../types/music';

export async function searchMusic(
  query: string,
  type: SearchType,
  genre?: string
): Promise<MusicItem[]> {
  if (!query.trim()) return [];

  const cleanGenre = genre && genre.trim().toLowerCase() !== 'all' ? genre.trim() : '';
  const genreParam = cleanGenre ? `&genre=${encodeURIComponent(cleanGenre)}` : '';

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}${genreParam}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Backend search API failed or unavailable, falling back to direct iTunes API:', err);
    // Direct client fallback to iTunes public API if proxy is unreachable
    const entity = type === 'album' ? 'album' : 'song';
    const termWithGenre = cleanGenre ? `${query.trim()} ${cleanGenre}` : query.trim();
    const fallbackRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(termWithGenre)}&entity=${entity}&limit=24`
    );
    if (!fallbackRes.ok) throw new Error('Failed to fetch from iTunes');
    const itunesData = await fallbackRes.json();
    let raw = itunesData.results || [];

    if (raw.length === 0 && cleanGenre) {
      const retryRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=${entity}&limit=24`
      );
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        raw = retryData.results || [];
      }
    }

    const results = raw.map((item: any): MusicItem => {
      const artwork = (item.artworkUrl100 || '')
        .replace(/\/\d+x\d+bb\.(jpg|png)/i, '/1000x1000bb.$1')
        .replace('100x100bb.jpg', '1000x1000bb.jpg')
        .replace('100x100bb.png', '1000x1000bb.png')
        .replace('600x600bb.jpg', '1000x1000bb.jpg');
      const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : undefined;

      if (type === 'album') {
        const title = item.collectionName || 'Unknown Album';
        const artist = item.artistName || 'Unknown Artist';
        return {
          id: item.collectionId || Math.random(),
          type: 'album',
          title,
          artist,
          album: item.collectionName,
          artworkUrl: artwork,
          artworkUrlSmall: item.artworkUrl100,
          genre: item.primaryGenreName,
          releaseYear,
          trackCount: item.trackCount,
          externalUrl: item.collectionViewUrl,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`.trim())}`,
        };
      }
      const title = item.trackName || 'Unknown Track';
      const artist = item.artistName || 'Unknown Artist';
      return {
        id: item.trackId || Math.random(),
        type: 'song',
        title,
        artist,
        album: item.collectionName,
        artworkUrl: artwork,
        artworkUrlSmall: item.artworkUrl100,
        previewUrl:
          item.previewUrl && typeof item.previewUrl === 'string' && item.previewUrl.trim()
            ? item.previewUrl.replace(/^http:\/\//i, 'https://').trim()
            : undefined,
        genre: item.primaryGenreName,
        releaseYear,
        durationMs: item.trackTimeMillis,
        externalUrl: item.trackViewUrl,
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`.trim())}`,
      };
    });

    if (cleanGenre) {
      const gLower = cleanGenre.toLowerCase();
      results.sort((a: MusicItem, b: MusicItem) => {
        const aGenre = (a.genre || '').toLowerCase();
        const bGenre = (b.genre || '').toLowerCase();
        const aMatch = aGenre.includes(gLower) || gLower.includes(aGenre) ? 1 : 0;
        const bMatch = bGenre.includes(gLower) || gLower.includes(bGenre) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return results;
  }
}

export async function analyzeMusic(item: MusicItem): Promise<AnalysisResult> {
  const payload = {
    name: item.title,
    artist: item.artist,
    type: item.type,
    genre: item.genre,
    releaseYear: item.releaseYear,
  };

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Analysis failed (${res.status}): ${errorText || 'Internal Server Error'}`);
  }

  const data = await res.json();
  return data;
}

export interface CuratedData {
  albums: MusicItem[];
  songs: MusicItem[];
}

export async function fetchCuratedIndex(count: number = 8): Promise<CuratedData> {
  try {
    const res = await fetch(`/api/curated-index?count=${count}`);
    if (!res.ok) throw new Error('Failed to fetch curated index');
    const data = await res.json();
    return {
      albums: Array.isArray(data.albums) ? data.albums : [],
      songs: Array.isArray(data.songs) ? data.songs : [],
    };
  } catch (err) {
    console.warn('Curated index fetch notice:', err);
    return { albums: [], songs: [] };
  }
}

