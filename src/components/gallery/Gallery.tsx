
import GalleryHeader from './GalleryHeader';
import GalleryContent from './GalleryContent';
import { useGalleryLogic } from '@/hooks/useGalleryLogic';

export default function Gallery() {
  const {
    currentMedia,
    showUploader,
    pendingFile,
    isAnalyzing,
    handleImageUploadComplete,
    handleStartAnalysis,
    reanalyzeCurrentMedia,
    toggleHeatMap,
    resetGallery
  } = useGalleryLogic();

  return (
    <div>
      <GalleryHeader title="Detecção de Animais em Vídeo" />
      <GalleryContent
        showUploader={showUploader}
        currentMedia={currentMedia}
        isAnalyzing={isAnalyzing}
        pendingFile={pendingFile}
        onImageUploadComplete={handleImageUploadComplete}
        onStartAnalysis={handleStartAnalysis}
        onReanalyze={reanalyzeCurrentMedia}
        onToggleHeatMap={toggleHeatMap}
        onNewUpload={resetGallery}
      />
    </div>
  );
}
