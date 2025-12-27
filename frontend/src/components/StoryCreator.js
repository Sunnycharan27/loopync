import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { X, Camera, Video, Music, MapPin, ChevronLeft, Check, Image, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import MusicPicker from './MusicPicker';
import MusicBadge from './MusicBadge';

const StoryCreator = ({ onClose, onStoryCreated }) => {
  const { currentUser } = useContext(AuthContext);
  const [step, setStep] = useState('media'); // 'media', 'edit'
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Popular Indian cities for location
  const popularLocations = [
    { id: '1', name: 'Mumbai, Maharashtra', icon: '🏙️' },
    { id: '2', name: 'Delhi, India', icon: '🏛️' },
    { id: '3', name: 'Bangalore, Karnataka', icon: '💻' },
    { id: '4', name: 'Chennai, Tamil Nadu', icon: '🏖️' },
    { id: '5', name: 'Kolkata, West Bengal', icon: '🌉' },
    { id: '6', name: 'Hyderabad, Telangana', icon: '🍗' },
    { id: '7', name: 'Pune, Maharashtra', icon: '📚' },
    { id: '8', name: 'Jaipur, Rajasthan', icon: '🏰' },
    { id: '9', name: 'Goa, India', icon: '🏝️' },
    { id: '10', name: 'Ahmedabad, Gujarat', icon: '🛕' },
  ];

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB');
      return;
    }

    setMediaFile(file);
    setMediaType('image');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setStep('edit');
    };
    reader.onerror = () => {
      toast.error('Failed to read image');
    };
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video too large. Max 100MB');
      return;
    }

    setMediaFile(file);
    setMediaType('video');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setStep('edit');
    };
    reader.onerror = () => {
      toast.error('Failed to read video');
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

      // Prepare music data with clip info
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
        id: selectedLocation.id,
        name: selectedLocation.name
      } : null;

      const storyData = {
        mediaUrl,
        mediaType,
        caption,
        music: musicData,
        location: locationData
      };

      await axios.post(`${API}/capsules?userId=${currentUser.id}`, storyData);
      toast.success('Story posted! 🎉');
      onStoryCreated?.();
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
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
            <X size={24} className="text-white" />
          </button>
          <h2 className="text-lg font-bold text-white">Create Story</h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center mb-8 animate-pulse">
            <Camera size={56} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Add to Your Story</h3>
          <p className="text-gray-400 text-center mb-10 max-w-xs">Share a photo or video that disappears after 24 hours</p>
          
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleVideoSelect}
            className="hidden"
          />
          
          <div className="flex gap-6">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-500/30 text-white font-semibold rounded-2xl hover:border-pink-500 hover:bg-pink-500/20 transition-all hover:scale-105"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <Image size={28} className="text-white" />
              </div>
              <span>Photo</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-500/30 text-white font-semibold rounded-2xl hover:border-cyan-500 hover:bg-cyan-500/20 transition-all hover:scale-105"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <Video size={28} className="text-white" />
              </div>
              <span>Video</span>
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            Supported: JPG, PNG, GIF, MP4 • Max: 10MB photo, 100MB video
          </p>
        </div>
      </div>
    );
  }

  // Edit Step
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => {
            setStep('media');
            setMediaFile(null);
            setMediaPreview(null);
            setSelectedMusic(null);
            setSelectedLocation(null);
          }} 
          className="p-2 hover:bg-gray-800 rounded-full transition"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Edit Story</h2>
        <button
          onClick={handlePost}
          disabled={loading || uploading}
          className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full disabled:opacity-50 hover:opacity-90 transition"
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
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Location Badge (if selected) */}
        {selectedLocation && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
              <MapPin size={16} className="text-red-400" />
              <span className="text-white text-sm font-medium">{selectedLocation.name}</span>
              <button 
                onClick={() => setSelectedLocation(null)}
                className="ml-1 p-0.5 hover:bg-white/20 rounded-full"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Music Badge (if selected) */}
        {selectedMusic && (
          <div className="absolute bottom-28 left-4 z-10">
            <div className="flex items-center gap-2">
              <MusicBadge track={selectedMusic} size="md" showPlay={true} />
              <button 
                onClick={() => setSelectedMusic(null)}
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Caption Input */}
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      {/* Bottom Tools */}
      <div className="p-4 border-t border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-center gap-4">
          {/* Music Button */}
          <button
            onClick={() => setShowMusicPicker(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              selectedMusic 
                ? 'bg-green-500 text-black' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <Music size={20} />
            {selectedMusic ? 'Change Music' : 'Add Music'}
          </button>

          {/* Location Button */}
          <button
            onClick={() => setShowLocationPicker(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              selectedLocation 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <MapPin size={20} />
            {selectedLocation ? 'Change Location' : 'Add Location'}
          </button>
        </div>
      </div>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <MusicPicker
          selectedTrack={selectedMusic}
          onSelect={(track) => {
            setSelectedMusic(track);
            setShowMusicPicker(false);
          }}
          onClose={() => setShowMusicPicker(false)}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-[#1a0b2e] rounded-t-3xl sm:rounded-3xl max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add Location</h2>
                  <p className="text-xs text-gray-400">Share where you are</p>
                </div>
              </div>
              <button onClick={() => setShowLocationPicker(false)} className="p-2 hover:bg-gray-800 rounded-full">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {popularLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    setSelectedLocation(location);
                    setShowLocationPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    selectedLocation?.id === location.id
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-2xl">{location.icon}</span>
                  <span className="text-white font-medium">{location.name}</span>
                  {selectedLocation?.id === location.id && (
                    <Check size={20} className="text-red-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;
