import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { BookOpen, Download, ExternalLink, FileText, Video, Music, Image, Code, Search, Filter, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import TopHeader from "../components/TopHeader";

const RESOURCE_CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "ebook", label: "eBooks", icon: FileText },
  { id: "course", label: "Courses", icon: Video },
  { id: "tutorial", label: "Tutorials", icon: Code },
  { id: "template", label: "Templates", icon: Image },
  { id: "audio", label: "Audio", icon: Music },
];

const ResourceCard = ({ resource, onView }) => {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ebook': return <FileText size={16} />;
      case 'course': return <Video size={16} />;
      case 'tutorial': return <Code size={16} />;
      case 'template': return <Image size={16} />;
      case 'audio': return <Music size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  return (
    <div className="glass-card p-4 hover:bg-gray-800/30 transition-all">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {resource.coverImage ? (
            <img src={resource.coverImage} alt={resource.title} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <BookOpen size={32} className="text-indigo-400" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white truncate">{resource.title}</h3>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full flex items-center gap-1 flex-shrink-0">
              {getCategoryIcon(resource.category)}
              {resource.category || 'Resource'}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{resource.description}</p>
          
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Eye size={12} />
              {resource.viewCount || 0} views
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Download size={12} />
              {resource.downloadCount || 0} downloads
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {resource.resourceUrl && (
              <a
                href={resource.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition"
                onClick={() => onView?.(resource.id)}
              >
                <Download size={14} />
                Download
              </a>
            )}
            {resource.externalUrl && (
              <a
                href={resource.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-600 transition"
              >
                <ExternalLink size={14} />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourcesSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="glass-card p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-700 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-full mb-1" />
            <div className="h-3 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Resources = () => {
  const { currentUser } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Fetch from digital products (free resources)
      const res = await axios.get(`${API}/digital-products`);
      // Filter only free resources
      const freeResources = (res.data || []).filter(r => r.isFree || r.price === 0);
      setResources(freeResources);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      // Set empty array on error
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (resourceId) => {
    try {
      await axios.post(`${API}/digital-products/${resourceId}/view`);
    } catch (error) {
      // Silently fail - view tracking is not critical
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <TopHeader title="Free Resources" subtitle="Learn & grow together" />

        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {RESOURCE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resources List */}
        <div className="px-4 space-y-4">
          {loading ? (
            <ResourcesSkeleton />
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-400 text-sm">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to share a resource!"}
              </p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                onView={handleView}
              />
            ))
          )}
        </div>

        {/* Stats */}
        {!loading && resources.length > 0 && (
          <div className="px-4 mt-6">
            <div className="glass-card p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-400">{resources.length}</p>
                  <p className="text-xs text-gray-500">Total Resources</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500">Downloads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-400">FREE</p>
                  <p className="text-xs text-gray-500">Always</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="resources" />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Resources;
