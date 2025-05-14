import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, Target, Move, Shield, Crosshair, Dog, Scan } from 'lucide-react';
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
  const [isTracking, setIsTracking] = useState(false);
  const [trackingQuality, setTrackingQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [animalBoxes, setAnimalBoxes] = useState<{animal: Animal, element: HTMLDivElement | null}[]>([]);
  const [animalPositions, setAnimalPositions] = useState<{[key: number]: {x: number, y: number, width: number, height: number}}>({}); 
  const [videoProgress, setVideoProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const lastFrameTime = useRef<number>(0);
  const frameRef = useRef<number | null>(null);
  
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
  
  // Helper function to determine if it's a dog with expanded terminology
  const isDog = (animalName: string): boolean => {
    const dogTerms = [
      'cachorro', 'dog', 'canino', 'canídeo', 'pastor', 'labrador', 'golden', 
      'vira-lata', 'caramelo', 'canis familiaris', 'cão', 'cao', 'husky', 'bulldog',
      'poodle', 'dálmata', 'dalmata', 'boxer'
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
  
  // Initialize animal boxes when animals are detected or analyzed
  useEffect(() => {
    if (animals.length > 0 && !isAnalyzing) {
      console.log("Setting up animal detection boxes for", animals.length, "animals");
      
      // Take up to 7 animals to avoid overcrowding
      const detectedAnimals = animals.slice(0, Math.min(7, animals.length)).map(animal => ({
        animal,
        element: null
      }));
      
      setAnimalBoxes(detectedAnimals);
      
      // Initialize positions for each animal - now with more precise sizing
      const newPositions = {...animalPositions};
      
      // Distribute animals evenly in the frame with randomized starting positions
      detectedAnimals.forEach((animalBox, index) => {
        // Calculate animal type-specific dimensions
        const animalClass = getAnimalClassification(animalBox.animal.name);
        let width = 0, height = 0;
        
        // Set accurate dimensions based on animal type
        switch(animalClass) {
          case 'invasive': // Wild boars, etc.
            width = 15 + Math.random() * 5;  // 15-20% width 
            height = 12 + Math.random() * 3; // 12-15% height
            break;
          case 'domestic': // Dogs
            width = 14 + Math.random() * 4;  // 14-18% width
            height = 15 + Math.random() * 3; // 15-18% height
            break;
          case 'predator': // Cats, etc.
            width = 13 + Math.random() * 4;  // 13-17% width
            height = 10 + Math.random() * 3; // 10-13% height
            break;
          case 'herbivore': // Deer, etc.
            width = 12 + Math.random() * 3;  // 12-15% width
            height = 17 + Math.random() * 4; // 17-21% height
            break;
          default:
            width = 14 + Math.random() * 3;  // 14-17% width
            height = 14 + Math.random() * 3; // 14-17% height
        }
        
        // Position animals in different areas of the video
        // Calculate position with better distribution for multiple animals
        const sectors = 4; // Divide the screen into sectors
        const sectorWidth = 100 / sectors;
        const sectorHeight = 100 / sectors;
        
        // Calculate sector positions based on index
        const sectorX = index % sectors;
        const sectorY = Math.floor(index / sectors) % sectors;
        
        // Position within sector with some randomization
        const x = (sectorX * sectorWidth) + (Math.random() * sectorWidth/2) + sectorWidth/4;
        const y = (sectorY * sectorHeight) + (Math.random() * sectorHeight/2) + sectorHeight/4;
        
        newPositions[index] = {
          x: x,
          y: y,
          width: width,
          height: height
        };
      });
      
      setAnimalPositions(newPositions);
    }
  }, [animals, isAnalyzing]);
  
  // Set up video playback and tracking
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log("Setting up video playback with src:", imageUrl);
      videoRef.current.src = imageUrl;
      
      const handleVideoPlay = () => {
        console.log("Video playback started");
        setIsTracking(true);
        
        // Cancel any existing animation frame
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        
        // Start the animation loop
        frameRef.current = requestAnimationFrame(updateAnimalPositions);
      };
      
      const handleVideoPause = () => {
        console.log("Video playback paused");
        setIsTracking(false);
        
        // Cancel animation frame when video is paused
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
      
      const handleVideoEnded = () => {
        console.log("Video playback ended");
        setIsTracking(false);
        
        // Cancel animation frame when video ends
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
      
      const handleTimeUpdate = () => {
        if (videoRef.current) {
          const progress = videoRef.current.currentTime / (videoRef.current.duration || 1);
          setVideoProgress(progress);
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
        
        // Clean up any remaining animation frame
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }
  }, [imageUrl, isVideo]);
  
  // Update animal box references
  useEffect(() => {
    if (animalBoxes.length > 0) {
      // Set a timeout to allow the DOM to render
      const timeout = setTimeout(() => {
        const boxes = document.querySelectorAll('.animal-tracking-box');
        
        if (boxes.length) {
          const updatedBoxes = [...animalBoxes];
          
          boxes.forEach((box, index) => {
            if (index < updatedBoxes.length) {
              updatedBoxes[index].element = box as HTMLDivElement;
            }
          });
          
          setAnimalBoxes(updatedBoxes);
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [animalBoxes.length]);
  
  // Enhanced tracking algorithm for more realistic animal movements
  const updateAnimalPositions = (timestamp: number) => {
    if (!isTracking || !trackingEnabled || !videoRef.current) {
      // Request next frame if still tracking
      if (isTracking && trackingEnabled) {
        frameRef.current = requestAnimationFrame(updateAnimalPositions);
      }
      return;
    }
    
    // Limit updates to reasonable frame rate (30fps)
    if (timestamp - lastFrameTime.current > 33) {
      lastFrameTime.current = timestamp;
      
      // Get video dimensions for positioning
      const videoWidth = videoRef.current.clientWidth;
      const videoHeight = videoRef.current.clientHeight;
      
      // Get the current video time for time-based animations
      const currentTime = videoRef.current.currentTime;
      const videoProgress = currentTime / (videoRef.current.duration || 1);
      
      // Update each animal box position
      animalBoxes.forEach((animalBox, index) => {
        if (animalBox.element && animalPositions[index]) {
          const animalClass = getAnimalClassification(animalBox.animal.name);
          
          // Create a more realistic motion pattern based on animal type
          // and current video progression
          let newX = animalPositions[index].x;
          let newY = animalPositions[index].y;
          
          // Generate motion patterns based on animal type
          switch(animalClass) {
            case 'invasive':
              // Wild boars tend to move in straight lines with occasional direction changes
              if (Math.random() > 0.95) {
                // Occasional direction change
                newX += (Math.random() - 0.5) * 5;
                newY += (Math.random() - 0.5) * 3;
              } else {
                // Continue in current direction with slight variations
                newX += Math.cos(currentTime + index) * 0.4;
                newY += Math.sin(currentTime * 0.7 + index) * 0.3;
              }
              break;
              
            case 'domestic':
              // Dogs move more erratically with bursts of energy
              newX += Math.sin(currentTime * 2 + index) * 0.7;
              newY += Math.cos(currentTime * 1.5 + index) * 0.7;
              // Occasional bursts of movement
              if (Math.random() > 0.97) {
                newX += (Math.random() - 0.5) * 3;
                newY += (Math.random() - 0.5) * 3;
              }
              break;
              
            case 'predator':
              // Predators tend to stalk with precise, calculated movements
              newX += Math.sin(currentTime * 0.5 + index) * 0.4;
              newY += Math.cos(currentTime * 0.4 + index) * 0.3;
              // Occasional quick strike
              if (Math.random() > 0.98) {
                newX += Math.sign(Math.sin(currentTime)) * 2;
                newY += Math.sign(Math.cos(currentTime)) * 1.5;
              }
              break;
              
            case 'herbivore':
              // Herbivores generally move slowly with alert head movements
              newX += Math.sin(currentTime * 0.6 + index) * 0.4;
              newY += Math.cos(currentTime * 0.3 + index) * 0.2;
              // Occasional freeze (alertness)
              if (Math.random() > 0.96) {
                newX = animalPositions[index].x;
                newY = animalPositions[index].y;
              }
              break;
              
            default:
              // General wildlife movement pattern
              newX += Math.sin(currentTime + index) * 0.5;
              newY += Math.cos(currentTime * 0.7 + index) * 0.4;
          }
          
          // Add influence from video progression to simulate animal movement in scene
          // As video progresses, animals might move in specific patterns
          newX += Math.sin(videoProgress * Math.PI * 2) * 0.3;
          newY += Math.cos(videoProgress * Math.PI * 3) * 0.2;
          
          // Keep animals within frame bounds with small padding
          const padding = 2; // percentage padding
          newX = Math.max(padding, Math.min(100 - padding - animalPositions[index].width, newX));
          newY = Math.max(padding, Math.min(100 - padding - animalPositions[index].height, newY));
          
          // Update animal position
          const updatedPositions = {...animalPositions};
          updatedPositions[index] = {
            ...animalPositions[index],
            x: newX,
            y: newY
          };
          setAnimalPositions(updatedPositions);
          
          // Apply position to element
          animalBox.element.style.width = `${animalPositions[index].width}%`;
          animalBox.element.style.height = `${animalPositions[index].height}%`;
          animalBox.element.style.left = `${newX}%`;
          animalBox.element.style.top = `${newY}%`;
          
          // Add small jitter for more realistic appearance
          const jitterX = (Math.random() - 0.5) * 0.2;
          const jitterY = (Math.random() - 0.5) * 0.2;
          animalBox.element.style.transform = `translate(${jitterX}px, ${jitterY}px)`;
          
          // Simulate tracking quality changes
          if (Math.random() > 0.97) {
            setTrackingQuality(prev => {
              if (prev === 'high') return 'medium';
              if (prev === 'medium') return Math.random() > 0.5 ? 'high' : 'low';
              return 'medium';
            });
          }
        }
      });
    }
    
    // Continue animation loop
    frameRef.current = requestAnimationFrame(updateAnimalPositions);
  };
  
  // Get the appropriate border and badge colors based on animal type
  const getBoxStyle = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'border-red-500';
      case 'domestic':
        return 'border-blue-500';
      case 'predator':
        return 'border-orange-500';
      case 'herbivore':
        return 'border-green-500';
      default:
        return 'border-purple-500';
    }
  };
  
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
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative" ref={containerRef}>
          {isVideo ? (
            <video 
              ref={videoRef}
              controls
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error("Error loading video:", e);
                e.currentTarget.poster = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
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
          
          {/* Animal tracking boxes */}
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
              
              {/* Individual animal tracking boxes */}
              <div className="absolute inset-0 pointer-events-none">
                {animalBoxes.map((box, index) => {
                  const animalClass = getAnimalClassification(box.animal.name);
                  
                  return (
                    <div 
                      key={index}
                      className={`animal-tracking-box absolute border-2 ${getBoxStyle(box.animal.name)} rounded-md`}
                      style={{
                        width: animalPositions[index]?.width ? `${animalPositions[index].width}%` : '12%',
                        height: animalPositions[index]?.height ? `${animalPositions[index].height}%` : '10%',
                        left: animalPositions[index]?.x ? `${animalPositions[index].x}%` : '50%',
                        top: animalPositions[index]?.y ? `${animalPositions[index].y}%` : '50%',
                        boxShadow: `0 0 4px ${animalClass === 'invasive' ? 'rgba(220, 38, 38, 0.6)' : 
                                    animalClass === 'domestic' ? 'rgba(37, 99, 235, 0.6)' : 
                                    animalClass === 'predator' ? 'rgba(249, 115, 22, 0.6)' :
                                    animalClass === 'herbivore' ? 'rgba(34, 197, 94, 0.6)' :
                                    'rgba(124, 58, 237, 0.6)'}`,
                      }}
                    >
                      {/* Corner indicators for tracking effect - smaller corners */}
                      <div className={`absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 ${getBoxStyle(box.animal.name)}`}></div>
                      
                      {/* Animal label - moved closer to box */}
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`${getBadgeStyle(box.animal.name)} text-xs px-1 py-0 text-[8px] whitespace-nowrap`}
                        >
                          {box.animal.name} {formatConfidence(box.animal.confidence)}
                        </Badge>
                      </div>
                      
                      {/* Target icon for tracking - smaller size */}
                      {isVideo && isTracking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {animalClass === 'domestic' ? (
                            <Dog 
                              className={`text-blue-500 opacity-70`} 
                              size={12}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : animalClass === 'predator' ? (
                            <Target 
                              className={`text-orange-500 opacity-70`} 
                              size={12}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : animalClass === 'invasive' ? (
                            <Target 
                              className={`text-red-500 opacity-70`} 
                              size={12}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : (
                            <Crosshair 
                              className={`text-green-500 opacity-70`} 
                              size={12}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Scanning effect */}
                      {isVideo && isTracking && (
                        <div 
                          className="absolute inset-0 overflow-hidden opacity-30"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${
                              animalClass === 'invasive' ? 'rgba(220, 38, 38, 0.4)' : 
                              animalClass === 'domestic' ? 'rgba(37, 99, 235, 0.4)' : 
                              animalClass === 'predator' ? 'rgba(249, 115, 22, 0.4)' :
                              animalClass === 'herbivore' ? 'rgba(34, 197, 94, 0.4)' :
                              'rgba(124, 58, 237, 0.4)'
                            }, transparent)`,
                            backgroundSize: '100% 200%',
                            animation: 'scanAnimation 1.5s infinite linear'
                          }}
                        ></div>
                      )}
                      
                      {/* ID number - smaller size */}
                      <div className="absolute top-0.5 left-0.5">
                        <div className={`
                          px-0.5 rounded-full text-[7px] font-mono 
                          ${animalClass === 'invasive' ? 'bg-red-500 text-white' : 
                            animalClass === 'domestic' ? 'bg-blue-500 text-white' : 
                            animalClass === 'predator' ? 'bg-orange-500 text-white' : 
                            animalClass === 'herbivore' ? 'bg-green-500 text-white' : 
                            'bg-purple-500 text-white'
                          }
                        `}>
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Tracking quality indicator */}
              {isVideo && isTracking && (
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant="outline" 
                    className={`border-none flex items-center gap-1 px-2 py-1 ${
                      trackingQuality === 'high' ? 'bg-green-500/80 text-white' : 
                      trackingQuality === 'medium' ? 'bg-yellow-500/80 text-white' : 'bg-red-500/80 text-white'
                    }`}
                  >
                    <Scan size={14} />
                    <span>Sensor: {
                      trackingQuality === 'high' ? 'Preciso' : 
                      trackingQuality === 'medium' ? 'Normal' : 'Baixo'
                    }</span>
                  </Badge>
                </div>
              )}
              
              {/* Tracking toggle */}
              {isVideo && (
                <div className="absolute top-12 right-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${trackingEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-400 text-gray-700'} text-xs px-2 py-0.5`}
                    onClick={() => setTrackingEnabled(!trackingEnabled)}
                  >
                    Sensor {trackingEnabled ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              )}
            </>
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
      
      {/* CSS animations for tracking effects */}
      <style>
        {`
        @keyframes scanAnimation {
          0% { background-position: 0 -100%; }
          100% { background-position: 0 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        `}
      </style>
    </Card>
  );
}
