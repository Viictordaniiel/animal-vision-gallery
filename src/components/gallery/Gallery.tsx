import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Play } from 'lucide-react';
import ImageUploader from './ImageUploader';
import GalleryItem from './GalleryItem';
import { recognizeAnimal } from '@/services/imageRecognition';
import { toast } from '@/components/ui/use-toast';

// Type for identified animals
type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Type for gallery items
type GalleryItemType = {
  url: string;
  analyzed: boolean;
  animals: Animal[];
  timestamp?: number;
  type: 'image' | 'video';
  heatMapEnabled?: boolean;
};

export default function Gallery() {
  const [currentMedia, setCurrentMedia] = useState<GalleryItemType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
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
  
  const analyzeMedia = async (url: string, file: File, type: 'image' | 'video') => {
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
      setCurrentMedia(prev => {
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

  // Function to start analysis manually
  function handleStartAnalysis() {
    if (!currentMedia || !pendingFile) return;
    
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type);
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
    
    analyzeMedia(currentMedia.url, pendingFile, currentMedia.type);
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
      ) : currentMedia ? (
        <div className="flex flex-col items-center">
          <div className="mb-6 w-full flex justify-between items-center">
            <h2 className="text-xl">Análise de {currentMedia.type === 'video' ? 'Vídeo' : 'Imagem'}</h2>
            <div className="flex gap-2">
              {!currentMedia.analyzed && (
                <Button 
                  onClick={handleStartAnalysis} 
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Play size={16} />
                  <span>{isAnalyzing ? 'Analisando...' : 'Analisar'}</span>
                </Button>
              )}
              {currentMedia.type === 'video' && currentMedia.analyzed && (
                <Button 
                  onClick={toggleHeatMap} 
                  variant={currentMedia.heatMapEnabled ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {currentMedia.heatMapEnabled ? "Desativar" : "Ativar"} Mapa de Calor
                </Button>
              )}
              <Button 
                onClick={handleNewUpload} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                <span>Nova Análise</span>
              </Button>
            </div>
          </div>
          
          <div className="w-full max-w-3xl">
            <GalleryItem
              imageUrl={currentMedia.url}
              animals={currentMedia.animals}
              onAnalyze={reanalyzeCurrentMedia}
              isAnalyzing={isAnalyzing}
              showReanalyze={currentMedia.analyzed}
              isVideo={currentMedia.type === 'video'}
              heatMapEnabled={currentMedia.heatMapEnabled}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregue um vídeo ou imagem para começar a detecção de animais.</p>
          <Button 
            onClick={handleNewUpload}
            className="mt-4"
          >
            Carregar Mídia
          </Button>
        </div>
      )}
    </div>
  );
}
