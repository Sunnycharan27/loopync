import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { 
  ArrowLeft, Image, Award, Building, Calendar, Link as LinkIcon, 
  Hash, FileText, X, Upload
} from 'lucide-react';

const CreateCertification = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState({ skills: [] });
  
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    certificateImage: '',
    certificatePdf: '',
    skills: []
  });
  
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
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

      setFormData(prev => ({ ...prev, certificateImage: res.data.url }));
      toast.success('Certificate uploaded!');
    } catch (error) {
      toast.error('Failed to upload certificate');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Certificate title is required');
      return;
    }
    if (!formData.issuer.trim()) {
      toast.error('Issuer is required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/certifications?userId=${currentUser.id}`, formData);
      toast.success('Certification added! 🎉');
      navigate('/certifications');
    } catch (error) {
      toast.error('Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skillSearch
    ? constants.skills.filter(s => 
        s.label.toLowerCase().includes(skillSearch.toLowerCase())
      )
    : constants.skills.slice(0, 30);

  // Common issuers for quick selection
  const commonIssuers = [
    'Coursera', 'Udemy', 'Google', 'AWS', 'Microsoft', 'IBM', 
    'Meta', 'HackerRank', 'LinkedIn', 'Cisco', 'Oracle'
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-white">Add Certification</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.issuer.trim()}
            className={`px-5 py-2 rounded-full font-semibold transition-all ${
              loading || !formData.title.trim() || !formData.issuer.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90'
            }`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Certificate Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Certificate Image
          </label>
          {formData.certificateImage ? (
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-900">
              <img 
                src={formData.certificateImage} 
                alt="Certificate" 
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setFormData(prev => ({ ...prev, certificateImage: '' }))}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[16/10] bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-400/50 transition-colors">
              <Award size={40} className="text-gray-500 mb-2" />
              <span className="text-gray-400">Upload certificate image</span>
              <span className="text-gray-500 text-sm mt-1">PNG, JPG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Award size={16} className="inline mr-2" />
            Certificate Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., AWS Solutions Architect"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Building size={16} className="inline mr-2" />
            Issuing Organization *
          </label>
          <input
            type="text"
            value={formData.issuer}
            onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
            placeholder="e.g., Amazon Web Services"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {commonIssuers.map(issuer => (
              <button
                key={issuer}
                onClick={() => setFormData(prev => ({ ...prev, issuer }))}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.issuer === issuer
                    ? 'bg-cyan-400 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {issuer}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Issue Date
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Credential ID */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Hash size={16} className="inline mr-2" />
            Credential ID
          </label>
          <input
            type="text"
            value={formData.credentialId}
            onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
            placeholder="e.g., ABC123XYZ"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Credential URL */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <LinkIcon size={16} className="inline mr-2" />
            Credential URL (Verification Link)
          </label>
          <input
            type="url"
            value={formData.credentialUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
            placeholder="https://verify.example.com/..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Related Skills
          </label>
          
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
      </div>
    </div>
  );
};

export default CreateCertification;
