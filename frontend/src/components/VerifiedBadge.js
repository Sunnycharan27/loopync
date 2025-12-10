import React from 'react';
import { CheckCircle } from 'lucide-react';

const VerifiedBadge = ({ size = 16, className = "" }) => {
  return (
    <span className={`inline-flex items-center ${className}`} title="Verified Account">
      <CheckCircle 
        size={size} 
        className="text-blue-500 fill-blue-500" 
        style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' }}
      />
    </span>
  );
};

export default VerifiedBadge;
