import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

const Products = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Toys'];

  useEffect(() => {
    fetchProducts();
    if (currentUser) fetchCartCount();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await axios.get(`${API}/cart/${currentUser.id}`);
      setCartCount(res.data.items?.length || 0);
    } catch (error) {
      console.error('Failed to fetch cart');
    }
  };

  const addToCart = async (product) => {
    if (!currentUser) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }

    try {
      await axios.post(`${API}/cart/${currentUser.id}/add`, {
        productId: product.id,
        quantity: 1,
        price: product.price,
        productName: product.name,
        productImage: product.images[0] || ''
      });
      toast.success('Added to cart!');
      fetchCartCount();
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to add to cart');
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">🛍️ Marketplace</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/seller-dashboard')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold"
            >
              Sell
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-full bg-gray-800 text-cyan-400"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                (cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p>No products found</p>
            <button
              onClick={() => navigate('/seller-dashboard')}
              className="mt-4 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold"
            >
              Be the first to sell!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map(product => (
              <div
                key={product.id}
                className="glass-surface rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="aspect-square bg-gray-800">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">{product.rating || 0} ({product.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-400 font-bold">₹{product.price.toLocaleString()}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-gray-500 line-through">₹{product.comparePrice}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="p-2 rounded-full bg-cyan-400 text-black hover:bg-cyan-300 transition"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Products;