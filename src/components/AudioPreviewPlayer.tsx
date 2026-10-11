import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPreviewPlayerProps {
  previewUrl?: string;
  title: string;
  artist: string;
  autoPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  previewUrl,
  title,
  artist,
  autoPlay = false,
  onPlayStateChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [error, setError] = useState<boolean>(false);

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  const secureUrl = previewUrl && previewUrl.startsWith('http')
    ? previewUrl.replace(/^http:\/\//i, 'https://')
    : undefined;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setError(!secureUrl);

    if (audioRef.current && secureUrl) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();

        if (autoPlay) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } catch (e) {
        console.warn('Audio reset notice:', e);
      }
    }
  }, [secureUrl, autoPlay]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current || !secureUrl || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setError(false);
        })
        .catch((err) => {
          console.warn('Audio playback notice:', err);
          setError(true);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error || !secureUrl) {
    return (
      <div className="text-[11px] font-mono text-zinc-600">
        audio preview unavailable for this recording
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setError(true);
          setIsPlaying(false);
        }}
      >
        <source src={secureUrl} type="audio/mp4" />
        <source src={secureUrl} type="audio/x-m4a" />
        <source src={secureUrl} type="audio/aac" />
      </audio>

      {/* Minimalist wireline audio player */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <button
          onClick={togglePlay}
          className="text-white hover:text-zinc-400 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.25} />
              <span>pause preview</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.25} />
              <span>listen preview</span>
            </>
          )}
        </button>

        {/* Hairline scrubber */}
        <input
          type="range"
          min="0"
          max={duration || 30}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-[2px] bg-zinc-800 rounded-none appearance-none cursor-pointer accent-white"
        />

        <span className="text-[10px] text-zinc-500 font-mono w-14 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
