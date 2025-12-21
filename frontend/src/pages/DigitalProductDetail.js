import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Eye, Heart, Share2, Clock, User,
  BookOpen, FileText, Palette, Music, Video, Code, Package,
  ExternalLink, Star, CheckCircle
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { toast } from "sonner";

const categoryIcons = {
  courses: BookOpen,
  ebooks: FileText,
  templates: Palette,
  software: Code,
  graphics: Palette,
  audio: Music,
  video: Video,
  documents: FileText,
  other: Package
};

const categoryColors = {
  courses: "from-blue-500 to-cyan-500",
  ebooks: "from-purple-500 to-pink-500",
  templates: "from-green-500 to-teal-500",
  software: "from-orange-500 to-red-500",
  graphics: "from-pink-500 to-rose-500",
  audio: "from-yellow-500 to-orange-500",
  video: "from-red-500 to-pink-500",
  documents: "from-gray-500 to-slate-500",
  other: "from-indigo-500 to-purple-500"
};

const DigitalProductDetail = () => {
  const { productId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/digital-products/${productId}`);
      setProduct(res.data);
      
      // Fetch related products
      if (res.data.category) {
        const relatedRes = await axios.get(`${API}/digital-products?category=${res.data.category}&limit=4`);
        setRelatedProducts((relatedRes.data.products || []).filter(p => p.id !== productId).slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Product not found");
      navigate('/digital-products');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentUser) {
      toast.error("Please login to download");
      navigate('/auth');
      return;
    }

    setDownloading(true);
    try {
      const res = await axios.post(`${API}/digital-products/${productId}/download?userId=${currentUser.id}`);
      
      if (res.data.fileUrl) {
        // Open file in new tab or trigger download
        window.open(res.data.fileUrl, '_blank');
        toast.success("Download started!");
        
        // Update download count locally
        setProduct(prev => ({
          ...prev,
          downloadCount: (prev.downloadCount || 0) + 1
        }));
      } else {
        toast.error("Download link not available");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please login to like");
      return;
    }
    
    try {
      const res = await axios.post(`${API}/digital-products/${productId}/like?userId=${currentUser.id}`);
      setProduct(prev => ({
        ...prev,
        likeCount: res.data.likeCount,
        likes: res.data.action === "liked" 
          ? [...(prev.likes || []), currentUser.id] 
          : (prev.likes || []).filter(id => id !== currentUser.id)
      }));
      toast.success(res.data.action === "liked" ? "Added to favorites!" : "Removed from favorites");
    } catch (error) {
      toast.error("Failed to like product");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="text-center">
          <Package size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Product not found</h2>
          <button 
            onClick={() => navigate('/digital-products')} 
            className="px-6 py-2 bg-cyan-400 text-black rounded-xl font-semibold"
          >
            Browse Resources
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = categoryIcons[product.category] || Package;
  const isLiked = currentUser && product.likes?.includes(currentUser.id);
  const isAuthor = currentUser?.id === product.authorId;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 p-4" style={{ background: 'rgba(15, 2, 30, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/digital-products')}
            className="p-2 hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition ${isLiked ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
          {product.coverImage ? (
            <img
              src={product.coverImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColors[product.category] || categoryColors.other} flex items-center justify-center`}>
              <IconComponent size={80} className="text-white/80" />
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-4 left-4">
            {product.isFree || product.price === 0 ? (
              <span className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-lg">
                FREE
              </span>
            ) : (
              <span className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl text-lg">
                ${product.price}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 rounded-full text-sm text-white capitalize">
            {product.category}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Author */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {product.title}
            </h1>
            
            {product.author && (
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/@${product.author.handle}`)}
              >
                <img
                  src={product.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.author.handle}`}
                  alt={product.author.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-800 group-hover:border-cyan-400 transition"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium group-hover:text-cyan-400 transition">
                      {product.author.name}
                    </span>
                    {product.author.isVerified && (
                      <CheckCircle size={16} className="text-cyan-400" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">@{product.author.handle}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Download size={18} className="text-cyan-400" />
              <span>{product.downloadCount || 0} downloads</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Eye size={18} />
              <span>{product.viewCount || 0} views</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Heart size={18} className={isLiked ? "text-red-500" : ""} />
              <span>{product.likeCount || 0} likes</span>
            </div>
            {product.fileType && (
              <div className="px-3 py-1 bg-gray-800 rounded-full text-gray-300 uppercase text-xs">
                {product.fileType}
              </div>
            )}
            {product.fileSize && (
              <div className="text-gray-400">
                {product.fileSize}
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
            >
              {downloading ? (
                <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <>
                  <Download size={20} />
                  Download Now
                </>
              )}
            </button>
            
            {product.fileUrl && (
              <a
                href={product.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition"
              >
                <ExternalLink size={20} className="text-white" />
              </a>
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-800 p-6" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
            <h2 className="text-lg font-bold text-white mb-3">Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Related Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map(relatedProduct => (
                  <div
                    key={relatedProduct.id}
                    onClick={() => navigate(`/digital-products/${relatedProduct.id}`)}
                    className="rounded-xl overflow-hidden cursor-pointer group border border-gray-800 hover:border-cyan-400/30 transition"
                    style={{ background: 'rgba(26, 11, 46, 0.5)' }}
                  >
                    <div className="h-24 overflow-hidden">
                      {relatedProduct.coverImage ? (
                        <img
                          src={relatedProduct.coverImage}
                          alt={relatedProduct.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${categoryColors[relatedProduct.category] || categoryColors.other}`} />
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-white text-sm line-clamp-1 group-hover:text-cyan-400 transition">
                        {relatedProduct.title}
                      </h4>
                      <span className="text-xs text-green-400">FREE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

export default DigitalProductDetail;
