import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Search, Filter, Building2, Users, MapPin, Briefcase, GraduationCap, Award, Code, Star, Eye, ChevronDown } from 'lucide-react';
import SkillTag from '../components/SkillTag';
import { useNavigate } from 'react-router-dom';

const CompanyDiscovery = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skill: '',
    category: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [constants, setConstants] = useState({ skills: [], categories: [] });

  useEffect(() => {
    fetchStudents();
    fetchConstants();
  }, [filters]);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      params.append('isPublic', 'true');
      
      const res = await axios.get(`${API}/students/discover?${params.toString()}`);
      setStudents(res.data || []);
    } catch (error) {
      console.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = searchQuery
    ? students.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : students;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Talent Discovery</h1>
                <p className="text-gray-400 text-sm">Find talented students for your team</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-800/50 rounded-xl space-y-3">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">All Categories</option>
                {constants.categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <select
                value={filters.skill}
                onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">All Skills</option>
                {constants.skills?.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Location..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <p className="text-gray-400 text-sm mb-4">{filteredStudents.length} students found</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No students found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => (
              <StudentCard key={student.id} student={student} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentCard = ({ student, navigate }) => (
  <div
    onClick={() => navigate(`/@${student.handle}`)}
    className="p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 cursor-pointer transition bg-gray-800/50"
  >
    <div className="flex items-start gap-3 mb-3">
      <img
        src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.handle}`}
        alt={student.name}
        className="w-14 h-14 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white truncate">{student.name}</h4>
          {student.isVerified && <span className="text-cyan-400">✓</span>}
        </div>
        <p className="text-sm text-gray-400">@{student.handle}</p>
        {student.category && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
            {student.category}
          </span>
        )}
      </div>
      {/* Reputation */}
      {student.reputation?.score > 0 && (
        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-sm font-semibold">{student.reputation.score}</span>
        </div>
      )}
    </div>

    {/* Bio */}
    {student.bio && (
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{student.bio}</p>
    )}

    {/* Skills */}
    {student.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-3">
        {student.skills.slice(0, 4).map(skill => (
          <SkillTag key={skill} skill={skill} size="sm" clickable={false} />
        ))}
        {student.skills.length > 4 && (
          <span className="text-xs text-gray-500">+{student.skills.length - 4}</span>
        )}
      </div>
    )}

    {/* Stats */}
    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-700">
      <span className="flex items-center gap-1"><Code size={12} />{student.projectsCount || 0} projects</span>
      <span className="flex items-center gap-1"><Award size={12} />{student.certificationsCount || 0} certs</span>
      {student.location && (
        <span className="flex items-center gap-1"><MapPin size={12} />{student.location}</span>
      )}
    </div>
  </div>
);

export default CompanyDiscovery;
