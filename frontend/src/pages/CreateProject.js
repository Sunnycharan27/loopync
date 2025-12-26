import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { 
  ArrowLeft, Image, Github, ExternalLink, Video, Plus, X, 
  Rocket, Users, Code, Upload
} from 'lucide-react';

const CreateProject = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState({ skills: [], projectStatus: [] });
  
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    status: 'in_progress',
    githubUrl: '',
    demoUrl: '',
    videoUrl: '',
    coverImage: '',
    screenshots: [],
    skills: [],
    tags: [],
    isTeamProject: false,
    isStartup: false,
    startupStage: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const handleSkillToggle = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await axios.post(`${API}/upload/image`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (type === 'cover') {
        setFormData(prev => ({ ...prev, coverImage: res.data.url }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          screenshots: [...prev.screenshots, res.data.url]
        }));
      }
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/projects?userId=${currentUser.id}`, formData);
      toast.success('Project created! 🚀');
      navigate(`/projects/${res.data.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skillSearch
    ? constants.skills.filter(s => 
        s.label.toLowerCase().includes(skillSearch.toLowerCase())
      )
    : constants.skills.slice(0, 30);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-white">New Project</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            className={`px-5 py-2 rounded-full font-semibold transition-all ${
              loading || !formData.title.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90'
            }`}
          >
            {loading ? 'Creating...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
          {formData.coverImage ? (
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-400/50 transition-colors">
              <Image size={32} className="text-gray-500 mb-2" />
              <span className="text-gray-500 text-sm">Upload cover image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Project Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="My Awesome Project"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">One-liner</label>
          <input
            type="text"
            value={formData.shortDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            placeholder="A brief description in one line"
            maxLength={120}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
          <span className="text-xs text-gray-500">{formData.shortDescription.length}/120</span>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Full Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your project in detail..."
            rows={5}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Project Status</label>
          <div className="grid grid-cols-2 gap-2">
            {constants.projectStatus?.map(status => (
              <button
                key={status.id}
                onClick={() => setFormData(prev => ({ ...prev, status: status.id }))}
                className={`p-3 rounded-xl border-2 transition-all ${
                  formData.status === status.id
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <span className={`font-medium ${formData.status === status.id ? 'text-cyan-400' : 'text-white'}`}>
                  {status.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Project Type */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400 mb-2">Project Type</label>
          
          <button
            onClick={() => setFormData(prev => ({ ...prev, isTeamProject: !prev.isTeamProject }))}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              formData.isTeamProject
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <Users size={20} className={formData.isTeamProject ? 'text-purple-400' : 'text-gray-500'} />
            <div className="text-left">
              <p className={`font-medium ${formData.isTeamProject ? 'text-purple-400' : 'text-white'}`}>
                Team Project
              </p>
              <p className="text-xs text-gray-500">Built with a team</p>
            </div>
          </button>

          <button
            onClick={() => setFormData(prev => ({ ...prev, isStartup: !prev.isStartup }))}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              formData.isStartup
                ? 'border-orange-400 bg-orange-400/10'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <Rocket size={20} className={formData.isStartup ? 'text-orange-400' : 'text-gray-500'} />
            <div className="text-left">
              <p className={`font-medium ${formData.isStartup ? 'text-orange-400' : 'text-white'}`}>
                This is a Startup
              </p>
              <p className="text-xs text-gray-500">A potential business</p>
            </div>
          </button>

          {formData.isStartup && (
            <select
              value={formData.startupStage}
              onChange={(e) => setFormData(prev => ({ ...prev, startupStage: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
            >
              <option value="">Select startup stage</option>
              <option value="idea">Idea Stage</option>
              <option value="mvp">MVP Built</option>
              <option value="launched">Launched</option>
            </select>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400 mb-2">Project Links</label>
          
          <div className="relative">
            <Github size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="GitHub repository URL"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="relative">
            <ExternalLink size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              value={formData.demoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
              placeholder="Live demo URL"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="relative">
            <Video size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="Demo video URL (YouTube, Loom, etc.)"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tech Stack / Skills Used</label>
          
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-800/50 rounded-xl">
              {formData.skills.map(skillId => {
                const skill = constants.skills.find(s => s.id === skillId);
                return skill ? (
                  <span key={skillId} className="px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm flex items-center gap-1">
                    {skill.label}
                    <button onClick={() => handleSkillToggle(skillId)} className="hover:text-white">×</button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 mb-3"
          />

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredSkills.map(skill => {
              const isSelected = formData.skills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSkillToggle(skill.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-cyan-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {skill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add a tag..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Screenshots</label>
          
          <div className="grid grid-cols-3 gap-2">
            {formData.screenshots.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    screenshots: prev.screenshots.filter((_, i) => i !== idx)
                  }))}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {formData.screenshots.length < 6 && (
              <label className="aspect-square bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400/50">
                <Upload size={20} className="text-gray-500 mb-1" />
                <span className="text-xs text-gray-500">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'screenshot')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
