import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Search, X, Music, Play, Pause, TrendingUp, Clock, ExternalLink } from 'lucide-react';

const MusicPicker = ({ onSelect, onClose, selectedTrack }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [playingId, setPlayingId] = useState(null);
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
    // Debounced search
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

  const playPreview = (track) => {
    if (!track.previewUrl) return;
    
    if (playingId === track.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      // Play new track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const handleSelect = (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelect(track);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayTracks = activeTab === 'search' ? tracks : trending;

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
        {selectedTrack && (
          <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center gap-3">
              <img src={selectedTrack.albumArtSmall || selectedTrack.albumArt} alt="" className="w-10 h-10 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{selectedTrack.name}</p>
                <p className="text-green-400 text-xs truncate">{selectedTrack.artist}</p>
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
                  selectedTrack?.id === track.id
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                }`}
                onClick={() => handleSelect(track)}
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
                  {selectedTrack?.id === track.id ? (
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border border-gray-600" />
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
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedTrack && onClose()}
            disabled={!selectedTrack}
            className="flex-1 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedTrack ? 'Done' : 'Select a Song'}
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
