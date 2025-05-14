
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
  const [animalMovements, setAnimalMovements] = useState<{[key: number]: {x: number, y: number, speed: number, pattern: string}}>({}); 
  const [videoProgress, setVideoProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const lastFrameTime = useRef<number>(0);
  
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
      
      // Initialize unique movement patterns for each animal
      const newMovements = {...animalMovements};
      
      detectedAnimals.forEach((animalBox, index) => {
        // Different movement patterns based on animal type
        const animalClass = getAnimalClassification(animalBox.animal.name);
        
        // Set different movement speeds and patterns for different animal types
        let speed = 1.0;
        let pattern = 'linear';
        
        switch(animalClass) {
          case 'invasive':
            speed = 0.8 + (Math.random() * 0.4); // Slower, more deliberate
            pattern = Math.random() > 0.5 ? 'circular' : 'zigzag';
            break;
          case 'domestic':
            speed = 1.2 + (Math.random() * 0.6); // Faster, more energetic
            pattern = Math.random() > 0.7 ? 'bouncy' : 'playful';
            break;
          case 'predator':
            speed = 0.7 + (Math.random() * 0.5); // Stealthy
            pattern = Math.random() > 0.6 ? 'stalking' : 'ambush';
            break;
          case 'herbivore':
            speed = 0.6 + (Math.random() * 0.5); // Cautious, grazing
            pattern = Math.random() > 0.5 ? 'cautious' : 'grazing';
            break;
          default:
            speed = 0.5 + (Math.random() * 0.6); // Varied for other animals
            pattern = Math.random() > 0.5 ? 'cautious' : 'random';
        }
        
        newMovements[index] = {
          x: 0,
          y: 0,
          speed,
          pattern
        };
      });
      
      setAnimalMovements(newMovements);
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
        requestAnimationFrame(updateAnimalPositions);
      };
      
      const handleVideoPause = () => {
        console.log("Video playback paused");
        setIsTracking(false);
      };
      
      const handleVideoEnded = () => {
        console.log("Video playback ended");
        setIsTracking(false);
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
  
  // Enhanced animation frame based tracking function
  const updateAnimalPositions = (timestamp: number) => {
    if (!isTracking || !trackingEnabled || !videoRef.current) return;
    
    // Limit updates to reasonable frame rate
    if (timestamp - lastFrameTime.current > 30) { // ~30fps
      lastFrameTime.current = timestamp;
      
      // Get the current video time for time-based animations
      const currentTime = videoRef.current.currentTime;
      
      // Update each animal box position
      animalBoxes.forEach((animalBox, index) => {
        if (animalBox.element && animalMovements[index]) {
          const { speed, pattern } = animalMovements[index];
          const time = currentTime * speed;
          
          // Calculate position based on pattern
          let x = 0, y = 0;
          
          const animalClass = getAnimalClassification(animalBox.animal.name);
          
          switch(animalClass) {
            case 'invasive':
              // Slower, purposeful movement
              switch(pattern) {
                case 'circular':
                  // Circular pattern
                  x = Math.cos(time * 0.5) * 30;
                  y = Math.sin(time * 0.6) * 20;
                  break;
                case 'zigzag':
                  // Zigzag pattern
                  x = Math.sin(time * 1.2) * 40;
                  y = Math.cos(time * 0.3) * 15;
                  break;
                default:
                  // Default pattern
                  x = (Math.sin(time) + Math.cos(time * 1.5)) * 20;
                  y = Math.sin(time * 0.8) * 15;
              }
              break;
              
            case 'domestic':
              // More energetic, playful movements
              switch(pattern) {
                case 'bouncy':
                  // Bouncy movement
                  x = Math.sin(time * 2) * 35;
                  y = Math.abs(Math.sin(time * 3)) * 25;
                  break;
                case 'playful':
                  // Playful, varied movement
                  x = Math.sin(time * 1.5) * 30 + Math.cos(time * 3) * 10;
                  y = Math.cos(time * 2) * 20;
                  break;
                default:
                  // Default pattern
                  x = Math.sin(time * 2) * 25;
                  y = Math.cos(time * 1.5) * 20;
              }
              break;
              
            case 'predator':
              // Stealthy, calculated movements
              switch(pattern) {
                case 'stalking':
                  // Stalking movement
                  x = Math.sin(time * 0.3) * 20;
                  y = Math.cos(time * 0.2) * 10;
                  // Add occasional pounce
                  if (Math.sin(time * 2) > 0.95) {
                    x *= 2;
                    y *= 1.5;
                  }
                  break;
                case 'ambush':
                  // Minimal movement with sudden strikes
                  x = Math.sin(time * 0.2) * 10;
                  y = Math.cos(time * 0.1) * 5;
                  // Add occasional strike
                  if (Math.sin(time * 1.5) > 0.98) {
                    x += Math.sign(Math.sin(time)) * 30;
                    y += Math.sign(Math.cos(time)) * 20;
                  }
                  break;
                default:
                  // Default pattern
                  x = Math.sin(time * 0.4) * 15;
                  y = Math.cos(time * 0.3) * 10;
              }
              break;
              
            case 'herbivore':
              // Cautious, grazing movements
              switch(pattern) {
                case 'grazing':
                  // Grazing movement
                  x = Math.sin(time * 0.4) * 15;
                  y = Math.cos(time * 0.3) * 10;
                  break;
                case 'cautious':
                  // Cautious movement with occasional freeze
                  x = Math.sin(time * 0.7) * 25;
                  y = Math.cos(time * 0.5) * 15;
                  // Occasional freeze
                  if (Math.sin(time * 1) > 0.9) {
                    x *= 0.2;
                    y *= 0.2;
                  }
                  break;
                default:
                  // Default pattern
                  x = Math.sin(time * 0.6) * 20;
                  y = Math.cos(time * 0.4) * 15;
              }
              break;
              
            default:
              // General wildlife movement
              x = Math.sin(time * 0.7) * 25;
              y = Math.cos(time * 0.6) * 20;
          }
          
          // Position animals in different regions to avoid overlap
          const angle = (index / animalBoxes.length) * Math.PI * 2;
          const radius = 25 + (index % 3) * 10; // Reduced radius for smaller tracking boxes
          
          const regionX = Math.cos(angle) * radius;
          const regionY = Math.sin(angle) * radius;
          
          // Add jitter for more realistic movement
          const jitterX = (Math.random() - 0.5) * 1.5; // Reduced jitter
          const jitterY = (Math.random() - 0.5) * 1.5;
          
          // Apply transform with slight scale variation for more natural movement
          animalBox.element.style.transform = `translate(${regionX + x + jitterX}px, ${regionY + y + jitterY}px) scale(${1 + Math.sin(time) * 0.03})`;
          
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
    
    if (isTracking) {
      requestAnimationFrame(updateAnimalPositions);
    }
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
  
  // Calculate box sizes based on animal class and confidence for tighter fit
  const getBoxSize = (animal: Animal, index: number): {width: string, height: string} => {
    const animalClass = getAnimalClassification(animal.name);
    const confidenceFactor = animal.confidence * 0.2;
    
    // Base size factor - smaller than before
    let widthFactor = 0.3; // Reduced from previous size
    let heightFactor = 0.2; // Reduced from previous size
    
    // Adjust based on animal type for more precise fitting
    switch(animalClass) {
      case 'invasive': 
        // Wild boars are wider than tall
        widthFactor = 0.25 - (index * 0.02);
        heightFactor = 0.18 - (index * 0.01);
        break;
      case 'domestic':
        // Dogs have more varied sizes
        widthFactor = 0.22 - (index * 0.02);
        heightFactor = 0.2 - (index * 0.01);
        break;
      case 'predator':
        // Predators are longer and leaner
        widthFactor = 0.28 - (index * 0.02);
        heightFactor = 0.17 - (index * 0.01);
        break;
      case 'herbivore':
        // Herbivores can be taller
        widthFactor = 0.25 - (index * 0.02);
        heightFactor = 0.25 - (index * 0.01);
        break;
    }
    
    // Add confidence factor - more confident detections can be more precisely fitted
    widthFactor = Math.max(0.15, widthFactor + (confidenceFactor * 0.05));
    heightFactor = Math.max(0.12, heightFactor + (confidenceFactor * 0.04));
    
    return {
      width: `${Math.round(widthFactor * 100)}%`, 
      height: `${Math.round(heightFactor * 100)}%`
    };
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
                  const boxSize = getBoxSize(box.animal, index);
                  
                  return (
                    <div 
                      key={index}
                      className={`animal-tracking-box absolute border-2 ${getBoxStyle(box.animal.name)} rounded-md`}
                      style={{
                        width: boxSize.width,
                        height: boxSize.height,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 6px ${animalClass === 'invasive' ? 'rgba(220, 38, 38, 0.6)' : 
                                    animalClass === 'domestic' ? 'rgba(37, 99, 235, 0.6)' : 
                                    animalClass === 'predator' ? 'rgba(249, 115, 22, 0.6)' :
                                    animalClass === 'herbivore' ? 'rgba(34, 197, 94, 0.6)' :
                                    'rgba(124, 58, 237, 0.6)'}`,
                        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* Corner indicators for tracking effect - smaller corners */}
                      <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 ${getBoxStyle(box.animal.name)}`}></div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 ${getBoxStyle(box.animal.name)}`}></div>
                      
                      {/* Animal label - moved closer to box */}
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`${getBadgeStyle(box.animal.name)} text-xs px-1 py-0 text-[10px]`}
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
                              size={16}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : animalClass === 'predator' ? (
                            <Target 
                              className={`text-orange-500 opacity-70`} 
                              size={16}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : animalClass === 'invasive' ? (
                            <Target 
                              className={`text-red-500 opacity-70`} 
                              size={16}
                              style={{ animation: 'pulse 1.5s infinite' }}
                            />
                          ) : (
                            <Crosshair 
                              className={`text-green-500 opacity-70`} 
                              size={16}
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
                          px-0.5 py-0 rounded-full text-[8px] font-mono 
                          ${animalClass === 'invasive' ? 'bg-red-500 text-white' : 
                            animalClass === 'domestic' ? 'bg-blue-500 text-white' : 
                            animalClass === 'predator' ? 'bg-orange-500 text-white' : 
                            animalClass === 'herbivore' ? 'bg-green-500 text-white' : 
                            'bg-purple-500 text-white'
                          }
                        `}>
                          ID-{index + 1}
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
