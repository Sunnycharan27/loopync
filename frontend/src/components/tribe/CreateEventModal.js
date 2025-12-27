import React, { useState, useRef } from 'react';
import { X, Calendar, MapPin, Clock, Users, Image, Link } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateEventModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    locationType: 'venue',
    maxAttendees: '',
    price: '',
    isFree: true,
    imageUrl: '',
    registrationUrl: ''
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch { toast.error('Upload failed'); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter event title'); return; }
    if (!formData.date) { toast.error('Please select a date'); return; }
    setLoading(true);
    try {
      const eventData = { ...formData, tribeId, organizerId: currentUser.id, organizer: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, attendees: [], status: 'upcoming' };
      await axios.post(`${API}/events?userId=${currentUser.id}`, eventData);
      toast.success('Event created! 🎉');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to create event'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center"><Calendar size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Create Event</h2><p className="text-xs text-gray-400">Host an event for your tribe</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Banner</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden"><img src={imagePreview} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }} className="absolute top-2 right-2 p-1 bg-black/70 rounded-full"><X size={14} className="text-white" /></button></div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:border-pink-500 hover:text-pink-500 transition"><Image size={24} className="mr-2" />Add Banner</button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Food Tasting Festival" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What's the event about?" rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Date *</label><input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Time</label><input type="time" value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, locationType: 'venue' }))} className={`flex-1 py-2 rounded-lg transition ${formData.locationType === 'venue' ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>🏢 Venue</button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, locationType: 'online' }))} className={`flex-1 py-2 rounded-lg transition ${formData.locationType === 'online' ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>💻 Online</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{formData.locationType === 'online' ? 'Meeting Link' : 'Venue Address'}</label>
            <div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder={formData.locationType === 'online' ? 'Zoom/Meet link' : 'Address'} className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <span className="text-gray-300">Free Event</span>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, isFree: !prev.isFree }))} className={`w-12 h-6 rounded-full transition ${formData.isFree ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`w-5 h-5 rounded-full bg-white transition transform ${formData.isFree ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
          </div>
          {!formData.isFree && (
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Ticket Price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="499" className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div></div>
          )}
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Max Attendees</label><div className="relative"><Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="number" value={formData.maxAttendees} onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))} placeholder="Leave empty for unlimited" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div></div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Creating...' : 'Create Event'}</button></div>
      </div>
    </div>
  );
};

export default CreateEventModal;
