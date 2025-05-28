
import { useGalleryState } from '@/hooks/useGalleryState';
import { useGalleryActions } from '../components/gallery/GalleryActions';

export function useGalleryLogic() {
  const {
    currentMedia,
    setCurrentMedia,
    showUploader,
    pendingFile,
    resetGallery,
    setupMediaForAnalysis
  } = useGalleryState();

  const {
    isAnalyzing,
    handleStartAnalysis,
    reanalyzeCurrentMedia,
    toggleHeatMap,
    handleImageUpload
  } = useGalleryActions({
    currentMedia,
    pendingFile,
    setCurrentMedia,
    onNewUpload: resetGallery
  });

  const handleImageUploadComplete = (imageUrl: string, file: File) => {
    const mediaType = setupMediaForAnalysis(imageUrl, file);
    handleImageUpload(imageUrl, file);
  };

  return {
    currentMedia,
    showUploader,
    pendingFile,
    isAnalyzing,
    handleImageUploadComplete,
    handleStartAnalysis,
    reanalyzeCurrentMedia,
    toggleHeatMap,
    resetGallery
  };
}
