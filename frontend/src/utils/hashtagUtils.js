/**
 * Hashtag utilities for social media features
 */

/**
 * Extract hashtags from text
 * @param {string} text - The text to extract hashtags from
 * @returns {array} - Array of hashtags without the # symbol
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
};

/**
 * Highlight hashtags in text with clickable links
 * @param {string} text - The text to process
 * @param {function} onHashtagClick - Callback when hashtag is clicked
 * @returns {JSX} - React elements with highlighted hashtags
 */
export const highlightHashtags = (text, onHashtagClick) => {
  if (!text) return text;
  
  const parts = [];
  let lastIndex = 0;
  const hashtagRegex = /#[\w]+/g;
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add hashtag as clickable element
    const hashtag = match[0];
    parts.push(
      <span
        key={`hashtag-${match.index}`}
        onClick={(e) => {
          e.stopPropagation();
          onHashtagClick && onHashtagClick(hashtag.substring(1));
        }}
        className="text-cyan-400 font-semibold cursor-pointer hover:text-cyan-300 transition"
      >
        {hashtag}
      </span>
    );
    
    lastIndex = match.index + hashtag.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

/**
 * Get trending hashtags from posts
 * @param {array} posts - Array of post objects
 * @param {number} limit - Number of top hashtags to return
 * @returns {array} - Array of {tag, count} objects
 */
export const getTrendingHashtags = (posts, limit = 10) => {
  const hashtagCounts = {};
  
  posts.forEach(post => {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(hashtagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Format hashtag for display
 * @param {string} tag - Hashtag without # symbol
 * @returns {string} - Formatted hashtag with # symbol
 */
export const formatHashtag = (tag) => {
  return `#${tag}`;
};

/**
 * Validate hashtag
 * @param {string} tag - Hashtag to validate
 * @returns {boolean} - True if valid hashtag
 */
export const isValidHashtag = (tag) => {
  // Remove # if present
  const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // Must be at least 1 character
  // Can only contain alphanumeric and underscore
  // Cannot start with a number
  const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  return regex.test(cleanTag) && cleanTag.length >= 1 && cleanTag.length <= 30;
};
