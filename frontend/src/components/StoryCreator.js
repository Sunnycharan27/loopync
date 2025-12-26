import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { X, Camera, Video, Type, Music, MapPin, Smile, Sparkles, Check, ChevronLeft, Search, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import MusicPicker from './MusicPicker';
import MusicBadge from './MusicBadge';

const StoryCreator = ({ onClose, onStoryCreated }) => {
  const { currentUser } = useContext(AuthContext);
  const [step, setStep] = useState('media'); // 'media', 'edit', 'stickers'
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please select an image or video');
      return;
    }

    // Size limits
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${isVideo ? '100MB' : '10MB'}`);
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setStep('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!mediaFile) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', mediaFile);

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      return res.data.url;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload media');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!currentUser) {
      toast.error('Please login to post stories');
      return;
    }

    if (!mediaFile) {
      toast.error('Please select a photo or video');
      return;
    }

    setLoading(true);
    try {
      const mediaUrl = await handleUpload();
      if (!mediaUrl) {
        setLoading(false);
        return;
      }

      // Prepare music data
      const musicData = selectedMusic ? {
        trackId: selectedMusic.id,
        name: selectedMusic.name,
        artist: selectedMusic.artist,
        albumArt: selectedMusic.albumArt,
        albumArtSmall: selectedMusic.albumArtSmall,
        previewUrl: selectedMusic.previewUrl,
        spotifyUrl: selectedMusic.spotifyUrl,
        startTime: selectedMusic.startTime || 0,
        clipDuration: selectedMusic.clipDuration || 15
      } : null;

      // Prepare location data
      const locationData = selectedLocation ? {
        name: selectedLocation.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      } : null;

      const storyData = {
        mediaType,
        mediaUrl,
        caption,
        music: musicData,
        location: locationData,
        duration: mediaType === 'video' ? 15 : 5
      };

      const res = await axios.post(`${API}/vibe-capsules?authorId=${currentUser.id}`, storyData);
      
      toast.success('Story posted! ✨');
      if (onStoryCreated) onStoryCreated(res.data);
      onClose();
    } catch (error) {
      console.error('Failed to post story:', error);
      toast.error('Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  // Media Selection Step
  if (step === 'media') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-white" />
          </button>
          <h2 className="text-lg font-bold text-white">Create Story</h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Add to Story</h3>
          <p className="text-gray-400 text-center mb-8">Share a photo or video that disappears after 24 hours</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
            >
              <Camera size={20} />
              Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
            >
              <Video size={20} />
              Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Step
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button onClick={() => setStep('media')} className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Edit Story</h2>
        <button
          onClick={handlePost}
          disabled={loading || uploading}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : loading ? 'Posting...' : 'Share'}
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Media Preview */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaPreview}
              className="max-h-full max-w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaPreview}
              alt="Story preview"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Caption Overlay */}
        {caption && (
          <div className="absolute bottom-24 left-4 right-4 text-center">
            <p className="inline-block px-4 py-2 bg-black/60 backdrop-blur-sm rounded-xl text-white font-medium">
              {caption}
            </p>
          </div>
        )}

        {/* Music Badge Overlay */}
        {selectedMusic && (
          <div className="absolute bottom-4 left-4">
            <MusicBadge track={selectedMusic} size="md" showPlay={true} />
          </div>
        )}

        {/* Location Badge Overlay */}
        {selectedLocation && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
              <MapPin size={16} className="text-red-400" />
              <span className="text-white text-sm font-medium">{selectedLocation.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tools Bar */}
      <div className="p-4 border-t border-gray-800 bg-black/80">
        {/* Caption Input */}
        <div className="mb-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            maxLength={100}
          />
        </div>

        {/* Sticker Tools */}
        <div className="flex gap-3 justify-center">
          {/* Music Button */}
          <button
            onClick={() => setShowMusicPicker(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
              selectedMusic
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <Music size={18} />
            {selectedMusic ? 'Change' : 'Music'}
          </button>

          {/* Location Button */}
          <button
            onClick={() => setShowLocationPicker(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
              selectedLocation
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <MapPin size={18} />
            {selectedLocation ? 'Change' : 'Location'}
          </button>

          {/* Text Button */}
          <button
            onClick={() => document.querySelector('input[placeholder="Add a caption..."]')?.focus()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition"
          >
            <Type size={18} />
            Text
          </button>
        </div>
      </div>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <MusicPicker
          onSelect={(track) => {
            setSelectedMusic(track);
            setShowMusicPicker(false);
          }}
          onClose={() => setShowMusicPicker(false)}
          selectedTrack={selectedMusic}
          showDurationPicker={true}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onSelect={(location) => {
            setSelectedLocation(location);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
          selectedLocation={selectedLocation}
        />
      )}
    </div>
  );
};

// Location Picker Component
const LocationPicker = ({ onSelect, onClose, selectedLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentLocations] = useState([
    { id: '1', name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
    { id: '2', name: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
    { id: '3', name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
    { id: '4', name: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
    { id: '5', name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { id: '6', name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
    { id: '7', name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    { id: '8', name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
  ]);

  const searchLocations = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    // Filter from recent locations (in production, use a geocoding API)
    const filtered = recentLocations.filter(loc => 
      loc.name.toLowerCase().includes(q.toLowerCase())
    );
    setResults(filtered);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchLocations(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const displayLocations = query ? results : recentLocations;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Location</h2>
                <p className="text-xs text-gray-400">Tag where you are</p>
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
              placeholder="Search for a location..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
              autoFocus
            />
          </div>
        </div>

        {/* Selected Location */}
        {selectedLocation && (
          <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-red-400" />
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{selectedLocation.name}</p>
              </div>
              <span className="text-red-400 text-xs font-semibold">✓ Selected</span>
            </div>
          </div>
        )}

        {/* Location List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-gray-500 mb-2">{query ? 'Search Results' : 'Popular Locations'}</p>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayLocations.length > 0 ? (
            displayLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => onSelect(location)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left ${
                  selectedLocation?.id === location.id
                    ? 'bg-red-500/20 border border-red-500/30'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <MapPin size={18} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{location.name}</p>
                </div>
                {selectedLocation?.id === location.id && (
                  <Check size={18} className="text-red-400" />
                )}
              </button>
            ))
          ) : query ? (
            <div className="text-center py-8">
              <MapPin size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No locations found</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          {selectedLocation && (
            <button
              onClick={() => onSelect(null)}
              className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className={`${selectedLocation ? 'flex-1' : 'w-full'} py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
