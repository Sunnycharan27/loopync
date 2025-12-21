import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Truck, Shield, Heart } from 'lucide-react';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { productId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${productId}`);
      setProduct(res.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!currentUser) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    try {
      await axios.post(`${API}/cart/${currentUser.id}/add`, {
        productId: product.id,
        quantity,
        price: product.price,
        productName: product.name,
        productImage: product.images[0] || ''
      });
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to add to cart');
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <button className="text-gray-400 hover:text-red-400">
          <Heart size={24} />
        </button>
      </div>

      {/* Images */}
      <div className="p-4">
        <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden mb-4">
          {product.images[selectedImage] ? (
            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-lg object-cover cursor-pointer ${selectedImage === idx ? 'ring-2 ring-cyan-400' : 'opacity-50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{product.rating || 0}</span>
              </div>
              <span className="text-gray-400 text-sm">({product.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <p className="text-3xl font-bold text-cyan-400">₹{product.price.toLocaleString()}</p>
          {product.comparePrice && (
            <p className="text-xl text-gray-500 line-through">₹{product.comparePrice}</p>
          )}
        </div>

        {/* Description */}
        <div className="glass-surface rounded-xl p-4 mb-4">
          <h2 className="text-white font-semibold mb-2">Description</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{product.description || 'No description available'}</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-surface rounded-xl p-3 flex items-center gap-2">
            <Truck className="text-cyan-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Delivery</p>
              <p className="text-sm text-white font-semibold">3-5 days</p>
            </div>
          </div>
          <div className="glass-surface rounded-xl p-3 flex items-center gap-2">
            <Shield className="text-green-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Warranty</p>
              <p className="text-sm text-white font-semibold">1 Year</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="glass-surface rounded-xl p-4 mb-4">
            <h2 className="text-white font-semibold mb-3">Customer Reviews</h2>
            {product.reviews.slice(0, 3).map(review => (
              <div key={review.id} className="mb-3 pb-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <img src={review.userAvatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{review.userName}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{review.review}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass-surface p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-surface rounded-lg p-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold flex items-center justify-center"
            >
              -
            </button>
            <span className="text-white font-semibold px-3">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={20} />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;