import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Users, Plus, Search } from "lucide-react";
import BottomNav from "../components/BottomNav";
import TribeCard from "../components/TribeCard";
import CreateTribeModal from "../components/CreateTribeModal";
import { toast } from "sonner";

// Helper to extract error message
const getErrorMsg = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (detail?.msg) return detail.msg;
  return error?.message || "An error occurred";
};

const Tribes = () => {
  const { currentUser } = useContext(AuthContext);
  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTribes();
  }, []);

  const fetchTribes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/tribes`);
      const tribesData = Array.isArray(res.data) ? res.data : [];
      setTribes(tribesData);
    } catch (error) {
      console.error("Failed to load tribes:", error);
      toast.error(getErrorMsg(error) || "Failed to load tribes");
    } finally {
      setLoading(false);
    }
  };

  const handleTribeCreated = (newTribe) => {
    if (newTribe && newTribe.id) {
      setTribes([newTribe, ...tribes]);
    }
    setShowCreateModal(false);
    toast.success("Tribe created successfully!");
  };

  const handleJoinLeave = async (tribeId, isMember) => {
    if (!currentUser) {
      toast.error("Please login to join tribes");
      return;
    }

    try {
      const endpoint = isMember ? "leave" : "join";
      const res = await axios.post(`${API}/tribes/${tribeId}/${endpoint}?userId=${currentUser.id}`);
      
      setTribes(tribes.map(t => {
        if (t.id === tribeId) {
          const newMembers = isMember
            ? (t.members || []).filter(m => m !== currentUser.id)
            : [...(t.members || []), currentUser.id];
          return { 
            ...t, 
            members: newMembers, 
            memberCount: res.data?.memberCount || newMembers.length 
          };
        }
        return t;
      }));
      
      toast.success(isMember ? "Left tribe successfully" : "Joined tribe successfully!");
    } catch (error) {
      console.error("Join/Leave failed:", error);
      toast.error(getErrorMsg(error) || "Action failed");
    }
  };

  // Filter tribes by search query
  const filteredTribes = tribes.filter(tribe => 
    tribe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tribe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tribe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-surface p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold neon-text flex items-center gap-2">
                <Users className="text-cyan-400" />
                Tribes
              </h1>
              <p className="text-gray-400 text-sm">Find your community</p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
              >
                <Plus size={20} />
                Create
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tribes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTribes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTribes.map(tribe => (
                <TribeCard
                  key={tribe.id}
                  tribe={tribe}
                  currentUser={currentUser}
                  onJoinLeave={handleJoinLeave}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No tribes found" : "No tribes yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Be the first to create a community!"}
              </p>
              {currentUser && !searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  Create a Tribe
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTribeModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onTribeCreated={handleTribeCreated}
        />
      )}

      <BottomNav active="discover" />
    </div>
  );
};

export default Tribes;
