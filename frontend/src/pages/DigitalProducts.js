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
import { toast } from "sonner";

const categoryIcons = {
  courses: BookOpen,
  ebooks: FileText,
  "study-material": GraduationCap,
  "placement-material": Briefcase,
  "digital-products": ShoppingBag,
  "money-making": DollarSign,
  pdfs: FileText,
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
  courses: "Courses",
  ebooks: "eBooks",
  "study-material": "Study Material",
  "placement-material": "Placement Material",
  "digital-products": "Digital Products",
  "money-making": "Money Making",
};

const DigitalProducts = () => {
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
      
      const res = await axios.get(`${API}/digital-products?${params.toString()}`);
      setProducts(res.data.products || []);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await axios.get(`${API}/digital-products/featured`);
      setFeaturedProducts(res.data || []);
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
      toast.error("Please login to like products");
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
      toast.error("Failed to like product");
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
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColors[product.category] || categoryColors.other} flex items-center justify-center`}>
              <IconComponent size={48} className="text-white/80" />
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 left-3">
            {product.isFree || product.price === 0 ? (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                FREE
              </span>
            ) : (
              <span className="px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
                ${product.price}
              </span>
            )}
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
                src={product.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.author.handle}`}
                alt={product.author.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-500">by {product.author.name}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download size={14} className="text-cyan-400" />
                {product.downloadCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {product.viewCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={14} className={isLiked ? "text-red-500" : ""} />
                {product.likeCount || 0}
              </span>
            </div>
            {product.fileType && (
              <span className="text-xs bg-gray-800 px-2 py-1 rounded uppercase">
                {product.fileType}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800" style={{ background: 'rgba(15, 2, 30, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="text-cyan-400" />
                Free Resources
              </h1>
              <p className="text-gray-400 text-sm">Download free courses, templates & more</p>
            </div>
            {currentUser && (
              <button
                onClick={() => navigate('/digital-products/upload')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload</span>
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search courses, ebooks, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 transition"
            >
              Search
            </button>
          </form>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === "all"
                    ? "bg-cyan-400 text-black"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              {categories.map(cat => {
                const IconComponent = categoryIcons[cat.name] || Package;
                return (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                      selectedCategory === cat.name
                        ? "bg-cyan-400 text-black"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    <IconComponent size={16} />
                    {categoryLabels[cat.name] || cat.name} ({cat.count})
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Viewed</option>
              <option value="downloads">Most Downloads</option>
            </select>

            {/* View Toggle */}
            <div className="hidden sm:flex bg-gray-800 rounded-lg p-1 ml-auto">
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Featured Section */}
        {featuredProducts.length > 0 && selectedCategory === "all" && !searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-cyan-400" />
                Featured Resources
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProducts.slice(0, 3).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-cyan-400" />
              {selectedCategory === "all" ? "All Resources" : `${categoryLabels[selectedCategory] || selectedCategory}`}
            </h2>
            <span className="text-gray-500 text-sm">{totalItems} items</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
              }>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="w-10 h-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                        >
                          1
                        </button>
                        {currentPage > 4 && <span className="text-gray-500 px-1">...</span>}
                      </>
                    )}
                    
                    {/* Page numbers around current page */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      if (currentPage > 3 && pageNum === 1) return null;
                      if (currentPage < totalPages - 2 && pageNum === totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg transition ${
                            currentPage === pageNum
                              ? "bg-cyan-400 text-black font-bold"
                              : "bg-gray-800 text-white hover:bg-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-gray-500 px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-10 h-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  <span className="text-gray-500 text-sm ml-4">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try a different search term" : "Be the first to share a free resource!"}
              </p>
              {currentUser && (
                <button
                  onClick={() => navigate('/digital-products/upload')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  Upload Resource
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

export default DigitalProducts;
