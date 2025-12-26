import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, Calendar, Clock, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

const CreateInternship = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState({ skills: [] });
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    type: 'internship',
    location: '',
    locationType: 'remote',
    stipend: '',
    duration: '',
    skills: [],
    responsibilities: [''],
    requirements: [''],
    applicationDeadline: '',
    startDate: ''
  });

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

  const addListItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateListItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login');
      return;
    }
    if (!formData.title || !formData.company || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/internships?userId=${currentUser.id}`, {
        ...formData,
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        requirements: formData.requirements.filter(r => r.trim())
      });
      toast.success('Internship posted!');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to post internship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Post Internship</h1>
            <p className="text-gray-400 text-sm">Find talented students</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Frontend Developer Intern"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
            <div className="relative">
              <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your company name"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="flex gap-2">
              {['internship', 'full-time', 'part-time', 'contract'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`px-4 py-2 rounded-lg text-sm capitalize ${formData.type === type ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the role and what the intern will be working on..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>

        {/* Location & Pay */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location Type</label>
              <select
                value={formData.locationType}
                onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stipend/Salary</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={formData.stipend}
                  onChange={(e) => setFormData(prev => ({ ...prev, stipend: e.target.value }))}
                  placeholder="₹15,000/month"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="3 months"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills</label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-xl max-h-40 overflow-y-auto">
            {constants.skills?.map(skill => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleSkillToggle(skill.id)}
                className={`px-3 py-1 rounded-full text-sm ${formData.skills.includes(skill.id) ? 'bg-cyan-400 text-black' : 'bg-gray-700 text-gray-300'}`}
              >
                {skill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Responsibilities</label>
          <div className="space-y-2">
            {formData.responsibilities.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('responsibilities', index, e.target.value)}
                  placeholder="Add a responsibility..."
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
                {formData.responsibilities.length > 1 && (
                  <button type="button" onClick={() => removeListItem('responsibilities', index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('responsibilities')} className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300">
              <Plus size={16} /> Add more
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Internship'}
        </button>
      </form>

      <BottomNav />
    </div>
  );
};

export default CreateInternship;
