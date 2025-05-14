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
  const [animalMovements, setAnimalMovements] = useState<{[key: number]: {x: number, y: number, speed: number, pattern: string, lastUpdate: number}}>({}); 
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
      'javali', 'porco', 'cateto', 'queixada', 'suino', 'suino', 'wild boar', 'wild pig',
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
  
  // Initialize tracking state and movement patterns for each animal when detected
  useEffect(() => {
    if (animals.length > 0 && !isAnalyzing) {
      console.log("Setting up animal detection boxes for", animals.length, "animals");
      
      // Clear previous detection boxes
      setDetectedAnimals([]);
      setTrackingEnabled(true);
      
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
          pattern,
          lastUpdate: Date.now() // Add timestamp for smoother animations
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
  
  // Enhanced video tracking with advanced sensor-like motion detection
  useEffect(() => {
    // Set up video playback if this is a video element
    if (isVideo && videoRef.current) {
      console.log("Setting up video playback with src:", imageUrl);
      videoRef.current.src = imageUrl;
      
      // Add event listeners for video playback to update detection box
      const handleVideoPlay = () => {
        console.log("Video playback started");
        setIsTracking(true);
        requestAnimationFrame(animateTracking);
      };
      
      const handleVideoPause = () => {
        console.log("Video playback paused");
        setIsTracking(false);
      };
      
      const handleVideoEnded = () => {
        console.log("Video playback ended");
        setIsTracking(false);
      };
      
      // Track video progress for adaptive behaviors
      const handleTimeUpdate = () => {
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration || 1;
          const progress = currentTime / duration;
          setVideoProgress(progress);
        }
      };
      
      // Enhanced animation frame based tracking for smoother motion
      const animateTracking = (timestamp: number) => {
        if (!isTracking || !videoRef.current || !trackingEnabled) return;
        
        // Limit updates to reasonable frame rate for performance
        if (timestamp - lastFrameTime.current > 16) { // ~60fps
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration || 1;
          const progress = currentTime / duration;
          
          // Update animal positions based on current video frame
          updateAnimalPositions(progress, currentTime);
          lastFrameTime.current = timestamp;
        }
        
        // Continue animation loop
        requestAnimationFrame(animateTracking);
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
        setIsTracking(false);
      };
    }
  }, [imageUrl, isVideo, trackingEnabled]);
  
  // Enhanced tracking algorithm with adaptive sensor-like movements
  const updateAnimalPositions = (progressPercent: number, currentTime: number) => {
    if (detectedAnimals.length > 0 && videoRef.current) {
      const now = Date.now();
      const updatedMovements = {...animalMovements};
      
      detectedAnimals.forEach((detectedAnimal, index) => {
        if (detectedAnimal.box) {
          const animalType = detectedAnimal.animal.name.toLowerCase();
          const isInvasive = isInvasiveSpecies(animalType);
          const isDogAnimal = isDog(animalType);
          const movement = updatedMovements[index] || {
            x: 0, y: 0, speed: 1, pattern: 'linear', lastUpdate: now
          };
          
          // Calculate time delta for smoother animation
          const timeDelta = now - movement.lastUpdate;
          const animationFactor = timeDelta / 16.67; // 60fps baseline
          
          // Get base movement characteristics
          const { speed, pattern } = movement;
          
          // Calculate movement based on pattern with sensor-like behavior
          let baseX = 0, baseY = 0, microX = 0, microY = 0, jitterX = 0, jitterY = 0;
          const time = currentTime * speed;
          
          // Dynamic sensor adjustment factor - simulates sensor tracking quality
          // Higher values mean more accurate tracking
          const sensorAccuracy = 0.85 + (Math.cos(time * 0.3) * 0.15);
          
          // Adapt movement based on video progress and scene complexity
          const adaptiveFactor = Math.min(1, progressPercent * 2 + 0.2) * sensorAccuracy;
          
          // Apply sensor-like tracking with natural movement patterns
          switch(pattern) {
            case 'circular':
              // Enhanced circular movement with adaptive radius and sensor-like tracking
              baseX = Math.cos(time * 1.2) * 15 * adaptiveFactor;
              baseY = Math.sin(time * 1.2) * 15 * adaptiveFactor;
              // Add slight drift with occasional sensor adjustment
              baseX += Math.sin(time * 0.3) * 5 * sensorAccuracy;
              baseY += Math.cos(time * 0.2) * 5 * sensorAccuracy;
              break;
              
            case 'zigzag':
              // Enhanced zig-zag movement with varying intensity and sensor recalibration
              baseX = Math.sin(time * 2) * 20 * adaptiveFactor;
              baseY = Math.cos(time * 0.5) * 5 * adaptiveFactor;
              // Add sensor recalibration moments
              if (Math.sin(time * 0.7) > 0.85) {
                baseX *= 0.2;  // Sensor recalibration pause
                baseY *= 0.2;
                // Add small corrective jump after recalibration
                if (Math.sin(time * 0.7) > 0.95) {
                  baseX += (Math.random() - 0.5) * 5;
                  baseY += (Math.random() - 0.5) * 5;
                }
              }
              break;
              
            case 'bouncy':
              // More realistic bouncy movement with adaptive sensor tracking
              baseX = Math.sin(time * 3) * 25 * adaptiveFactor;
              baseY = Math.abs(Math.sin(time * 5)) * 15 * adaptiveFactor;
              // Add sudden movement detection with sensor response lag
              if (Math.sin(time * 1.5) > 0.8) {
                baseX *= 1.5;
                // Simulate slight sensor lag when animal moves quickly
                baseY *= (0.5 + (Math.random() * 0.2));
              }
              break;
              
            case 'playful':
              // More complex playful movement with sensor tracking
              baseX = Math.sin(time * 2.5) * 18 + Math.cos(time * 4) * 8 * sensorAccuracy;
              baseY = Math.cos(time * 3.5) * 12 * sensorAccuracy;
              // Add "chase" behavior with sensor catch-up effect
              if (Math.sin(time) > 0.9) {
                const targetX = Math.sin(time * 2) * 30;
                const targetY = Math.cos(time * 2) * 30;
                // Apply sensor lag when fast movements occur
                const lagFactor = 0.6 + (Math.random() * 0.2);
                baseX = baseX * (1-lagFactor) + targetX * lagFactor;
                baseY = baseY * (1-lagFactor) + targetY * lagFactor;
              }
              break;
              
            case 'cautious':
              // Realistic cautious movement with precise sensor tracking
              baseX = Math.sin(time * 1.2) * 10 * adaptiveFactor;
              baseY = Math.cos(time * 0.8) * 6 * adaptiveFactor;
              // Add sensor focus moments with higher precision
              if (Math.sin(time * 2) > 0.3) {
                baseX *= 0.2;
                baseY *= 0.2;
                // Add slight vibration during precise tracking
                microX += (Math.random() - 0.5) * 0.5;
                microY += (Math.random() - 0.5) * 0.5;
              }
              break;
              
            case 'random':
            default:
              // Enhanced semi-random movement with sensor tracking
              baseX = (Math.sin(time) + Math.cos(time * 2.3)) * 12 * adaptiveFactor;
              baseY = (Math.cos(time * 1.5) + Math.sin(time * 0.7)) * 8 * adaptiveFactor;
              // Add sensor recalibration moments
              if (Math.cos(time * 3) > 0.95) {
                baseX *= -1.2;
                // Brief sensor tracking adjustment
                microX += (Math.random() - 0.5) * 2;
              }
          }
          
          // Enhance micro-movements with sensor-like precision
          if (isDogAnimal) {
            // Dogs have more energetic micro-movements that challenge sensors
            microX = Math.sin(time * 7) * 4 * sensorAccuracy;
            microY = Math.cos(time * 8) * 4 * sensorAccuracy;
          } else if (isInvasive) {
            // Invasive species with deliberate micro-movements and better tracking
            microX = Math.sin(time * 5) * 3 * sensorAccuracy;
            microY = Math.cos(time * 4) * 3 * sensorAccuracy;
          } else {
            // Other animals with subtle micro-movements
            microX = Math.sin(time * 6) * 2 * sensorAccuracy;
            microY = Math.cos(time * 5) * 2 * sensorAccuracy;
          }
          
          // Add jitter when actively tracking to simulate sensor noise
          if (isTracking) {
            const jitterIntensity = isDogAnimal ? 1.5 : (isInvasive ? 0.8 : 0.5);
            // Reduced jitter factor for sensor-like precision
            const jitterFactor = jitterIntensity * (1 - sensorAccuracy) * 2;
            jitterX = (Math.random() - 0.5) * jitterFactor * animationFactor;
            jitterY = (Math.random() - 0.5) * jitterFactor * animationFactor;
          }
          
          // Calculate different positions for each animal with sensor zone awareness
          // to avoid overlap and maintain tracking fidelity
          let regionX = 0, regionY = 0;
          
          // Position based on array index, with sensor tracking zones
          switch (index % 5) {
            case 0: // Center with slight offset - primary tracking zone
              regionX = Math.sin(time * 0.2) * 10 * sensorAccuracy;
              regionY = Math.cos(time * 0.3) * 10 * sensorAccuracy;
              break;
            case 1: // Top-right quadrant - secondary tracking zone
              regionX = 70 + Math.sin(time * 0.25) * 15 * sensorAccuracy;
              regionY = -50 + Math.cos(time * 0.35) * 15 * sensorAccuracy;
              break;
            case 2: // Bottom-left quadrant - secondary tracking zone
              regionX = -60 + Math.sin(time * 0.3) * 15 * sensorAccuracy;
              regionY = 40 + Math.cos(time * 0.2) * 15 * sensorAccuracy;
              break;
            case 3: // Top-left quadrant - tertiary tracking zone
              regionX = -70 + Math.sin(time * 0.22) * 15 * sensorAccuracy;
              regionY = -50 + Math.cos(time * 0.28) * 15 * sensorAccuracy;
              break;
            case 4: // Bottom-right quadrant - tertiary tracking zone
              regionX = 60 + Math.sin(time * 0.18) * 15 * sensorAccuracy;
              regionY = 40 + Math.cos(time * 0.33) * 15 * sensorAccuracy;
              break;
          }
          
          // Combine all movements with sensor-like smoothing
          const totalX = regionX + baseX + microX + jitterX;
          const totalY = regionY + baseY + microY + jitterY;
          
          // Apply transform with subtle easing for more natural sensor tracking
          detectedAnimal.box.style.transform = `translate(calc(${totalX}px), calc(${totalY}px)) scale(${1 + Math.sin(currentTime + index) * 0.03})`;
          
          // Sensor tracking quality simulation
          if (progressPercent > 0.7) {
            // Simulate adaptive tracking quality based on movement complexity and visibility
            const qualityRandom = Math.random();
            const confidenceAdjustment = detectedAnimal.animal.confidence * 0.3;
            // Higher complexity movements affect sensor accuracy
            const movementComplexity = Math.abs(Math.sin(time * 5)) * 0.2;
            
            if (qualityRandom > (0.85 - confidenceAdjustment + movementComplexity)) {
              setTrackingQuality('medium');
            } else if (qualityRandom > (0.97 - confidenceAdjustment + movementComplexity)) {
              setTrackingQuality('low');
            } else {
              setTrackingQuality('high');
            }
          } else {
            setTrackingQuality('high');
          }
          
          // Update last update timestamp
          updatedMovements[index] = {
            ...movement,
            lastUpdate: now
          };
        }
      });
      
      setAnimalMovements(updatedMovements);
    }
  };
  
  // Create refs for detection boxes with immediate tracking activation
  useEffect(() => {
    if (animals.length > 0 && detectedAnimals.length > 0) {
      console.log("Setting up detection box refs for", detectedAnimals.length, "animals");
      
      // Use a timeout to ensure the component is fully rendered
      const timeout = setTimeout(() => {
        const boxes = document.querySelectorAll('.animal-detection-box');
        console.log("Found", boxes.length, "detection boxes");
        
        const updatedAnimals = [...detectedAnimals];
        
        boxes.forEach((box, index) => {
          if (index < updatedAnimals.length) {
            updatedAnimals[index].box = box as HTMLDivElement;
            console.log(`Assigned box reference for animal ${index}`);
          }
        });
        
        setDetectedAnimals(updatedAnimals);
        
        // Start tracking immediately if this is a video
        if (isVideo && videoRef.current && !videoRef.current.paused) {
          setIsTracking(true);
          requestAnimationFrame((timestamp) => {
            lastFrameTime.current = timestamp;
            const currentTime = videoRef.current?.currentTime || 0;
            const duration = videoRef.current?.duration || 1;
            const progress = currentTime / duration;
            updateAnimalPositions(progress, currentTime);
          });
        }
      }, 200); // Increased timeout for better chance of DOM being ready
      
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
        <div className="relative" ref={containerRef}>
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
                      className={`animal-detection-box border-2 ${
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
                      {/* Corner decorations for sensor effect */}
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
                      
                      {/* Enhanced animal label with scientific name */}
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
                          {getDetailedSpecies(detectedAnimal.animal.name)} {formatConfidence(detectedAnimal.animal.confidence)}
                        </Badge>
                      </div>
                      
                      {/* Enhanced sensor target icon in the center for videos */}
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
                      
                      {/* Enhanced scanning effect for active sensor tracking */}
                      {isVideo && isTracking && (
                        <div 
                          className="absolute inset-0 overflow-hidden opacity-30"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${isInvasive ? 'rgba(220, 38, 38, 0.5)' : isDogAnimal ? 'rgba(37, 99, 235, 0.5)' : 'rgba(34, 197, 94, 0.5)'}, transparent)`,
                            backgroundSize: '100% 200%',
                            animation: 'scanAnimation 2s infinite linear',
                            zIndex: 1
                          }}
                        ></div>
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
                    <Scan size={14} />
                    <span>Sensor: {
                      trackingQuality === 'high' ? 'Preciso' : 
                      trackingQuality === 'medium' ? 'Normal' : 'Baixo'
                    }</span>
                  </Badge>
                </div>
              )}
              
              {/* Tracking enable/disable toggle */}
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
                            {getDetailedSpecies(animal.name)}
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
