import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import TopHeader from "../components/TopHeader";
import CreateFAB from "../components/CreateFAB";
import PostCard from "../components/PostCard";
import ComposerModal from "../components/ComposerModal";
import VibeCapsules from "../components/VibeCapsules";
import { toast } from "sonner";
import { emergentApi } from "../services/emergentApi";
// import GuidedTours from "../components/GuidedTours";

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`);
      setPosts(res.data);
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowComposer(false);
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const liked = res.data.action === "liked";
          return {
            ...p,
            stats: { ...p.stats, likes: res.data.likes },
            likedBy: liked 
              ? [...(p.likedBy || []), currentUser.id]
              : (p.likedBy || []).filter(id => id !== currentUser.id)
          };
        }
        return p;
      }));
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await axios.post(`${API}/posts/${postId}/repost?userId=${currentUser.id}`);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const reposted = res.data.action === "reposted";
          return {
            ...p,
            stats: { ...p.stats, reposts: res.data.reposts },
            repostedBy: reposted
              ? [...(p.repostedBy || []), currentUser.id]
              : (p.repostedBy || []).filter(id => id !== currentUser.id)
          };
        }
        return p;
      }));
      toast.success(res.data.action === "reposted" ? "Reposted!" : "Unreposted");
    } catch (error) {
      toast.error("Failed to repost");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const token = localStorage.getItem('loopync_token');
      await axios.delete(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 403) {
        toast.error("You can only delete your own posts");
      } else {
        toast.error(error.response?.data?.detail || "Failed to delete post");
      }
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <TopHeader title="Feed" subtitle="What's happening now" />

        {/* Vibe Capsules (Stories) */}
        <VibeCapsules currentUser={currentUser} />

        {/* Posts Feed */}
        <div className="space-y-4 px-4 mt-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 glass-card p-8">
              <p className="text-gray-400">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onRepost={handleRepost}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Create FAB - Only for authenticated users */}
      {currentUser && <CreateFAB onClick={() => setShowComposer(true)} />}
      
      {/* Login prompt for unauthenticated users */}
      {!currentUser && (
        <div className="fixed bottom-20 left-0 right-0 mx-4 mb-4">
          <div className="glass-card p-4 text-center border border-cyan-400/20">
            <p className="text-white mb-2">Want to post, like, or comment?</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
            >
              Login or Sign Up
            </button>
          </div>
        </div>
      )}
      
      <BottomNav active="home" />

      {currentUser && showComposer && (
        <ComposerModal
          currentUser={currentUser}
          onClose={() => setShowComposer(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Home;