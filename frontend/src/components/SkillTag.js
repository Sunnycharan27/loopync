import React from 'react';
import { useNavigate } from 'react-router-dom';

const SkillTag = ({ skill, onClick, size = 'md', clickable = true }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(skill);
    } else if (clickable) {
      navigate(`/discover?skill=${encodeURIComponent(skill)}`);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} bg-cyan-400/10 text-cyan-400 rounded-full hover:bg-cyan-400/20 transition-colors cursor-pointer`}
    >
      #{typeof skill === 'string' ? skill : skill?.label || skill?.id || ''}
    </button>
  );
};

export default SkillTag;
