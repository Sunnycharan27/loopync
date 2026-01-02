import React, { useState, useRef, useEffect } from 'react';
import { getOptimizedImageUrl, getAdaptiveImageQuality } from '../utils/performance';

/**
 * Optimized Image Component with Lazy Loading
 * - Lazy loads images when they enter viewport
 * - Shows placeholder/skeleton while loading
 * - Adapts quality based on network speed
 * - Progressive loading for better 3G/4G experience
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  placeholder = null,
  onLoad,
  onError,
  priority = false, // Load immediately if true
  quality, // Override quality
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Get adaptive quality based on network
  const adaptiveSettings = getAdaptiveImageQuality();
  const finalQuality = quality || adaptiveSettings.quality;
  const finalWidth = width || adaptiveSettings.width;

  // Optimize image URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: finalWidth,
    quality: finalQuality,
  });

  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setError(true);
    onError?.(e);
  };

  // Default placeholder (skeleton)
  const defaultPlaceholder = (
    <div
      className={`animate-pulse bg-gray-700 ${className}`}
      style={{ width, height }}
    />
  );

  // Error placeholder
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative" style={{ width, height }}>
      {/* Placeholder while loading */}
      {!isLoaded && (placeholder || defaultPlaceholder)}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={{ width, height }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};

/**
 * Optimized Avatar Component
 * Specifically optimized for small circular images
 */
export const OptimizedAvatar = ({
  src,
  alt = '',
  size = 40,
  className = '',
  fallbackSeed = 'default',
  ...props
}) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;
  
  return (
    <OptimizedImage
      src={src || fallbackUrl}
      alt={alt}
      width={size}
      height={size}
      quality={70}
      className={`rounded-full object-cover ${className}`}
      priority={size <= 50} // Priority load small avatars
      {...props}
    />
  );
};

/**
 * Optimized Post Image
 * For feed images with progressive loading
 */
export const OptimizedPostImage = ({
  src,
  alt = '',
  className = '',
  aspectRatio = '4/3',
  ...props
}) => {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio }}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        quality={75}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
