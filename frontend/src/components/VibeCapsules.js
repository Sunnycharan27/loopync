import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import VibeCapsuleUpload from "./VibeCapsuleUpload";
import VibeCapsuleViewer from "./VibeCapsuleViewer";
import { OptimizedAvatar } from "./OptimizedImage";
import { Plus } from "lucide-react";

const VibeCapsules = ({ currentUser, onCreateStory }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/capsules`);
      setStories(response.data.stories || []);
    } catch (error) {
      console.error("Failed to fetch capsules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (index) => {
    setSelectedStoryIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedStoryIndex(null);
    fetchCapsules();
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchCapsules();
  };

  // Find current user's story
  const userStoryIndex = stories.findIndex(s => s.author?.id === currentUser?.id);
  const userStory = userStoryIndex !== -1 ? stories[userStoryIndex] : null;
  const otherStories = stories.filter(s => s.author?.id !== currentUser?.id);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-800" />
              <div className="w-12 h-3 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          
          {/* ALWAYS show Upload Button first - for adding new stories */}
          {currentUser && (
            <button
              onClick={() => onCreateStory ? onCreateStory() : setShowUploadModal(true)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                  <Plus size={28} className="text-cyan-400" />
                </div>
              </div>
              <span className="text-xs text-cyan-400 font-semibold">Add Story</span>
            </button>
          )}

          {/* Current user's story (if exists) */}
          {currentUser && userStory && (
            <button
              onClick={() => handleStoryClick(userStoryIndex)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full border-2 border-gray-900 overflow-hidden">
                    <OptimizedAvatar
                      src={userStory.author?.avatar || null}
                      alt="Your Story"
                      size={60}
                      fallbackSeed={currentUser.name}
                      priority={true}
                    />
                  </div>
                </div>
                {/* Story count badge */}
                {userStory.capsules?.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 border-2 border-gray-900 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{userStory.capsules.length}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-white font-medium">Your Story</span>
            </button>
          )}

          {/* Other users' stories */}
          {otherStories.map((story) => {
            const actualIndex = stories.findIndex(s => s.author?.id === story.author?.id);
            return (
              <button
                key={story.author?.id}
                onClick={() => handleStoryClick(actualIndex)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-0.5">
                    <div className="w-full h-full rounded-full border-2 border-gray-900 overflow-hidden">
                      <OptimizedAvatar
                        src={story.author?.avatar || null}
                        alt={story.author?.name}
                        size={60}
                        fallbackSeed={story.author?.name}
                      />
                    </div>
                  </div>
                  {/* Story count badge */}
                  {story.capsules?.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-gray-900 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{story.capsules.length}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-white font-medium max-w-[60px] truncate">
                  {story.author?.name?.split(' ')[0] || 'User'}
                </span>
              </button>
            );
          })}

          {/* Empty state message when no stories */}
          {stories.length === 0 && (
            <div className="flex items-center text-gray-500 text-sm pl-4">
              No stories yet. Be the first to share!
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <VibeCapsuleUpload
          currentUser={currentUser}
          isOpen={showUploadModal}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Story Viewer */}
      {selectedStoryIndex !== null && (
        <VibeCapsuleViewer
          stories={stories}
          currentUserId={currentUser?.id}
          onClose={handleCloseViewer}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default VibeCapsules;
