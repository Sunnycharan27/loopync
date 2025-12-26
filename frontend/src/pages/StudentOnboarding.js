import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { 
  ChevronRight, ChevronLeft, Check, GraduationCap, Briefcase, 
  Palette, Star, Rocket, Laptop, Brain, Search as SearchIcon, User,
  School, Calendar, BookOpen, Link as LinkIcon, Github, Linkedin
} from 'lucide-react';

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState({
    categories: [],
    interests: [],
    skills: []
  });
  
  // Form state
  const [formData, setFormData] = useState({
    userCategory: '',
    collegeName: '',
    branch: '',
    graduationYear: '',
    degree: '',
    academicBio: '',
    skills: [],
    customSkills: [],
    interests: [],
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: ''
  });
  
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  
  useEffect(() => {
    fetchConstants();
  }, []);
  
  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      toast.error('Failed to load options');
    }
  };
  
  const categoryIcons = {
    student: GraduationCap,
    graduate: BookOpen,
    working_professional: Briefcase,
    creator: Palette,
    influencer: Star,
    entrepreneur: Rocket,
    freelancer: Laptop,
    mentor: Brain,
    recruiter: SearchIcon,
    other: User
  };
  
  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({ ...prev, userCategory: categoryId }));
  };
  
  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId]
    }));
  };
  
  const handleSkillToggle = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
  };
  
  const handleAddCustomSkill = () => {
    if (customSkillInput.trim() && !formData.customSkills.includes(customSkillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        customSkills: [...prev.customSkills, customSkillInput.trim()]
      }));
      setCustomSkillInput('');
    }
  };
  
  const handleRemoveCustomSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      customSkills: prev.customSkills.filter(s => s !== skill)
    }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/student/profile?userId=${currentUser.id}`, formData);
      toast.success('Profile setup complete! 🎉');
      await refreshUserData();
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredSkills = skillSearch
    ? constants.skills.filter(s => 
        s.label.toLowerCase().includes(skillSearch.toLowerCase())
      )
    : constants.skills;
  
  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    const cat = skill.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Who are you?</h2>
        <p className="text-gray-400">Select the category that best describes you</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {constants.categories.map(category => {
          const IconComponent = categoryIcons[category.id] || User;
          const isSelected = formData.userCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-cyan-400/20' : 'bg-gray-700'
                }`}>
                  <IconComponent size={20} className={isSelected ? 'text-cyan-400' : 'text-gray-400'} />
                </div>
                <div>
                  <p className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                    {category.icon} {category.label}
                  </p>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>
              {isSelected && (
                <div className="mt-2 flex justify-end">
                  <Check size={16} className="text-cyan-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">What are your interests?</h2>
        <p className="text-gray-400">Select at least 3 interests (selected: {formData.interests.length})</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {constants.interests.map(interest => {
          const isSelected = formData.interests.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => handleInterestToggle(interest.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-cyan-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {interest.icon} {interest.label}
            </button>
          );
        })}
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Your Skills</h2>
        <p className="text-gray-400">What technologies and tools do you know?</p>
      </div>
      
      {/* Search */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          placeholder="Search skills..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
        />
      </div>
      
      {/* Selected skills */}
      {(formData.skills.length > 0 || formData.customSkills.length > 0) && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 rounded-xl">
          {formData.skills.map(skillId => {
            const skill = constants.skills.find(s => s.id === skillId);
            return skill ? (
              <span key={skillId} className="px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm flex items-center gap-1">
                {skill.label}
                <button onClick={() => handleSkillToggle(skillId)} className="hover:text-white">×</button>
              </span>
            ) : null;
          })}
          {formData.customSkills.map(skill => (
            <span key={skill} className="px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
              {skill}
              <button onClick={() => handleRemoveCustomSkill(skill)} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}
      
      {/* Add custom skill */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customSkillInput}
          onChange={(e) => setCustomSkillInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
          placeholder="Add custom skill..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={handleAddCustomSkill}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
        >
          Add
        </button>
      </div>
      
      {/* Skills by category */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(groupedSkills).map(([category, skills]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">
              {category.replace('_', ' ')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => {
                const isSelected = formData.skills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillToggle(skill.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-black font-medium'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {skill.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Education Details</h2>
        <p className="text-gray-400">Tell us about your academic background</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <School size={16} className="inline mr-2" />
            College/University
          </label>
          <input
            type="text"
            value={formData.collegeName}
            onChange={(e) => setFormData(prev => ({ ...prev, collegeName: e.target.value }))}
            placeholder="e.g., IIT Delhi, Stanford University"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Degree</label>
            <select
              value={formData.degree}
              onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select degree</option>
              <option value="B.Tech">B.Tech</option>
              <option value="B.E.">B.E.</option>
              <option value="BCA">BCA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Tech">M.Tech</option>
              <option value="MCA">MCA</option>
              <option value="M.Sc">M.Sc</option>
              <option value="MBA">MBA</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Graduation Year
            </label>
            <select
              value={formData.graduationYear}
              onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select year</option>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Branch/Major</label>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
            placeholder="e.g., Computer Science, Electronics"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Academic Bio</label>
          <textarea
            value={formData.academicBio}
            onChange={(e) => setFormData(prev => ({ ...prev, academicBio: e.target.value }))}
            placeholder="Brief description of your academic focus and goals..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
  
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Profiles</h2>
        <p className="text-gray-400">Add your professional links (optional)</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Github size={16} className="inline mr-2" />
            GitHub
          </label>
          <input
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
            placeholder="https://github.com/username"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Linkedin size={16} className="inline mr-2" />
            LinkedIn
          </label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <LinkIcon size={16} className="inline mr-2" />
            Portfolio Website
          </label>
          <input
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
            placeholder="https://yourportfolio.com"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
      
      {/* Preview */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-xl">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Profile Preview</h4>
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`}
            alt="Avatar"
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold text-white">{currentUser?.name}</p>
            <p className="text-sm text-cyan-400">
              {constants.categories.find(c => c.id === formData.userCategory)?.icon}{' '}
              {constants.categories.find(c => c.id === formData.userCategory)?.label}
            </p>
          </div>
        </div>
        {formData.collegeName && (
          <p className="text-sm text-gray-400">
            🎓 {formData.degree} in {formData.branch} @ {formData.collegeName}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.skills.slice(0, 5).map(skillId => {
            const skill = constants.skills.find(s => s.id === skillId);
            return skill ? (
              <span key={skillId} className="px-2 py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-xs">
                {skill.label}
              </span>
            ) : null;
          })}
          {formData.skills.length > 5 && (
            <span className="text-xs text-gray-500">+{formData.skills.length - 5} more</span>
          )}
        </div>
      </div>
    </div>
  );
  
  const canProceed = () => {
    switch (step) {
      case 1: return formData.userCategory !== '';
      case 2: return formData.interests.length >= 3;
      case 3: return formData.skills.length >= 1 || formData.customSkills.length >= 1;
      case 4: return true; // Education is optional
      case 5: return true; // Links are optional
      default: return false;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Progress bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Step {step} of 5</span>
          <span className="text-sm text-cyan-400">{Math.round((step / 5) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
      
      {/* Navigation */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          
          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-black rounded-xl font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check size={20} />
                </>
              )}
            </button>
          )}
        </div>
        
        {step === 1 && (
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-400"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentOnboarding;
