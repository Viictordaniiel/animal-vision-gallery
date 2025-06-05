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
  scientificName?: string;
  category?: string;
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
    analyzeMedia(imageUrl, file, mediaType, false); // false = primeira análise
  };
  
  const analyzeMedia = async (url: string, file: File, type: 'image' | 'video', isReanalysis: boolean = false) => {
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
          title: isReanalysis ? "Reanalisando vídeo" : "Processando vídeo",
          description: isReanalysis ? "Buscando animais similares..." : "Analisando quadros para identificar espécies. Processamento pode demorar mais..."
        });
      } else if (isReanalysis) {
        toast({
          title: "Reanalisando imagem",
          description: "Buscando animais similares..."
        });
      }
      
      console.log(`${isReanalysis ? 'Reanalisando' : 'Analisando'} ${type} com arquivo: ${file.name}`);
      
      const results = await recognizeAnimal(imageUrlWithTimestamp, file.name, isReanalysis, type === 'video');
      
      console.log('Resultados da análise:', results);
      
      // Check for invasive species with improved detection logic
      const invasiveSpecies = results.filter(animal => {
        const animalName = animal.name.toLowerCase();
        const animalCategory = animal.category?.toLowerCase() || '';
        
        // Check if it's explicitly marked as invasive species
        if (animalCategory.includes('invasora') || animalCategory.includes('invasiva')) {
          console.log(`Animal ${animal.name} detectado como invasor por categoria: ${animal.category}`);
          return true;
        }
        
        // Check specific invasive species names
        if (animalName.includes('javali')) {
          console.log(`Javali detectado como espécie invasora: ${animal.name}`);
          return true;
        }
        
        return false;
      });
      
      console.log(`Espécies invasoras detectadas: ${invasiveSpecies.length}`, invasiveSpecies);
      
      // Add invasive species to gallery with more reliable event dispatch
      if (invasiveSpecies.length > 0) {
        invasiveSpecies.forEach((species, index) => {
          const invasiveRecord = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
            name: species.name,
            confidence: species.confidence,
            description: species.description,
            scientificName: species.scientificName,
            category: species.category || 'Espécie invasora',
            detectedAt: new Date(),
            imageUrl: url,
            fileName: file.name,
            isVideo: type === 'video'
          };
          
          console.log('Adicionando espécie invasora à galeria:', invasiveRecord);
          
          // Use setTimeout to ensure event is dispatched after current execution
          setTimeout(() => {
            const event = new CustomEvent('invasiveSpeciesDetected', {
              detail: invasiveRecord
            });
            window.dispatchEvent(event);
            console.log('Evento invasiveSpeciesDetected disparado para:', species.name);
          }, 100);
          
          // Show specific toast for invasive species
          toast({
            title: "Espécie invasora detectada!",
            description: `${species.name} foi adicionada à galeria de invasoras.`,
            variant: "destructive"
          });
        });
      }
      
      // Update current media with results
      setCurrentMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          analyzed: true,
          animals: results
        };
      });
      
      if (isReanalysis) {
        toast({
          title: "Reanálise concluída",
          description: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''} (incluindo similares).`
        });
      } else {
        toast({
          title: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''}!`,
          description: type === 'video' ? "Análise de vídeo concluída com sucesso." : "Análise concluída com sucesso."
        });
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
          title: "Reanalisando vídeo",
          description: "Buscando animais similares... Processamento pode demorar mais..."
        });
      } else {
        toast({
          title: "Reanalisando imagem",
          description: "Buscando animais similares..."
        });
      }
      
      // Criar um arquivo simulado para manter compatibilidade
      const mockFile = new File([''], currentMedia.fileName || 'unknown', { type: currentMedia.type === 'video' ? 'video/mp4' : 'image/jpeg' });
      
      const results = await recognizeAnimal(mediaUrlWithTimestamp, currentMedia.fileName, true, currentMedia.type === 'video'); // true = reanálise
      
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
        description: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''} (incluindo similares).`
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
