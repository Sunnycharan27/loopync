import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Plus, X, Upload, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";

const VibeCapsuleUpload = ({ currentUser, onUploadComplete, onClose, isOpen = false }) => {
  const [showModal, setShowModal] = useState(isOpen);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sync external isOpen prop with internal state
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setShowModal(isOpen);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowModal(false);
    setMediaUrl("");
    setCaption("");
    setUploadProgress(0);
    if (onClose) onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return;
    }

    // Validate file size (max 150MB for video, 10MB for image)
    const maxSize = isVideo ? 150 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${isVideo ? '150MB for video' : '10MB for image'}`);
      return;
    }

    setUploading(true);
    setMediaType(isImage ? "image" : "video");

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Backend returns /api/uploads/filename, just use it directly without prepending API
      // since API already includes the base URL with /api
      const uploadedUrl = uploadRes.data.url;
      setMediaUrl(uploadedUrl);
      
      toast.success("Media uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload media");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateCapsule = async () => {
    if (!mediaUrl) {
      toast.error("Please upload media first");
      return;
    }

    try {
      setUploading(true);
      
      const capsuleData = {
        mediaType,
        mediaUrl,
        caption,
        duration: mediaType === "video" ? 15 : 5
      };

      await axios.post(
        `${API}/capsules?authorId=${currentUser.id}`,
        capsuleData
      );

      toast.success("🎉 Vibe Capsule created!");
      
      // Call callback first before closing modal
      if (onUploadComplete) {
        await onUploadComplete();
      }
      
      // Then close modal and reset
      handleClose();
    } catch (error) {
      console.error("Failed to create capsule:", error);
      toast.error("Failed to create Vibe Capsule");
    } finally {
      setUploading(false);
    }
  };

  // If opened externally, only render the modal
  if (isOpen) {
    return showModal ? ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div className="bg-gray-800 rounded-2xl max-w-lg w-full border border-gray-700" style={{ zIndex: 10000 }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Create Vibe Capsule</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Media Upload */}
            {!mediaUrl ? (
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
                <input
                  type="file"
                  id="media-upload-modal"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="media-upload-modal"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Upload Photo or Video</p>
                    <p className="text-gray-400 text-sm mt-1">Max 10MB for images, 150MB for videos</p>
                  </div>
                </label>
                {uploading && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                {mediaType === "image" ? (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full max-h-64"
                  />
                )}
                <button
                  onClick={() => setMediaUrl("")}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Add a caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write something..."
                className="w-full bg-gray-700 text-white rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
                rows={3}
                maxLength={150}
              />
              <p className="text-right text-gray-500 text-xs mt-1">{caption.length}/150</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleCreateCapsule}
              disabled={!mediaUrl || uploading}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                mediaUrl && !uploading
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {uploading ? "Uploading..." : "Share to Vibe Capsule"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    ) : null;
  }

  return (
    <>
      {/* Add Story Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col items-center gap-2 flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center border-4 border-gray-900 relative">
          <Plus size={24} className="text-white" />
        </div>
        <span className="text-xs text-white font-medium">Vibe Capsule</span>
      </button>

      {/* Upload Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-gray-800 rounded-2xl max-w-lg w-full border border-gray-700" style={{ zIndex: 10000 }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Create Vibe Capsule</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Media Upload */}
              {!mediaUrl ? (
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <Upload size={32} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Upload Photo or Video
                      </p>
                      <p className="text-sm text-gray-400">
                        Video must be 15-30 seconds
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-gray-900">
                  {mediaType === "image" ? (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <button
                    onClick={() => setMediaUrl("")}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
                  rows="3"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {caption.length}/200 characters
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateCapsule}
                disabled={!mediaUrl || uploading}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                {uploading ? "Creating..." : "Share Vibe Capsule"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default VibeCapsuleUpload;
