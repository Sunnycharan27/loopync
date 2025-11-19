import React, { useState, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const SellerDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: 'Electronics',
    stock: '',
    images: []
  });

  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Toys', 'Other'];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await axios.post(`${API}/upload`, formData);
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
      setProduct({...product, images: [...product.images, imageUrl]});
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setProduct({...product, images: product.images.filter((_, i) => i !== index)});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!product.name || !product.price || product.images.length === 0) {
      toast.error('Please fill all required fields and add at least one image');
      return;
    }

    try {
      await axios.post(`${API}/products?sellerId=${currentUser.id}`, {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
        category: product.category,
        stock: parseInt(product.stock) || 0,
        images: product.images,
        tags: [],
        specifications: {}
      });
      
      toast.success('Product listed successfully! 🎉');
      setShowAddProduct(false);
      setProduct({
        name: '',
        description: '',
        price: '',
        comparePrice: '',
        category: 'Electronics',
        stock: '',
        images: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to list product');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Seller Dashboard</h1>
        <button
          onClick={() => setShowAddProduct(true)}
          className="text-cyan-400"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="p-4">
        <div className="glass-surface rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Start Selling Today!</h2>
          <p className="text-gray-400 mb-6">List your products and reach thousands of buyers</p>
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full max-h-[90vh] glass-surface rounded-t-3xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="text-gray-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Images */}
              <div>
                <label className="text-white font-semibold mb-2 block">Product Images *</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-cyan-400 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="text-gray-400 text-xs">Uploading...</div>
                    ) : (
                      <Upload className="text-gray-400" size={24} />
                    )}
                  </label>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-white font-semibold mb-2 block">Product Name *</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => setProduct({...product, name: e.target.value})}
                  placeholder="Enter product name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-white font-semibold mb-2 block">Description</label>
                <textarea
                  value={product.description}
                  onChange={(e) => setProduct({...product, description: e.target.value})}
                  placeholder="Describe your product"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white font-semibold mb-2 block">Price (₹) *</label>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => setProduct({...product, price: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-white font-semibold mb-2 block">Compare Price (₹)</label>
                  <input
                    type="number"
                    value={product.comparePrice}
                    onChange={(e) => setProduct({...product, comparePrice: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white font-semibold mb-2 block">Category</label>
                  <select
                    value={product.category}
                    onChange={(e) => setProduct({...product, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white font-semibold mb-2 block">Stock</label>
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => setProduct({...product, stock: e.target.value})}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg mt-6"
              >
                List Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;