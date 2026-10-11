export type SearchType = 'song' | 'album';

export interface MusicItem {
  id: string | number;
  type: SearchType;
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

export interface Recommendation {
  title: string;
  artist: string;
  reason: string;
  type?: SearchType;
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
  similar_recommendations: Recommendation[];
}
