import React from 'react';
import { Award, ExternalLink, Calendar, Building2, Download, Eye } from 'lucide-react';
import SkillTag from './SkillTag';

const CertificationCard = ({ cert, onSkillClick }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 transition bg-gray-800/50">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Award size={24} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">{cert.title}</h4>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <Building2 size={12} />
            {cert.issuer}
          </p>
          {cert.issueDate && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Calendar size={10} />
              {formatDate(cert.issueDate)}
              {cert.expiryDate && ` - ${formatDate(cert.expiryDate)}`}
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      {cert.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {cert.skills.slice(0, 3).map(skill => (
            <SkillTag key={skill} skill={skill} size="sm" onClick={onSkillClick} />
          ))}
          {cert.skills.length > 3 && (
            <span className="text-xs text-gray-500">+{cert.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Certificate Preview */}
      {cert.fileUrl && (
        <div className="mt-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700">
          <img
            src={cert.fileUrl}
            alt={cert.title}
            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition"
            loading="lazy"
            onClick={() => window.open(cert.fileUrl, '_blank')}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {cert.credentialUrl && (
          <a
            href={cert.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-semibold transition"
          >
            <ExternalLink size={14} />
            Verify Certificate
          </a>
        )}
        {cert.fileUrl && (
          <a
            href={cert.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition"
          >
            <Eye size={14} />
            View Full
          </a>
        )}
      </div>
    </div>
  );
};

export default CertificationCard;
