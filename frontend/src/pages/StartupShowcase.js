import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { 
  Rocket, Plus, Search, Filter, Star, Users, Globe, Calendar, 
  TrendingUp, ExternalLink, Loader2, ChevronLeft, Award, Target,
  Briefcase, MapPin, Mail, Trophy, Sparkles, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const StartupShowcase = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showcases, setShowcases] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: Rocket },
    { id: 'tech', name: 'Tech', icon: Globe },
    { id: 'fintech', name: 'Fintech', icon: TrendingUp },
    { id: 'edtech', name: 'EdTech', icon: Award },
    { id: 'healthtech', name: 'HealthTech', icon: Target },
    { id: 'ecommerce', name: 'E-Commerce', icon: Briefcase },
    { id: 'social', name: 'Social', icon: Users }
  ];

  useEffect(() => {
    fetchShowcases();
  }, [selectedCategory]);

  const fetchShowcases = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const res = await axios.get(`${API}/showcases${params}`);
      
      const all = res.data || [];
      setFeatured(all.filter(s => s.isFeatured));
      setShowcases(all.filter(s => !s.isFeatured));
    } catch (error) {
      console.error('Failed to fetch showcases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShowcases = searchQuery
    ? showcases.filter(s => 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : showcases;

  const StartupCard = ({ startup, isFeatured = false }) => (
    <div 
      className={`rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${
        isFeatured 
          ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30' 
          : 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/30'
      }`}
      onClick={() => navigate(`/startup/${startup.id}`)}
    >
      {/* Cover Image */}
      <div className="relative h-40">
        <img
          src={startup.coverImage || startup.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${startup.id}`}
          alt={startup.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {isFeatured && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center gap-1">
            <Sparkles size={14} className="text-white" />
            <span className="text-xs font-bold text-white">Featured</span>
          </div>
        )}
        
        {startup.stage && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-cyan-400">{startup.stage}</span>
          </div>
        )}
        
        {/* Logo */}
        <div className="absolute -bottom-6 left-4">
          <img
            src={startup.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${startup.name}`}
            alt={startup.name}
            className="w-14 h-14 rounded-xl border-2 border-gray-900 object-cover bg-gray-900"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">{startup.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">{startup.tagline}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {startup.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-gray-300">
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-1 text-gray-400">
            <Users size={14} />
            <span className="text-xs">{startup.teamSize || '1-10'}</span>
          </div>
          {startup.location && (
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin size={14} />
              <span className="text-xs truncate max-w-[100px]">{startup.location}</span>
            </div>
          )}
          {startup.website && (
            <a 
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto p-1.5 hover:bg-gray-700 rounded-lg transition"
            >
              <ExternalLink size={14} className="text-cyan-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f021e] to-[#150525]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/90 backdrop-blur-lg border-b border-gray-800/50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full transition">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Rocket className="text-purple-400" size={24} />
                Startup Showcase
              </h1>
              <p className="text-sm text-gray-400">Discover innovative startups</p>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="ml-auto p-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl hover:opacity-90 transition"
              >
                <Plus size={20} className="text-white" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startups..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon size={16} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featured.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-400" size={20} />
                  Featured Startups
                </h2>
                <div className="grid gap-4">
                  {featured.map((startup) => (
                    <StartupCard key={startup.id} startup={startup} isFeatured />
                  ))}
                </div>
              </div>
            )}

            {/* All Startups */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Rocket className="text-purple-400" size={20} />
                All Startups ({filteredShowcases.length})
              </h2>
              
              {filteredShowcases.length === 0 ? (
                <div className="text-center py-12">
                  <Rocket size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No startups found</p>
                  {currentUser && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
                    >
                      Add Your Startup
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredShowcases.map((startup) => (
                    <StartupCard key={startup.id} startup={startup} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateStartupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchShowcases();
          }}
          currentUser={currentUser}
        />
      )}

      <BottomNav />
    </div>
  );
};

// Create Startup Modal Component
const CreateStartupModal = ({ onClose, onSuccess, currentUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'tech',
    stage: 'idea',
    website: '',
    location: '',
    teamSize: '1-10',
    tags: '',
    logo: '',
    coverImage: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const stages = ['idea', 'mvp', 'early-stage', 'growth', 'scale-up'];
  const teamSizes = ['1-10', '11-50', '51-200', '200+'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.tagline) {
      toast.error('Name and tagline are required');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/showcases?userId=${currentUser.id}`, {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Startup added to showcase!');
      onSuccess();
    } catch (error) {
      console.error('Failed to create showcase:', error);
      toast.error('Failed to add startup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[#1a0b2e] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a0b2e] p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Your Startup</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
            <span className="text-gray-400 text-xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Startup Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g., TechVenture"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tagline *</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({...formData, tagline: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="One line description"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Tell us about your startup..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="tech">Tech</option>
                <option value="fintech">Fintech</option>
                <option value="edtech">EdTech</option>
                <option value="healthtech">HealthTech</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                {stages.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Team Size</label>
              <select
                value={formData.teamSize}
                onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                {teamSizes.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                placeholder="City, Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="AI, SaaS, B2B"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Rocket size={20} />
                Add Startup
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartupShowcase;
