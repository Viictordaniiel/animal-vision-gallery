
import ImageUploader from './ImageUploader';
import MediaDisplay from './MediaDisplay';
import { GalleryItemType } from './types';

type GalleryContentProps = {
  showUploader: boolean;
  currentMedia: GalleryItemType | null;
  isAnalyzing: boolean;
  pendingFile: File | null;
  onImageUploadComplete: (imageUrl: string, file: File) => void;
  onStartAnalysis: () => void;
  onReanalyze: () => void;
  onToggleHeatMap: () => void;
  onNewUpload: () => void;
};

export default function GalleryContent({
  showUploader,
  currentMedia,
  isAnalyzing,
  pendingFile,
  onImageUploadComplete,
  onStartAnalysis,
  onReanalyze,
  onToggleHeatMap,
  onNewUpload
}: GalleryContentProps) {
  if (showUploader) {
    return (
      <div className="container mx-auto px-4">
        <div className="w-full max-w-2xl mx-auto">
          <ImageUploader onImageUpload={onImageUploadComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <MediaDisplay
        currentMedia={currentMedia}
        isAnalyzing={isAnalyzing}
        pendingFile={pendingFile}
        onStartAnalysis={onStartAnalysis}
        onReanalyze={onReanalyze}
        onToggleHeatMap={onToggleHeatMap}
        onNewUpload={onNewUpload}
      />
    </div>
  );
}
