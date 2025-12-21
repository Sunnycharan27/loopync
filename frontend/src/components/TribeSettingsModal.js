import React, { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { X, Camera, Trash2, Globe, Lock, Upload } from "lucide-react";
import { toast } from "sonner";

const TribeSettingsModal = ({ tribe, currentUser, onClose, onUpdate, onDelete }) => {
  const [name, setName] = useState(tribe.name || "");
  const [description, setDescription] = useState(tribe.description || "");
  const [privacy, setPrivacy] = useState(tribe.type || "public");
  const [avatar, setAvatar] = useState(tribe.avatar || "");
  const [coverImage, setCoverImage] = useState(tribe.coverImage || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("loopync_token");
      const res = await axios.post(`${API}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (type === "avatar") {
        setAvatar(res.data.url);
      } else {
        setCoverImage(res.data.url);
      }
      toast.success(`${type === "avatar" ? "Avatar" : "Cover"} uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tribe name is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("loopync_token");
      const updates = {
        name: name.trim(),
        description: description.trim(),
        type: privacy,
        avatar: avatar,
        coverImage: coverImage,
      };

      const res = await axios.put(
        `${API}/tribes/${tribe.id}?userId=${currentUser.id}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Tribe settings updated!");
      onUpdate(res.data);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === "string" ? detail : detail?.msg || detail?.[0]?.msg || "Failed to update";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("loopync_token");
      await axios.delete(`${API}/tribes/${tribe.id}?userId=${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Tribe deleted successfully");
      onDelete();
    } catch (error) {
      console.error("Delete error:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === "string" ? detail : detail?.msg || detail?.[0]?.msg || "Failed to delete";
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, #1a0b2e 0%, #0f021e 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Tribe Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Cover Photo
            </label>
            <div
              className="relative h-32 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => document.getElementById("cover-upload").click()}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Upload size={32} className="text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploadingCover ? (
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "cover")}
            />
            <p className="text-xs text-gray-500 mt-1">Click to change cover photo</p>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tribe Avatar
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => document.getElementById("avatar-upload").click()}
              >
                <img
                  src={avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {uploadingAvatar ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">Click to change avatar</p>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "avatar")}
            />
          </div>

          {/* Tribe Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tribe Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-400"
              placeholder="Enter tribe name"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tribe Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="What is your tribe about?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tribe Privacy
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPrivacy("public")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  privacy === "public"
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <Globe size={18} />
                Public
              </button>
              <button
                type="button"
                onClick={() => setPrivacy("private")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  privacy === "private"
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <Lock size={18} />
                Private
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Delete Tribe */}
          <div className="pt-4 border-t border-gray-800">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-500/10 text-red-400 font-semibold rounded-xl border border-red-500/30 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Tribe
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-400 text-sm text-center">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TribeSettingsModal;
