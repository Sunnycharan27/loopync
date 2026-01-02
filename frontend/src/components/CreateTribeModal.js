import React, { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { X, Camera, Users, Code, GraduationCap, Dumbbell, Utensils, Briefcase, Palette } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: 'tech', name: 'Tech', icon: Code, color: 'cyan' },
  { id: 'college', name: 'College', icon: GraduationCap, color: 'purple' },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: 'green' },
  { id: 'food', name: 'Food', icon: Utensils, color: 'orange' },
  { id: 'business', name: 'Business', icon: Briefcase, color: 'blue' },
  { id: 'creative', name: 'Creative', icon: Palette, color: 'pink' },
];

const CreateTribeModal = ({ currentUser, onClose, onTribeCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("tech");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("public");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("loopync_token");
      const res = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      
      if (imageType === "avatar") {
        setAvatar(res.data.url);
      } else {
        setCoverImage(res.data.url);
      }
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tribe name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/tribes?ownerId=${currentUser.id}`, {
        name: name.trim(),
        description: description.trim(),
        category: category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        type,
        avatar: avatar || null,
        coverImage: coverImage || null,
      });
      toast.success("Tribe created! 🎉");
      onTribeCreated(res.data);
    } catch (error) {
      console.error("Failed to create tribe:", error);
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to create tribe";
      if (Array.isArray(errorMsg)) {
        toast.error(errorMsg[0]?.msg || "Failed to create tribe");
      } else {
        toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to create tribe");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #1a0b2e 0%, #0f021e 100%)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Tribe</h2>
              <p className="text-xs text-gray-400">Build your community</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image (Optional)</label>
            <div 
              onClick={() => document.getElementById('cover-input').click()}
              className="h-24 rounded-xl bg-gray-800/50 border border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-cyan-400/50 transition overflow-hidden"
            >
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera size={24} className="mx-auto text-gray-500 mb-1" />
                  <span className="text-xs text-gray-500">Add Cover</span>
                </div>
              )}
            </div>
            <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
          </div>

          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => document.getElementById('avatar-input').click()}
              className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition overflow-hidden border-2 border-gray-700"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-white font-medium">Tribe Avatar</p>
              <p className="text-xs text-gray-500">Click to upload</p>
            </div>
            <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          {/* Tribe Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tribe Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tech Builders India"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
              required
              maxLength={50}
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-400/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-cyan-400' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your tribe about?"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tech, startups, coding"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Privacy</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("public")}
                className={`flex-1 py-3 rounded-xl border-2 transition ${
                  type === "public" ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                🌐 Public
              </button>
              <button
                type="button"
                onClick={() => setType("private")}
                className={`flex-1 py-3 rounded-xl border-2 transition ${
                  type === "private" ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                🔒 Private
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || !name.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create Tribe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTribeModal;