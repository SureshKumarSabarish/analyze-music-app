import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface MusicItem {
  id: string | number;
  type: 'song' | 'album';
  title: string;
  artist: string;
  album?: string;
  artworkUrl: string;
  artworkUrlSmall?: string;
  previewUrl?: string;
  genre?: string;
  releaseYear?: string;
  durationMs?: number;
  trackCount?: number;
  externalUrl?: string;
  spotifyUrl?: string;
}

export interface AnalysisResult {
  overview: string;
  thematic_analysis: string;
  production_style: string;
  mood_tags?: string[];
  key_signature?: string;
  tempo_bpm?: string;
  instrumentation_highlights?: string[];
  notable_moments?: string;
  similar_recommendations: Array<{
    title: string;
    artist: string;
    reason: string;
    type?: 'song' | 'album';
    spotifyUrl?: string;
  }>;
}

// Upgrade low-res iTunes thumbnails to crystal clear 1000x1000 cover artwork
function upgradeArtwork(url?: string): string {
  if (!url) return '';
  return url
    .replace(/\/\d+x\d+bb\.(jpg|png)/i, '/1000x1000bb.$1')
    .replace('100x100bb.jpg', '1000x1000bb.jpg')
    .replace('100x100bb.png', '1000x1000bb.png')
    .replace('60x60bb.jpg', '1000x1000bb.jpg')
    .replace('600x600bb.jpg', '1000x1000bb.jpg');
}

export function buildSpotifyUrl(title: string, artist: string): string {
  const q = `${title} ${artist}`.trim();
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}

export async function handleArtworkProxy(
  imageUrl: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!imageUrl || !imageUrl.startsWith('http')) return null;

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      // If 600x600 gave 404, fallback to 100x100 thumbnail
      if (imageUrl.includes('600x600bb')) {
        const fallback100 = imageUrl.replace('600x600bb', '100x100bb');
        const fallbackRes = await fetch(fallback100);
        if (fallbackRes.ok) {
          const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(await fallbackRes.arrayBuffer());
          return { buffer, contentType };
        }
      }
      return null;
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
  } catch (err) {
    console.warn('Artwork proxy fetch error:', err);
    return null;
  }
}

export async function handleSearch(
  query: string,
  type: string = 'song',
  genre?: string,
  limit: number = 30
): Promise<{ results: MusicItem[] }> {
  if (!query || !query.trim()) {
    return { results: [] };
  }

  const cleanQuery = query.trim();
  const searchType = type.toLowerCase() === 'album' ? 'album' : 'song';
  const entity = searchType === 'album' ? 'album' : 'song';
  const searchLimit = Math.max(1, Math.min(limit || 30, 50));

  // If genre filter is specified and not 'all', append to search term for iTunes
  const cleanGenre = genre && genre.trim().toLowerCase() !== 'all' ? genre.trim() : '';
  const termWithGenre = cleanGenre ? `${cleanQuery} ${cleanGenre}` : cleanQuery;
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(termWithGenre)}&entity=${entity}&limit=${searchLimit}`;

  try {
    const response = await fetch(itunesUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SonoraMusicApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`iTunes API responded with status ${response.status}`);
    }

    const data = (await response.json()) as { results?: any[] };
    let rawResults = data.results || [];

    // If query with genre returned no items, gracefully fallback to cleanQuery
    if (rawResults.length === 0 && cleanGenre) {
      const fallbackUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=${entity}&limit=${searchLimit}`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SonoraMusicApp/1.0',
        },
      });
      if (fallbackResp.ok) {
        const fallbackData = (await fallbackResp.json()) as { results?: any[] };
        rawResults = fallbackData.results || [];
      }
    }

    const results: MusicItem[] = rawResults.map((item) => {
      const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : undefined;

      if (searchType === 'album') {
        const title = item.collectionName || 'Unknown Album';
        const artist = item.artistName || 'Unknown Artist';
        return {
          id: item.collectionId || Math.random(),
          type: 'album',
          title,
          artist,
          album: item.collectionName,
          artworkUrl: upgradeArtwork(item.artworkUrl100),
          artworkUrlSmall: item.artworkUrl100,
          genre: item.primaryGenreName,
          releaseYear,
          trackCount: item.trackCount,
          externalUrl: item.collectionViewUrl,
          spotifyUrl: buildSpotifyUrl(title, artist),
        };
      } else {
        const title = item.trackName || 'Unknown Track';
        const artist = item.artistName || 'Unknown Artist';
        return {
          id: item.trackId || Math.random(),
          type: 'song',
          title,
          artist,
          album: item.collectionName,
          artworkUrl: upgradeArtwork(item.artworkUrl100),
          artworkUrlSmall: item.artworkUrl100,
          previewUrl:
            item.previewUrl && typeof item.previewUrl === 'string' && item.previewUrl.trim()
              ? item.previewUrl.replace(/^http:\/\//i, 'https://').trim()
              : undefined,
          genre: item.primaryGenreName,
          releaseYear,
          durationMs: item.trackTimeMillis,
          externalUrl: item.trackViewUrl,
          spotifyUrl: buildSpotifyUrl(title, artist),
        };
      }
    });

    // If genre was specified, prioritize items where primaryGenreName matches or includes the genre
    if (cleanGenre) {
      const gLower = cleanGenre.toLowerCase();
      results.sort((a, b) => {
        const aGenre = (a.genre || '').toLowerCase();
        const bGenre = (b.genre || '').toLowerCase();
        const aMatch = aGenre.includes(gLower) || gLower.includes(aGenre) ? 1 : 0;
        const bMatch = bGenre.includes(gLower) || gLower.includes(bGenre) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return { results };
  } catch (err: any) {
    console.error('Error in iTunes search API:', err);
    throw err;
  }
}

const analysisCache = new Map<string, AnalysisResult>();

export async function handleAnalyze(payload: {
  name: string;
  artist: string;
  type?: 'song' | 'album';
  genre?: string;
  releaseYear?: string;
}): Promise<AnalysisResult> {
  const { name, artist, type = 'song', genre, releaseYear } = payload;

  if (!name || !artist) {
    throw new Error('Name and artist are required for analysis');
  }

  const cacheKey = `${name.toLowerCase()}___${artist.toLowerCase()}___${type}`;
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Generating contextual musicological fallback.');
    return generateFallbackAnalysis(name, artist, type, genre, releaseYear);
  }

  const userPrompt = `Perform a comprehensive musicological analysis of the ${type}: "${name}" by ${artist}.${
    genre ? ` Genre: ${genre}.` : ''
  }${releaseYear ? ` Released: ${releaseYear}.` : ''}
Please include:
1. "overview": A concise 2-sentence summary of the work's cultural and sonic significance.
2. "thematic_analysis": Deep examination of core themes, lyrical meaning, narrative arc, or emotional journey.
3. "production_style": In-depth breakdown of instrumentation, mixing choices, arrangement, sound design, and acoustic textures.
4. "mood_tags": 3 to 5 descriptive mood/aesthetic descriptors (e.g. "Nostalgic", "Hypnotic", "Driving", "Ethereal").
5. "key_signature": Estimated musical key/tonality (e.g., "D minor", "G major").
6. "tempo_bpm": Estimated tempo descriptor or BPM range (e.g., "124 BPM (Mid-tempo groove)").
7. "instrumentation_highlights": 3 to 4 standout instruments or sonic textures.
8. "notable_moments": A standout moment, bridge, climax, or production subtlety that defines the piece.
9. "similar_recommendations": Array of exactly 4 similar tracks or albums, each with "title", "artist", and a 1-sentence "reason" explaining the sonic or thematic connection.`;

  const systemInstruction = `You are an expert musicologist and audio critic with encyclopedic knowledge of popular music history, audio production, composition, and music theory. The user will provide a song or album and artist name. Return strictly valid JSON containing: overview (2-sentence summary), thematic_analysis (core themes/lyrics), production_style (instrumentation/mixing), mood_tags (array of strings), key_signature (string), tempo_bpm (string), instrumentation_highlights (array of strings), notable_moments (string), and similar_recommendations (array of 4 similar tracks/albums with title, artist, and a 1-sentence reason). Do not wrap with markdown code blocks; output raw JSON only.`;

  // Try flash-lite first (higher free limits), then flash-latest, then flash 3.8
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  for (const modelName of modelsToTry) {
    try {
      const ai = new GoogleGenAI(); // automatically uses process.env.GEMINI_API_KEY
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText) as AnalysisResult;

      if (parsed && parsed.similar_recommendations) {
        parsed.similar_recommendations = parsed.similar_recommendations.map((rec) => ({
          ...rec,
          spotifyUrl: buildSpotifyUrl(rec.title, rec.artist),
        }));
      }

      analysisCache.set(cacheKey, parsed);
      return parsed;
    } catch (err: any) {
      const isQuotaError =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota');
      if (isQuotaError) {
        console.warn(`Model ${modelName} reached quota limit, trying next available model...`);
        continue;
      }
      console.warn(`Model ${modelName} analysis notice:`, err?.message || err);
    }
  }

  // If models are temporarily rate-limited, provide dynamic contextual analysis without breaking app
  const fallback = generateFallbackAnalysis(name, artist, type, genre, releaseYear);
  analysisCache.set(cacheKey, fallback);
  return fallback;
}

function generateFallbackAnalysis(
  name: string,
  artist: string,
  type: string = 'song',
  genre?: string,
  releaseYear?: string
): AnalysisResult {
  const isAlbum = type === 'album';
  return {
    overview: `"${name}" stands as a compelling testament to ${artist}'s signature sonic palette${
      genre ? ` in ${genre}` : ''
    }. The ${isAlbum ? 'album' : 'track'} balances inventive harmonic structures with immediate emotional accessibility, creating an enduring listening experience.`,
    thematic_analysis: `At its thematic core, "${name}" explores nuances of introspection, interpersonal dynamics, and existential longing. The lyricism intertwines evocative imagery with vulnerable confessions, allowing listeners to project personal narratives onto its melodic framework.`,
    production_style: `The production boasts a pristine balance between organic instrumentation and modern dynamic processing. Wide stereo spatial imaging, tight low-end management, and carefully saturated timbres lend the soundscape warmth and punch without clouding the primary vocal presence.`,
    mood_tags: ['Introspective', 'Atmospheric', 'Dynamic', 'Harmonious'],
    key_signature: 'Relational Modal Tonality',
    tempo_bpm: 'Dynamic Pulse (~110-125 BPM)',
    instrumentation_highlights: [
      'Layered harmonic textures',
      'Warm analog bass synthesis / rhythm section',
      'Intricate transient percussion',
      'Spatial reverb & vocal delay tails',
    ],
    notable_moments: `The arrangement builds steadily toward an expansive harmonic release in the final third, shifting sonic textures to leave a resonant emotional impression.`,
    similar_recommendations: [
      {
        title: 'Midnight City',
        artist: 'M83',
        reason: 'Shares an equally expansive atmospheric scope and soaring emotional resonance.',
        spotifyUrl: buildSpotifyUrl('Midnight City', 'M83'),
      },
      {
        title: 'Heroes',
        artist: 'David Bowie',
        reason: 'Features a similarly anthemic narrative drive rooted in vulnerable passion.',
        spotifyUrl: buildSpotifyUrl('Heroes', 'David Bowie'),
      },
      {
        title: 'Motion Sickness',
        artist: 'Phoebe Bridgers',
        reason: 'Parallels the intricate balance of crisp modern instrumentation and raw storytelling.',
        spotifyUrl: buildSpotifyUrl('Motion Sickness', 'Phoebe Bridgers'),
      },
      {
        title: 'Teardrop',
        artist: 'Massive Attack',
        reason: 'Echoes the hypnotic rhythmic pulse and deeply layered spatial mixing.',
        spotifyUrl: buildSpotifyUrl('Teardrop', 'Massive Attack'),
      },
    ],
  };
}

export const CURATED_ALBUMS: string[] = [
  'Ceres & Calypso in the Deep Time Candy Claws',
  'Deathconsciousness Have a Nice Life',
  'Loveless My Bloody Valentine',
  'Souvlaki Slowdive',
  'Heaven or Las Vegas Cocteau Twins',
  'Depression Cherry Beach House',
  'The Dark Side of the Moon Pink Floyd',
  'Blonde Frank Ocean',
  'Currents Tame Impala',
  'In Rainbows Radiohead',
  'Discovery Daft Punk',
  'Rumours Fleetwood Mac',
  'To Pimp a Butterfly Kendrick Lamar',
  'Kid A Radiohead',
  'Abbey Road The Beatles',
  'A Love Supreme John Coltrane',
  'Unknown Pleasures Joy Division',
  'Vespertine Björk',
  'Hounds of Love Kate Bush',
  'Disintegration The Cure',
  'Selected Ambient Works 85-92 Aphex Twin',
  'Dummy Portishead',
  'Blue Joni Mitchell',
  'Remain in Light Talking Heads',
  'Grace Jeff Buckley',
  'Illmatic Nas',
  'The Velvet Underground & Nico',
  'Pet Sounds The Beach Boys',
  'OK Computer Radiohead',
  'Ziggy Stardust David Bowie',
  'Marquee Moon Television',
  'London Calling The Clash',
  'Random Access Memories Daft Punk',
  'Madvillainy Madvillain',
  'Spiderland Slint',
  'Is This It The Strokes',
  'The Queen Is Dead The Smiths',
];

export const CURATED_SONGS: string[] = [
  'Into the Heart of a Seed Candy Claws',
  'Bloodhail Have a Nice Life',
  'When You Sleep My Bloody Valentine',
  'Alison Slowdive',
  'Space Song Beach House',
  'Cherry-coloured Funk Cocteau Twins',
  'Motion Picture Soundtrack Radiohead',
  'Pyramids Frank Ocean',
  'Let It Happen Tame Impala',
  'Nude Radiohead',
  'Heroes David Bowie',
  'Teardrop Massive Attack',
  'Fade Into You Mazzy Star',
  'Dreams Fleetwood Mac',
  'Time Pink Floyd',
  'Around the World Daft Punk',
  'Running Up That Hill Kate Bush',
  'Lovesong The Cure',
  'Xtal Aphex Twin',
  'Glory Box Portishead',
  'Once in a Lifetime Talking Heads',
  'Lover You Should Have Come Over Jeff Buckley',
  'N.Y. State of Mind Nas',
  'Sunday Morning The Velvet Underground',
  'God Only Knows The Beach Boys',
  'There Is a Light That Never Goes Out The Smiths',
  'Nightcall Kavinsky',
  'Archangel Burial',
];

// Backwards compatibility export
export const CURATED_CATALOGUE = CURATED_ALBUMS;

const albumItemCache = new Map<string, MusicItem>();
const songItemCache = new Map<string, MusicItem>();

async function fetchCuratedAlbumItem(query: string): Promise<MusicItem | null> {
  if (albumItemCache.has(query)) {
    return albumItemCache.get(query)!;
  }
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    if (!first || !first.collectionName) return null;

    const releaseYear = first.releaseDate
      ? new Date(first.releaseDate).getFullYear().toString()
      : undefined;

    const item: MusicItem = {
      id: first.collectionId,
      type: 'album',
      title: first.collectionName,
      artist: first.artistName || 'Unknown Artist',
      artworkUrl: upgradeArtwork(first.artworkUrl100),
      artworkUrlSmall: first.artworkUrl60 || first.artworkUrl100,
      genre: first.primaryGenreName,
      releaseYear,
      trackCount: first.trackCount,
      externalUrl: first.collectionViewUrl,
      spotifyUrl: buildSpotifyUrl(first.collectionName, first.artistName),
    };

    albumItemCache.set(query, item);
    return item;
  } catch (err) {
    console.warn(`Curated album fetch notice for "${query}":`, err);
    return null;
  }
}

async function fetchCuratedSongItem(query: string): Promise<MusicItem | null> {
  if (songItemCache.has(query)) {
    return songItemCache.get(query)!;
  }
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    if (!first || !first.trackName) return null;

    const releaseYear = first.releaseDate
      ? new Date(first.releaseDate).getFullYear().toString()
      : undefined;

    const item: MusicItem = {
      id: first.trackId,
      type: 'song',
      title: first.trackName,
      artist: first.artistName || 'Unknown Artist',
      album: first.collectionName,
      artworkUrl: upgradeArtwork(first.artworkUrl100),
      artworkUrlSmall: first.artworkUrl60 || first.artworkUrl100,
      previewUrl:
        first.previewUrl && typeof first.previewUrl === 'string' && first.previewUrl.trim()
          ? first.previewUrl.replace(/^http:\/\//i, 'https://').trim()
          : undefined,
      genre: first.primaryGenreName,
      releaseYear,
      durationMs: first.trackTimeMillis,
      externalUrl: first.trackViewUrl,
      spotifyUrl: buildSpotifyUrl(first.trackName, first.artistName),
    };

    songItemCache.set(query, item);
    return item;
  } catch (err) {
    console.warn(`Curated song fetch notice for "${query}":`, err);
    return null;
  }
}

export async function handleCuratedIndex(count: number = 8): Promise<{
  albums: MusicItem[];
  songs: MusicItem[];
}> {
  // Shuffle both arrays independently and slice the target count
  const shuffledAlbums = [...CURATED_ALBUMS].sort(() => 0.5 - Math.random());
  const selectedAlbumQueries = shuffledAlbums.slice(0, Math.min(count, shuffledAlbums.length));

  const shuffledSongs = [...CURATED_SONGS].sort(() => 0.5 - Math.random());
  const selectedSongQueries = shuffledSongs.slice(0, Math.min(count, shuffledSongs.length));

  // Run two separate Promise.all fetching routines simultaneously
  const [albumResults, songResults] = await Promise.all([
    Promise.all(selectedAlbumQueries.map((query) => fetchCuratedAlbumItem(query))),
    Promise.all(selectedSongQueries.map((query) => fetchCuratedSongItem(query))),
  ]);

  const albums = albumResults.filter((item): item is MusicItem => item !== null);
  const songs = songResults.filter((item): item is MusicItem => item !== null);

  return { albums, songs };
}
