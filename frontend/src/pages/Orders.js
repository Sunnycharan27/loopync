import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

const Orders = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders/user/${currentUser.id}`);
      setOrders(res.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return <Clock className="text-yellow-400" size={20} />;
      case 'shipped':
        return <Truck className="text-blue-400" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-400" size={20} />;
      default:
        return <Package className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return 'text-yellow-400';
      case 'shipped':
        return 'text-blue-400';
      case 'delivered':
        return 'text-green-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-white">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">My Orders</h1>
        <div className="w-6" />
      </div>

      {/* Orders List */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No orders yet</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass-surface rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-400 text-sm">Order #{order.orderNumber}</p>
                    <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.orderStatus)}
                    <span className={`text-sm font-semibold capitalize ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold line-clamp-1">{item.productName}</p>
                        <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                        <p className="text-cyan-400 text-sm font-semibold">₹{item.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-white font-bold text-lg">₹{order.total.toLocaleString()}</span>
                </div>

                {/* Tracking */}
                {order.deliveryInfo?.trackingId && (
                  <button
                    onClick={() => navigate(`/orders/track/${order.id}`)}
                    className="w-full mt-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400 text-cyan-400 font-semibold text-sm"
                  >
                    Track Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;