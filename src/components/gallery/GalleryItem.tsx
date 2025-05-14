import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, MoveHorizontal, Target, Move, MoveVertical, Radar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

type GalleryItemProps = {
  imageUrl: string;
  animals: Animal[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
  showReanalyze?: boolean;
  isVideo?: boolean;
};

// Helper function to format confidence scores as percentages
const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

export default function GalleryItem({ 
  imageUrl, 
  animals, 
  onAnalyze, 
  isAnalyzing,
  showReanalyze = false,
  isVideo = false
}: GalleryItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [motionDetection, setMotionDetection] = useState(false);
  const [motionPoints, setMotionPoints] = useState<{x: number, y: number, strength: number}[]>([]);
  const lastFrameRef = useRef<ImageData | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Enhanced species identification with detailed taxonomy
  const getDetailedSpecies = (animalName: string): string => {
    const nameMap: {[key: string]: string} = {
      'Javali': 'Sus scrofa (Javali Europeu)',
      'Porco-do-mato': 'Pecari tajacu (Cateto)',
      'Queixada': 'Tayassu pecari (Queixada)',
      'Cachorro': 'Canis familiaris (Cão Doméstico)',
      'Cachorro Caramelo': 'Canis familiaris (SRD Brasileiro)',
      'Pastor Alemão': 'Canis familiaris (Pastor Alemão)',
      'Labrador': 'Canis familiaris (Labrador Retriever)',
      'Golden Retriever': 'Canis familiaris (Golden Retriever)',
      'Lobo-guará': 'Chrysocyon brachyurus (Lobo-guará)',
      'Onça-pintada': 'Panthera onca (Onça-pintada)',
      'Capivara': 'Hydrochoerus hydrochaeris (Capivara)',
      'Veado': 'Ozotoceros bezoarticus (Veado-campeiro)'
    };
    
    return nameMap[animalName] || animalName;
  };

  // Enhanced detection function to classify invasive species
  const isInvasiveSpecies = (animalName: string): boolean => {
    const invasiveTerms = [
      'javali', 'porco', 'cateto', 'queixada', 'suino', 'suíno', 'wild boar', 'wild pig',
      'sus scrofa', 'pecari', 'tayassu'
    ];
    const lowerName = animalName.toLowerCase();
    return invasiveTerms.some(term => lowerName.includes(term));
  };
  
  // Check if any animal is an invasive species
  const hasInvasiveSpecies = animals.length > 0 && animals.some(animal => isInvasiveSpecies(animal.name));
  
  // Enhanced function to determine if it's a dog with expanded terminology (Stanford Dogs Dataset)
  const isDog = (animalName: string): boolean => {
    const dogTerms = [
      'cachorro', 'dog', 'canino', 'canídeo', 'pastor', 'labrador', 'golden', 
      'vira-lata', 'caramelo', 'canis familiaris', 'cão', 'cao', 'husky', 'bulldog',
      'poodle', 'dálmata', 'dalmata', 'boxer', 'beagle', 'chihuahua', 'cocker', 
      'dachshund', 'doberman', 'pug', 'rottweiler', 'shih tzu', 'yorkshire', 
      'border collie', 'akita', 'bull terrier', 'pit bull', 'terrier', 'spaniel',
      'retriever', 'shepherd', 'hound', 'mastiff', 'setter', 'collie', 'corgi'
    ];
    const lowerName = animalName.toLowerCase();
    return dogTerms.some(term => lowerName.includes(term));
  };
  
  // Advanced function to identify potential predator species
  const isPredator = (animalName: string): boolean => {
    const predatorTerms = [
      'onça', 'jaguar', 'panthera', 'lobo', 'wolf', 'felino', 'felid', 
      'puma', 'cougar', 'leão', 'lion', 'tigre', 'tiger', 'leopardo', 
      'leopard', 'raposa', 'fox'
    ];
    const lowerName = animalName.toLowerCase();
    return predatorTerms.some(term => lowerName.includes(term));
  };
  
  // Advanced function to identify herbivore species
  const isHerbivore = (animalName: string): boolean => {
    const herbivoreTerms = [
      'veado', 'deer', 'capivara', 'capybara', 'alce', 'moose', 
      'cavalo', 'horse', 'vaca', 'cow', 'boi', 'cattle', 'cabra', 
      'goat', 'ovelha', 'sheep', 'coelho', 'rabbit'
    ];
    const lowerName = animalName.toLowerCase();
    return herbivoreTerms.some(term => lowerName.includes(term));
  };
  
  // Advanced classification for specialized sensor tracking
  const getAnimalClassification = (animalName: string): 'invasive' | 'domestic' | 'predator' | 'herbivore' | 'other' => {
    if (isInvasiveSpecies(animalName)) return 'invasive';
    if (isDog(animalName)) return 'domestic';
    if (isPredator(animalName)) return 'predator';
    if (isHerbivore(animalName)) return 'herbivore';
    return 'other';
  };
  
  // Find the primary invasive animal if available (highest confidence)
  const primaryInvasiveAnimal = animals.length > 0 
    ? animals.filter(animal => isInvasiveSpecies(animal.name))
          .sort((a, b) => b.confidence - a.confidence)[0]
    : null;
  
  // Find the primary non-invasive animal if available (highest confidence)
  const primaryNonInvasiveAnimal = animals.length > 0
    ? animals.filter(animal => !isInvasiveSpecies(animal.name))
          .sort((a, b) => b.confidence - a.confidence)[0]
    : null;
  
  // Set up video playback and motion detection
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log("Setting up video playback with src:", imageUrl);
      videoRef.current.src = imageUrl;
      
      const handleTimeUpdate = () => {
        if (videoRef.current) {
          const progress = videoRef.current.currentTime / (videoRef.current.duration || 1);
          setVideoProgress(progress);
        }
      };
      
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      // Set up canvas for motion detection
      if (canvasRef.current) {
        contextRef.current = canvasRef.current.getContext('2d');
      }
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
        
        // Clean up motion detection
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [imageUrl, isVideo]);
  
  // Toggle motion detection
  useEffect(() => {
    if (isVideo && motionDetection && videoRef.current && canvasRef.current && contextRef.current) {
      // Reset previous motion detection
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        lastFrameRef.current = null;
      }
      
      // Start motion detection
      const detectMotion = () => {
        if (videoRef.current && canvasRef.current && contextRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = contextRef.current;
          
          // Set canvas dimensions to match video
          if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          
          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data for current frame
          const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Compare with last frame to detect motion
          if (lastFrameRef.current) {
            const lastFrame = lastFrameRef.current;
            const motionData = [];
            const blockSize = 16; // Size of blocks to analyze for motion
            const threshold = 30; // Threshold for motion detection
            
            // Analyze blocks of pixels for changes
            for (let y = 0; y < canvas.height; y += blockSize) {
              for (let x = 0; x < canvas.width; x += blockSize) {
                let diffCount = 0;
                let totalDiff = 0;
                
                // Check a sampling of pixels in this block
                for (let by = 0; by < blockSize && y + by < canvas.height; by += 4) {
                  for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx += 4) {
                    const pixelPos = ((y + by) * canvas.width + (x + bx)) * 4;
                    
                    // Calculate difference between frames for this pixel
                    const rDiff = Math.abs(currentFrame.data[pixelPos] - lastFrame.data[pixelPos]);
                    const gDiff = Math.abs(currentFrame.data[pixelPos + 1] - lastFrame.data[pixelPos + 1]);
                    const bDiff = Math.abs(currentFrame.data[pixelPos + 2] - lastFrame.data[pixelPos + 2]);
                    
                    const diff = (rDiff + gDiff + bDiff) / 3;
                    if (diff > threshold) {
                      diffCount++;
                      totalDiff += diff;
                    }
                  }
                }
                
                // If enough pixels changed, mark this as a motion point
                if (diffCount > 3) {
                  motionData.push({
                    x: x + blockSize / 2, 
                    y: y + blockSize / 2,
                    strength: Math.min(1, totalDiff / (255 * diffCount))
                  });
                }
              }
            }
            
            // Update motion points
            setMotionPoints(motionData);
          }
          
          // Save current frame for next comparison
          lastFrameRef.current = currentFrame;
          
          // Continue detection loop
          animationRef.current = requestAnimationFrame(detectMotion);
        }
      };
      
      // Start the detection loop
      detectMotion();
      
      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else if (!motionDetection && animationRef.current !== null) {
      // Stop motion detection
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
      setMotionPoints([]);
    }
  }, [motionDetection, isVideo]);
  
  // Get the appropriate badge colors based on animal type
  const getBadgeStyle = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'bg-red-100 border-red-600 text-red-800';
      case 'domestic':
        return 'bg-blue-100 border-blue-600 text-blue-800';
      case 'predator':
        return 'bg-orange-100 border-orange-600 text-orange-800';
      case 'herbivore':
        return 'bg-green-100 border-green-600 text-green-800';
      default:
        return 'bg-purple-100 border-purple-600 text-purple-800';
    }
  };
  
  // Toggle motion detection
  const toggleMotionDetection = () => {
    // Only allow toggling on videos
    if (!isVideo) {
      toast({
        title: "Sensor de movimento",
        description: "Detecção de movimento disponível apenas para vídeos.",
      });
      return;
    }
    
    if (!motionDetection) {
      toast({
        title: "Sensor de movimento ativado",
        description: "Monitorando movimentos no vídeo em tempo real.",
      });
    }
    
    setMotionDetection(!motionDetection);
  };
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative">
          {isVideo ? (
            <>
              <video 
                ref={videoRef}
                controls
                className="w-full h-64 object-cover"
                onError={(e) => {
                  console.error("Error loading video:", e);
                  e.currentTarget.poster = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-64 pointer-events-none"
                style={{ opacity: motionDetection ? 1 : 0 }}
              />
              {motionDetection && motionPoints.map((point, i) => (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(point.x / (canvasRef.current?.width || 1)) * 100}%`,
                    top: `${(point.y / (canvasRef.current?.height || 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                >
                  <div 
                    className="animate-ping rounded-full bg-red-500"
                    style={{
                      width: `${12 + point.strength * 16}px`,
                      height: `${12 + point.strength * 16}px`,
                      opacity: 0.5 + point.strength * 0.3
                    }}
                  />
                </div>
              ))}
            </>
          ) : (
            <img 
              src={imageUrl} 
              alt="Animal" 
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          )}
          
          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                <p>Analisando {isVideo ? 'vídeo' : 'imagem'}...</p>
              </div>
            </div>
          )}
          
          {animals.length > 0 && !isAnalyzing && (
            <>
              {/* Warning badge for invasive species */}
              {hasInvasiveSpecies && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                    <AlertTriangle size={14} />
                    <span>Espécie Invasora</span>
                  </Badge>
                </div>
              )}
              
              {/* Video indicator */}
              {isVideo && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    <Frame size={14} />
                    <span>Detecção em vídeo</span>
                  </Badge>
                </div>
              )}
              
              {/* Animal counter */}
              {animals.length > 1 && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    {animals.length} animais detectados
                  </Badge>
                </div>
              )}
            </>
          )}
          
          {/* Motion detection button for videos */}
          {isVideo && animals.length > 0 && !isAnalyzing && (
            <Button 
              size="sm"
              variant={motionDetection ? "default" : "outline"}
              className={`absolute bottom-2 left-2 flex items-center gap-1 text-xs ${
                motionDetection ? 'bg-red-600 hover:bg-red-700' : 'bg-black/50 hover:bg-black/70 text-white border-none'
              }`}
              onClick={toggleMotionDetection}
            >
              {motionDetection ? (
                <>
                  <Radar size={14} />
                  <span>Sensor ativo</span>
                </>
              ) : (
                <>
                  <Target size={14} />
                  <span>Detectar movimento</span>
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Details panel */}
        <div className="p-4">
          {animals.length > 0 ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">Resultados</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {animals.length} {animals.length === 1 ? 'animal' : 'animais'} identificado{animals.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {showReanalyze && (
                    <button
                      className="text-gray-500 hover:text-gray-700 p-1"
                      onClick={onAnalyze}
                      title="Reanalisar"
                    >
                      <RotateCw size={18} />
                    </button>
                  )}
                  <button 
                    className="text-gray-500 hover:text-gray-700 p-1"
                    onClick={() => setShowDetails(!showDetails)}
                    title={showDetails ? "Esconder detalhes" : "Mostrar detalhes"}
                  >
                    {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {animals.map((animal, index) => (
                  <Badge 
                    key={index} 
                    variant={isInvasiveSpecies(animal.name) ? "destructive" : "outline"}
                    className={getBadgeStyle(animal.name)}
                  >
                    {animal.name} - {formatConfidence(animal.confidence)}
                  </Badge>
                ))}
              </div>
              
              {showDetails && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Detalhes</h4>
                  {animals.map((animal, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {getDetailedSpecies(animal.name)}
                        </span>
                        <Badge 
                          variant={isInvasiveSpecies(animal.name) ? "destructive" : "outline"} 
                          className={getBadgeStyle(animal.name)}
                        >
                          {formatConfidence(animal.confidence)}
                        </Badge>
                      </div>
                      {animal.description && (
                        <p className="text-sm mt-1 text-gray-600">{animal.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <Button 
                onClick={onAnalyze}
                className="bg-agrotech-blue hover:bg-agrotech-darkblue gap-2"
                disabled={isAnalyzing}
              >
                <Search size={16} />
                <span>Analisar {isVideo ? 'vídeo' : 'imagem'}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
