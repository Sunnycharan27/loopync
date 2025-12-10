import React from 'react';

const VerifiedBadge = ({ size = 16, className = "" }) => {
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`} 
      title="Verified Account"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`
      }}
    >
      <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size}
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
        }}
      >
        {/* Instagram-style blue circle background */}
        <circle 
          cx="12" 
          cy="12" 
          r="11" 
          fill="#1DA1F2"
          stroke="#1DA1F2"
          strokeWidth="0.5"
        />
        
        {/* White checkmark */}
        <path
          d="M9 12.5l2 2 4-5"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
