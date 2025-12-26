import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { X, Image as ImageIcon, Upload, Cloud, Film, FileText, Video } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CLOUDINARY_CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_UNSIGNED || 'loopync_unsigned';

const ComposerModal = ({ currentUser, onClose, onPostCreated, onReelCreated, initialMode = 'post' }) => {
  const [contentType, setContentType] = useState(initialMode); // 'post', 'reel'
  const [text, setText] = useState("");
  const [media, setMedia] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("local");
  const fileInputRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (CLOUDINARY_CLOUD) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const openCloudinaryWidget = () => {
    if (window.cloudinary && CLOUDINARY_CLOUD) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD,
          uploadPreset: CLOUDINARY_PRESET,
          folder: contentType === 'reel' ? 'loopync/reels' : 'loopync/posts',
          sources: ['local', 'camera'],
          resourceType: contentType === 'reel' ? 'video' : 'auto',
          maxFileSize: contentType === 'reel' ? 100000000 : 10000000,
          clientAllowedFormats: contentType === 'reel' 
            ? ['mp4', 'mov', 'webm'] 
            : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
          showPoweredBy: false,
          styles: {
            palette: {
              window: '#121427',
              sourceBg: '#0f021e',
              windowBorder: '#00E0FF',
              tabIcon: '#00E0FF',
              inactiveTabIcon: '#555',
              menuIcons: '#00E0FF',
              link: '#00E0FF',
              action: '#00E0FF',
              inProgress: '#00E0FF',
              complete: '#5AFF9C',
              error: '#FF3DB3',
              textDark: '#FFFFFF',
              textLight: '#FFFFFF'
            }
          }
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            setMedia(result.info.secure_url);
            setPreviewUrl(result.info.secure_url);
            setUploadMethod('cloudinary');
            toast.success(`${contentType === 'reel' ? 'Reel' : 'Media'} uploaded to Cloudinary!`);
          }
        }
      );
      widgetRef.current.open();
    } else {
      toast.error('Cloudinary not configured');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For reels, only allow videos
    if (contentType === 'reel' && !file.type.startsWith('video/')) {
      toast.error("Reels must be videos (MP4, MOV, WebM)");
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('video/') ? 150 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = contentType === 'reel' 
      ? ['video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(contentType === 'reel' 
        ? "Only video files (MP4, MOV, WebM) are supported for reels"
        : "Only images and videos are supported");
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    
    toast.success(`${file.type.startsWith('video/') ? 'Video' : 'Image'} selected!`);
  };

  const handleUpload = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000 // 2 min timeout for large video files
      });
      
      toast.success("Media uploaded successfully!");
      return res.data.url;
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Failed to upload file";
      toast.error(`Upload failed: ${errorMsg}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For reels, video is required
    if (contentType === 'reel' && !selectedFile && !media) {
      toast.error("Please upload a video for your reel");
      return;
    }
    
    // For posts, text is required
    if (contentType === 'post' && !text.trim()) {
      toast.error("Post text cannot be empty");
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = media;
      
      if (selectedFile) {
        const uploadedUrl = await handleUpload();
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
        } else {
          toast.error("Failed to upload media");
          setLoading(false);
          return;
        }
      }

      if (contentType === 'reel') {
        // Create reel
        const res = await axios.post(`${API}/reels?authorId=${currentUser.id}`, {
          caption: text || "",
          videoUrl: mediaUrl,
          thumbnailUrl: "", // Could generate from video
          audio: null
        });
        
        toast.success("Reel posted! 🎬");
        if (onReelCreated) onReelCreated(res.data);
      } else {
        // Create post
        const res = await axios.post(`${API}/posts?authorId=${currentUser.id}`, {
          text,
          media: mediaUrl || null,
          audience: "public"
        });
        
        toast.success("Posted!");
        if (onPostCreated) onPostCreated(res.data);
      }
      
      // Clear form and close
      setText("");
      setMedia("");
      setSelectedFile(null);
      setPreviewUrl("");
      onClose();
    } catch (error) {
      console.error("Failed to create content:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Failed to create content");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearMedia = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setMedia("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold neon-text">
            {contentType === 'reel' ? 'Create Reel' : 'Create Post'}
          </h2>
          <button
            data-testid="composer-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Type Toggle */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-800/50 rounded-xl">
          <button
            type="button"
            onClick={() => { setContentType('post'); clearMedia(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${
              contentType === 'post' 
                ? 'bg-cyan-400 text-black' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={18} />
            Post
          </button>
          <button
            type="button"
            onClick={() => { setContentType('reel'); clearMedia(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${
              contentType === 'reel' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film size={18} />
            Reel
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Text Input */}
          <textarea
            data-testid="composer-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={contentType === 'reel' ? "Add a caption for your reel..." : "What's on your mind?"}
            className="w-full h-24 resize-none mb-4"
            autoFocus={contentType === 'post'}
          />

          {/* File Upload Section */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={contentType === 'reel' 
                ? "video/mp4,video/quicktime,video/webm" 
                : "image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
              }
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
                  contentType === 'reel'
                    ? 'border-pink-500/50 text-pink-400 hover:bg-pink-500/10'
                    : 'border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
                }`}
                data-testid="composer-file-btn"
              >
                {contentType === 'reel' ? <Video size={20} /> : <Upload size={20} />}
                {selectedFile 
                  ? "Change Media" 
                  : contentType === 'reel' 
                    ? "Upload Video for Reel" 
                    : "Upload Photo/Video"
                }
              </button>
              
              {CLOUDINARY_CLOUD && (
                <button
                  type="button"
                  onClick={openCloudinaryWidget}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-400/10 text-purple-400 hover:bg-purple-400/20"
                  data-testid="composer-cloudinary-btn"
                >
                  <Cloud size={18} />
                </button>
              )}
            </div>

            {contentType === 'reel' && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                📱 Vertical videos work best for reels (9:16 aspect ratio)
              </p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4 relative">
              {(selectedFile?.type.startsWith('video/') || contentType === 'reel') ? (
                <div className={`relative ${contentType === 'reel' ? 'max-w-[200px] mx-auto' : ''}`}>
                  <video 
                    src={previewUrl} 
                    controls 
                    className={`rounded-2xl w-full object-cover ${contentType === 'reel' ? 'aspect-[9/16] max-h-[300px]' : 'max-h-64'}`}
                  />
                  {contentType === 'reel' && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white text-xs font-bold flex items-center gap-1">
                      <Film size={12} />
                      Reel
                    </div>
                  )}
                </div>
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="rounded-2xl w-full max-h-64 object-cover" 
                />
              )}
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* URL Input (only for posts) */}
          {!selectedFile && contentType === 'post' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-400">
                <ImageIcon size={16} className="inline mr-2" />
                Or paste image URL (optional)
              </label>
              <input
                data-testid="composer-media-input"
                type="url"
                value={media}
                onChange={(e) => setMedia(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
            </div>
          )}

          {media && !selectedFile && contentType === 'post' && (
            <div className="mb-4">
              <img src={media} alt="Preview" className="rounded-2xl w-full max-h-64 object-cover" onError={() => setMedia("")} />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              data-testid="composer-submit-btn"
              type="submit"
              disabled={loading || uploading || (contentType === 'post' && !text.trim()) || (contentType === 'reel' && !selectedFile && !media)}
              className={`flex-1 py-3 rounded-full font-semibold transition-all disabled:opacity-50 ${
                contentType === 'reel'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
                  : 'btn-primary'
              }`}
            >
              {uploading ? "Uploading..." : loading ? "Posting..." : contentType === 'reel' ? "Post Reel 🎬" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposerModal;
