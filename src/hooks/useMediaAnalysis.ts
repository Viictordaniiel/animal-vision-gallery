
import { useState } from 'react';
import { recognizeAnimal } from '@/services/imageRecognition';
import { toast } from '@/components/ui/use-toast';
import { GalleryItemType } from '@/components/gallery/types';

export function useMediaAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMedia = async (url: string, file: File, type: 'image' | 'video', updateCurrentMedia: (updater: (prev: GalleryItemType | null) => GalleryItemType | null) => void) => {
    setIsAnalyzing(true);
    
    try {
      // Add timestamp to avoid browser cache and ensure uniqueness
      const timestamp = Date.now();
      const imageUrlWithTimestamp = url.includes('?') 
        ? `${url}&t=${timestamp}` 
        : `${url}?t=${timestamp}`;
      
      // For videos, notify that we're processing frames
      if (type === 'video') {
        toast({
          title: "Processando vídeo",
          description: "Analisando quadros para identificar espécies e rastrear movimentos."
        });
      }
      
      console.log(`Analisando ${type} com sistema aprimorado: ${imageUrlWithTimestamp}`);
      
      const results = await recognizeAnimal(imageUrlWithTimestamp);
      
      // Add dramatic delay before showing results
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Show dramatic recognition message
      toast({
        title: "🔍 Processamento concluído!",
        description: "Revelando espécies identificadas..."
      });
      
      // Another shorter delay for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update current media with results
      updateCurrentMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          analyzed: true,
          animals: results
        };
      });
      
      toast({
        title: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''}!`,
        description: "O sensor de calor está agora rastreando movimentos dos animais detectados."
      });
      
      // If it's a video with animals detected, inform about the enhanced motion tracking
      if (type === 'video' && results.length > 0) {
        setTimeout(() => {
          toast({
            title: "Sensores de presença ativados",
            description: "Use o botão 'Ativar Mapa de Calor' para visualizar os padrões de movimento."
          });
        }, 1500);
      }
      
    } catch (error) {
      console.error('Erro ao analisar mídia:', error);
      toast({
        variant: "destructive",
        title: `Erro ao analisar ${type === 'video' ? 'vídeo' : 'imagem'}`,
        description: "Não foi possível processar o reconhecimento."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analyzeMedia
  };
}
