import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Dog, AlertTriangle, Circle, TreePine, Home, Cat } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { classifyAnimalType } from '@/services/imageRecognition';
import { useToast } from '@/hooks/use-toast';
import AnimalInfoDialog from './AnimalInfoDialog';
import AnimalTracker from './AnimalTracker';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  category?: string;
  habitat?: string;
  diet?: string;
  threats?: string;
  conservation?: string;
  scientificName?: string;
};

type GalleryItemProps = {
  imageUrl: string;
  animals: Animal[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
  showReanalyze: boolean;
  isVideo: boolean;
  heatMapEnabled?: boolean;
  fileName?: string;
};

// Define colors for different animal types
const animalColors = {
  vaca: '#4ecdc4',
  boi: '#4ecdc4',
  cachorro: '#4ecdc4',
  'lobo-guará': '#2ecc71',
  capivara: '#ff6b6b',
  cutia: '#2ecc71',
  javali: '#b76d2b',
  'porco-do-mato': '#2ecc71',
  'onça-pintada': '#f39c12',
  jaguatirica: '#f39c12',
  invasivo: '#ea384c',
  nativo: '#2ecc71',
  default: '#4ecdc4'
};

// Get icon for animal type
const getAnimalIcon = (animalType: string) => {
  const type = animalType.toLowerCase();
  if (type.includes('vaca') || type.includes('cow') || type.includes('boi')) {
    return <Circle size={16} />;
  } else if (type.includes('cachorro') || type.includes('cão') || type.includes('dog')) {
    return <Dog size={16} />;
  } else if (type.includes('lobo')) {
    return <Dog size={16} />;
  } else if (type.includes('capivara') || type.includes('javali')) {
    return <AlertTriangle size={16} />;
  } else if (type.includes('cutia') || type.includes('porco-do-mato')) {
    return <TreePine size={16} />;
  } else if (type.includes('onça') || type.includes('jaguatirica')) {
    return <Cat size={16} />;
  } else {
    return <Circle size={16} />;
  }
};

// Get color for animal type
const getAnimalColor = (animalType: string) => {
  const type = animalType.toLowerCase();
  if (type.includes('vaca') || type.includes('cow')) {
    return animalColors.vaca;
  } else if (type.includes('boi')) {
    return animalColors.boi;
  } else if (type.includes('cachorro') || type.includes('cão') || type.includes('dog')) {
    return animalColors.cachorro;
  } else if (type.includes('lobo-guará') || type.includes('lobo')) {
    return animalColors['lobo-guará'];
  } else if (type.includes('capivara')) {
    return animalColors.capivara;
  } else if (type.includes('cutia')) {
    return animalColors.cutia;
  } else if (type.includes('javali')) {
    return animalColors.javali;
  } else if (type.includes('porco-do-mato')) {
    return animalColors['porco-do-mato'];
  } else if (type.includes('onça')) {
    return animalColors['onça-pintada'];
  } else if (type.includes('jaguatirica')) {
    return animalColors.jaguatirica;
  } else {
    return animalColors.default;
  }
};

export default function GalleryItem({
  imageUrl,
  animals,
  isAnalyzing,
  onAnalyze,
  showReanalyze,
  isVideo,
  heatMapEnabled = false,
  fileName,
}: GalleryItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showAnimalInfo, setShowAnimalInfo] = useState(false);
  const [trackerActive, setTrackerActive] = useState(false);
  const { toast } = useToast();
  
  // Initialize video element
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log(`Configurando reprodução de vídeo: ${imageUrl}`);
      videoRef.current.src = imageUrl;
      
      setVideoLoaded(false);
      
      const handleLoadedData = () => {
        setVideoLoaded(true);
        if (videoRef.current) {
          videoRef.current.play().catch(error => {
            console.error("Erro ao reproduzir vídeo:", error);
          });
          setIsPlaying(true);
        }
      };
      
      const handleError = (error: Event) => {
        console.error("Erro no carregamento do vídeo:", error);
        setVideoLoaded(false);
      };
      
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      videoRef.current.addEventListener('error', handleError);
      
      // Configurações específicas para mobile
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.muted = true;
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [imageUrl, isVideo]);

  // Handle video play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error("Erro ao reproduzir vídeo:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowAnimalInfo(true);
  };

  const toggleTracker = () => {
    setTrackerActive(!trackerActive);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border bg-background shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isVideo ? (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain"
              onClick={togglePlayPause}
              playsInline
              muted
              loop
              onLoadedData={() => setVideoLoaded(true)}
              style={{
                minHeight: '200px',
                backgroundColor: '#000'
              }}
            />
            
            {/* Rastreador de animais */}
            {videoLoaded && !isAnalyzing && animals.length > 0 && (
              <AnimalTracker
                isActive={trackerActive}
                onToggle={toggleTracker}
                animals={animals}
                videoElement={videoRef.current}
              />
            )}
          </>
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded media" 
            className="w-full h-full object-contain"
          />
        )}
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Analisando...</p>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-medium mb-2">
              {isAnalyzing ? 'Processando análise...' : (
                animals.length > 0 
                  ? `${animals.length} ${animals.length === 1 ? 'animal' : 'animais'} identificado${animals.length !== 1 ? 's' : ''}` 
                  : 'Nenhum animal detectado'
              )}
            </h3>
            
            {fileName && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <span>Arquivo: {fileName}</span>
              </div>
            )}
            
            {!isAnalyzing && animals.some(animal => 
              animal.category?.toLowerCase().includes('invasora') || 
              animal.name.toLowerCase().includes('capivara') ||
              animal.name.toLowerCase().includes('javali')
            ) && (
              <div className="flex items-center gap-1 text-sm text-red-500 font-medium mt-1">
                <AlertTriangle size={16} className="text-red-500" />
                <span>Espécie invasora detectada!</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {showReanalyze && (
              <Button 
                onClick={onAnalyze} 
                variant="secondary" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Reanalisar</span>
              </Button>
            )}
          </div>
        </div>
        
        {!isAnalyzing && animals.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Espécies detectadas:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {animals.map((animal, index) => {
                const isInvasive = animal.name.toLowerCase().includes('capivara') || 
                                  animal.name.toLowerCase().includes('javali') ||
                                  animal.category?.toLowerCase().includes('invasora');
                return (
                  <div 
                    key={`${animal.name}-${index}`} 
                    className={`flex items-center p-2 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors ${isInvasive ? 'border-red-500/70' : ''}`}
                    style={{ borderColor: isInvasive ? '#ea384c80' : getAnimalColor(animal.name) + '80' }}
                    onClick={() => handleAnimalClick(animal)}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
                      style={{ backgroundColor: isInvasive ? '#ea384c33' : getAnimalColor(animal.name) + '33' }}
                    >
                      {isInvasive ? (
                        <AlertTriangle size={16} className="text-red-500" />
                      ) : (
                        getAnimalIcon(animal.name)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{animal.name}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Confiança: {Math.round(animal.confidence * 100)}%</p>
                        {animal.category ? (
                          <p className={`font-medium ${isInvasive ? 'text-red-500' : ''}`}>
                            {animal.category}
                          </p>
                        ) : (
                          <p className={`font-medium ${isInvasive ? 'text-red-500' : ''}`}>
                            {isInvasive ? 'Espécie invasora' : classifyAnimalType(animal.name)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AnimalInfoDialog 
        animal={selectedAnimal}
        isOpen={showAnimalInfo}
        onClose={() => setShowAnimalInfo(false)}
      />
    </div>
  );
}
