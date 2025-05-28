
import ImageUploader from './ImageUploader';
import MediaDisplay from './MediaDisplay';
import { useGalleryState } from '@/hooks/useGalleryState';
import { useGalleryActions } from './GalleryActions';

export default function Gallery() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Detecção de Animais em Vídeo</h1>
      
      {showUploader ? (
        <div className="w-full max-w-2xl mx-auto">
          <ImageUploader onImageUpload={handleImageUploadComplete} />
        </div>
      ) : (
        <MediaDisplay
          currentMedia={currentMedia}
          isAnalyzing={isAnalyzing}
          pendingFile={pendingFile}
          onStartAnalysis={handleStartAnalysis}
          onReanalyze={reanalyzeCurrentMedia}
          onToggleHeatMap={toggleHeatMap}
          onNewUpload={resetGallery}
        />
      )}
    </div>
  );
}
