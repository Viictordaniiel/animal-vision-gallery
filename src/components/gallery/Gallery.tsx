
import { useState } from 'react';
import ImageUploader from './ImageUploader';
import MediaDisplay from './MediaDisplay';
import { useMediaAnalysis } from '@/hooks/useMediaAnalysis';
import { toast } from '@/components/ui/use-toast';
import { GalleryItemType } from './types';

export default function Gallery() {
  const [currentMedia, setCurrentMedia] = useState<GalleryItemType | null>(null);
  const [showUploader, setShowUploader] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { isAnalyzing, analyzeMedia } = useMediaAnalysis();
  
  const handleImageUpload = (imageUrl: string, file: File) => {
    // Determine if it's an image or video
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    
    // Hide uploader after successful upload
    setShowUploader(false);
    
    // Store the file for later analysis
    setPendingFile(file);
    
    // Show appropriate toast message
    if (isVideo) {
      toast({
        title: "Vídeo carregado",
        description: "Clique em 'Analisar' para iniciar a detecção de animais."
      });
    } else {
      toast({
        title: "Imagem carregada",
        description: "Clique em 'Analisar' para iniciar a detecção de animais."
      });
    }

    // Create a new media object without analysis
    const newMedia: GalleryItemType = {
      url: imageUrl,
      analyzed: false,
      animals: [],
      timestamp: Date.now(),
      type: mediaType,
      heatMapEnabled: false // Start with heat map disabled
    };
    
    // Set current media
    setCurrentMedia(newMedia);
  };

  // Function to start analysis manually
  function handleStartAnalysis() {
    if (!currentMedia || !pendingFile) return;
    
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type, setCurrentMedia);
  }

  // Function to reanalyze
  async function reanalyzeCurrentMedia() {
    if (!currentMedia || !pendingFile) return;
    
    setCurrentMedia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        analyzed: false
      };
    });
    
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type, setCurrentMedia);
  }

  // Function to toggle heat map
  function toggleHeatMap() {
    if (!currentMedia || currentMedia.type !== 'video') return;
    
    setCurrentMedia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        heatMapEnabled: !prev.heatMapEnabled
      };
    });
    
    // Show toast based on new state
    setTimeout(() => {
      toast({
        title: currentMedia.heatMapEnabled ? "Mapa de calor desativado" : "Mapa de calor ativado",
        description: currentMedia.heatMapEnabled ? 
          "Visualização normal de vídeo restaurada." : 
          "Rastreando movimentos dos animais com mapa de calor."
      });
    }, 100);
  }

  // Function to show uploader again
  function handleNewUpload() {
    setShowUploader(true);
    setCurrentMedia(null);
    setPendingFile(null);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Detecção de Animais em Vídeo</h1>
      
      {showUploader ? (
        <div className="w-full max-w-2xl mx-auto">
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>
      ) : (
        <MediaDisplay
          currentMedia={currentMedia}
          isAnalyzing={isAnalyzing}
          pendingFile={pendingFile}
          onStartAnalysis={handleStartAnalysis}
          onReanalyze={reanalyzeCurrentMedia}
          onToggleHeatMap={toggleHeatMap}
          onNewUpload={handleNewUpload}
        />
      )}
    </div>
  );
}
