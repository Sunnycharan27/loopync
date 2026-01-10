import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Grid, List, Download, Eye, Heart, Star,
  BookOpen, FileText, Package, Plus, GraduationCap, Briefcase,
  ArrowRight, TrendingUp, Clock, ChevronLeft, ChevronRight, DollarSign, ShoppingBag
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import TopHeader from "../components/TopHeader";
import { toast } from "sonner";

const categoryIcons = {
  courses: BookOpen,
  ebooks: FileText,
  "study-material": GraduationCap,
  "placement-material": Briefcase,
  "digital-products": ShoppingBag,
  "money-making": DollarSign,
  pdfs: FileText,
  all: Package,
};

const categoryColors = {
  courses: "from-blue-500 to-cyan-500",
  ebooks: "from-purple-500 to-pink-500",
  "study-material": "from-green-500 to-teal-500",
  "placement-material": "from-orange-500 to-amber-500",
  "digital-products": "from-pink-500 to-rose-500",
  "money-making": "from-yellow-500 to-orange-500",
  pdfs: "from-green-500 to-teal-500",
};

const categoryLabels = {
  all: "All Resources",
  courses: "Courses",
  ebooks: "eBooks",
  "study-material": "Study Material",
  "placement-material": "Placement Material",
  "digital-products": "Digital Products",
  "money-making": "Money Making",
  pdfs: "PDFs",
};

const ResourcesSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-2xl overflow-hidden border border-gray-800 animate-pulse">
        <div className="h-40 bg-gray-700" />
        <div className="p-4">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-full mb-1" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

const Resources = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    fetchProducts();
    fetchFeatured();
    fetchCategories();
  }, [selectedCategory, sortBy, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("sort_by", sortBy);
      params.append("skip", ((currentPage - 1) * itemsPerPage).toString());
      params.append("limit", itemsPerPage.toString());
      params.append("free_only", "true"); // Only fetch free resources
      
      const res = await axios.get(`${API}/digital-products?${params.toString()}`);
      const allProducts = res.data.products || res.data || [];
      // Filter for free products only (double check client-side)
      const freeProducts = Array.isArray(allProducts) 
        ? allProducts.filter(p => p.isFree || p.price === 0)
        : [];
      setProducts(freeProducts);
      setTotalItems(freeProducts.length);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await axios.get(`${API}/digital-products/featured`);
      const featured = res.data || [];
      // Filter for free products only
      const freeFeatured = Array.isArray(featured) 
        ? featured.filter(p => p.isFree || p.price === 0)
        : [];
      setFeaturedProducts(freeFeatured);
    } catch (error) {
      console.error("Failed to fetch featured:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/digital-products/categories`);
      setCategories(res.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLike = async (productId, e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please login to like resources");
      return;
    }
    
    try {
      const res = await axios.post(`${API}/digital-products/${productId}/like?userId=${currentUser.id}`);
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, likeCount: res.data.likeCount, likes: res.data.action === "liked" ? [...(p.likes || []), currentUser.id] : (p.likes || []).filter(id => id !== currentUser.id) }
          : p
      ));
    } catch (error) {
      toast.error("Failed to like resource");
    }
  };

  const ProductCard = ({ product }) => {
    const IconComponent = categoryIcons[product.category] || Package;
    const isLiked = currentUser && product.likes?.includes(currentUser.id);
    
    return (
      <div
        onClick={() => navigate(`/digital-products/${product.id}`)}
        className="rounded-2xl overflow-hidden cursor-pointer group border border-gray-800 hover:border-cyan-400/30 transition-all hover:shadow-lg hover:shadow-cyan-400/10"
        style={{ background: 'linear-gradient(180deg, #1a0b2e 0%, #0f021e 100%)' }}
      >
        {/* Cover Image */}
        <div className="relative h-40 overflow-hidden">
          {product.coverImage ? (
            <img
              src={product.coverImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColors[product.category] || "from-cyan-500 to-blue-500"} flex items-center justify-center`}>
              <IconComponent size={48} className="text-white/80" />
            </div>
          )}
          
          {/* Free Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              FREE
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-full text-xs text-white capitalize">
            {product.category}
          </div>

          {/* Like Button */}
          <button
            onClick={(e) => handleLike(product.id, e)}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition ${
              isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-white text-lg mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {product.title}
          </h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {product.description || "No description"}
          </p>

          {/* Author */}
          {product.author && (
            <div className="flex items-center gap-2 mb-3">
              <img
                src={product.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.author.name}`}
                alt={product.author.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-gray-400 text-xs">{product.author.name}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {product.viewCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Download size={14} />
                {product.downloadCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={14} />
                {product.likeCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <TopHeader title="Free Resources" subtitle="Learn & grow together" />
        
        <div className="px-4 pt-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search free resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </form>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <Package size={16} />
              All
            </button>
            {Object.keys(categoryLabels).filter(k => k !== 'all').map((cat) => {
              const IconComponent = categoryIcons[cat] || Package;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <IconComponent size={16} />
                  {categoryLabels[cat]}
                </button>
              );
            })}
          </div>

          {/* Featured Section */}
          {featuredProducts.length > 0 && selectedCategory === "all" && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Star className="text-yellow-400" size={20} />
                Featured Free Resources
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">
              {products.length} free resources found
            </span>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="downloads">Most Downloads</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
              >
                {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <ResourcesSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <Package size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No free resources found</h3>
              <p className="text-gray-400 text-sm mb-4">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to share a free resource!"}
              </p>
              {currentUser && (
                <button
                  onClick={() => navigate("/upload-digital-product")}
                  className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition"
                >
                  <Plus size={16} className="inline mr-2" />
                  Upload Resource
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
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
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Resources;
