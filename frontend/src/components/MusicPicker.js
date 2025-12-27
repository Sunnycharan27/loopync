import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Search, X, Music, Play, Pause, TrendingUp, ChevronLeft, Volume2, VolumeX } from 'lucide-react';

const MusicPicker = ({ onSelect, onClose, selectedTrack }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [playingId, setPlayingId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(selectedTrack || null);
  const [step, setStep] = useState('browse'); // 'browse' or 'confirm'
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  // Fetch lyrics when track is selected
  useEffect(() => {
    if (currentTrack && step === 'duration') {
      fetchLyrics(currentTrack);
    }
  }, [currentTrack, step]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Use Deezer API for trending (has previews for ALL songs)
      const res = await axios.get(`${API}/music/trending?limit=20`);
      setTrending(res.data.tracks || []);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
      // Fallback to Spotify
      try {
        const res = await axios.get(`${API}/spotify/trending?limit=20`);
        setTrending(res.data.tracks || []);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchTracks = async (q) => {
    setLoading(true);
    setActiveTab('search');
    try {
      // Use Deezer API for search (has previews for ALL songs)
      const res = await axios.get(`${API}/music/search?q=${encodeURIComponent(q)}&limit=20`);
      setTracks(res.data.tracks || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to Spotify
      try {
        const res = await axios.get(`${API}/spotify/search?q=${encodeURIComponent(q)}&limit=20`);
        setTracks(res.data.tracks || []);
      } catch (e) {
        console.error('Fallback search also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLyrics = async (track) => {
    try {
      const res = await axios.get(`${API}/music/lyrics/${track.id}?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.name)}`);
      setLyrics(res.data);
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      setLyrics(null);
    }
  };

  const playPreview = (track, fromTime = 0) => {
    if (!track.previewUrl) {
      console.log('No preview URL for this track');
      return;
    }
    
    if (playingId === track.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.ontimeupdate = null;
        audioRef.current.onended = null;
        audioRef.current = null;
      }
      
      const audio = new Audio(track.previewUrl);
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;
      
      // Set start time (max 25 seconds to allow for clip)
      const maxStart = Math.min(fromTime, 25);
      audio.currentTime = maxStart;
      
      audio.ontimeupdate = () => {
        if (!audioRef.current) return;
        setCurrentPlayTime(audio.currentTime);
        // Loop within selected clip duration
        if (step === 'duration' && audio.currentTime >= startTime + duration) {
          audio.currentTime = startTime;
        }
      };
      
      audio.onended = () => {
        if (!audioRef.current) return;
        if (step === 'duration') {
          audio.currentTime = startTime;
          audio.play().catch(console.error);
        } else {
          setPlayingId(null);
        }
      };

      audio.play()
        .then(() => setPlayingId(track.id))
        .catch(err => {
          console.error('Playback failed:', err);
          setPlayingId(null);
        });
    }
  };

  const handleTrackSelect = (track) => {
    if (!track.previewUrl) {
      // If no preview, still allow selection but show message
      console.log('This track has no preview available');
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    setCurrentTrack(track);
    setCurrentPlayTime(0);
    setLyrics(null);
    
    if (showDurationPicker) {
      setStep('duration');
      setStartTime(0);
      // Auto-play when entering duration selection
      if (track.previewUrl) {
        setTimeout(() => playPreview(track, 0), 100);
      }
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

  // Get full song duration in seconds (from track.duration which could be in ms or formatted string)
  const getFullSongDuration = () => {
    if (!currentTrack) return 180; // default 3 minutes
    
    // If we have durationMs (milliseconds)
    if (currentTrack.durationMs) {
      return Math.floor(currentTrack.durationMs / 1000);
    }
    
    // If we have duration
    if (currentTrack.duration) {
      // Handle "3:59" format (mm:ss)
      if (typeof currentTrack.duration === 'string' && currentTrack.duration.includes(':')) {
        const parts = currentTrack.duration.split(':');
        if (parts.length === 2) {
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        if (parts.length === 3) {
          // Handle "1:23:45" format (hh:mm:ss)
          return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
      }
      // If it's already a number
      const numDuration = parseInt(currentTrack.duration);
      if (!isNaN(numDuration)) {
        // If it's more than 1000, it's likely in milliseconds (convert to seconds)
        if (numDuration > 1000) {
          return Math.floor(numDuration / 1000);
        }
        return numDuration;
      }
    }
    
    return 180; // default 3 minutes
  };

  // Max time for preview (Deezer provides 30 sec, but we can loop or use full song URL if available)
  const maxPreviewTime = 30;
  const maxClipDuration = 60; // Allow up to 60 second clips
  const fullSongDuration = getFullSongDuration();
  const displayTracks = activeTab === 'search' ? tracks : trending;

  // Duration Selection Step with Lyrics
  if (step === 'duration' && currentTrack) {
    const isPlaying = playingId === currentTrack.id;
    const playProgress = ((currentPlayTime - startTime) / duration) * 100;

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center">
        <div className="w-full max-w-lg bg-gradient-to-b from-[#1a0b2e] to-[#0f021e] rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { 
                  if (audioRef.current) audioRef.current.pause(); 
                  setPlayingId(null); 
                  setStep('browse'); 
                  setLyrics(null);
                }} 
                className="p-2 hover:bg-gray-800 rounded-full transition"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Select Music Clip</h2>
                <p className="text-xs text-gray-400">Choose the part you want to play</p>
              </div>
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`p-2 rounded-full transition ${showLyrics ? 'bg-purple-500 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
              >
                <FileText size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Track Info */}
          <div className="p-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
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
                          className="w-1 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s`, height: `${40 + Math.random() * 60}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">{currentTrack.name}</p>
                <p className="text-gray-400 truncate">{currentTrack.artist}</p>
                <p className="text-xs text-purple-400 mt-1">{formatDuration(currentTrack.duration)}</p>
              </div>
              <button
                onClick={() => playPreview(currentTrack, startTime)}
                disabled={!currentTrack.previewUrl}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  !currentTrack.previewUrl 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : isPlaying 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 hover:scale-105'
                }`}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
            </div>
            {!currentTrack.previewUrl && (
              <p className="text-yellow-400 text-xs text-center mt-2">⚠️ Preview not available for this track</p>
            )}
          </div>

          {/* Lyrics Section (Collapsible) */}
          {showLyrics && lyrics && (
            <div className="px-4 pb-2 max-h-32 overflow-y-auto">
              <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-xs text-gray-500 mb-2">📝 Lyrics</p>
                <div className="text-gray-300 text-sm whitespace-pre-line max-h-20 overflow-y-auto">
                  {lyrics.lyrics?.substring(0, 500) || 'Lyrics not available'}
                  {lyrics.lyrics?.length > 500 && '...'}
                </div>
              </div>
            </div>
          )}

          {/* Duration Buttons */}
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Clock size={14} />
              Clip Duration
            </p>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    // Adjust start time if it would exceed song length
                    if (startTime + d > fullSongDuration) {
                      setStartTime(Math.max(0, fullSongDuration - d));
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    duration === d
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Full Song Timeline Selector */}
          <div className="px-4 pb-3">
            <div className="relative bg-gray-900 rounded-2xl p-4 border border-gray-800">
              {/* Song Info Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-semibold">{currentTrack?.name}</p>
                  <p className="text-gray-400 text-sm">{currentTrack?.artist}</p>
                </div>
                <span className="text-sm text-purple-400 font-mono bg-purple-500/10 px-3 py-1.5 rounded-full">
                  Full: {formatTime(fullSongDuration)}
                </span>
              </div>

              {/* Preview Player Section */}
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <span>🎧</span> Preview (30 sec sample)
                  </p>
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        audioRef.current?.pause();
                        setPlayingId(null);
                      } else {
                        playPreview(currentTrack, 0);
                      }
                    }}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                      isPlaying
                        ? 'bg-white text-purple-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}
                  >
                    {isPlaying ? '⏸ Pause' : '▶ Play Preview'}
                  </button>
                </div>
                
                {/* Mini Preview Progress */}
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${(currentPlayTime / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Selection Section */}
              <div className="mb-3">
                <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                  <span>✂️</span> Select your clip from the full song:
                </p>
              </div>

              {/* Waveform Visualization - Clickable to seek */}
              <div 
                className="h-20 relative flex items-center gap-[2px] cursor-pointer rounded-xl overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  const newStartTime = Math.floor(percentage * fullSongDuration);
                  const maxStart = Math.max(0, fullSongDuration - duration);
                  setStartTime(Math.min(newStartTime, maxStart));
                }}
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const barPosition = (i / 60) * fullSongDuration;
                  const isInRange = barPosition >= startTime && barPosition < startTime + duration;
                  const seed = (currentTrack?.id?.toString() || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const height = 25 + (Math.sin(seed + i * 0.4) * 0.5 + 0.5) * 75;
                  
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isInRange
                          ? 'bg-gradient-to-t from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
                
                {/* Selection Range Overlay */}
                <div 
                  className="absolute top-0 bottom-0 border-2 border-white/60 rounded-lg pointer-events-none"
                  style={{ 
                    left: `${(startTime / fullSongDuration) * 100}%`,
                    width: `${(duration / fullSongDuration) * 100}%`,
                    backgroundColor: 'rgba(168, 85, 247, 0.2)'
                  }}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-12 bg-purple-500 rounded-full shadow-lg border-2 border-white" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-pink-500 rounded-full shadow-lg border-2 border-white" />
                </div>
              </div>
              
              {/* Range Slider */}
              <div className="mt-4 px-1">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, fullSongDuration - duration)}
                  step="1"
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-700"
                  style={{
                    background: `linear-gradient(to right, 
                      #374151 ${(startTime / Math.max(1, fullSongDuration - duration)) * 100}%, 
                      #a855f7 ${(startTime / Math.max(1, fullSongDuration - duration)) * 100}%)`
                  }}
                />
              </div>
              
              {/* Time Labels */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500 font-mono">0:00</span>
                <span className="text-lg text-white font-bold bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-full shadow-lg">
                  {formatTime(startTime)} → {formatTime(startTime + duration)}
                </span>
                <span className="text-xs text-gray-500 font-mono">{formatTime(fullSongDuration)}</span>
              </div>

              {/* Selected Range Info */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <p className="text-xs text-gray-400">Start</p>
                  <p className="text-purple-400 font-bold text-lg">{formatTime(startTime)}</p>
                </div>
                <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/30">
                  <p className="text-xs text-gray-400">End</p>
                  <p className="text-pink-400 font-bold text-lg">{formatTime(startTime + duration)}</p>
                </div>
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                  <p className="text-xs text-gray-400">Clip</p>
                  <p className="text-cyan-400 font-bold text-lg">{duration}s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="px-4 pb-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <span>ℹ️</span>
                <span>Your selection <strong>{formatTime(startTime)} - {formatTime(startTime + duration)}</strong> will be saved with your story. The preview above is a sample from the song.</span>
              </p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <button onClick={toggleMute} className="p-2 hover:bg-gray-700 rounded-lg transition">
                {isMuted ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-purple-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50 flex gap-3 bg-black/30">
            <button
              onClick={() => { 
                if (audioRef.current) audioRef.current.pause(); 
                setPlayingId(null); 
                setStep('browse');
                setLyrics(null);
              }}
              className="flex-1 py-3.5 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
            >
              Change Song
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition shadow-lg"
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1a0b2e] to-[#0f021e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Music size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Music</h2>
                <p className="text-xs text-gray-400">Search any song</p>
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
              className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
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
          <div className="px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <img src={currentTrack.albumArtSmall || currentTrack.albumArt} alt="" className="w-10 h-10 rounded-lg shadow" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{currentTrack.name}</p>
                <p className="text-purple-400 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-purple-400 text-xs font-semibold bg-purple-500/20 px-2 py-1 rounded-full">✓ Selected</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!query && (
          <div className="flex gap-2 px-4 py-3 border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === 'trending' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Loading songs...</p>
            </div>
          ) : displayTracks.length > 0 ? (
            displayTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  currentTrack?.id === track.id
                    ? 'bg-purple-500/20 border border-purple-500/30 shadow-lg'
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
                            className="w-1 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {!track.previewUrl && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px]">
                      !
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
                        playingId === track.id ? 'bg-purple-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
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
              <p className="text-gray-500 text-sm mt-1">Try a different search</p>
            </div>
          ) : null}
        </div>

        {/* Info Footer */}
        <div className="p-3 border-t border-gray-800/50 flex items-center justify-center gap-2">
          <Music size={14} className="text-purple-400" />
          <span className="text-xs text-gray-500">30-second previews • Tap to preview, click to select</span>
        </div>
      </div>
    </div>
  );
};

export default MusicPicker;
