import React, { useState, useRef } from "react";
import { X, Copy, Check, Link2, Facebook, Twitter, MessageCircle, Mail, Users, Instagram, Download } from "lucide-react";
import { toast } from "sonner";
import ShareToFriendsModal from "./ShareToFriendsModal";

// Helper function to draw rounded rectangles (for browser compatibility)
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Helper function for clipboard with fallback
const copyToClipboardFallback = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (e) {
    console.error('Clipboard copy failed:', e);
    return false;
  }
};

const UniversalShareModal = ({ item, type, onClose, currentUser }) => {
  const [copied, setCopied] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const storyCardRef = useRef(null);
  
  // Generate appropriate URL based on type
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'post':
        return `${baseUrl}/posts/${item.id}`;
      case 'reel':
        return `${baseUrl}/reels/${item.id}`;
      case 'room':
        return `${baseUrl}/viberooms/${item.id}`;
      case 'tribe':
        return `${baseUrl}/tribes/${item.id}`;
      case 'event':
        return `${baseUrl}/events/${item.id}`;
      case 'venue':
        return `${baseUrl}/venues/${item.id}`;
      case 'profile':
        return `${baseUrl}/profile/${item.id}`;
      case 'product':
        return `${baseUrl}/marketplace/${item.id}`;
      default:
        return baseUrl;
    }
  };

  const shareUrl = getShareUrl();

  // Generate share text based on type
  const getShareText = () => {
    switch (type) {
      case 'post':
        return `Check out this post by ${item.author?.name || 'someone'}: ${item.caption || ''}`;
      case 'reel':
        return `Watch this amazing reel by ${item.author?.name || 'someone'}! ${item.caption || ''}`;
      case 'room':
        return `Join me in "${item.name}" on Loopync! Live audio conversation happening now 🎙️`;
      case 'tribe':
        return `Join the "${item.name}" tribe on Loopync! ${item.description || ''}`;
      case 'event':
        return `Check out this event: ${item.name} 🎉`;
      case 'venue':
        return `Discover ${item.name} on Loopync! ${item.description || ''}`;
      case 'profile':
        return `Check out ${item.name}'s profile on Loopync!`;
      case 'product':
        return `Check out ${item.name} on Loopync Marketplace! Only ₹${item.price}`;
      default:
        return 'Check this out on Loopync!';
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(shareUrl);
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      email: `mailto:?subject=${encodeURIComponent('Check this out on Loopync')}&body=${text}%20${url}`,
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Use native share API if available (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Loopync',
          text: getShareText(),
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  // Generate story card as image using canvas
  const generateStoryImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }
      
      // Instagram Story dimensions (9:16 aspect ratio)
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f021e');
      gradient.addColorStop(0.5, '#1a0b2e');
      gradient.addColorStop(1, '#0f021e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add decorative elements
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(100, 300, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(980, 1600, 250, 0, Math.PI * 2);
      ctx.fill();
      
      // Load Loopync logo
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          setTimeout(() => reject(new Error('Logo load timeout')), 3000);
          logo.src = '/loopync-logo.jpg';
        });
        
        // Draw logo at top center
        const logoSize = 120;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = 60;
        
        // Draw circular logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
        
        // Add glow effect around logo
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 4, 0, Math.PI * 2);
        ctx.stroke();
      } catch (logoErr) {
        console.log('Could not load logo:', logoErr);
      }
      
      // Loopync branding text below logo
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 56px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOPYNC', canvas.width / 2, 240);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px Arial, sans-serif';
      ctx.fillText('Social Media Reimagined', canvas.width / 2, 285);
      
      // Load and draw post image if available
      const mediaUrl = item.mediaUrl || item.image || item.coverImage;
      let imageLoaded = false;
      
      if (mediaUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(() => reject(new Error('Image load timeout')), 5000);
            img.src = mediaUrl;
          });
          
          // Draw image in center with rounded corners effect
          const imgSize = 700;
          const imgX = (canvas.width - imgSize) / 2;
          const imgY = 380;
          
          // Create rounded rectangle clip using compatible method
          ctx.save();
          drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 30);
          ctx.clip();
          
          // Draw image maintaining aspect ratio
          const scale = Math.max(imgSize / img.width, imgSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const offsetX = imgX + (imgSize - scaledWidth) / 2;
          const offsetY = imgY + (imgSize - scaledHeight) / 2;
          ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
          ctx.restore();
          
          // Add border glow
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 4;
          drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 30);
          ctx.stroke();
          
          imageLoaded = true;
        } catch (err) {
          console.log('Could not load image:', err);
        }
      }
      
      // If no image, show text content
      if (!imageLoaded) {
        ctx.fillStyle = 'rgba(26, 11, 46, 0.8)';
        drawRoundedRect(ctx, 90, 380, 900, 500, 30);
        ctx.fill();
        
        // Post text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        const postText = item.caption || item.text || item.description || 'Check out this post!';
        const words = postText.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 800) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        
        // Draw text lines (max 5 lines)
        lines.slice(0, 5).forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, 550 + (i * 70));
        });
      }
      
      // Author info card
      const authorName = item.author?.name || currentUser?.name || 'Loopync User';
      const authorHandle = item.author?.handle || currentUser?.handle || 'loopync';
      
      ctx.fillStyle = 'rgba(26, 11, 46, 0.9)';
      drawRoundedRect(ctx, 90, imageLoaded ? 1150 : 950, 900, 140, 20);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(authorName, 140, imageLoaded ? 1220 : 1020);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = '32px Arial, sans-serif';
      ctx.fillText(`@${authorHandle}`, 140, imageLoaded ? 1265 : 1065);
      
      // Link box - prominent display
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      drawRoundedRect(ctx, 90, imageLoaded ? 1320 : 1120, 900, 120, 20);
      ctx.fill();
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 90, imageLoaded ? 1320 : 1120, 900, 120, 20);
      ctx.stroke();
      
      // Link icon and URL
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔗 ' + shareUrl.replace('https://', '').replace('http://', ''), canvas.width / 2, imageLoaded ? 1395 : 1195);
      
      // Call to action button at bottom
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      drawRoundedRect(ctx, 190, 1520, 700, 120, 60);
      ctx.fill();
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, 190, 1520, 700, 120, 60);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👆 Swipe Up to View', canvas.width / 2, 1595);
      
      // Bottom hint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText('Add link sticker with the copied URL!', canvas.width / 2, 1720);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating story image:', error);
      throw error;
    }
  };

  // Open Instagram app or web
  const openInstagram = () => {
    // Try to open Instagram app first using deep link
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS || isAndroid) {
      // Try to open Instagram app
      window.location.href = 'instagram://story-camera';
      
      // Fallback to Instagram web after a short delay if app doesn't open
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 1500);
    } else {
      // Desktop - open Instagram web
      window.open('https://www.instagram.com/', '_blank');
    }
  };

  // Share to Instagram Stories
  const handleInstagramStory = async () => {
    setGeneratingStory(true);
    try {
      // Generate the story card image
      const storyImageDataUrl = await generateStoryImage();
      
      // Convert data URL to blob
      const response = await fetch(storyImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'loopync-story.png', { type: 'image/png' });
      
      // Copy link to clipboard first (using fallback)
      await copyToClipboardFallback(shareUrl);
      
      // Check if we can use Web Share API with files (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Share to Instagram Stories',
            text: `Check this out on Loopync! ${shareUrl}`,
          });
          toast.success('Link copied! Add it as a sticker in your story 📎');
          
          // After sharing, redirect to Instagram Stories
          setTimeout(() => {
            openInstagram();
          }, 500);
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            setGeneratingStory(false);
            return;
          }
          console.log('Share cancelled or failed:', err);
        }
      }
      
      // Fallback: Show preview, download, and redirect option
      setShowStoryPreview(storyImageDataUrl);
      toast.success('Story image ready! Download and share on Instagram 📸');
      
    } catch (error) {
      console.error('Instagram share error:', error);
      // Final fallback - just copy link and show message
      const shareText = `${getShareText()}\n\n${shareUrl}\n\n#Loopync`;
      const copied = await copyToClipboardFallback(shareText);
      if (copied) {
        toast.success('Link copied! Share it on Instagram Stories');
        // Still try to open Instagram
        setTimeout(() => openInstagram(), 500);
      } else {
        // Ultimate fallback - show the link in a toast
        toast.info(`Share this link: ${shareUrl}`, { duration: 10000 });
      }
    } finally {
      setGeneratingStory(false);
    }
  };

  // Download story image
  const downloadStoryImage = () => {
    if (showStoryPreview) {
      const link = document.createElement('a');
      link.download = 'loopync-story.png';
      link.href = showStoryPreview;
      link.click();
      toast.success('Image downloaded! Share it on Instagram Stories and add the link sticker 📎');
    }
  };

  const getItemTitle = () => {
    switch (type) {
      case 'post':
      case 'reel':
        return item.author?.name || 'User';
      case 'room':
      case 'tribe':
      case 'event':
      case 'venue':
      case 'product':
        return item.name || 'Item';
      case 'profile':
        return item.name || 'Profile';
      default:
        return 'Share';
    }
  };

  const getItemDescription = () => {
    return item.caption || item.description || item.bio || '';
  };

  return (
    <>
      {showFriendsModal ? (
        <ShareToFriendsModal
          currentUser={currentUser}
          item={item}
          type={type}
          onClose={() => {
            setShowFriendsModal(false);
            onClose();
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-gradient-to-b from-gray-900 to-black w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Share {type}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Share to Friends (In-App) */}
            {currentUser && (
              <button
                onClick={() => setShowFriendsModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 transition mb-3 border border-cyan-500/30"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center">
                  <Users size={24} className="text-cyan-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold">Share with Friends</p>
                  <p className="text-sm text-gray-400">Send directly to your friends on Loopync</p>
                </div>
              </button>
            )}

        {/* Native Share (Mobile) */}
        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 transition mb-3 border border-cyan-500/30"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center">
              <Link2 size={24} className="text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">Share via...</p>
              <p className="text-sm text-gray-400">Use your device&apos;s share menu</p>
            </div>
          </button>
        )}

        {/* Share Options */}
        <div className="space-y-3">
          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
          >
            {copied ? (
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={24} className="text-green-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Copy size={24} className="text-blue-400" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">
                {copied ? "Link Copied!" : "Copy Link"}
              </p>
              <p className="text-sm text-gray-400 truncate">{shareUrl}</p>
            </div>
          </button>

          {/* Social Media Grid */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            {/* Instagram Stories - Featured */}
            <button
              onClick={handleInstagramStory}
              disabled={generatingStory}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-orange-400/20 hover:from-purple-600/30 hover:via-pink-500/30 hover:to-orange-400/30 border border-pink-500/30 transition col-span-2"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                {generatingStory ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Instagram size={28} className="text-white" />
                )}
              </div>
              <span className="text-xs text-white font-medium">Instagram Stories</span>
            </button>

            <button
              onClick={() => handleShare('whatsapp')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <MessageCircle size={28} className="text-green-400" />
              </div>
              <span className="text-xs text-gray-400">WhatsApp</span>
            </button>

            <button
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Facebook size={28} className="text-blue-400" />
              </div>
              <span className="text-xs text-gray-400">Facebook</span>
            </button>

            <button
              onClick={() => handleShare('twitter')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Twitter size={28} className="text-sky-400" />
              </div>
              <span className="text-xs text-gray-400">Twitter</span>
            </button>

            <button
              onClick={() => handleShare('email')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Mail size={28} className="text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">Email</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-2xl bg-gray-800/50 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Preview</p>
          <div className="flex items-start gap-3">
            <img
              src={item.author?.avatar || item.image || item.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=default'}
              alt={getItemTitle()}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {getItemTitle()}
              </p>
              <p className="text-gray-400 text-xs truncate line-clamp-2">
                {getItemDescription() || 'Check this out on Loopync!'}
              </p>
            </div>
          </div>
        </div>
          </div>
        </div>
      )}

      {/* Story Preview Modal */}
      {showStoryPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Instagram Story Ready!</h3>
              <button
                onClick={() => setShowStoryPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Story Preview Image */}
            <div className="relative rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-cyan-500/20">
              <img
                src={showStoryPreview}
                alt="Story Preview"
                className="w-full"
                style={{ aspectRatio: '9/16' }}
              />
            </div>

            {/* Instructions */}
            <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
              <p className="text-white text-sm font-semibold mb-2">📱 How to share:</p>
              <ol className="text-gray-300 text-sm space-y-2">
                <li>1. Download the story image below</li>
                <li>2. Open Instagram → Create Story</li>
                <li>3. Upload this image</li>
                <li>4. Add a <span className="text-cyan-400">Link Sticker</span> with the copied URL</li>
                <li>5. Share your story! 🎉</li>
              </ol>
            </div>

            {/* Link Display */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-cyan-400 flex-shrink-0" />
              <p className="text-cyan-400 text-sm truncate flex-1">{shareUrl}</p>
              <button
                onClick={handleCopy}
                className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-1 rounded"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadStoryImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold rounded-xl hover:opacity-90 transition"
              >
                <Download size={20} />
                Download Story
              </button>
              <button
                onClick={() => setShowStoryPreview(false)}
                className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UniversalShareModal;
