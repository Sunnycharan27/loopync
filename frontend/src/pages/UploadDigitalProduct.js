import React, { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, Image, FileText, X, Plus, Package,
  BookOpen
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { toast } from "sonner";

const categories = [
  { value: "courses", label: "Courses", icon: BookOpen, description: "Educational content, tutorials, video courses" },
  { value: "ebooks", label: "E-Books", icon: FileText, description: "Digital books, guides, manuals" },
  { value: "pdfs", label: "PDFs", icon: FileText, description: "Documents, notes, study materials" },
  { value: "templates", label: "Templates", icon: FileText, description: "Design templates, code snippets, spreadsheets" },
  { value: "tools", label: "Tools & Code", icon: Package, description: "Software, scripts, code repositories" },
  { value: "other", label: "Other", icon: Package, description: "Any other type of resource" },
];

const UploadDigitalProduct = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    coverImage: "",
    fileUrl: "",
    fileType: "",
    fileSize: "",
    tags: []
  });
  
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="text-center">
          <Package size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-4">Please login to upload resources</p>
          <button 
            onClick={() => navigate('/auth')} 
            className="px-6 py-2 bg-cyan-400 text-black rounded-xl font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingCover(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const token = localStorage.getItem("loopync_token");
      const res = await axios.post(`${API}/upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      setFormData(prev => ({ ...prev, coverImage: res.data.url }));
      toast.success("Cover image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size should be less than 100MB");
      return;
    }

    setUploadingFile(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const token = localStorage.getItem("loopync_token");
      const res = await axios.post(`${API}/upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      // Get file extension and size
      const extension = file.name.split('.').pop().toLowerCase();
      const size = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setFormData(prev => ({ 
        ...prev, 
        fileUrl: res.data.url,
        fileType: extension,
        fileSize: size
      }));
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 10 && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.fileUrl) {
      toast.error("Please upload a file");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("loopync_token");
      const productData = {
        ...formData,
        price: 0 // Free products
      };

      const res = await axios.post(
        `${API}/digital-products?authorId=${currentUser.id}`,
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Resource uploaded successfully!");
      navigate(`/digital-products/${res.data.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === "string" ? detail : detail?.msg || detail?.[0]?.msg || "Failed to upload";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 p-4" style={{ background: 'rgba(15, 2, 30, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/digital-products')}
            className="p-2 hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Upload Free Resource</h1>
            <p className="text-gray-400 text-sm">Share knowledge with the community</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Cover Image
          </label>
          <div
            onClick={() => document.getElementById("cover-input").click()}
            className="relative h-48 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-700 hover:border-cyan-400 transition"
            style={{
              background: formData.coverImage
                ? `url(${formData.coverImage}) center/cover`
                : "rgba(31, 41, 55, 0.5)"
            }}
          >
            {!formData.coverImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {uploadingCover ? (
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Image size={32} className="text-gray-500 mb-2" />
                    <p className="text-gray-500 text-sm">Click to upload cover image</p>
                    <p className="text-gray-600 text-xs mt-1">Recommended: 1200x630</p>
                  </>
                )}
              </div>
            )}
            {formData.coverImage && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                <p className="text-white font-medium">Change Cover</p>
              </div>
            )}
          </div>
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-400"
            placeholder="Enter resource title"
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-400 resize-none"
            placeholder="Describe your resource..."
            rows={4}
            maxLength={2000}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => {
              const IconComponent = cat.icon;
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <IconComponent size={20} className={isSelected ? "text-cyan-400" : "text-gray-500"} />
                  <p className={`font-medium mt-1 ${isSelected ? "text-cyan-400" : "text-white"}`}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Upload File *
          </label>
          <div
            onClick={() => document.getElementById("file-input").click()}
            className={`relative p-6 rounded-2xl border-2 border-dashed cursor-pointer transition ${
              formData.fileUrl
                ? "border-green-500 bg-green-500/10"
                : "border-gray-700 hover:border-cyan-400"
            }`}
          >
            {uploadingFile ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mb-2" />
                <p className="text-gray-400">Uploading...</p>
              </div>
            ) : formData.fileUrl ? (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <FileText size={24} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">File uploaded successfully</p>
                  <p className="text-gray-400 text-sm">
                    {formData.fileType?.toUpperCase()} • {formData.fileSize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, fileUrl: "", fileType: "", fileSize: "" }));
                  }}
                  className="p-2 hover:bg-gray-800 rounded-full"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <Upload size={32} className="text-gray-500 mb-2" />
                <p className="text-white font-medium">Click to upload file</p>
                <p className="text-gray-500 text-sm mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, MP4, MP3
                </p>
                <p className="text-gray-600 text-xs mt-1">Max 100MB</p>
              </div>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.mp4,.mp3,.wav,.json,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-400"
              placeholder="Add a tag"
              maxLength={30}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim() || formData.tags.length >= 10}
              className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-gray-500 text-xs mt-1">{formData.tags.length}/10 tags</p>
        </div>

        {/* Free Badge Info */}
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-xl">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <p className="text-green-400 font-medium">This resource will be FREE</p>
              <p className="text-gray-400 text-sm">Help students and creators by sharing free resources</p>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {(!formData.title || !formData.category || !formData.fileUrl) && (
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400 text-sm font-medium mb-1">Complete these to upload:</p>
            <ul className="text-yellow-400/80 text-xs space-y-0.5">
              {!formData.title && <li>• Enter a title</li>}
              {!formData.category && <li>• Select a category</li>}
              {!formData.fileUrl && <li>• Upload a file</li>}
            </ul>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !formData.title || !formData.category || !formData.fileUrl}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload Resource
            </>
          )}
        </button>
      </form>

      <BottomNav active="discover" />
    </div>
  );
};

export default UploadDigitalProduct;
