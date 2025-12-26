import React, { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage - Lazy loading image component with blur placeholder
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Error handling with fallback
 * - Native loading="lazy" support
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback,
  style = {},
  onClick,
  priority = false, // Load immediately if true
  blur = true // Show blur placeholder
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const finalSrc = hasError && fallback ? fallback : src;

  // Generate a tiny placeholder color from the image src
  const placeholderColor = `hsl(${(src?.length || 0) * 137.5 % 360}, 30%, 20%)`;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        backgroundColor: placeholderColor,
        ...style 
      }}
      onClick={onClick}
    >
      {isInView && (
        <img
          src={finalSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: blur && !isLoaded ? 'blur(20px)' : 'none',
            transform: blur && !isLoaded ? 'scale(1.1)' : 'scale(1)'
          }}
        />
      )}
      
      {/* Loading shimmer effect */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}
    </div>
  );
};

/**
 * OptimizedVideo - Lazy loading video component
 */
export const OptimizedVideo = ({
  src,
  poster,
  className = '',
  style = {},
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true,
  priority = false,
  onPlay,
  onPause
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Auto-play when in view
  useEffect(() => {
    if (isInView && autoPlay && videoRef.current && isLoaded) {
      videoRef.current.play().catch(() => {});
    }
  }, [isInView, autoPlay, isLoaded]);

  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-900 ${className}`}
      style={style}
    >
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline={playsInline}
          preload="metadata"
          onLoadedData={handleLoadedData}
          onPlay={onPlay}
          onPause={onPause}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
