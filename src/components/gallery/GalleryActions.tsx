
import { useMediaAnalysis } from '@/hooks/useMediaAnalysis';
import { toast } from '@/components/ui/use-toast';
import { GalleryItemType } from './types';

type GalleryActionsProps = {
  currentMedia: GalleryItemType | null;
  pendingFile: File | null;
  setCurrentMedia: (updater: (prev: GalleryItemType | null) => GalleryItemType | null) => void;
  onNewUpload: () => void;
};

export function useGalleryActions({
  currentMedia,
  pendingFile,
  setCurrentMedia,
  onNewUpload
}: GalleryActionsProps) {
  const { isAnalyzing, analyzeMedia } = useMediaAnalysis();

  const handleStartAnalysis = () => {
    if (!currentMedia || !pendingFile) return;
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type, setCurrentMedia);
  };

  const reanalyzeCurrentMedia = async () => {
    if (!currentMedia || !pendingFile) return;
    
    setCurrentMedia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        analyzed: false
      };
    });
    
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type, setCurrentMedia);
  };

  const toggleHeatMap = () => {
    if (!currentMedia || currentMedia.type !== 'video') return;
    
    setCurrentMedia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        heatMapEnabled: !prev.heatMapEnabled
      };
    });
    
    setTimeout(() => {
      toast({
        title: currentMedia.heatMapEnabled ? "Mapa de calor desativado" : "Mapa de calor ativado",
        description: currentMedia.heatMapEnabled ? 
          "Visualização normal de vídeo restaurada." : 
          "Rastreando movimentos dos animais com mapa de calor."
      });
    }, 100);
  };

  const handleImageUpload = (imageUrl: string, file: File) => {
    const isVideo = file.type.startsWith('video/');
    
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
  };

  return {
    isAnalyzing,
    handleStartAnalysis,
    reanalyzeCurrentMedia,
    toggleHeatMap,
    handleImageUpload,
    handleNewUpload: onNewUpload
  };
}
