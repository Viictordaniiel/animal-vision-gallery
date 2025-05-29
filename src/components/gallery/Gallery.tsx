import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import ImageUploader from './ImageUploader';
import GalleryItem from './GalleryItem';
import DroneCapture from './DroneCapture';
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
  fileName?: string;
};

export default function Gallery() {
  const [currentMedia, setCurrentMedia] = useState<GalleryItemType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [showDroneCapture, setShowDroneCapture] = useState(false);
  
  const handleImageUpload = (imageUrl: string, file: File) => {
    // Determine if it's an image or video
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    
    // Hide uploader after successful upload
    setShowUploader(false);
    
    // Show appropriate toast message
    if (isVideo) {
      toast({
        title: "Vídeo detectado",
        description: "Pronto para análise em modo vídeo."
      });
    }

    // Create a new media object
    const newMedia: GalleryItemType = {
      url: imageUrl,
      analyzed: false,
      animals: [],
      timestamp: Date.now(),
      type: mediaType,
      fileName: file.name
    };
    
    // Set current media
    setCurrentMedia(newMedia);

    // Automatically analyze the uploaded media
    analyzeMedia(imageUrl, file, mediaType);
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
          description: "Analisando para identificar espécies."
        });
      }
      
      console.log(`Analisando ${type} com arquivo: ${file.name}`);
      
      const results = await recognizeAnimal(imageUrlWithTimestamp, file.name);
      
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
        description: "Análise concluída com sucesso."
      });
      
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

  // Function to reanalyze
  const reanalyzeCurrentMedia = async () => {
    if (!currentMedia) return;
    
    setCurrentMedia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        analyzed: false
      };
    });
    
    setIsAnalyzing(true);
    
    try {
      // Add timestamp to avoid browser cache
      const timestamp = Date.now();
      const mediaUrlWithTimestamp = currentMedia.url.includes('?') 
        ? `${currentMedia.url}&t=${timestamp}` 
        : `${currentMedia.url}?t=${timestamp}`;
      
      // Show appropriate message for video processing
      if (currentMedia.type === 'video') {
        toast({
          title: "Processando vídeo",
          description: "Reanalisando..."
        });
      }
      
      const results = await recognizeAnimal(mediaUrlWithTimestamp, currentMedia.fileName);
      
      // Update the current media with new results
      setCurrentMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          analyzed: true,
          animals: results,
          timestamp: timestamp
        };
      });
      
      toast({
        title: "Reanálise concluída",
        description: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''}.`
      });
      
    } catch (error) {
      console.error('Erro ao reanalisar mídia:', error);
      
      setCurrentMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          analyzed: true
        };
      });
      
      toast({
        variant: "destructive",
        title: "Erro na reanálise",
        description: "Não foi possível processar o reconhecimento."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to show uploader again
  const handleNewUpload = () => {
    setShowUploader(true);
    setCurrentMedia(null);
  };

  // Function to show drone capture
  const handleDroneCapture = () => {
    setShowDroneCapture(true);
  };

  // Function to handle drone image capture
  const handleDroneImageCapture = (imageUrl: string, file: File) => {
    setShowDroneCapture(false);
    handleImageUpload(imageUrl, file);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Detecção de Animais</h1>
      
      {showUploader ? (
        <div className="w-full max-w-2xl mx-auto">
          <ImageUploader onImageUpload={handleImageUpload} />
          
          {/* Botão para captura via drone */}
          <div className="mt-4 text-center">
            <Button 
              onClick={handleDroneCapture}
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              <Camera size={16} />
              Capturar via Drone
            </Button>
          </div>
        </div>
      ) : currentMedia ? (
        <div className="flex flex-col items-center">
          <div className="mb-6 w-full flex justify-between items-center">
            <h2 className="text-xl">Análise de {currentMedia.type === 'video' ? 'Vídeo' : 'Imagem'}</h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleDroneCapture}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Camera size={16} />
                <span>Drone</span>
              </Button>
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
              isAnalyzing={isAnalyzing || !currentMedia.analyzed}
              showReanalyze={currentMedia.analyzed}
              isVideo={currentMedia.type === 'video'}
              fileName={currentMedia.fileName}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregue um vídeo ou imagem para começar a detecção de animais.</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              onClick={handleNewUpload}
            >
              Carregar Mídia
            </Button>
            <Button 
              onClick={handleDroneCapture}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Camera size={16} />
              Capturar via Drone
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal de captura via drone */}
      {showDroneCapture && (
        <DroneCapture 
          onImageCapture={handleDroneImageCapture}
          onClose={() => setShowDroneCapture(false)}
        />
      )}
    </div>
  );
}
