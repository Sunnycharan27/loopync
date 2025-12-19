import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Plus, X, Upload, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";

const VibeCapsuleUpload = ({ currentUser, onUploadComplete, onClose, isOpen = false }) => {
  const [showModal, setShowModal] = useState(isOpen);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Multiple stories support
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");

  // Sync external isOpen prop with internal state
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setShowModal(isOpen);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowModal(false);
    setStories([]);
    setCurrentIndex(0);
    setCaption("");
    setUploadProgress(0);
    if (onClose) onClose();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newStories = [...stories];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video`);
        continue;
      }

      // Validate file size
      const maxSize = isVideo ? 150 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await axios.post(`${API}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        newStories.push({
          id: Date.now() + i,
          mediaUrl: uploadRes.data.url,
          mediaType: isImage ? "image" : "video",
          caption: "",
          duration: isVideo ? 15 : 5
        });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setStories(newStories);
    setCurrentIndex(newStories.length - 1);
    setUploading(false);
    setUploadProgress(0);
    
    if (newStories.length > stories.length) {
      toast.success(`${newStories.length - stories.length} file(s) uploaded!`);
    }
  };

  const handleRemoveStory = (index) => {
    const newStories = stories.filter((_, i) => i !== index);
    setStories(newStories);
    if (currentIndex >= newStories.length) {
      setCurrentIndex(Math.max(0, newStories.length - 1));
    }
  };

  const handleCaptionChange = (value) => {
    setCaption(value);
    if (stories[currentIndex]) {
      const newStories = [...stories];
      newStories[currentIndex].caption = value;
      setStories(newStories);
    }
  };

  const handleCreateCapsules = async () => {
    if (stories.length === 0) {
      toast.error("Please upload at least one photo or video");
      return;
    }

    try {
      setUploading(true);
      
      // Upload each story as a capsule
      for (const story of stories) {
        const capsuleData = {
          mediaType: story.mediaType,
          mediaUrl: story.mediaUrl,
          caption: story.caption || "",
          duration: story.mediaType === "video" ? 15 : 5
        };

        await axios.post(
          `${API}/capsules?authorId=${currentUser.id}`,
          capsuleData
        );
      }

      toast.success(`🎉 ${stories.length} Vibe Capsule${stories.length > 1 ? 's' : ''} created!`);
      
      if (onUploadComplete) {
        await onUploadComplete();
      }
      
      handleClose();
    } catch (error) {
      console.error("Failed to create capsules:", error);
      toast.error("Failed to create Vibe Capsules");
    } finally {
      setUploading(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCaption(stories[currentIndex - 1]?.caption || "");
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCaption(stories[currentIndex + 1]?.caption || "");
    }
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-hidden" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create Vibe Capsule</h2>
          <div className="flex items-center gap-2">
            {stories.length > 0 && (
              <span className="text-sm text-cyan-400 font-medium">
                {currentIndex + 1} / {stories.length}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Media Preview Area */}
          {stories.length === 0 ? (
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
              <input
                type="file"
                id="multi-media-upload"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="multi-media-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Upload size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Upload Photos or Videos</p>
                  <p className="text-gray-400 text-sm mt-1">Select multiple files to create a story sequence</p>
                  <p className="text-gray-500 text-xs mt-2">Max 10MB for images, 150MB for videos</p>
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
            <div className="relative">
              {/* Story Preview with Navigation */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px] mx-auto">
                {stories[currentIndex]?.mediaType === "image" ? (
                  <img
                    src={stories[currentIndex]?.mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={stories[currentIndex]?.mediaUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Delete current story */}
                <button
                  onClick={() => handleRemoveStory(currentIndex)}
                  className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={18} className="text-white" />
                </button>

                {/* Story counter */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {currentIndex + 1} / {stories.length}
                  </span>
                </div>

                {/* Navigation arrows */}
                {stories.length > 1 && (
                  <>
                    {currentIndex > 0 && (
                      <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft size={28} className="text-white" />
                      </button>
                    )}
                    {currentIndex < stories.length - 1 && (
                      <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight size={28} className="text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Story thumbnails */}
              {stories.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {stories.map((story, idx) => (
                    <button
                      key={story.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setCaption(story.caption || "");
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentIndex ? 'border-cyan-400 scale-105' : 'border-transparent opacity-60'
                      }`}
                    >
                      {story.mediaType === "image" ? (
                        <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-xs text-white">Video</span>
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {/* Add more button */}
                  <label
                    htmlFor="add-more-media"
                    className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors"
                  >
                    <Plus size={24} className="text-gray-400" />
                  </label>
                  <input
                    type="file"
                    id="add-more-media"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption for current story */}
          {stories.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Caption for story {currentIndex + 1} (Optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Add a caption for this story..."
                className="w-full bg-gray-800 text-white rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-gray-700"
                rows={2}
                maxLength={150}
              />
              <p className="text-right text-gray-500 text-xs mt-1">{caption.length}/150</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          {stories.length > 0 && (
            <label
              htmlFor="add-more-footer"
              className="px-4 py-3 border border-gray-600 text-gray-300 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add More
            </label>
          )}
          <input
            type="file"
            id="add-more-footer"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleCreateCapsules}
            disabled={stories.length === 0 || uploading}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              stories.length > 0 && !uploading
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {uploading ? "Uploading..." : `Share ${stories.length} Vibe Capsule${stories.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );

  // If opened externally, only render the modal
  if (isOpen) {
    return showModal ? ReactDOM.createPortal(renderModal(), document.body) : null;
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
      {showModal && ReactDOM.createPortal(renderModal(), document.body)}
    </>
  );
};

export default VibeCapsuleUpload;
