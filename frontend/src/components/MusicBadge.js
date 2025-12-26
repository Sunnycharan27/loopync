import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, ExternalLink } from 'lucide-react';

const MusicBadge = ({ track, size = 'md', showPlay = true, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (autoPlay && track?.previewUrl) {
      playAudio();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [autoPlay, track]);

  const playAudio = () => {
    if (!track?.previewUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.volume = 0.5;
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!track) return null;

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  const imgSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2 pr-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 ${sizeClasses[size]}`}>
      {/* Album Art */}
      <div className="relative">
        <img
          src={track.albumArtSmall || track.albumArt}
          alt={track.album}
          className={`${imgSizes[size]} rounded-full object-cover`}
        />
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-green-500 rounded-full animate-pulse"
                  style={{ height: `${3 + i * 2}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 max-w-[120px]">
        <p className="text-white font-medium truncate leading-tight">{track.name}</p>
        <p className="text-gray-400 text-xs truncate">{track.artist}</p>
      </div>

      {/* Play Button */}
      {showPlay && track.previewUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            playAudio();
          }}
          className="p-1 rounded-full hover:bg-white/10 transition"
        >
          {isPlaying ? (
            <Pause size={14} className="text-green-500" />
          ) : (
            <Play size={14} className="text-white ml-0.5" />
          )}
        </button>
      )}

      {/* Spotify Link */}
      {track.spotifyUrl && (
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-green-500 hover:text-green-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </a>
      )}
    </div>
  );
};

export default MusicBadge;
