import React, { useState } from 'react';
import { X, Tag, Percent, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateDealModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    discountType: 'percent',
    originalPrice: '',
    code: '',
    validFrom: '',
    validTill: '',
    terms: '',
    maxUses: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter deal title');
      return;
    }
    if (!formData.discount) {
      toast.error('Please enter discount amount');
      return;
    }

    setLoading(true);
    try {
      const dealData = {
        ...formData,
        tribeId,
        createdBy: currentUser.id,
        discount: parseFloat(formData.discount),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        usedCount: 0,
        isActive: true
      };

      await axios.post(`${API}/deals?userId=${currentUser.id}`, dealData);
      toast.success('Deal created! 🎉');
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = `DEAL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setFormData(prev => ({ ...prev, code }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Deal</h2>
              <p className="text-xs text-gray-400">Offer a special discount</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deal Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Weekend Special - 20% Off!"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's included in this deal?"
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Discount *</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  placeholder={formData.discountType === 'percent' ? '20' : '100'}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, discountType: 'percent' }))}
                  className={`px-4 py-2 rounded-lg text-sm transition ${formData.discountType === 'percent' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, discountType: 'flat' }))}
                  className={`px-4 py-2 rounded-lg text-sm transition ${formData.discountType === 'flat' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  ₹
                </button>
              </div>
            </div>
          </div>

          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Original Price (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                placeholder="500"
                className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Promo Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 uppercase"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 text-sm"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valid From</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valid Till</label>
              <input
                type="date"
                value={formData.validTill}
                onChange={(e) => setFormData(prev => ({ ...prev, validTill: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Max Uses */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Uses (optional)</label>
            <input
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Any terms or restrictions..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-black font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDealModal;
