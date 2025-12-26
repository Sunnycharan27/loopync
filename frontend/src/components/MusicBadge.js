import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause } from 'lucide-react';

const MusicBadge = ({ track, size = 'md', showPlay = true, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Get clip settings from track
  const startTime = track?.startTime || 0;
  const clipDuration = track?.clipDuration || 30;

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && track?.previewUrl) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        playAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, track?.previewUrl]);

  const playAudio = () => {
    if (!track?.previewUrl) {
      console.log('No preview URL available');
      return;
    }

    if (isPlaying && audioRef.current) {
      // Pause
      audioRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      // Play
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.volume = 0.7;
      }

      // Set start time
      audioRef.current.currentTime = startTime;

      // Handle time updates to loop within the clip duration
      audioRef.current.ontimeupdate = () => {
        const currentPos = audioRef.current.currentTime - startTime;
        const progressPercent = (currentPos / clipDuration) * 100;
        setProgress(Math.min(progressPercent, 100));

        // Loop back to start when clip duration is reached
        if (audioRef.current.currentTime >= startTime + clipDuration) {
          audioRef.current.currentTime = startTime;
        }
      };

      audioRef.current.onended = () => {
        // If the full preview ends before our clip, restart
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
      };

      audioRef.current.onerror = (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
      };

      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
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
    <div 
      className={`inline-flex items-center gap-2 px-2 pr-3 rounded-full bg-black/70 backdrop-blur-md border border-white/20 ${sizeClasses[size]} cursor-pointer hover:bg-black/80 transition`}
      onClick={(e) => {
        e.stopPropagation();
        playAudio();
      }}
    >
      {/* Album Art with Progress Ring */}
      <div className="relative">
        <img
          src={track.albumArtSmall || track.albumArt}
          alt={track.album || track.name}
          className={`${imgSizes[size]} rounded-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
          style={{ animationDuration: '3s' }}
        />
        
        {/* Progress Ring */}
        {isPlaying && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Sound Wave Animation */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <div className="flex gap-0.5 items-end h-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-green-500 rounded-full animate-sound-wave"
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    height: '100%'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 max-w-[120px]">
        <p className="text-white font-medium truncate leading-tight text-xs">{track.name}</p>
        <p className="text-gray-400 text-[10px] truncate">{track.artist}</p>
      </div>

      {/* Play/Pause Button */}
      {showPlay && track.previewUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            playAudio();
          }}
          className="p-1.5 rounded-full bg-green-500 hover:bg-green-400 transition flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause size={12} className="text-black" />
          ) : (
            <Play size={12} className="text-black ml-0.5" />
          )}
        </button>
      )}

      {/* Spotify Logo */}
      {track.spotifyUrl && (
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-green-500 hover:text-green-400 ml-1"
          title="Open in Spotify"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </a>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes sound-wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        .animate-sound-wave {
          animation: sound-wave 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MusicBadge;
