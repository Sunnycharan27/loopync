import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { 
  Plus, Search, Award, Heart, ExternalLink, Calendar, Building,
  Filter, X
} from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';

const Certifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [constants, setConstants] = useState({ skills: [] });

  useEffect(() => {
    fetchCertifications();
    fetchConstants();
  }, [selectedSkill]);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const params = selectedSkill ? `?skill=${selectedSkill}` : '';
      const res = await axios.get(`${API}/certifications${params}`);
      setCertifications(res.data);
    } catch (error) {
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (certId) => {
    if (!currentUser) {
      toast.error('Please login to like');
      return;
    }
    try {
      const res = await axios.post(`${API}/certifications/${certId}/like?userId=${currentUser.id}`);
      setCertifications(prev => prev.map(c => {
        if (c.id === certId) {
          return {
            ...c,
            likeCount: res.data.likeCount,
            likes: res.data.action === 'liked'
              ? [...(c.likes || []), currentUser.id]
              : (c.likes || []).filter(id => id !== currentUser.id)
          };
        }
        return c;
      }));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const filteredCerts = searchQuery
    ? certifications.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.issuer?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : certifications;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Certifications</h1>
              <p className="text-gray-400 text-sm">Showcase your achievements</p>
            </div>
            <button
              onClick={() => navigate('/certifications/create')}
              className="p-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full text-black"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search certifications..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Skill Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSkill('')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                !selectedSkill ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
              }`}
            >
              All
            </button>
            {constants.skills?.slice(0, 10).map(skill => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  selectedSkill === skill.id ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {skill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications List */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-12">
            <Award size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No certifications found</p>
            <button
              onClick={() => navigate('/certifications/create')}
              className="mt-4 px-6 py-2 bg-cyan-400 text-black rounded-full font-semibold"
            >
              Add Certification
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCerts.map(cert => (
              <CertificationCard
                key={cert.id}
                cert={cert}
                currentUser={currentUser}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

const CertificationCard = ({ cert, currentUser, onLike }) => {
  const navigate = useNavigate();
  const isLiked = cert.likes?.includes(currentUser?.id);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
      {/* Certificate Image */}
      {cert.certificateImage && (
        <div className="aspect-[16/10] bg-gray-900">
          <img
            src={cert.certificateImage}
            alt={cert.title}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="p-4">
        {/* Title & Issuer */}
        <div className="mb-3">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Award size={18} className="text-yellow-400" />
            {cert.title}
          </h3>
          <p className="text-gray-400 flex items-center gap-1 mt-1">
            <Building size={14} />
            {cert.issuer}
          </p>
          {cert.issueDate && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <Calendar size={14} />
              Issued: {new Date(cert.issueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Author */}
        {cert.author && (
          <div 
            className="flex items-center gap-2 mb-3 cursor-pointer"
            onClick={() => navigate(`/profile/${cert.author.id}`)}
          >
            <img
              src={cert.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cert.author.name}`}
              alt={cert.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-white font-medium">{cert.author.name}</span>
                {cert.author.isVerified && <VerifiedBadge size={14} />}
              </div>
              <span className="text-xs text-gray-500">@{cert.author.handle}</span>
            </div>
          </div>
        )}

        {/* Skills */}
        {cert.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {cert.skills.map(skill => (
              <span key={skill} className="px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded text-xs">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <button
            onClick={() => onLike(cert.id)}
            className={`flex items-center gap-1.5 ${isLiked ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'}`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm">{cert.likeCount || 0}</span>
          </button>

          {cert.credentialUrl && (
            <a
              href={cert.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cyan-400 text-sm hover:underline"
            >
              <ExternalLink size={14} />
              Verify
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certifications;
