import React, { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, Building2, Users, Link2, Mail } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const EditJobModal = ({ job, currentUser, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    companyLogo: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    location: '',
    locationType: 'hybrid',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: '',
    salaryType: 'monthly',
    skills: [],
    applicationUrl: '',
    contactEmail: '',
    deadline: ''
  });
  const [newSkill, setNewSkill] = useState('');

  // Populate form with existing job data
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        company: job.company || '',
        companyLogo: job.companyLogo || '',
        description: job.description || '',
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        benefits: job.benefits || '',
        location: job.location || '',
        locationType: job.remote ? 'remote' : (job.locationType || 'hybrid'),
        jobType: job.jobType || job.type || 'full-time',
        experienceLevel: job.experienceLevel || 'entry',
        salary: job.salary || job.stipend || '',
        salaryType: job.salaryType || 'monthly',
        skills: job.skills || [],
        applicationUrl: job.applicationUrl || '',
        contactEmail: job.contactEmail || '',
        deadline: job.deadline ? job.deadline.split('T')[0] : ''
      });
    }
  }, [job]);

  const locationTypes = [{ id: 'remote', label: '🏠 Remote' }, { id: 'hybrid', label: '🔄 Hybrid' }, { id: 'onsite', label: '🏢 On-site' }];
  const jobTypes = [{ id: 'full-time', label: 'Full-time' }, { id: 'part-time', label: 'Part-time' }, { id: 'contract', label: 'Contract' }, { id: 'internship', label: 'Internship' }, { id: 'freelance', label: 'Freelance' }];
  const experienceLevels = [{ id: 'entry', label: 'Entry Level' }, { id: 'mid', label: 'Mid Level' }, { id: 'senior', label: 'Senior' }, { id: 'lead', label: 'Lead/Manager' }];

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter job title'); return; }
    if (!formData.company.trim()) { toast.error('Please enter company name'); return; }
    setLoading(true);
    try {
      const jobData = { 
        ...formData,
        remote: formData.locationType === 'remote',
        stipend: formData.salary,
        type: formData.jobType
      };
      await axios.put(`${API}/internships/${job.id}?userId=${currentUser.id}`, jobData);
      toast.success('Job updated! 💼');
      onUpdated?.(job.id, jobData);
      onClose();
    } catch (error) { 
      if (error.response?.status === 403) {
        toast.error('You can only edit your own job postings');
      } else {
        toast.error('Failed to update job'); 
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center"><Briefcase size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Edit Job/Internship</h2><p className="text-xs text-gray-400">Update job details</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Frontend Developer Intern" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
            <div className="relative"><Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="Company name" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo URL</label>
            <input type="url" value={formData.companyLogo} onChange={(e) => setFormData(prev => ({ ...prev, companyLogo: e.target.value }))} placeholder="https://company.com/logo.png" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Job description..." rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Responsibilities</label>
            <textarea value={formData.responsibilities} onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))} placeholder="Key responsibilities..." rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
            <textarea value={formData.requirements} onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))} placeholder="Required qualifications..." rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Benefits (Optional)</label>
            <textarea value={formData.benefits} onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))} placeholder="Perks and benefits..." rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
            <div className="flex flex-wrap gap-2">{jobTypes.map(t => (<button key={t.id} type="button" onClick={() => setFormData(prev => ({ ...prev, jobType: t.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.jobType === t.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location Type</label>
            <div className="flex gap-2">{locationTypes.map(l => (<button key={l.id} type="button" onClick={() => setFormData(prev => ({ ...prev, locationType: l.id }))} className={`flex-1 py-2 rounded-lg text-sm transition ${formData.locationType === l.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{l.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder="City, Country" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
            <div className="flex flex-wrap gap-2">{experienceLevels.map(e => (<button key={e.id} type="button" onClick={() => setFormData(prev => ({ ...prev, experienceLevel: e.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.experienceLevel === e.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{e.label}</button>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Salary/Stipend</label><div className="relative"><DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={formData.salary} onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))} placeholder="₹50,000/month" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" /></div></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label><input type="date" value={formData.deadline} onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
          </div>
          
          {/* Application Link - Google Forms, etc. */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <label className="block text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
              <Link2 size={16} />
              Application Link (Google Forms, etc.)
            </label>
            <input 
              type="url" 
              value={formData.applicationUrl} 
              onChange={(e) => setFormData(prev => ({ ...prev, applicationUrl: e.target.value }))} 
              placeholder="https://forms.google.com/..." 
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" 
            />
            <p className="text-xs text-gray-400 mt-2">Candidates will be redirected to this link when they click "Apply Now"</p>
          </div>
          
          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Mail size={14} />
              Contact Email (Optional)
            </label>
            <input 
              type="email" 
              value={formData.contactEmail} 
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))} 
              placeholder="hr@company.com" 
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills</label>
            <div className="flex gap-2 mb-2"><input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addSkill} className="px-3 py-2 bg-orange-500 text-white rounded-lg">Add</button></div>
            <div className="flex flex-wrap gap-2">{formData.skills.map((skill, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">{skill}<button type="button" onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}><X size={12} /></button></span>))}</div>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Updating...' : 'Update Job'}</button></div>
      </div>
    </div>
  );
};

export default EditJobModal;
