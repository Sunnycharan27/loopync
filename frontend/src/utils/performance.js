/**
 * Performance Optimizations for Loopync Frontend
 * Optimized for 3G/4G networks and high traffic (30k+ users)
 */

// Image optimization utilities
export const getOptimizedImageUrl = (url, { width = 400, quality = 80 } = {}) => {
  if (!url) return '';
  
  // For Unsplash images - use their optimization
  if (url.includes('unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&fm=webp`;
  }
  
  // For DiceBear avatars - already optimized
  if (url.includes('dicebear.com')) {
    return url;
  }
  
  // Return original for other sources
  return url;
};

// Thumbnail sizes for different contexts
export const ImageSizes = {
  avatar: { width: 100, quality: 70 },
  avatarSmall: { width: 50, quality: 60 },
  postImage: { width: 600, quality: 75 },
  postThumbnail: { width: 300, quality: 70 },
  storyImage: { width: 400, quality: 80 },
  coverImage: { width: 800, quality: 75 },
};

// Debounce utility for search and scroll handlers
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Throttle utility for scroll handlers
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createLazyLoadObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1,
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Network speed detection
export const getNetworkSpeed = () => {
  if (navigator.connection) {
    const { effectiveType, downlink } = navigator.connection;
    return {
      type: effectiveType, // 'slow-2g', '2g', '3g', '4g'
      speed: downlink, // Mbps
      isSlow: ['slow-2g', '2g', '3g'].includes(effectiveType),
    };
  }
  return { type: 'unknown', speed: null, isSlow: false };
};

// Adaptive loading based on network
export const getAdaptiveImageQuality = () => {
  const network = getNetworkSpeed();
  if (network.isSlow) {
    return { quality: 50, width: 300 };
  }
  return { quality: 80, width: 600 };
};

// Request queue for batching API calls
class RequestQueue {
  constructor(batchSize = 10, delay = 50) {
    this.queue = [];
    this.batchSize = batchSize;
    this.delay = delay;
    this.processing = false;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    await new Promise(r => setTimeout(r, this.delay));
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const results = await Promise.all(batch.map(item => item.request()));
      batch.forEach((item, i) => item.resolve(results[i]));
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
    
    this.processing = false;
    if (this.queue.length > 0) this.process();
  }
}

export const requestQueue = new RequestQueue();

// Cache for API responses
class ResponseCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ResponseCache(100, 30000); // 30 second cache

// Preload important resources
export const preloadResource = (url, type = 'image') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
};

// Preload critical images
export const preloadImages = (urls) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

// Virtual scroll helper for long lists
export const calculateVisibleRange = (scrollTop, itemHeight, containerHeight, totalItems, overscan = 5) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  return { startIndex, endIndex };
};

// Memory cleanup utility
export const cleanupMemory = () => {
  // Clear old cached data
  apiCache.clear();
  
  // Force garbage collection hint (doesn't guarantee GC)
  if (window.gc) {
    window.gc();
  }
};

// Performance metrics
export const measurePerformance = (name) => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  };
};

export default {
  getOptimizedImageUrl,
  ImageSizes,
  debounce,
  throttle,
  createLazyLoadObserver,
  getNetworkSpeed,
  getAdaptiveImageQuality,
  requestQueue,
  apiCache,
  preloadResource,
  preloadImages,
  calculateVisibleRange,
  cleanupMemory,
  measurePerformance,
};
