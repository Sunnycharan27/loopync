import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Users, Plus, Search, Grid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import TribeCardEnhanced from "../components/TribeCardEnhanced";
import TribeSettingsModal from "../components/TribeSettingsModal";
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
  const navigate = useNavigate();
  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [activeTab, setActiveTab] = useState("all"); // all, myTribes, joined

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

  const handleSettingsClick = (tribe) => {
    setSelectedTribe(tribe);
    setShowSettings(true);
  };

  const handleTribeUpdate = (updatedTribe) => {
    setTribes(tribes.map(t => t.id === updatedTribe.id ? updatedTribe : t));
  };

  const handleTribeDelete = () => {
    setTribes(tribes.filter(t => t.id !== selectedTribe.id));
    setShowSettings(false);
    setSelectedTribe(null);
  };

  // Filter tribes based on search and tab
  const filteredTribes = tribes.filter(tribe => {
    const matchesSearch = 
      tribe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tribe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tribe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "myTribes") {
      return tribe.ownerId === currentUser?.id;
    }
    if (activeTab === "joined") {
      return tribe.members?.includes(currentUser?.id) && tribe.ownerId !== currentUser?.id;
    }
    return true;
  });

  // Separate my tribes and others for sidebar display
  const myTribes = tribes.filter(t => t.ownerId === currentUser?.id);
  const joinedTribes = tribes.filter(t => t.members?.includes(currentUser?.id) && t.ownerId !== currentUser?.id);

  return (
    <div className="min-h-screen pb-20 flex" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col w-20 border-r border-gray-800 p-3 gap-2 sticky top-0 h-screen">
        {/* Create Button */}
        {currentUser && (
          <button
            onClick={() => navigate('/tribes/create')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center hover:shadow-lg hover:shadow-cyan-400/30 transition-all mx-auto"
            title="Create Tribe"
          >
            <Plus size={24} className="text-black" />
          </button>
        )}

        <div className="h-px bg-gray-800 my-2" />

        {/* My Tribes */}
        {myTribes.map(tribe => (
          <button
            key={tribe.id}
            onClick={() => navigate(`/tribes/${tribe.id}`)}
            className="w-14 h-14 rounded-2xl overflow-hidden hover:ring-2 ring-cyan-400 transition-all mx-auto relative group"
            title={tribe.name}
          >
            <img
              src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
              alt={tribe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">👑</span>
            </div>
          </button>
        ))}

        {/* Joined Tribes */}
        {joinedTribes.length > 0 && (
          <>
            <div className="h-px bg-gray-800 my-2" />
            {joinedTribes.map(tribe => (
              <button
                key={tribe.id}
                onClick={() => navigate(`/tribes/${tribe.id}`)}
                className="w-14 h-14 rounded-2xl overflow-hidden hover:ring-2 ring-cyan-400 transition-all mx-auto"
                title={tribe.name}
              >
                <img
                  src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
                  alt={tribe.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 border-b border-gray-800" style={{ background: 'rgba(15, 2, 30, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="text-cyan-400" />
                Tribes
              </h1>
              <p className="text-gray-400 text-sm">Find your community</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-cyan-400 text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-cyan-400 text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <List size={18} />
                </button>
              </div>
              
              {currentUser && (
                <button
                  onClick={() => navigate('/tribes/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Create</span>
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tribes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "all" 
                  ? "bg-cyan-400 text-black" 
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              All Tribes
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => setActiveTab("myTribes")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "myTribes" 
                      ? "bg-cyan-400 text-black" 
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  My Tribes ({myTribes.length})
                </button>
                <button
                  onClick={() => setActiveTab("joined")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "joined" 
                      ? "bg-cyan-400 text-black" 
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Joined ({joinedTribes.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredTribes.length > 0 ? (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-4"
            }>
              {filteredTribes.map(tribe => (
                <TribeCardEnhanced
                  key={tribe.id}
                  tribe={tribe}
                  currentUser={currentUser}
                  onJoinLeave={handleJoinLeave}
                  onSettingsClick={handleSettingsClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No tribes found" : activeTab === "myTribes" ? "You haven't created any tribes" : activeTab === "joined" ? "You haven't joined any tribes" : "No tribes yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Be the first to create a community!"}
              </p>
              {currentUser && !searchQuery && (
                <button
                  onClick={() => navigate('/tribes/create')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  Create a Tribe
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && selectedTribe && (
        <TribeSettingsModal
          tribe={selectedTribe}
          currentUser={currentUser}
          onClose={() => {
            setShowSettings(false);
            setSelectedTribe(null);
          }}
          onUpdate={handleTribeUpdate}
          onDelete={handleTribeDelete}
        />
      )}

      <BottomNav active="tribes" />
    </div>
  );
};

export default Tribes;
