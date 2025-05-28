
import { useState } from 'react';
import { GalleryItemType } from '@/components/gallery/types';

export function useGalleryState() {
  const [currentMedia, setCurrentMedia] = useState<GalleryItemType | null>(null);
  const [showUploader, setShowUploader] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const resetGallery = () => {
    setShowUploader(true);
    setCurrentMedia(null);
    setPendingFile(null);
  };

  const setupMediaForAnalysis = (imageUrl: string, file: File) => {
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    
    setShowUploader(false);
    setPendingFile(file);

    const newMedia: GalleryItemType = {
      url: imageUrl,
      analyzed: false,
      animals: [],
      timestamp: Date.now(),
      type: mediaType,
      heatMapEnabled: false
    };
    
    setCurrentMedia(newMedia);
    return mediaType;
  };

  return {
    currentMedia,
    setCurrentMedia,
    showUploader,
    pendingFile,
    resetGallery,
    setupMediaForAnalysis
  };
}
