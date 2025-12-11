import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

const ImageCropModal = ({ imageSrc, onClose, onCropComplete, aspectRatio = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white">Crop Photo</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-500 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          cropShape={aspectRatio === 1 ? "round" : "rect"}
          showGrid={true}
          style={{
            containerStyle: {
              backgroundColor: 'transparent'
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-gray-700 space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-4">
          <ZoomOut size={20} className="text-gray-400" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <ZoomIn size={20} className="text-gray-400" />
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-4">
          <RotateCw size={20} className="text-gray-400" />
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(e.target.value)}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-gray-400 text-sm w-12">{rotation}°</span>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
