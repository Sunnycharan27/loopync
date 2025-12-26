import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Search, X, Music, Play, Pause, TrendingUp, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const MusicPicker = ({ onSelect, onClose, selectedTrack, showDurationPicker = true }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [playingId, setPlayingId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(selectedTrack || null);
  const [step, setStep] = useState('browse'); // 'browse' or 'duration'
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(15); // 15, 30, 45, or 60 seconds
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const progressRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetchTrending();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchTracks(query);
      }, 500);
    } else {
      setTracks([]);
      setActiveTab('trending');
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [query]);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`${API}/spotify/trending?limit=15`);
      setTrending(res.data.tracks || []);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    }
  };

  const searchTracks = async (q) => {
    setLoading(true);
    setActiveTab('search');
    try {
      const res = await axios.get(`${API}/spotify/search?q=${encodeURIComponent(q)}&limit=20`);
      setTracks(res.data.tracks || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (track, fromTime = 0) => {
    if (!track.previewUrl) return;
    
    if (playingId === track.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = fromTime;
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current.currentTime);
        // Stop at duration limit
        if (step === 'duration' && audioRef.current.currentTime >= startTime + duration) {
          audioRef.current.currentTime = startTime;
        }
      };
      setPlayingId(track.id);
    }
  };

  const handleTrackSelect = (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    setCurrentTrack(track);
    if (showDurationPicker && track.previewUrl) {
      setStep('duration');
      setStartTime(0);
    } else {
      onSelect({ ...track, startTime: 0, clipDuration: 30 });
    }
  };

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelect({
      ...currentTrack,
      startTime,
      clipDuration: duration
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Max time for preview (usually 30 sec)
  const maxPreviewTime = 30;

  const displayTracks = activeTab === 'search' ? tracks : trending;

  // Duration Selection Step
  if (step === 'duration' && currentTrack) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div className="w-full max-w-lg bg-[#1a0b2e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('browse')} className="p-2 hover:bg-gray-800 rounded-full">
                <ChevronLeft size={24} className="text-white" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Select Clip</h2>
                <p className="text-xs text-gray-400">Choose which part to play</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Track Info */}
          <div className="p-4">
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-2xl">
              <img
                src={currentTrack.albumArt || currentTrack.albumArtSmall}
                alt={currentTrack.album}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">{currentTrack.name}</p>
                <p className="text-gray-400 truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => playPreview(currentTrack, startTime)}
                className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
              >
                {playingId === currentTrack.id ? (
                  <Pause size={24} className="text-black" />
                ) : (
                  <Play size={24} className="text-black ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400 mb-3">Clip Duration</p>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    duration === d
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Start Time Slider */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400 mb-3">Start Point</p>
            <div className="relative">
              {/* Waveform visual (simplified) */}
              <div className="h-16 bg-gray-800 rounded-xl relative overflow-hidden">
                {/* Progress bars to simulate waveform */}
                <div className="absolute inset-0 flex items-center gap-[2px] px-2">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all ${
                        i / 50 * maxPreviewTime >= startTime && i / 50 * maxPreviewTime < startTime + duration
                          ? 'bg-green-500'
                          : 'bg-gray-600'
                      }`}
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
                {/* Selected range indicator */}
                <div
                  className="absolute top-0 bottom-0 border-2 border-green-400 rounded-lg pointer-events-none"
                  style={{
                    left: `${(startTime / maxPreviewTime) * 100}%`,
                    width: `${(duration / maxPreviewTime) * 100}%`
                  }}
                />
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="0"
                max={Math.max(0, maxPreviewTime - duration)}
                value={startTime}
                onChange={(e) => {
                  setStartTime(Number(e.target.value));
                  if (playingId === currentTrack.id && audioRef.current) {
                    audioRef.current.currentTime = Number(e.target.value);
                  }
                }}
                className="w-full mt-3 accent-green-500"
              />
              
              {/* Time labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(startTime)}</span>
                <span className="text-green-400 font-medium">
                  Playing: {formatTime(startTime)} - {formatTime(startTime + duration)}
                </span>
                <span>{formatTime(maxPreviewTime)}</span>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-sm text-center">
                🎵 Preview plays {duration} seconds starting at {formatTime(startTime)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800 flex gap-3">
            <button
              onClick={() => setStep('browse')}
              className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
            >
              Change Song
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Browse Songs Step
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <Music size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Music</h2>
                <p className="text-xs text-gray-400">Powered by Spotify</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Selected Track Preview */}
        {currentTrack && (
          <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center gap-3">
              <img src={currentTrack.albumArtSmall || currentTrack.albumArt} alt="" className="w-10 h-10 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{currentTrack.name}</p>
                <p className="text-green-400 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-green-400 text-xs font-semibold">✓ Selected</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!query && (
          <div className="flex gap-2 px-4 py-2 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                activeTab === 'trending' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp size={14} />
              Trending
            </button>
          </div>
        )}

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayTracks.length > 0 ? (
            displayTracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${
                  currentTrack?.id === track.id
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                }`}
                onClick={() => handleTrackSelect(track)}
              >
                {/* Album Art with Play Button */}
                <div className="relative flex-shrink-0">
                  <img
                    src={track.albumArtSmall || track.albumArt}
                    alt={track.album}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  {track.previewUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(track);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition"
                    >
                      {playingId === track.id ? (
                        <Pause size={20} className="text-white" />
                      ) : (
                        <Play size={20} className="text-white ml-0.5" />
                      )}
                    </button>
                  )}
                  {playingId === track.id && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-500 rounded-full animate-pulse"
                          style={{ height: `${4 + i * 2}px`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{track.name}</p>
                  <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                </div>

                {/* Duration & Select */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(track.duration)}
                  </span>
                  {currentTrack?.id === track.id ? (
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </span>
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                </div>
              </div>
            ))
          ) : query && !loading ? (
            <div className="text-center py-8">
              <Music size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No songs found for "{query}"</p>
              <p className="text-gray-500 text-sm mt-1">Try a different search</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>

        {/* Spotify Attribution */}
        <div className="px-4 pb-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Music from</span>
          <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500 hover:text-green-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Spotify
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MusicPicker;
