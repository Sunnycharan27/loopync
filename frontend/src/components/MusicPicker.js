import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Search, X, Music, Play, Pause, TrendingUp, Clock, ChevronLeft, Volume2, VolumeX } from 'lucide-react';

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
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Generate consistent waveform data based on track ID
  const waveformData = useMemo(() => {
    if (!currentTrack?.id) return [];
    const seed = currentTrack.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 60 }, (_, i) => {
      const random = Math.sin(seed + i * 0.5) * 0.5 + 0.5;
      return 20 + random * 60;
    });
  }, [currentTrack?.id]);

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
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.currentTime = fromTime;
      
      audioRef.current.ontimeupdate = () => {
        setCurrentPlayTime(audioRef.current.currentTime);
        // Loop within selected clip duration
        if (step === 'duration' && audioRef.current.currentTime >= startTime + duration) {
          audioRef.current.currentTime = startTime;
        }
      };
      
      audioRef.current.onended = () => {
        if (step === 'duration') {
          // Loop back
          audioRef.current.currentTime = startTime;
          audioRef.current.play();
        } else {
          setPlayingId(null);
        }
      };

      audioRef.current.play()
        .then(() => setPlayingId(track.id))
        .catch(err => console.error('Playback failed:', err));
    }
  };

  const handleTrackSelect = (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    setCurrentTrack(track);
    setCurrentPlayTime(0);
    if (showDurationPicker && track.previewUrl) {
      setStep('duration');
      setStartTime(0);
      // Auto-play when entering duration selection
      setTimeout(() => playPreview(track, 0), 100);
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

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
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
    const isPlaying = playingId === currentTrack.id;
    const playProgress = ((currentPlayTime - startTime) / duration) * 100;

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center">
        <div className="w-full max-w-lg bg-gradient-to-b from-[#1a0b2e] to-[#0f021e] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <button onClick={() => { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); setStep('browse'); }} className="p-2 hover:bg-gray-800 rounded-full transition">
                <ChevronLeft size={24} className="text-white" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Select Music Clip</h2>
                <p className="text-xs text-gray-400">Choose the part you want to play</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Track Info with Album Art */}
          <div className="p-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-2xl border border-green-500/20">
              <div className="relative">
                <img
                  src={currentTrack.albumArt || currentTrack.albumArtSmall}
                  alt={currentTrack.album}
                  className={`w-20 h-20 rounded-xl object-cover shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}
                />
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <div className="flex gap-1 items-end h-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-400 rounded-full animate-bounce"
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            height: `${40 + Math.random() * 60}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">{currentTrack.name}</p>
                <p className="text-gray-400 truncate">{currentTrack.artist}</p>
                <p className="text-xs text-green-400 mt-1">{formatDuration(currentTrack.duration)}</p>
              </div>
              <button
                onClick={() => playPreview(currentTrack, startTime)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isPlaying 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105'
                }`}
              >
                {isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} className="ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Duration Buttons */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Clock size={14} />
              Clip Duration
            </p>
            <div className="flex gap-2">
              {[15, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    if (startTime + d > maxPreviewTime) {
                      setStartTime(Math.max(0, maxPreviewTime - d));
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    duration === d
                      ? 'bg-green-500 text-black shadow-lg shadow-green-500/30'
                      : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {d} sec
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Visualizer */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400 mb-3">Drag to select start point</p>
            <div className="relative bg-gray-900 rounded-2xl p-4 border border-gray-800">
              {/* Waveform */}
              <div className="h-20 relative flex items-center gap-[2px]">
                {waveformData.map((height, i) => {
                  const barPosition = (i / waveformData.length) * maxPreviewTime;
                  const isInRange = barPosition >= startTime && barPosition < startTime + duration;
                  const isCurrentlyPlaying = isPlaying && currentPlayTime >= barPosition && currentPlayTime < barPosition + (maxPreviewTime / waveformData.length);
                  
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isCurrentlyPlaying
                          ? 'bg-white'
                          : isInRange
                            ? 'bg-green-500'
                            : 'bg-gray-700'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
                
                {/* Playhead */}
                {isPlaying && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50 transition-all"
                    style={{ left: `${(currentPlayTime / maxPreviewTime) * 100}%` }}
                  />
                )}
              </div>
              
              {/* Range Slider */}
              <input
                type="range"
                min="0"
                max={Math.max(0, maxPreviewTime - duration)}
                step="0.5"
                value={startTime}
                onChange={(e) => {
                  const newStart = Number(e.target.value);
                  setStartTime(newStart);
                  if (isPlaying && audioRef.current) {
                    audioRef.current.currentTime = newStart;
                  }
                }}
                className="w-full mt-4 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                style={{
                  background: `linear-gradient(to right, #22c55e ${(startTime / (maxPreviewTime - duration)) * 100}%, #374151 ${(startTime / (maxPreviewTime - duration)) * 100}%)`
                }}
              />
              
              {/* Time Labels */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500 font-mono">{formatTime(startTime)}</span>
                <span className="text-sm text-green-400 font-semibold bg-green-500/10 px-3 py-1 rounded-full">
                  {formatTime(startTime)} → {formatTime(Math.min(startTime + duration, maxPreviewTime))}
                </span>
                <span className="text-xs text-gray-500 font-mono">{formatTime(maxPreviewTime)}</span>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <button onClick={toggleMute} className="p-2 hover:bg-gray-700 rounded-lg transition">
                {isMuted ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-green-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                <Music size={16} />
                Your story will play this {duration}-second clip
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50 flex gap-3 bg-black/30">
            <button
              onClick={() => { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); setStep('browse'); }}
              className="flex-1 py-3.5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
            >
              Change Song
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-black font-bold hover:from-green-400 hover:to-green-500 transition shadow-lg shadow-green-500/30"
            >
              Add to Story ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Browse Songs Step
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1a0b2e] to-[#0f021e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Music size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Music</h2>
                <p className="text-xs text-gray-400">Powered by Spotify</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
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
              className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Selected Track Preview */}
        {currentTrack && (
          <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center gap-3">
              <img src={currentTrack.albumArtSmall || currentTrack.albumArt} alt="" className="w-10 h-10 rounded-lg shadow" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{currentTrack.name}</p>
                <p className="text-green-400 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">✓ Selected</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!query && (
          <div className="flex gap-2 px-4 py-3 border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'trending' ? 'bg-green-500 text-black shadow-lg shadow-green-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
                onClick={() => handleTrackSelect(track)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  currentTrack?.id === track.id
                    ? 'bg-green-500/20 border border-green-500/30 shadow-lg'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="relative">
                  <img
                    src={track.albumArtSmall || track.albumArt}
                    alt={track.album}
                    className="w-12 h-12 rounded-lg object-cover shadow"
                  />
                  {playingId === track.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="flex gap-0.5 items-end h-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-1 bg-green-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
                  {track.previewUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(track);
                      }}
                      className={`p-2 rounded-full transition ${
                        playingId === track.id ? 'bg-green-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {playingId === track.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : query ? (
            <div className="text-center py-8">
              <Music size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No songs found</p>
            </div>
          ) : null}
        </div>

        {/* Spotify Attribution */}
        <div className="p-3 border-t border-gray-800/50 flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className="text-xs text-gray-500">30-second previews from Spotify</span>
        </div>
      </div>
    </div>
  );
};

export default MusicPicker;
