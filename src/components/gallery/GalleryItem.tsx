
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, Target, Move, Shield, Crosshair, Dog } from 'lucide-react';
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
  const detectionBoxRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingQuality, setTrackingQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [detectedAnimals, setDetectedAnimals] = useState<{animal: Animal, box: HTMLDivElement | null}[]>([]);
  const [animalMovements, setAnimalMovements] = useState<{[key: number]: {x: number, y: number, speed: number, pattern: string}}>({}); 
  
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Enhanced detection function to classify invasive species
  const isInvasiveSpecies = (animalName: string): boolean => {
    const invasiveTerms = [
      'javali', 'porco', 'cateto', 'queixada', 'suíno', 'suino', 'wild boar', 'wild pig'
    ];
    const lowerName = animalName.toLowerCase();
    return invasiveTerms.some(term => lowerName.includes(term));
  };
  
  // Check if any animal is an invasive species
  const hasInvasiveSpecies = animals.length > 0 && animals.some(animal => isInvasiveSpecies(animal.name));
  
  // Helper function to determine if it's a dog
  const isDog = (animalName: string): boolean => {
    const dogTerms = [
      'cachorro', 'dog', 'canino', 'canídeo', 'pastor', 'labrador', 'golden', 'vira-lata', 'caramelo'
    ];
    const lowerName = animalName.toLowerCase();
    return dogTerms.some(term => lowerName.includes(term));
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
  
  // Initialize movement patterns for each animal when detected
  useEffect(() => {
    if (animals.length > 0 && !isAnalyzing) {
      // Clear previous detection boxes
      setDetectedAnimals([]);
      
      // Create new detection boxes and initialize movement patterns
      const newBoxes = animals.slice(0, Math.min(5, animals.length)).map((animal, index) => {
        // Initialize unique movement pattern for each animal
        const newMovements = {...animalMovements};
        
        // Different movement patterns based on animal type
        const isInvasive = isInvasiveSpecies(animal.name);
        const isDogAnimal = isDog(animal.name);
        
        // Set different movement speeds and patterns for different animal types
        let speed = 1.0;
        let pattern = 'linear';
        
        if (isInvasive) {
          speed = 0.8 + (Math.random() * 0.4); // Slower, more deliberate
          pattern = Math.random() > 0.5 ? 'circular' : 'zigzag';
        } else if (isDogAnimal) {
          speed = 1.2 + (Math.random() * 0.6); // Faster, more energetic
          pattern = Math.random() > 0.7 ? 'bouncy' : 'playful';
        } else {
          speed = 0.5 + (Math.random() * 0.6); // Varied for other animals
          pattern = Math.random() > 0.5 ? 'cautious' : 'random';
        }
        
        newMovements[index] = {
          x: (Math.random() * 50) - 25, // Random starting position offset
          y: (Math.random() * 30) - 15,
          speed,
          pattern
        };
        
        setAnimalMovements(newMovements);
        
        return {
          animal,
          box: null
        };
      });
      
      setDetectedAnimals(newBoxes);
    }
  }, [animals, isAnalyzing]);
  
  // Enhanced video tracking with more natural movement patterns
  useEffect(() => {
    // Set up video playback if this is a video element
    if (isVideo && videoRef.current) {
      videoRef.current.src = imageUrl;
      
      // Add event listeners for video playback to update detection box
      const handleVideoPlay = () => {
        console.log("Video playback started");
        setIsTracking(true);
      };
      
      const handleVideoPause = () => {
        console.log("Video playback paused");
        setIsTracking(false);
      };
      
      const handleVideoEnded = () => {
        console.log("Video playback ended");
        setIsTracking(false);
      };
      
      // Enhanced tracking with advanced motion patterns
      const handleTimeUpdate = () => {
        if (detectedAnimals.length > 0 && videoRef.current) {
          // Get current playback position
          const videoProgress = videoRef.current.currentTime;
          const videoDuration = videoRef.current.duration || 1;
          const progressPercent = videoProgress / videoDuration;
          
          detectedAnimals.forEach((detectedAnimal, index) => {
            if (detectedAnimal.box) {
              const animalType = detectedAnimal.animal.name.toLowerCase();
              const isInvasive = isInvasiveSpecies(animalType);
              const isDogAnimal = isDog(animalType);
              const movement = animalMovements[index] || {
                x: 0, y: 0, speed: 1, pattern: 'linear'
              };
              
              // Get base movement characteristics
              const { speed, pattern } = movement;
              
              // Calculate movement based on pattern
              let baseX = 0, baseY = 0, microX = 0, microY = 0, jitterX = 0, jitterY = 0;
              const time = videoProgress * speed;
              
              // Create different movement patterns based on animal type
              switch(pattern) {
                case 'circular':
                  // Circular movement pattern
                  baseX = Math.cos(time * 1.2) * 15;
                  baseY = Math.sin(time * 1.2) * 15;
                  break;
                  
                case 'zigzag':
                  // Zig-zag movement
                  baseX = Math.sin(time * 2) * 20;
                  baseY = Math.cos(time * 0.5) * 5;
                  break;
                  
                case 'bouncy':
                  // Bouncy, playful dog movement
                  baseX = Math.sin(time * 3) * 25;
                  baseY = Math.abs(Math.sin(time * 5)) * 15;
                  break;
                  
                case 'playful':
                  // More playful movement
                  baseX = Math.sin(time * 2.5) * 18 + Math.cos(time * 4) * 8;
                  baseY = Math.cos(time * 3.5) * 12;
                  break;
                  
                case 'cautious':
                  // More cautious animal movement
                  baseX = Math.sin(time * 1.2) * 10;
                  baseY = Math.cos(time * 0.8) * 6;
                  break;
                  
                case 'random':
                default:
                  // Semi-random movement
                  baseX = (Math.sin(time) + Math.cos(time * 2.3)) * 12;
                  baseY = (Math.cos(time * 1.5) + Math.sin(time * 0.7)) * 8;
              }
              
              // Add micro-movements for natural feel
              microX = Math.sin(time * 7) * 3;
              microY = Math.cos(time * 8) * 3;
              
              // Add jitter when actively tracking
              if (isTracking) {
                const jitterIntensity = isDogAnimal ? 1.5 : (isInvasive ? 0.8 : 0.5);
                jitterX = (Math.random() - 0.5) * jitterIntensity;
                jitterY = (Math.random() - 0.5) * jitterIntensity;
              }
              
              // Calculate different positions for each animal to avoid overlap
              // Make them more spread out
              let regionX = 0, regionY = 0;
              
              // Position based on array index, with more spacing
              switch (index % 5) {
                case 0: // Center
                  regionX = 0;
                  regionY = 0;
                  break;
                case 1: // Top-right
                  regionX = 70;
                  regionY = -50;
                  break;
                case 2: // Bottom-left
                  regionX = -60;
                  regionY = 40;
                  break;
                case 3: // Top-left
                  regionX = -70;
                  regionY = -50;
                  break;
                case 4: // Bottom-right
                  regionX = 60;
                  regionY = 40;
                  break;
              }
              
              // Combine all movements
              const totalX = regionX + baseX + microX + jitterX;
              const totalY = regionY + baseY + microY + jitterY;
              
              // Apply transform with easing for smoother movements
              detectedAnimal.box.style.transform = `translate(calc(${totalX}px), calc(${totalY}px)) scale(${1 + Math.sin(videoProgress + index) * 0.03})`;
              
              // Update tracking quality based on confidence and time
              if (progressPercent > 0.7) {
                // Simulate reduced tracking quality near the end of video
                const qualityRandom = Math.random();
                const confidenceAdjustment = detectedAnimal.animal.confidence * 0.3;
                
                if (qualityRandom > (0.85 - confidenceAdjustment)) {
                  setTrackingQuality('medium');
                } else if (qualityRandom > (0.97 - confidenceAdjustment)) {
                  setTrackingQuality('low');
                } else {
                  setTrackingQuality('high');
                }
              } else {
                setTrackingQuality('high');
              }
            }
          });
        }
      };
      
      videoRef.current.addEventListener('play', handleVideoPlay);
      videoRef.current.addEventListener('pause', handleVideoPause);
      videoRef.current.addEventListener('ended', handleVideoEnded);
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('play', handleVideoPlay);
          videoRef.current.removeEventListener('pause', handleVideoPause);
          videoRef.current.removeEventListener('ended', handleVideoEnded);
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, [imageUrl, isVideo, detectedAnimals, animalMovements]);
  
  // Create refs for detection boxes
  useEffect(() => {
    if (animals.length > 0 && detectedAnimals.length > 0) {
      // Use a timeout to ensure the component is fully rendered
      const timeout = setTimeout(() => {
        const boxes = document.querySelectorAll('.animal-detection-box');
        const updatedAnimals = [...detectedAnimals];
        
        boxes.forEach((box, index) => {
          if (index < updatedAnimals.length) {
            updatedAnimals[index].box = box as HTMLDivElement;
          }
        });
        
        setDetectedAnimals(updatedAnimals);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [animals.length, detectedAnimals.length]);
  
  // Get animal badge color based on type
  const getAnimalBadgeClass = (animalName: string): string => {
    if (isInvasiveSpecies(animalName)) {
      return "bg-red-100 border-red-600 text-red-800 px-2 py-1";
    } else if (isDog(animalName)) {
      return "bg-blue-100 border-blue-600 text-blue-800 px-2 py-1";
    } else {
      return "bg-green-100 border-green-600 text-green-800 px-2 py-1";
    }
  };
  
  // Get detection box style based on animal type
  const getDetectionBoxStyle = (animalName: string): string => {
    if (isInvasiveSpecies(animalName)) {
      return "border-red-500";
    } else if (isDog(animalName)) {
      return "border-blue-500";
    } else {
      return "border-green-500";
    }
  };
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative">
          {isVideo ? (
            <video 
              ref={videoRef}
              controls
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error("Error loading video:", e);
                // Fallback for video error
                e.currentTarget.poster = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Animal" 
              className="w-full h-64 object-cover"
              onError={(e) => {
                // Fallback for image error
                e.currentTarget.src = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          )}
          
          {/* Status overlay (when analyzing) */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                <p>Analisando {isVideo ? 'vídeo' : 'imagem'}...</p>
              </div>
            </div>
          )}
          
          {/* Multiple detection boxes for all identified animals */}
          {animals.length > 0 && !isAnalyzing && (
            <>
              {/* Show badge for any invasive species */}
              {hasInvasiveSpecies && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                    <AlertTriangle size={14} />
                    <span>Espécie Invasora</span>
                  </Badge>
                </div>
              )}
              
              {/* Frame indicator icon for videos */}
              {isVideo && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    <Frame size={14} />
                    <span>Detecção em vídeo</span>
                  </Badge>
                </div>
              )}
              
              {/* Animal counter badge */}
              {animals.length > 1 && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    {animals.length} animais detectados
                  </Badge>
                </div>
              )}
              
              {/* Multiple detection boxes */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {detectedAnimals.map((detectedAnimal, index) => {
                  const isInvasive = isInvasiveSpecies(detectedAnimal.animal.name);
                  const isDogAnimal = isDog(detectedAnimal.animal.name);
                  
                  // Calculate different sizes and positions for each animal
                  const sizeAdjustment = 1 - (index * 0.1); // First box is 100%, second 90%, third 80%
                  const width = isVideo ? `${55 * sizeAdjustment}%` : `${70 * sizeAdjustment}%`;
                  const height = isVideo ? `${55 * sizeAdjustment}%` : `${70 * sizeAdjustment}%`;
                  
                  // Define box shadow based on animal type
                  let boxShadow = '';
                  if (isInvasive) {
                    boxShadow = 'rgba(220, 38, 38, 0.8)';
                  } else if (isDogAnimal) {
                    boxShadow = 'rgba(37, 99, 235, 0.8)';
                  } else {
                    boxShadow = 'rgba(34, 197, 94, 0.8)';
                  }
                  
                  return (
                    <div 
                      key={index}
                      className={`animal-detection-box border-3 ${
                        isInvasive ? 'border-red-500' : 
                        isDogAnimal ? 'border-blue-500' : 
                        'border-green-500'
                      } rounded-md ${isTracking ? 'animate-pulse' : ''}`}
                      style={{
                        width: width,
                        height: height,
                        boxShadow: `0 0 10px ${boxShadow}`,
                        position: 'absolute',
                        zIndex: 50 - index, // Higher index, lower z-index
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {/* Corner decorations */}
                      <div className={`absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 ${
                        isInvasive ? 'border-red-500' : 
                        isDogAnimal ? 'border-blue-500' : 
                        'border-green-500'
                      }`}></div>
                      <div className={`absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 ${
                        isInvasive ? 'border-red-500' : 
                        isDogAnimal ? 'border-blue-500' : 
                        'border-green-500'
                      }`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-5 h-5 border-b-4 border-l-4 ${
                        isInvasive ? 'border-red-500' : 
                        isDogAnimal ? 'border-blue-500' : 
                        'border-green-500'
                      }`}></div>
                      <div className={`absolute -bottom-2 -right-2 w-5 h-5 border-b-4 border-r-4 ${
                        isInvasive ? 'border-red-500' : 
                        isDogAnimal ? 'border-blue-500' : 
                        'border-green-500'
                      }`}></div>
                      
                      {/* Animal label */}
                      <div className="absolute -top-7 left-0 right-0 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${isInvasive ? 'bg-red-500/90 text-white border-red-700' : 
                              isDogAnimal ? 'bg-blue-500/90 text-white border-blue-700' : 
                              'bg-green-500/90 text-white border-green-700'
                            } text-xs px-2 py-0.5
                          `}
                        >
                          {detectedAnimal.animal.name} {formatConfidence(detectedAnimal.animal.confidence)}
                        </Badge>
                      </div>
                      
                      {/* Enhanced target icon in the center for videos */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <Crosshair 
                              className={`${
                                isInvasive ? 'text-red-500' : 
                                isDogAnimal ? 'text-blue-500' : 
                                'text-green-500'
                              } opacity-80`} 
                              size={24 - (index * 4)} 
                            />
                            {isTracking && (
                              <>
                                {isDogAnimal && (
                                  <Dog 
                                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 opacity-60`} 
                                    size={32 - (index * 6)}
                                    style={{
                                      animation: 'pulse 1.5s infinite'
                                    }}
                                  />
                                )}
                                {!isDogAnimal && (
                                  <Target 
                                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                                      isInvasive ? 'text-red-500' : 'text-green-500'
                                    } opacity-60`} 
                                    size={32 - (index * 6)}
                                    style={{
                                      animation: 'pulse 1.5s infinite'
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Improved tracking quality indicator */}
              {isVideo && isTracking && (
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant="outline" 
                    className={`border-none flex items-center gap-1 px-2 py-1 ${
                      trackingQuality === 'high' ? 'bg-green-500/80 text-white' : 
                      trackingQuality === 'medium' ? 'bg-orange-500/80 text-white' : 'bg-yellow-500/80 text-black'
                    }`}
                  >
                    <span>Sensor: {
                      trackingQuality === 'high' ? 'Ótimo' : 
                      trackingQuality === 'medium' ? 'Médio' : 'Baixo'
                    }</span>
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
        
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
                    className={getAnimalBadgeClass(animal.name)}
                  >
                    {animal.name} - {formatConfidence(animal.confidence)}
                  </Badge>
                ))}
              </div>
              
              {showDetails && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Detalhes</h4>
                  {animals.map((animal, index) => {
                    const isInvasive = isInvasiveSpecies(animal.name);
                    const isDogAnimal = isDog(animal.name);
                    
                    return (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${
                            isInvasive ? 'text-red-800' : 
                            isDogAnimal ? 'text-blue-800' : 
                            'text-green-800'
                          }`}>
                            {animal.name}
                            {isInvasive && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Invasor</span>}
                            {isDogAnimal && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Doméstico</span>}
                            {!isInvasive && !isDogAnimal && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Nativo</span>}
                          </span>
                          <Badge 
                            variant={isInvasive ? "destructive" : "outline"} 
                            className={!isInvasive ? (isDogAnimal ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800") : ""}
                          >
                            {formatConfidence(animal.confidence)}
                          </Badge>
                        </div>
                        {animal.description && (
                          <p className="text-sm mt-1 text-gray-600">{animal.description}</p>
                        )}
                      </div>
                    );
                  })}
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
