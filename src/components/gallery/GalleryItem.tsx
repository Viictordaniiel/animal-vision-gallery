
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
  const detectionBoxRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingQuality, setTrackingQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [detectedAnimals, setDetectedAnimals] = useState<{animal: Animal, box: HTMLDivElement | null}[]>([]);
  const [animalMovements, setAnimalMovements] = useState<{[key: number]: {x: number, y: number, speed: number, pattern: string, lastUpdate: number}}>({}); 
  const [videoProgress, setVideoProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const lastFrameTime = useRef<number>(0);
  const [animalDetails, setAnimalDetails] = useState<{[key: string]: {color: string, icon: string, behavior: string}}>({}); 
  
  // Enhanced species identification with detailed taxonomy and tracking characteristics
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
  
  // Initialize animal details for enhanced tracking and identification
  useEffect(() => {
    // Generate unique visual details for each type of animal
    const newAnimalDetails: {[key: string]: {color: string, icon: string, behavior: string}} = {};
    
    // Standard classes
    newAnimalDetails['invasive'] = {
      color: 'rgb(220, 38, 38)',
      icon: 'Target',
      behavior: 'Tracking: Invasive species shows deliberate, goal-oriented movement'
    };
    
    newAnimalDetails['domestic'] = {
      color: 'rgb(37, 99, 235)',
      icon: 'Dog',
      behavior: 'Tracking: Domestic species shows familiar, playful movement'
    };
    
    newAnimalDetails['predator'] = {
      color: 'rgb(249, 115, 22)',
      icon: 'Target',
      behavior: 'Tracking: Predator species shows stealthy, calculated movement'
    };
    
    newAnimalDetails['herbivore'] = {
      color: 'rgb(34, 197, 94)',
      icon: 'Target',
      behavior: 'Tracking: Herbivore species shows cautious, grazing movement'
    };
    
    newAnimalDetails['other'] = {
      color: 'rgb(124, 58, 237)',
      icon: 'Target',
      behavior: 'Tracking: Wildlife shows natural movement'
    };
    
    setAnimalDetails(newAnimalDetails);
  }, []);
  
  // Initialize tracking state and movement patterns for each animal when detected
  useEffect(() => {
    if (animals.length > 0 && !isAnalyzing) {
      console.log("Setting up animal detection boxes for", animals.length, "animals");
      
      // Clear previous detection boxes
      setDetectedAnimals([]);
      setTrackingEnabled(true);
      
      // Create new detection boxes and initialize movement patterns
      const newBoxes = animals.slice(0, Math.min(7, animals.length)).map((animal, index) => {
        // Initialize unique movement pattern for each animal
        const newMovements = {...animalMovements};
        
        // Different movement patterns based on animal type
        const animalClass = getAnimalClassification(animal.name);
        
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
      
      // Enhanced animation frame based tracking for smoother motion with sensor simulation
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
          const animalClass = getAnimalClassification(detectedAnimal.animal.name);
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
          
          // Apply different sensor-like tracking patterns based on animal classification
          switch(animalClass) {
            case 'invasive':
              // Slower, deliberate movement with occasional stops
              switch(pattern) {
                case 'circular':
                  // Circular roaming pattern with occasional probing movements
                  baseX = Math.cos(time * 1.0) * 18 * adaptiveFactor;
                  baseY = Math.sin(time * 1.2) * 18 * adaptiveFactor;
                  // Add occasional stop-and-go movement
                  if (Math.sin(time * 0.3) > 0.9) {
                    baseX *= 0.2; // Almost stopping
                    baseY *= 0.2;
                  }
                  microX = Math.sin(time * 4) * 3 * sensorAccuracy;
                  microY = Math.cos(time * 5) * 3 * sensorAccuracy;
                  break;
                  
                case 'zigzag':
                default:
                  // Zig-zag destructive foraging pattern
                  baseX = Math.sin(time * 1.8) * 22 * adaptiveFactor;
                  baseY = Math.cos(time * 0.5) * 10 * adaptiveFactor;
                  // Add forward momentum
                  baseY += Math.sin(time * 0.2) * 15 * adaptiveFactor;
                  // Add micro-movements for rooting behavior
                  microX = Math.sin(time * 6) * 4 * sensorAccuracy;
                  microY = Math.cos(time * 7) * 3 * sensorAccuracy;
                  break;
              }
              break;
              
            case 'domestic':
              // More playful and energetic movements
              switch(pattern) {
                case 'bouncy':
                  // Bouncy, high-energy movement
                  baseX = Math.sin(time * 3) * 25 * adaptiveFactor;
                  baseY = Math.abs(Math.sin(time * 5)) * 18 * adaptiveFactor;
                  // Add sudden direction changes
                  if (Math.sin(time * 1.5) > 0.85) {
                    baseX *= 1.8; // Sudden bursts
                    baseY *= 1.3;
                  }
                  microX = Math.sin(time * 10) * 5 * sensorAccuracy;
                  microY = Math.cos(time * 12) * 5 * sensorAccuracy;
                  break;
                  
                case 'playful':
                default:
                  // Playful, exploratory movement with play bows
                  baseX = Math.sin(time * 2.5) * 20 + Math.cos(time * 4) * 10 * sensorAccuracy;
                  baseY = Math.cos(time * 3) * 15 * sensorAccuracy;
                  // Add play bow movements
                  if (Math.sin(time * 2) > 0.8) {
                    baseY += 10 * Math.sin(time * 8) * sensorAccuracy;
                  }
                  microX = Math.sin(time * 8) * 6 * sensorAccuracy;
                  microY = Math.cos(time * 9) * 6 * sensorAccuracy;
                  break;
              }
              break;
              
            case 'predator':
              // Stealthy, calculated movements
              switch(pattern) {
                case 'stalking':
                  // Slow stalking with occasional pounces
                  baseX = Math.sin(time * 0.8) * 12 * adaptiveFactor;
                  baseY = Math.cos(time * 0.5) * 8 * adaptiveFactor;
                  // Add occasional pouncing
                  if (Math.sin(time * 0.3) > 0.95) {
                    baseX *= 3.0; // Sudden pounce
                    baseY *= 2.5;
                  }
                  microX = Math.sin(time * 3) * 2 * sensorAccuracy;
                  microY = Math.cos(time * 4) * 2 * sensorAccuracy;
                  break;
                  
                case 'ambush':
                default:
                  // Very minimal movement with occasional quick strikes
                  baseX = Math.sin(time * 0.4) * 5 * adaptiveFactor;
                  baseY = Math.cos(time * 0.3) * 3 * adaptiveFactor;
                  // Add strike behavior
                  if (Math.sin(time * 0.2) > 0.97) {
                    baseX += Math.sign(Math.sin(time)) * 30 * sensorAccuracy;
                    baseY += Math.sign(Math.cos(time)) * 20 * sensorAccuracy;
                  }
                  microX = Math.sin(time * 2) * 1 * sensorAccuracy;
                  microY = Math.cos(time * 2) * 1 * sensorAccuracy;
                  break;
              }
              break;
              
            case 'herbivore':
              // Cautious, grazing movements
              switch(pattern) {
                case 'grazing':
                  // Slow grazing with head down, then up to check surroundings
                  baseX = Math.sin(time * 0.6) * 8 * adaptiveFactor;
                  baseY = Math.cos(time * 0.4) * 6 * adaptiveFactor;
                  // Add head up and down movement
                  if (Math.sin(time * 0.8) > 0.7) {
                    baseY -= 5 * sensorAccuracy; // Head up to look around
                    microX *= 0.3; // Less micro-movement when alert
                    microY *= 0.3;
                  } else {
                    microX = Math.sin(time * 6) * 3 * sensorAccuracy; // More micro-movements when grazing
                    microY = Math.cos(time * 5) * 3 * sensorAccuracy;
                  }
                  break;
                  
                case 'cautious':
                default:
                  // Cautious movement with freezing when detecting threats
                  baseX = Math.sin(time * 0.9) * 15 * adaptiveFactor;
                  baseY = Math.cos(time * 0.7) * 10 * adaptiveFactor;
                  // Add occasional freezing behavior
                  if (Math.sin(time * 1.2) > 0.8) {
                    baseX *= 0.1; // Almost complete stop
                    baseY *= 0.1;
                    microX *= 0.5; // Very minimal micro-movements
                    microY *= 0.5;
                  } else {
                    microX = Math.sin(time * 5) * 2 * sensorAccuracy;
                    microY = Math.cos(time * 6) * 2 * sensorAccuracy;
                  }
                  break;
              }
              break;
              
            default: // 'other' classification
              // General wildlife movement
              baseX = (Math.sin(time) + Math.cos(time * 2.3)) * 15 * adaptiveFactor;
              baseY = (Math.cos(time * 1.5) + Math.sin(time * 0.7)) * 10 * adaptiveFactor;
              // Add natural variations
              microX = Math.sin(time * 4) * 3 * sensorAccuracy;
              microY = Math.cos(time * 5) * 3 * sensorAccuracy;
              break;
          }
          
          // Add jitter when actively tracking to simulate sensor noise
          if (isTracking) {
            // Base jitter intensity on animal type and sensor quality
            const jitterIntensity = animalClass === 'domestic' ? 1.5 : 
                                    animalClass === 'invasive' ? 0.8 : 0.5;
            // Reduced jitter factor for sensor-like precision
            const jitterFactor = jitterIntensity * (1 - sensorAccuracy) * 2;
            jitterX = (Math.random() - 0.5) * jitterFactor * animationFactor;
            jitterY = (Math.random() - 0.5) * jitterFactor * animationFactor;
          }
          
          // Calculate different positions for each animal with sensor zone awareness
          // to avoid overlap and maintain tracking fidelity
          let regionX = 0, regionY = 0;
          
          // Position based on array index, with sensor tracking zones
          // Create a semi-natural distribution around the frame
          const angle = (index / detectedAnimals.length) * Math.PI * 2;
          const radius = 40 + (index % 3) * 20; // Varying distances from center
          
          // Position animals in different regions to avoid overlap
          regionX = Math.cos(angle + time * 0.1) * radius * sensorAccuracy;
          regionY = Math.sin(angle + time * 0.1) * radius * sensorAccuracy;
          
          // Apply animal-specific regional bias
          switch(animalClass) {
            case 'invasive':
              // Invasive species tend to be more in foreground/lower parts of frame
              regionY += 15;
              break;
            case 'predator':
              // Predators often at edges of frame
              regionX *= 1.2;
              break;
            case 'herbivore':
              // Herbivores often in open areas/center
              regionX *= 0.8;
              regionY *= 0.8;
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
            
            // Simulate tracking quality changes
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
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return "bg-red-100 border-red-600 text-red-800 px-2 py-1";
      case 'domestic':
        return "bg-blue-100 border-blue-600 text-blue-800 px-2 py-1";
      case 'predator':
        return "bg-orange-100 border-orange-600 text-orange-800 px-2 py-1";
      case 'herbivore':
        return "bg-green-100 border-green-600 text-green-800 px-2 py-1";
      default:
        return "bg-purple-100 border-purple-600 text-purple-800 px-2 py-1";
    }
  };
  
  // Get detection box style based on animal type
  const getDetectionBoxStyle = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return "border-red-500";
      case 'domestic':
        return "border-blue-500";
      case 'predator':
        return "border-orange-500";
      case 'herbivore':
        return "border-green-500";
      default:
        return "border-purple-500";
    }
  };
  
  // Get box shadow color based on animal classification
  const getBoxShadowColor = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'rgba(220, 38, 38, 0.8)';
      case 'domestic':
        return 'rgba(37, 99, 235, 0.8)';
      case 'predator':
        return 'rgba(249, 115, 22, 0.8)';
      case 'herbivore':
        return 'rgba(34, 197, 94, 0.8)';
      default:
        return 'rgba(124, 58, 237, 0.8)';
    }
  };
  
  // Get badge background color based on animal classification
  const getBadgeBgColor = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'bg-red-500/90 text-white border-red-700';
      case 'domestic':
        return 'bg-blue-500/90 text-white border-blue-700';
      case 'predator':
        return 'bg-orange-500/90 text-white border-orange-700';
      case 'herbivore':
        return 'bg-green-500/90 text-white border-green-700';
      default:
        return 'bg-purple-500/90 text-white border-purple-700';
    }
  };
  
  // Get border color based on animal classification
  const getBorderColor = (animalName: string): string => {
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
  
  // Get scanning background based on animal classification
  const getScanningBg = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'rgba(220, 38, 38, 0.5)';
      case 'domestic':
        return 'rgba(37, 99, 235, 0.5)';
      case 'predator':
        return 'rgba(249, 115, 22, 0.5)';
      case 'herbivore':
        return 'rgba(34, 197, 94, 0.5)';
      default:
        return 'rgba(124, 58, 237, 0.5)';
    }
  };
  
  // Get text color based on animal classification
  const getTextColor = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'text-red-800';
      case 'domestic':
        return 'text-blue-800';
      case 'predator':
        return 'text-orange-800';
      case 'herbivore':
        return 'text-green-800';
      default:
        return 'text-purple-800';
    }
  };
  
  // Get tracking behavior description based on animal class
  const getTrackingBehavior = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'Movimento invasor';
      case 'domestic':
        return 'Movimento doméstico';
      case 'predator':
        return 'Movimento predador';
      case 'herbivore':
        return 'Movimento herbívoro';
      default:
        return 'Movimento natural';
    }
  };
  
  // Get animal category label
  const getAnimalCategoryLabel = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'Invasor';
      case 'domestic':
        return 'Doméstico';
      case 'predator':
        return 'Predador';
      case 'herbivore':
        return 'Herbívoro';
      default:
        return 'Nativo';
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
                  const animalClass = getAnimalClassification(detectedAnimal.animal.name);
                  
                  // Calculate different sizes and positions for each animal
                  // Larger box for higher confidence animals, but not too big
                  const confidenceAdjustment = Math.min(0.2, detectedAnimal.animal.confidence * 0.2);
                  const sizeBase = 0.7 - (index * 0.07); // First box is 70%, then reduce by 7%
                  const sizeAdjustment = Math.max(0.4, sizeBase + confidenceAdjustment); // Don't go below 40%
                  
                  const width = `${Math.round(sizeAdjustment * 100)}%`;
                  const height = `${Math.round(sizeAdjustment * 100)}%`;
                  
                  // Define box shadow based on animal type
                  const boxShadow = getBoxShadowColor(detectedAnimal.animal.name);
                  
                  return (
                    <div 
                      key={index}
                      className={`animal-detection-box border-3 ${getBorderColor(detectedAnimal.animal.name)} rounded-md ${isTracking ? 'animate-pulse' : ''}`}
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
                      <div className={`absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 ${getBorderColor(detectedAnimal.animal.name)}`}></div>
                      <div className={`absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 ${getBorderColor(detectedAnimal.animal.name)}`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 ${getBorderColor(detectedAnimal.animal.name)}`}></div>
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 ${getBorderColor(detectedAnimal.animal.name)}`}></div>
                      
                      {/* Enhanced animal label with scientific name */}
                      <div className="absolute -top-7 left-0 right-0 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${getBadgeBgColor(detectedAnimal.animal.name)} text-xs px-2 py-0.5 text-white
                          `}
                        >
                          {getDetailedSpecies(detectedAnimal.animal.name)} {formatConfidence(detectedAnimal.animal.confidence)}
                        </Badge>
                      </div>
                      
                      {/* Animal behavior badge */}
                      <div className="absolute -bottom-7 left-0 right-0 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`bg-black/70 text-white text-xs px-2 py-0.5`}
                        >
                          {getTrackingBehavior(detectedAnimal.animal.name)}
                        </Badge>
                      </div>
                      
                      {/* Enhanced sensor target icon in the center for videos */}
                      {isVideo && isTracking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {animalClass === 'domestic' ? (
                              <Dog 
                                className={`text-blue-500 opacity-80`} 
                                size={32 - (index * 4)} 
                                style={{
                                  animation: 'pulse 1.5s infinite'
                                }}
                              />
                            ) : animalClass === 'predator' ? (
                              <Target 
                                className={`text-orange-500 opacity-80`} 
                                size={32 - (index * 4)}
                                style={{
                                  animation: 'pulse 1.5s infinite'
                                }}
                              />
                            ) : animalClass === 'invasive' ? (
                              <Target 
                                className={`text-red-500 opacity-80`} 
                                size={32 - (index * 4)}
                                style={{
                                  animation: 'pulse 1.5s infinite'
                                }}
                              />
                            ) : (
                              <Crosshair 
                                className={`text-green-500 opacity-80`} 
                                size={32 - (index * 4)} 
                                style={{
                                  animation: 'pulse 1.5s infinite'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced scanning effect for active sensor tracking */}
                      {isVideo && isTracking && (
                        <div 
                          className="absolute inset-0 overflow-hidden opacity-30"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${getScanningBg(detectedAnimal.animal.name)}, transparent)`,
                            backgroundSize: '100% 200%',
                            animation: 'scanAnimation 2s infinite linear',
                            zIndex: 1
                          }}
                        ></div>
                      )}
                      
                      {/* Identification ID */}
                      <div className="absolute top-2 left-2">
                        <div className={`
                          px-1.5 py-0.5 rounded-full text-[10px] font-mono 
                          ${animalClass === 'invasive' ? 'bg-red-600 text-white' : 
                            animalClass === 'domestic' ? 'bg-blue-600 text-white' : 
                            animalClass === 'predator' ? 'bg-orange-600 text-white' : 
                            animalClass === 'herbivore' ? 'bg-green-600 text-white' : 
                            'bg-purple-600 text-white'
                          }
                        `}>
                          ID-{index + 1}
                        </div>
                      </div>
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
                    const animalClass = getAnimalClassification(animal.name);
                    
                    return (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${getTextColor(animal.name)}`}>
                            {getDetailedSpecies(animal.name)}
                            <span className={`ml-2 text-xs ${
                              animalClass === 'invasive' ? 'bg-red-100 text-red-800' : 
                              animalClass === 'domestic' ? 'bg-blue-100 text-blue-800' : 
                              animalClass === 'predator' ? 'bg-orange-100 text-orange-800' : 
                              animalClass === 'herbivore' ? 'bg-green-100 text-green-800' : 
                              'bg-purple-100 text-purple-800'
                            } px-2 py-0.5 rounded-full`}>
                              {getAnimalCategoryLabel(animal.name)}
                            </span>
                          </span>
                          <Badge 
                            variant={isInvasiveSpecies(animal.name) ? "destructive" : "outline"} 
                            className={!isInvasiveSpecies(animal.name) ? 
                              (isDog(animal.name) ? "bg-blue-100 text-blue-800" : 
                               isPredator(animal.name) ? "bg-orange-100 text-orange-800" :
                               isHerbivore(animal.name) ? "bg-green-100 text-green-800" : 
                               "bg-purple-100 text-purple-800") : ""}
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
