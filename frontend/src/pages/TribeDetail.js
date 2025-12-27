import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, UserMinus, Settings, Image, Video, Send, Share2, Rocket, Award, UsersRound, Briefcase, Star, Code, Building2, Filter, Dumbbell, Utensils, Tag, Calendar, Trophy, MessageCircle, Trash2, Lightbulb, BookOpen, Sparkles, Handshake, Palette } from "lucide-react";
import { toast } from "sonner";
import PostCard from "../components/PostCard";
import { getMediaUrl } from "../utils/mediaUtils";
import BottomNav from "../components/BottomNav";
import TribeSettingsModal from "../components/TribeSettingsModal";
import ProjectCard from "../components/ProjectCard";
import CertificationCard from "../components/CertificationCard";
import TeamPostCard from "../components/TeamPostCard";
import SkillTag from "../components/SkillTag";
import CreateWorkoutModal from "../components/tribe/CreateWorkoutModal";
import CreateChallengeModal from "../components/tribe/CreateChallengeModal";
import CreateMenuItemModal from "../components/tribe/CreateMenuItemModal";
import CreateDealModal from "../components/tribe/CreateDealModal";
import CreateReviewModal from "../components/tribe/CreateReviewModal";
import AddTrainerModal from "../components/tribe/AddTrainerModal";
import CreateProjectModal from "../components/tribe/CreateProjectModal";
import CreateJobModal from "../components/tribe/CreateJobModal";
import CreateCertificationModal from "../components/tribe/CreateCertificationModal";
import CreateTeamPostModal from "../components/tribe/CreateTeamPostModal";
import CreateEventModal from "../components/tribe/CreateEventModal";
import CreateIdeaModal from "../components/tribe/CreateIdeaModal";
import CreateShowcaseModal from "../components/tribe/CreateShowcaseModal";
import CreateResourceModal from "../components/tribe/CreateResourceModal";
import CreateCollaborationModal from "../components/tribe/CreateCollaborationModal";
import CreateServiceModal from "../components/tribe/CreateServiceModal";
import CreatePortfolioModal from "../components/tribe/CreatePortfolioModal";

const getErrorMsg = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (detail?.msg) return detail.msg;
  return error?.message || "An error occurred";
};

// Category-based tab configurations
const CATEGORY_TABS = {
  college: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "projects", label: "Projects", icon: Rocket },
    { id: "certifications", label: "Certs", icon: Award },
    { id: "teamPosts", label: "Teams", icon: UsersRound },
    { id: "internships", label: "Jobs", icon: Briefcase },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "members", label: "Members", icon: Users }
  ],
  tech: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "projects", label: "Projects", icon: Rocket },
    { id: "certifications", label: "Certs", icon: Award },
    { id: "teamPosts", label: "Teams", icon: UsersRound },
    { id: "internships", label: "Jobs", icon: Briefcase },
    { id: "ideas", label: "Ideas", icon: Lightbulb },
    { id: "showcases", label: "Startups", icon: Sparkles },
    { id: "members", label: "Members", icon: Users }
  ],
  fitness: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "workouts", label: "Workouts", icon: Dumbbell },
    { id: "challenges", label: "Challenges", icon: Trophy },
    { id: "trainers", label: "Trainers", icon: Users },
    { id: "events", label: "Events", icon: Calendar },
    { id: "members", label: "Members", icon: Users }
  ],
  food: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "deals", label: "Deals", icon: Tag },
    { id: "events", label: "Events", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "members", label: "Members", icon: Users }
  ],
  business: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "portfolios", label: "Portfolio", icon: Palette },
    { id: "deals", label: "Deals", icon: Tag },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "members", label: "Members", icon: Users }
  ],
  creative: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "portfolios", label: "Portfolio", icon: Palette },
    { id: "collaborations", label: "Collabs", icon: Handshake },
    { id: "events", label: "Events", icon: Calendar },
    { id: "members", label: "Members", icon: Users }
  ],
  startup: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "showcases", label: "Startups", icon: Sparkles },
    { id: "ideas", label: "Ideas", icon: Lightbulb },
    { id: "internships", label: "Jobs", icon: Briefcase },
    { id: "events", label: "Events", icon: Calendar },
    { id: "members", label: "Members", icon: Users }
  ],
  default: [
    { id: "posts", label: "Posts", icon: Image },
    { id: "events", label: "Events", icon: Calendar },
    { id: "members", label: "Members", icon: Users }
  ]
};

const TribeDetail = () => {
  const { tribeId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tribe, setTribe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [teamPosts, setTeamPosts] = useState([]);
  const [internships, setInternships] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [events, setEvents] = useState([]);
  const [services, setServices] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [showcases, setShowcases] = useState([]);
  const [resources, setResources] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  // Modal states for tribe content creation
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showTeamPostModal, setShowTeamPostModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [skillFilter, setSkillFilter] = useState("");


  const tribeCategory = tribe?.category || 'default';
  const tabs = CATEGORY_TABS[tribeCategory] || CATEGORY_TABS.default;
  const isAdmin = tribe?.ownerId === currentUser?.id || tribe?.creatorId === currentUser?.id || tribe?.admins?.includes(currentUser?.id);

  useEffect(() => {
    if (tribeId) fetchTribeDetails();
  }, [tribeId]);

  useEffect(() => {
    if (tribe && isMember) {
      fetchTabContent();
    }
  }, [activeTab, tribe, skillFilter]);

  const fetchTabContent = async () => {
    switch(activeTab) {
      case "projects": await fetchProjects(); break;
      case "certifications": await fetchCertifications(); break;
      case "teamPosts": await fetchTeamPosts(); break;
      case "internships": await fetchInternships(); break;
      case "workouts": await fetchWorkouts(); break;
      case "challenges": await fetchChallenges(); break;
      case "menu": await fetchMenuItems(); break;
      case "deals": await fetchDeals(); break;
      case "trainers": await fetchTrainers(); break;
      case "reviews": await fetchReviews(); break;
      case "events": await fetchEvents(); break;
      case "services": await fetchServices(); break;
      case "portfolios": await fetchPortfolios(); break;
      case "ideas": await fetchIdeas(); break;
      case "showcases": await fetchShowcases(); break;
      case "resources": await fetchResources(); break;
      case "collaborations": await fetchCollaborations(); break;
      default: break;
    }
  };

  const fetchTribeDetails = async () => {
    setLoading(true);
    try {
      const tribeRes = await axios.get(`${API}/tribes/${tribeId}`);
      setTribe(tribeRes.data);
      
      try {
        const membersRes = await axios.get(`${API}/tribes/${tribeId}/members`);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      } catch (err) { console.error("Failed to fetch members:", err); }
      
      const membersList = tribeRes.data?.members || [];
      if (currentUser && membersList.includes(currentUser.id)) {
        try {
          const postsRes = await axios.get(`${API}/tribes/${tribeId}/posts`);
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        } catch (postError) { setPosts([]); }
      }
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to load tribe");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const memberIds = members.map(m => m.id).join(',');
      const params = skillFilter ? `?skill=${skillFilter}&tribeId=${tribeId}` : `?tribeId=${tribeId}`;
      const res = await axios.get(`${API}/projects${params}`);
      setProjects(res.data || []);
    } catch (error) { console.error("Failed to fetch projects"); }
  };

  const fetchCertifications = async () => {
    try {
      const params = skillFilter ? `?skill=${skillFilter}&tribeId=${tribeId}` : `?tribeId=${tribeId}`;
      const res = await axios.get(`${API}/certifications${params}`);
      setCertifications(res.data || []);
    } catch (error) { console.error("Failed to fetch certifications"); }
  };

  const fetchTeamPosts = async () => {
    try {
      const res = await axios.get(`${API}/team-posts?tribeId=${tribeId}`);
      setTeamPosts(res.data || []);
    } catch (error) { console.error("Failed to fetch team posts"); }
  };

  const fetchInternships = async () => {
    try {
      const res = await axios.get(`${API}/internships?tribeId=${tribeId}`);
      setInternships(res.data || []);
    } catch (error) { console.error("Failed to fetch internships"); }
  };

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get(`${API}/workouts?tribeId=${tribeId}`);
      setWorkouts(res.data || []);
    } catch (error) { console.error("Failed to fetch workouts"); }
  };

  const fetchChallenges = async () => {
    try {
      const res = await axios.get(`${API}/challenges?tribeId=${tribeId}`);
      setChallenges(res.data || []);
    } catch (error) { console.error("Failed to fetch challenges"); }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get(`${API}/menu-items?tribeId=${tribeId}`);
      setMenuItems(res.data || []);
    } catch (error) { console.error("Failed to fetch menu"); }
  };

  const fetchDeals = async () => {
    try {
      const res = await axios.get(`${API}/deals?tribeId=${tribeId}`);
      setDeals(res.data || []);
    } catch (error) { console.error("Failed to fetch deals"); }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/reviews?tribeId=${tribeId}`);
      setReviews(res.data || []);
    } catch (error) { console.error("Failed to fetch reviews"); }
  };

  const fetchTrainers = async () => {
    try {
      const res = await axios.get(`${API}/tribes/${tribeId}/trainers`);
      setTrainers(res.data || []);
    } catch (error) { console.error("Failed to fetch trainers"); }
  };

  const removeTrainer = async (trainerId) => {
    if (!confirm("Remove this trainer from the tribe?")) return;
    try {
      await axios.delete(`${API}/tribes/${tribeId}/trainers/${trainerId}?userId=${currentUser.id}`);
      toast.success("Trainer removed");
      fetchTrainers();
    } catch (error) {
      toast.error("Failed to remove trainer");
    }
  };

  const joinTribe = async () => {
    if (!currentUser) { toast.error("Please login to join"); navigate('/auth'); return; }
    setJoining(true);
    try {
      await axios.post(`${API}/tribes/${tribeId}/join?userId=${currentUser.id}`);
      toast.success("Joined tribe!");
      fetchTribeDetails();
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to join tribe");
    } finally { setJoining(false); }
  };

  const leaveTribe = async () => {
    if (!currentUser) return;
    setJoining(true);
    try {
      await axios.post(`${API}/tribes/${tribeId}/leave?userId=${currentUser.id}`);
      toast.success("Left tribe");
      setTribe({ ...tribe, members: (tribe.members || []).filter(m => m !== currentUser.id), memberCount: Math.max(0, (tribe.memberCount || 1) - 1) });
      setPosts([]);
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to leave tribe");
    } finally { setJoining(false); }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setNewPostMedia(file);
  };

  const createPost = async () => {
    if (!currentUser) { toast.error("Please login to post"); return; }
    if (!newPostText.trim() && !newPostMedia) { toast.error("Please add text or media"); return; }
    setPosting(true);
    try {
      let mediaUrl = null;
      if (newPostMedia) {
        const formData = new FormData();
        formData.append('file', newPostMedia);
        const uploadRes = await axios.post(`${API}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        mediaUrl = uploadRes.data.url;
      }
      const postData = { text: newPostText.trim(), authorId: currentUser.id, tribeId: tribeId, mediaUrl: mediaUrl };
      const postRes = await axios.post(`${API}/tribes/${tribeId}/posts`, postData);
      setPosts([{ ...postRes.data, author: currentUser }, ...posts]);
      setNewPostText(""); setNewPostMedia(null);
      toast.success("Post created!");
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to create post");
    } finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    if (!currentUser) { toast.error("Please login to like"); return; }
    try {
      const res = await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
      setPosts(posts.map(p => p.id === postId ? { ...p, ...res.data, likeCount: res.data.likeCount } : p));
    } catch (error) { toast.error(getErrorMsg(error) || "Failed to like post"); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await axios.delete(`${API}/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted!");
    } catch (error) { toast.error(getErrorMsg(error) || "Failed to delete post"); }
  };

  const handleRepost = async (postId) => {
    if (!currentUser) { toast.error("Please login to repost"); return; }
    try {
      await axios.post(`${API}/posts/${postId}/repost?userId=${currentUser.id}`);
      toast.success("Reposted!");
    } catch (error) { toast.error(getErrorMsg(error) || "Failed to repost"); }
  };

  const tribeMembers = tribe?.members || [];
  const isMember = currentUser?.id && tribeMembers.includes(currentUser.id);
  const isOwner = currentUser?.id === tribe?.ownerId;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
    </div>
  );

  if (!tribe) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
      <div className="text-center">
        <Users size={64} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-white mb-2">Tribe not found</h2>
        <button onClick={() => navigate('/tribes')} className="px-6 py-2 bg-cyan-400 text-black rounded-xl font-semibold">Browse Tribes</button>
      </div>
    </div>
  );

  const defaultCover = `https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop`;
  const categoryColors = {
    college: 'from-blue-500 to-purple-500',
    tech: 'from-cyan-400 to-blue-500',
    fitness: 'from-orange-500 to-red-500',
    food: 'from-yellow-500 to-orange-500',
    business: 'from-green-500 to-teal-500'
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 w-full">
        <img src={tribe.coverImage || defaultCover} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f021e] via-transparent to-transparent" />
        <button onClick={() => navigate('/tribes')} className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwner && <button onClick={() => setShowSettings(true)} className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition"><Settings size={20} className="text-white" /></button>}
          <button className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition"><Share2 size={20} className="text-white" /></button>
        </div>
        <div className="absolute -bottom-12 left-6">
          <img src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`} alt={tribe.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#0f021e] bg-gray-800" />
        </div>
      </div>

      {/* Tribe Info */}
      <div className="max-w-4xl mx-auto px-4 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{tribe.name}</h1>
              {tribe.category && (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryColors[tribe.category] || 'from-gray-500 to-gray-600'} text-white capitalize`}>
                  {tribe.category}
                </span>
              )}
            </div>
            <p className="text-gray-400 mb-3">{tribe.description || 'No description'}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-gray-400"><Users size={16} className="text-cyan-400" />{tribe.memberCount || tribeMembers.length} members</span>
              <span className={`px-3 py-1 rounded-full text-xs ${tribe.type === 'private' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {tribe.type === 'private' ? '🔒 Private' : '🌐 Public'}
              </span>
            </div>
            {Array.isArray(tribe.tags) && tribe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {tribe.tags.map((tag, idx) => <SkillTag key={idx} skill={tag} onClick={() => setSkillFilter(tag)} />)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {currentUser && (isOwner ? (
              <button onClick={() => setShowSettings(true)} className="px-6 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30 flex items-center gap-2"><Settings size={18} />Manage</button>
            ) : isMember ? (
              <button onClick={leaveTribe} disabled={joining} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50">
                {joining ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserMinus size={18} />}Leave
              </button>
            ) : (
              <button onClick={joinTribe} disabled={joining} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50">
                {joining ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <UserPlus size={18} />}Join
              </button>
            ))}
            {!currentUser && <button onClick={() => navigate('/auth')} className="px-6 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">Login to Join</button>}
          </div>
        </div>

        {/* Member Avatars */}
        {members.length > 0 && (
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
            <div className="flex -space-x-2">
              {members.slice(0, 8).map((member, idx) => (
                <img key={member.id || idx} src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.handle || idx}`} alt={member.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                  title={member.name} onClick={() => navigate(`/@${member.handle}`)} />
              ))}
              {members.length > 8 && <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center"><span className="text-xs text-white font-medium">+{members.length - 8}</span></div>}
            </div>
            <span className="text-sm text-gray-400">{members.slice(0, 2).map(m => m.name).join(", ")}{members.length > 2 && ` and ${members.length - 2} others`}</span>
          </div>
        )}

        {/* Category-based Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${activeTab === tab.id ? 'bg-cyan-400 text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {/* Skill Filter for relevant tabs */}
        {["projects", "certifications", "workouts"].includes(activeTab) && isMember && (
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Filter by skill..." value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-cyan-400" />
            </div>
            {skillFilter && <button onClick={() => setSkillFilter("")} className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:text-white">Clear</button>}
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {showSettings && <TribeSettingsModal tribe={tribe} currentUser={currentUser} onClose={() => setShowSettings(false)} onUpdate={(t) => setTribe(t)} onDelete={() => navigate('/tribes')} />}
      
      {/* Tribe Content Creation Modals */}
      {showWorkoutModal && (
        <CreateWorkoutModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowWorkoutModal(false)} 
          onCreated={() => fetchWorkouts()} 
        />
      )}
      {showChallengeModal && (
        <CreateChallengeModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowChallengeModal(false)} 
          onCreated={() => fetchChallenges()} 
        />
      )}
      {showMenuItemModal && (
        <CreateMenuItemModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowMenuItemModal(false)} 
          onCreated={() => fetchMenuItems()} 
        />
      )}
      {showDealModal && (
        <CreateDealModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowDealModal(false)} 
          onCreated={() => fetchDeals()} 
        />
      )}
      {showReviewModal && (
        <CreateReviewModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowReviewModal(false)} 
          onCreated={() => fetchReviews()} 
        />
      )}
      {showAddTrainerModal && (
        <AddTrainerModal 
          tribeId={tribeId} 
          currentUser={currentUser} 
          onClose={() => setShowAddTrainerModal(false)} 
          onAdded={() => fetchTrainers()} 
        />
      )}
      
      <BottomNav active="tribes" />
    </div>
  );

  function renderTabContent() {
    // Posts Tab (All categories)
    if (activeTab === "posts") return (
      <div className="space-y-6">
        {isMember && (
          <div className="rounded-2xl p-4 border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
            <div className="flex gap-3">
              <img src={getMediaUrl(currentUser?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.handle}`} alt="You" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder={`Share something with ${tribe.name}...`}
                  className="w-full bg-gray-800/50 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none border border-gray-700" rows="2" />
                {newPostMedia && (
                  <div className="mt-2 relative">
                    {newPostMedia.type.startsWith('video/') ? <video src={URL.createObjectURL(newPostMedia)} className="w-full max-h-48 object-cover rounded-xl" controls /> : <img src={URL.createObjectURL(newPostMedia)} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />}
                    <button onClick={() => setNewPostMedia(null)} className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-xs">Remove</button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1">
                    <label className="p-2 hover:bg-gray-800 rounded-lg cursor-pointer"><Image size={18} className="text-cyan-400" /><input type="file" accept="image/*" className="hidden" onChange={handleMediaSelect} /></label>
                    <label className="p-2 hover:bg-gray-800 rounded-lg cursor-pointer"><Video size={18} className="text-cyan-400" /><input type="file" accept="video/*" className="hidden" onChange={handleMediaSelect} /></label>
                  </div>
                  <button onClick={createPost} disabled={posting || (!newPostText.trim() && !newPostMedia)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-sm font-semibold disabled:opacity-50">
                    {posting ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div> : <Send size={16} />}Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {!isMember && currentUser && <JoinPrompt onJoin={joinTribe} joining={joining} />}
        {!currentUser && <LoginPrompt navigate={navigate} />}
        {isMember && (posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLike} onDelete={handleDelete} onRepost={handleRepost} />) : <EmptyState icon={Image} message="No posts yet" />)}
      </div>
    );

    // College/Tech: Projects
    if (activeTab === "projects") return (
      <div className="space-y-4">
        <TabHeader title="Member Projects" buttonText="Add Project" buttonIcon={Rocket} onClick={() => navigate('/projects/create')} />
        {projects.length > 0 ? projects.map(p => <ProjectCard key={p.id} project={p} currentUser={currentUser} onSkillClick={setSkillFilter} />) : <EmptyState icon={Code} message="No projects yet" />}
      </div>
    );

    // College/Tech: Certifications
    if (activeTab === "certifications") return (
      <div className="space-y-4">
        <TabHeader title="Member Certifications" buttonText="Add Cert" buttonIcon={Award} onClick={() => navigate('/certifications/create')} />
        {certifications.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{certifications.map(c => <CertificationCard key={c.id} cert={c} onSkillClick={setSkillFilter} />)}</div> : <EmptyState icon={Award} message="No certifications yet" />}
      </div>
    );

    // College/Tech: Team Posts
    if (activeTab === "teamPosts") return (
      <div className="space-y-4">
        <TabHeader title="Looking for Team" buttonText="Find Team" buttonIcon={UsersRound} onClick={() => navigate('/team-posts/create')} />
        {teamPosts.length > 0 ? teamPosts.map(p => <TeamPostCard key={p.id} post={p} currentUser={currentUser} />) : <EmptyState icon={UsersRound} message="No team posts yet" />}
      </div>
    );

    // College/Tech: Internships
    if (activeTab === "internships") return (
      <div className="space-y-4">
        <TabHeader title="Internships & Jobs" buttonText="Post Job" buttonIcon={Briefcase} onClick={() => navigate('/internships/create')} />
        {internships.length > 0 ? internships.map(j => <InternshipCard key={j.id} job={j} />) : <EmptyState icon={Briefcase} message="No jobs posted yet" />}
      </div>
    );

    // Fitness: Workouts
    if (activeTab === "workouts") return (
      <div className="space-y-4">
        <TabHeader title="Workouts" buttonText="Add Workout" buttonIcon={Dumbbell} onClick={() => setShowWorkoutModal(true)} />
        {workouts.length > 0 ? workouts.map(w => <WorkoutCard key={w.id} workout={w} />) : <EmptyState icon={Dumbbell} message="No workouts shared yet" />}
      </div>
    );

    // Fitness: Challenges
    if (activeTab === "challenges") return (
      <div className="space-y-4">
        <TabHeader title="Fitness Challenges" buttonText="Create Challenge" buttonIcon={Trophy} onClick={() => setShowChallengeModal(true)} />
        {challenges.length > 0 ? challenges.map(c => <ChallengeCard key={c.id} challenge={c} />) : <EmptyState icon={Trophy} message="No active challenges" />}
      </div>
    );

    // Food: Menu
    if (activeTab === "menu") return (
      <div className="space-y-4">
        <TabHeader title="Menu Items" buttonText="Add Item" buttonIcon={Utensils} onClick={() => setShowMenuItemModal(true)} />
        {menuItems.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{menuItems.map(m => <MenuItemCard key={m.id} item={m} />)}</div> : <EmptyState icon={Utensils} message="No menu items yet" />}
      </div>
    );

    // Food/Business: Deals
    if (activeTab === "deals") return (
      <div className="space-y-4">
        <TabHeader title="Deals & Offers" buttonText="Add Deal" buttonIcon={Tag} onClick={() => setShowDealModal(true)} />
        {deals.length > 0 ? deals.map(d => <DealCard key={d.id} deal={d} />) : <EmptyState icon={Tag} message="No deals available" />}
      </div>
    );

    // Food/Business: Reviews
    if (activeTab === "reviews") return (
      <div className="space-y-4">
        <TabHeader title="Reviews" buttonText="Write Review" buttonIcon={Star} onClick={() => setShowReviewModal(true)} />
        {reviews.length > 0 ? reviews.map(r => <ReviewCard key={r.id} review={r} />) : <EmptyState icon={Star} message="No reviews yet" />}
      </div>
    );

    // Fitness: Trainers Tab
    if (activeTab === "trainers") return (
      <div className="space-y-4">
        {isAdmin && (
          <TabHeader title="Trainers" buttonText="Add Trainer" buttonIcon={UserPlus} onClick={() => setShowAddTrainerModal(true)} />
        )}
        {!isAdmin && <h3 className="text-lg font-semibold text-white">Trainers</h3>}
        {trainers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trainers.map(trainer => (
              <TrainerCard 
                key={trainer.id} 
                trainer={trainer} 
                isAdmin={isAdmin}
                onRemove={() => removeTrainer(trainer.id)}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} message="No trainers added yet" />
        )}
      </div>
    );

    // Members Tab (All categories)
    if (activeTab === "members") return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map(m => <MemberCard key={m.id} member={m} tribe={tribe} navigate={navigate} />)}
      </div>
    );

    return null;
  }
};

// Helper Components
const TabHeader = ({ title, buttonText, buttonIcon: Icon, onClick }) => (
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <button onClick={onClick} className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black rounded-lg text-sm font-semibold flex items-center gap-2"><Icon size={16} />{buttonText}</button>
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <Icon size={48} className="mx-auto mb-3 text-gray-600" />
    <p className="text-gray-400">{message}</p>
  </div>
);

const JoinPrompt = ({ onJoin, joining }) => (
  <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <Users size={48} className="mx-auto mb-3 text-gray-600" />
    <h3 className="text-xl font-semibold text-white mb-2">Members Only</h3>
    <p className="text-gray-400 mb-4">Join this tribe to participate</p>
    <button onClick={onJoin} disabled={joining} className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold">{joining ? 'Joining...' : 'Join Tribe'}</button>
  </div>
);

const LoginPrompt = ({ navigate }) => (
  <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <Users size={48} className="mx-auto mb-3 text-gray-600" />
    <h3 className="text-xl font-semibold text-white mb-2">Login Required</h3>
    <button onClick={() => navigate('/auth')} className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold">Login / Sign Up</button>
  </div>
);

const MemberCard = ({ member, tribe, navigate }) => (
  <div onClick={() => navigate(`/@${member.handle}`)} className="flex items-center gap-3 p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 cursor-pointer transition" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.handle}`} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-white truncate">{member.name}</h4>
        {member.id === tribe.ownerId && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Owner</span>}
      </div>
      <p className="text-sm text-gray-400">@{member.handle}</p>
    </div>
  </div>
);

const InternshipCard = ({ job }) => {
  const navigate = useNavigate();
  return (
    <div className="p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 transition" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-white text-lg">{job.title}</h4>
          <p className="text-cyan-400 text-sm flex items-center gap-1"><Building2 size={14} />{job.company}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${job.type === 'internship' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{job.type}</span>
      </div>
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{job.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{job.location} • {job.stipend || 'Unpaid'}</span>
        <button onClick={() => navigate(`/internships/${job.id}/apply`)} className="px-4 py-1.5 bg-cyan-400 text-black rounded-lg text-sm font-semibold">Apply</button>
      </div>
    </div>
  );
};

const WorkoutCard = ({ workout }) => (
  <div className="p-4 rounded-xl border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center"><Dumbbell size={24} className="text-orange-400" /></div>
      <div>
        <h4 className="font-bold text-white">{workout.title}</h4>
        <p className="text-sm text-gray-400">{workout.duration} • {workout.difficulty}</p>
      </div>
    </div>
  </div>
);

const ChallengeCard = ({ challenge }) => (
  <div className="p-4 rounded-xl border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center"><Trophy size={24} className="text-yellow-400" /></div>
      <div className="flex-1">
        <h4 className="font-bold text-white">{challenge.title}</h4>
        <p className="text-sm text-gray-400">{challenge.participants} participants</p>
      </div>
      <button className="px-3 py-1 bg-yellow-500 text-black rounded-lg text-sm font-semibold">Join</button>
    </div>
  </div>
);

const MenuItemCard = ({ item }) => (
  <div className="p-4 rounded-xl border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
    <h4 className="font-bold text-white">{item.name}</h4>
    <p className="text-sm text-gray-400 mb-2">{item.description}</p>
    <div className="flex justify-between items-center">
      <span className="text-cyan-400 font-semibold">₹{item.price}</span>
      {item.isVeg !== undefined && <span className={`text-xs ${item.isVeg ? 'text-green-400' : 'text-red-400'}`}>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>}
    </div>
  </div>
);

const DealCard = ({ deal }) => (
  <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
    <div className="flex items-center gap-2 mb-2">
      <Tag size={16} className="text-yellow-400" />
      <span className="text-yellow-400 font-bold">{deal.discount}% OFF</span>
    </div>
    <h4 className="font-bold text-white">{deal.title}</h4>
    <p className="text-sm text-gray-400">{deal.description}</p>
    <p className="text-xs text-gray-500 mt-2">Valid till: {deal.validTill}</p>
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="p-4 rounded-xl border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
    <div className="flex items-center gap-3 mb-2">
      <img src={review.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} className="w-8 h-8 rounded-full" alt="" />
      <div>
        <p className="text-white font-semibold">{review.author?.name}</p>
        <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}</div>
      </div>
    </div>
    <p className="text-gray-400 text-sm">{review.text}</p>
  </div>
);

const TrainerCard = ({ trainer, isAdmin, onRemove, navigate }) => (
  <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5 relative">
    {/* Admin Remove Button */}
    {isAdmin && (
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-full transition"
      >
        <Trash2 size={14} className="text-red-400" />
      </button>
    )}
    
    <div className="flex items-start gap-3">
      <img 
        src={trainer.avatar || trainer.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trainer.name}`} 
        alt={trainer.name || trainer.user?.name}
        className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500/30 cursor-pointer"
        onClick={() => navigate(`/profile/${trainer.userId}`)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white truncate">{trainer.name || trainer.user?.name}</h4>
          {trainer.isVerified && (
            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
              <Award size={10} /> Verified
            </span>
          )}
        </div>
        <p className="text-orange-400 text-sm">{trainer.specialization}</p>
        {trainer.experience && (
          <p className="text-gray-400 text-xs mt-1">{trainer.experience}</p>
        )}
      </div>
    </div>
    
    {trainer.bio && (
      <p className="text-gray-400 text-sm mt-3 line-clamp-2">{trainer.bio}</p>
    )}
    
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
      <span className={`text-xs px-2 py-1 rounded-full ${
        trainer.availability === 'Available' 
          ? 'bg-green-500/20 text-green-400' 
          : trainer.availability === 'Currently Unavailable'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-yellow-500/20 text-yellow-400'
      }`}>
        {trainer.availability}
      </span>
      <button 
        onClick={() => navigate(`/profile/${trainer.userId}`)}
        className="text-sm text-cyan-400 hover:text-cyan-300 transition"
      >
        View Profile →
      </button>
    </div>
  </div>
);

export default TribeDetail;
