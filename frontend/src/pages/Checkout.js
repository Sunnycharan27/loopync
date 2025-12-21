import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CreditCard, Truck } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [address, setAddress] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API}/cart/${currentUser.id}`);
      if (!res.data.items || res.data.items.length === 0) {
        toast.error('Cart is empty');
        navigate('/cart');
        return;
      }
      setCart(res.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate address
    if (!address.addressLine1 || !address.city || !address.state || !address.pincode || !address.phone) {
      toast.error('Please fill all address fields');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        items: cart.items,
        shippingAddress: address,
        paymentMethod,
        notes: ''
      };

      const res = await axios.post(`${API}/orders?userId=${currentUser.id}`, orderData);
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders`);
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to place order');
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const estimatedShipping = 50;
  const tax = Math.round(cart.total * 0.18);
  const total = cart.total + estimatedShipping + tax;

  return (
    <div className="min-h-screen pb-32" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/cart')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Checkout</h1>
        <div className="w-6" />
      </div>

      <div className="p-4 space-y-4">
        {/* Delivery Address */}
        <div className="glass-surface rounded-xl p-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Truck size={20} className="text-cyan-400" />
            Delivery Address
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={address.name}
                onChange={(e) => setAddress({...address, name: e.target.value})}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={address.phone}
                onChange={(e) => setAddress({...address, phone: e.target.value})}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <input
              type="text"
              placeholder="Address Line 1"
              value={address.addressLine1}
              onChange={(e) => setAddress({...address, addressLine1: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={address.addressLine2}
              onChange={(e) => setAddress({...address, addressLine2: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({...address, state: e.target.value})}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <input
              type="text"
              placeholder="Pincode"
              value={address.pincode}
              onChange={(e) => setAddress({...address, pincode: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="glass-surface rounded-xl p-4">
          <h2 className="text-white font-semibold mb-4">Payment Method</h2>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${paymentMethod === 'wallet' ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-700 bg-gray-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Wallet className={paymentMethod === 'wallet' ? 'text-cyan-400' : 'text-gray-400'} />
                <div className="text-left flex-1">
                  <p className="text-white font-semibold">Loopync Wallet</p>
                  <p className="text-sm text-gray-400">Balance: ₹{currentUser?.walletBalance?.toLocaleString() || 0}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('cod')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${paymentMethod === 'cod' ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-700 bg-gray-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className={paymentMethod === 'cod' ? 'text-cyan-400' : 'text-gray-400'} />
                <div className="text-left flex-1">
                  <p className="text-white font-semibold">Cash on Delivery</p>
                  <p className="text-sm text-gray-400">Pay when you receive</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-surface rounded-xl p-4">
          <h2 className="text-white font-semibold mb-3">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal ({cart.items.length} items)</span>
              <span>₹{cart.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Shipping</span>
              <span>₹{estimatedShipping}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax (18% GST)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span className="text-cyan-400">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass-surface p-4 border-t border-gray-700">
        <button
          onClick={handlePlaceOrder}
          disabled={processing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Place Order • ₹${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;