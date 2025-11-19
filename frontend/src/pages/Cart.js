import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    fetchCart();
  }, [currentUser]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API}/cart/${currentUser.id}`);
      setCart(res.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${API}/cart/${currentUser.id}/remove/${productId}`);
      toast.success('Removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await axios.delete(`${API}/cart/${currentUser.id}/remove/${item.productId}`);
      await axios.post(`${API}/cart/${currentUser.id}/add`, {
        ...item,
        quantity: newQuantity
      });
      fetchCart();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-white">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Shopping Cart</h1>
        <div className="w-6" />
      </div>

      {/* Cart Items */}
      <div className="p-4">
        {cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.items.map(item => (
              <div key={item.productId} className="glass-surface rounded-xl p-4 flex gap-4">
                <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 line-clamp-2">{item.productName}</h3>
                  <p className="text-cyan-400 font-bold mb-2">₹{item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-white font-semibold px-3">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-700 text-white font-bold flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-400 hover:text-red-300 self-start"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            {/* Summary */}
            <div className="glass-surface rounded-xl p-4 mt-6">
              <h2 className="text-white font-semibold mb-3">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>₹{cart.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className="text-green-400">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span className="text-cyan-400">₹{cart.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-surface p-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg"
          >
            Proceed to Checkout • ₹{cart.total.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;