import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Dog, Rat, AlertTriangle, Circle, X } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { classifyAnimalType } from '@/services/imageRecognition';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  category?: string;
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
};

// Define colors for different animal types
const animalColors = {
  cachorro: '#4ecdc4',
  capivara: '#ff6b6b',
  javali: '#b76d2b',
  invasivo: '#ea384c',
  default: '#ff5e57'
};

// Get icon for animal type
const getAnimalIcon = (animalType: string) => {
  const type = animalType.toLowerCase();
  if (type.includes('cachorro') || type.includes('cão') || type.includes('dog')) {
    return <Dog size={16} />;
  } else if (type.includes('capivara') || type.includes('hydrochoerus') || 
            type.includes('javali') || type.includes('sus scrofa')) {
    return <Rat size={16} />;
  } else {
    return null;
  }
};

// Get color for animal type
const getAnimalColor = (animalType: string) => {
  const type = animalType.toLowerCase();
  if (type.includes('cachorro') || type.includes('cão') || type.includes('dog')) {
    return animalColors.cachorro;
  } else if (type.includes('capivara')) {
    return animalColors.capivara;
  } else if (type.includes('javali')) {
    return animalColors.javali;
  } else {
    return animalColors.invasivo;
  }
};

// Mobile detection utility
const isMobile = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

// Enhanced motion tracking parameters for specific animal types
const MOTION_THRESHOLD = 6;
const MOVEMENT_INTENSITY_THRESHOLD = 0.12;
const TRACKING_SMOOTHNESS = 0.7;
const PRESENCE_RADIUS = 45;
const INACTIVITY_TIMEOUT = 2500;
const INVASIVE_TRACKING_BOOST = 1.3;

// Specific detection parameters for different animal types
const ANIMAL_DETECTION_ZONES = {
  invasive: {
    preferredY: { min: 0.1, max: 0.6 },
    preferredX: { min: 0.2, max: 0.8 },
    sensitivity: 1.4,
    trackingRadius: 180
  },
  domestic: {
    preferredY: { min: 0.4, max: 0.9 },
    preferredX: { min: 0.1, max: 0.9 },
    sensitivity: 1.0,
    trackingRadius: 150
  }
};

// Species information database
const speciesInfo = {
  'Cachorro': {
    description: 'O cachorro (Canis familiaris) é um mamífero carnívoro da família dos canídeos, considerado o melhor amigo do homem. São animais domésticos leais, inteligentes e versáteis.',
    habitat: 'Ambientes domésticos e urbanos',
    behavior: 'Sociável, leal, protetor',
    conservationStatus: 'Doméstico',
    riskLevel: 'Baixo'
  },
  'Capivara': {
    description: 'A capivara (Hydrochoerus hydrochaeris) é o maior roedor do mundo. Pode pesar até 65kg e medir 1,3m de comprimento. É considerada espécie invasora em áreas urbanas.',
    habitat: 'Proximidade de corpos d\'água, áreas alagadas',
    behavior: 'Semi-aquático, vive em grupos, herbívoro',
    conservationStatus: 'Espécie invasora em ambientes urbanos',
    riskLevel: 'Alto - Causa danos a cultivos e infraestrutura'
  },
  'Javali': {
    description: 'O javali (Sus scrofa) é um suíno selvagem originário da Europa e Ásia. No Brasil, é considerado espécie invasora extremamente prejudicial ao meio ambiente e agricultura.',
    habitat: 'Florestas, campos, áreas rurais',
    behavior: 'Omnívoro, agressivo quando ameaçado, vive em grupos',
    conservationStatus: 'Espécie invasora - Controle obrigatório',
    riskLevel: 'Muito Alto - Danos severos à biodiversidade e agricultura'
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
}: GalleryItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatMapCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const previousFrameDataRef = useRef<ImageData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selectedAnimalInfo, setSelectedAnimalInfo] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Enhanced presence sensors tracking with invasive species priority
  const activePresenceSensorsRef = useRef<{[key: string]: {
    x: number, 
    y: number, 
    lastMovement: number, 
    isActive: boolean, 
    pulsePhase: number,
    velocity: {x: number, y: number},
    confidence: number,
    isInvasive: boolean,
    trackingPriority: number,
    animalType: 'invasive' | 'domestic'
  }}>({});
  const { toast } = useToast();
  const invasiveAlertShownRef = useRef<boolean>(false);

  // Detect mobile device on component mount
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);
  
  // Initialize video element with mobile optimizations
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log(`Configurando reprodução de vídeo para ${isMobileDevice ? 'mobile' : 'desktop'}: ${imageUrl}`);
      
      const video = videoRef.current;
      video.src = imageUrl;
      
      // Mobile-specific video attributes
      if (isMobileDevice) {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.preload = 'metadata';
      } else {
        video.preload = 'auto';
      }
      
      setVideoLoaded(false);
      setVideoError(false);
      
      const handleLoadedData = () => {
        console.log('Vídeo carregado com sucesso');
        setVideoLoaded(true);
        setVideoError(false);
        
        if (video && !isMobileDevice) {
          video.play().catch(error => {
            console.error("Erro ao reproduzir vídeo:", error);
            setVideoError(true);
          });
          setIsPlaying(true);
          
          if (animals.length > 0) {
            initializePresenceSensors();
          }
        }
      };

      const handleError = (e: Event) => {
        console.error("Erro ao carregar vídeo:", e);
        setVideoError(true);
        toast({
          title: "Erro no vídeo",
          description: "Não foi possível carregar o vídeo. Tente novamente.",
          variant: "destructive"
        });
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }
  }, [imageUrl, isVideo, isMobileDevice]);

  // Initialize presence sensors with specific animal type zones
  const initializePresenceSensors = () => {
    if (!canvasRef.current || !videoRef.current || isMobileDevice) return;
    
    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;
    
    console.log(`Inicializando sensores específicos para ${animals.length} animais em área ${width}x${height}`);
    
    activePresenceSensorsRef.current = {};
    
    // Separate animals by type
    const invasiveAnimals = animals.filter(animal => 
      animal.category?.toLowerCase().includes('invasora') ||
      animal.name.toLowerCase().includes('capivara') ||
      animal.name.toLowerCase().includes('javali')
    );
    
    const domesticAnimals = animals.filter(animal => 
      !invasiveAnimals.includes(animal)
    );
    
    // Position invasive animal sensors
    invasiveAnimals.forEach((animal, index) => {
      const zone = ANIMAL_DETECTION_ZONES.invasive;
      const xPos = width * (zone.preferredX.min + (index * (zone.preferredX.max - zone.preferredX.min)) / Math.max(1, invasiveAnimals.length - 1));
      const yPos = height * (zone.preferredY.min + Math.random() * (zone.preferredY.max - zone.preferredY.min));
      
      activePresenceSensorsRef.current[animal.name] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
        velocity: {x: 0, y: 0},
        confidence: animal.confidence,
        isInvasive: true,
        trackingPriority: 10,
        animalType: 'invasive'
      };
    });
    
    // Position domestic animal sensors
    domesticAnimals.forEach((animal, index) => {
      const zone = ANIMAL_DETECTION_ZONES.domestic;
      const totalDomestic = domesticAnimals.length;
      const xPos = width * (zone.preferredX.min + (index * (zone.preferredX.max - zone.preferredX.min)) / Math.max(1, totalDomestic - 1));
      const yPos = height * (zone.preferredY.min + Math.random() * (zone.preferredY.max - zone.preferredY.min));
      
      activePresenceSensorsRef.current[animal.name] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
        velocity: {x: 0, y: 0},
        confidence: animal.confidence,
        isInvasive: false,
        trackingPriority: 5,
        animalType: 'domestic'
      };
    });
    
    console.log("Sensores específicos por tipo inicializados:", activePresenceSensorsRef.current);
  };
  
  // Show alert for invasive species
  useEffect(() => {
    if (!isAnalyzing && animals.length > 0 && !invasiveAlertShownRef.current) {
      const invasiveSpecies = animals.filter(animal => {
        const isInvasive = 
          animal.category?.toLowerCase().includes('invasora') ||
          animal.name.toLowerCase().includes('capivara') ||
          animal.name.toLowerCase().includes('javali');
        return isInvasive;
      });
      
      if (invasiveSpecies.length > 0) {
        invasiveSpecies.forEach(species => {
          toast({
            title: "⚠️ Espécie Invasora Detectada!",
            description: `${species.name} foi identificada com ${Math.round(species.confidence * 100)}% de confiança. Rastreamento prioritário ativado.`,
            variant: "destructive",
            duration: 6000,
          });
        });
        
        invasiveAlertShownRef.current = true;
      }
    }
  }, [animals, isAnalyzing, toast]);

  useEffect(() => {
    if (isAnalyzing) {
      invasiveAlertShownRef.current = false;
    }
  }, [isAnalyzing]);

  // Handle video play/pause with mobile support
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error("Erro ao reproduzir vídeo:", error);
        setVideoError(true);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  // Enhanced animal tracking system (disabled on mobile for performance)
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing || isMobileDevice) return;
    
    console.log("Iniciando sistema de rastreamento específico por tipo para", animals.length, "animais");
    
    const setupAnimalTracking = () => {
      if (!videoRef.current || !canvasRef.current || !heatMapCanvasRef.current) {
        console.error("Referências de vídeo ou canvas ausentes");
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const heatMapCanvas = heatMapCanvasRef.current;
      
      const setCanvasSize = () => {
        const width = video.videoWidth || video.clientWidth;
        const height = video.videoHeight || video.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        heatMapCanvas.width = width;
        heatMapCanvas.height = height;
        
        console.log(`Dimensões do canvas configuradas: ${width}x${height}`);
        
        if (Object.keys(activePresenceSensorsRef.current).length === 0) {
          initializePresenceSensors();
        }
      };
      
      setCanvasSize();
      
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      const motionCanvas = document.createElement('canvas');
      const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
      motionCanvas.width = canvas.width;
      motionCanvas.height = canvas.height;
      
      const ctx = canvas.getContext('2d');
      const heatMapCtx = heatMapCanvas.getContext('2d');
      
      if (!ctx || !heatMapCtx || !motionCtx) {
        console.error("Falha ao obter contextos do canvas");
        return;
      }
      
      heatMapCtx.clearRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
      if (heatMapEnabled) {
        heatMapCtx.globalAlpha = 0.15;
      }
      
      // Type-specific motion detection
      const detectAnimalMovementByType = (animalType: 'invasive' | 'domestic') => {
        if (!motionCtx || !videoRef.current) return [];
        
        motionCtx.drawImage(videoRef.current, 0, 0, motionCanvas.width, motionCanvas.height);
        const currentFrameData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        if (!previousFrameDataRef.current) {
          previousFrameDataRef.current = currentFrameData;
          return [];
        }
        
        const movementAreas = [];
        const blockSize = animalType === 'invasive' ? 8 : 10; // Blocos menores para invasores
        const zone = ANIMAL_DETECTION_ZONES[animalType];
        
        // Detectar movimento apenas na zona preferencial do tipo de animal
        const startY = Math.floor(motionCanvas.height * zone.preferredY.min);
        const endY = Math.floor(motionCanvas.height * zone.preferredY.max);
        const startX = Math.floor(motionCanvas.width * zone.preferredX.min);
        const endX = Math.floor(motionCanvas.width * zone.preferredX.max);
        
        for (let y = startY; y < endY; y += blockSize) {
          for (let x = startX; x < endX; x += blockSize) {
            let totalDifference = 0;
            let pixelCount = 0;
            
            for (let blockY = 0; blockY < blockSize && y + blockY < motionCanvas.height; blockY++) {
              for (let blockX = 0; blockX < blockSize && x + blockX < motionCanvas.width; blockX++) {
                const pixelIndex = ((y + blockY) * motionCanvas.width + (x + blockX)) * 4;
                
                const rDiff = Math.abs(currentFrameData.data[pixelIndex] - previousFrameDataRef.current.data[pixelIndex]);
                const gDiff = Math.abs(currentFrameData.data[pixelIndex + 1] - previousFrameDataRef.current.data[pixelIndex + 1]);
                const bDiff = Math.abs(currentFrameData.data[pixelIndex + 2] - previousFrameDataRef.current.data[pixelIndex + 2]);
                
                const pixelDifference = (rDiff + gDiff + bDiff) / 3;
                
                if (pixelDifference > MOTION_THRESHOLD) {
                  totalDifference += pixelDifference;
                  pixelCount++;
                }
              }
            }
            
            const intensity = pixelCount > 0 ? totalDifference / (blockSize * blockSize) / 255 : 0;
            const adjustedThreshold = MOVEMENT_INTENSITY_THRESHOLD / zone.sensitivity;
            
            if (intensity > adjustedThreshold) {
              movementAreas.push({
                x: x + blockSize / 2,
                y: y + blockSize / 2,
                intensity: Math.min(1.0, intensity * zone.sensitivity),
                area: pixelCount,
                animalType: animalType
              });
            }
          }
        }
        
        previousFrameDataRef.current = currentFrameData;
        return movementAreas;
      };
      
      // Update sensor positions with type-specific tracking
      const updateAnimalSensorsByType = () => {
        const currentTime = Date.now();
        
        // Detectar movimento por tipo
        const invasiveMovements = detectAnimalMovementByType('invasive');
        const domesticMovements = detectAnimalMovementByType('domestic');
        
        // Atualizar sensores invasivos
        animals.filter(animal => 
          animal.category?.toLowerCase().includes('invasora') ||
          animal.name.toLowerCase().includes('capivara') ||
          animal.name.toLowerCase().includes('javali')
        ).forEach(animal => {
          const sensorData = activePresenceSensorsRef.current[animal.name];
          if (!sensorData) return;
          
          sensorData.pulsePhase += 0.12;
          
          // Encontrar o melhor movimento invasivo para este sensor
          let bestMovement = null;
          let maxScore = 0;
          
          const detectionRadius = sensorData.trackingPriority === 10 ? 220 : 180;
          
          invasiveMovements.forEach(movement => {
            const distance = Math.sqrt(
              Math.pow(movement.x - sensorData.x, 2) + 
              Math.pow(movement.y - sensorData.y, 2)
            );
            
            const distanceScore = Math.max(0, 1 - distance / detectionRadius);
            const score = movement.intensity * movement.area * distanceScore * INVASIVE_TRACKING_BOOST;
            
            if (score > maxScore && distance < detectionRadius) {
              maxScore = score;
              bestMovement = movement;
            }
          });
          
          if (bestMovement) {
            sensorData.isActive = true;
            sensorData.lastMovement = currentTime;
            
            const deltaX = bestMovement.x - sensorData.x;
            const deltaY = bestMovement.y - sensorData.y;
            
            sensorData.velocity.x = deltaX * TRACKING_SMOOTHNESS * 1.2;
            sensorData.velocity.y = deltaY * TRACKING_SMOOTHNESS * 1.2;
            
            sensorData.x += sensorData.velocity.x;
            sensorData.y += sensorData.velocity.y;
            
            sensorData.x = Math.max(PRESENCE_RADIUS, Math.min(canvas.width - PRESENCE_RADIUS, sensorData.x));
            sensorData.y = Math.max(PRESENCE_RADIUS, Math.min(canvas.height - PRESENCE_RADIUS, sensorData.y));
            
            console.log(`Sensor [INVASOR] ${animal.name} rastreando movimento invasivo em (${Math.round(sensorData.x)}, ${Math.round(sensorData.y)})`);
          } else {
            sensorData.velocity.x *= 0.92;
            sensorData.velocity.y *= 0.92;
            
            const timeSinceLastMovement = currentTime - sensorData.lastMovement;
            if (timeSinceLastMovement > INACTIVITY_TIMEOUT * 1.5) {
              sensorData.isActive = false;
            }
          }
        });
        
        // Atualizar sensores domésticos
        animals.filter(animal => 
          !animal.category?.toLowerCase().includes('invasora') &&
          !animal.name.toLowerCase().includes('capivara') &&
          !animal.name.toLowerCase().includes('javali')
        ).forEach(animal => {
          const sensorData = activePresenceSensorsRef.current[animal.name];
          if (!sensorData) return;
          
          sensorData.pulsePhase += 0.08;
          
          // Encontrar o melhor movimento doméstico para este sensor
          let bestMovement = null;
          let maxScore = 0;
          
          const detectionRadius = 180;
          
          domesticMovements.forEach(movement => {
            const distance = Math.sqrt(
              Math.pow(movement.x - sensorData.x, 2) + 
              Math.pow(movement.y - sensorData.y, 2)
            );
            
            const distanceScore = Math.max(0, 1 - distance / detectionRadius);
            const score = movement.intensity * movement.area * distanceScore;
            
            if (score > maxScore && distance < detectionRadius) {
              maxScore = score;
              bestMovement = movement;
            }
          });
          
          if (bestMovement) {
            sensorData.isActive = true;
            sensorData.lastMovement = currentTime;
            
            const deltaX = bestMovement.x - sensorData.x;
            const deltaY = bestMovement.y - sensorData.y;
            
            sensorData.velocity.x = deltaX * TRACKING_SMOOTHNESS;
            sensorData.velocity.y = deltaY * TRACKING_SMOOTHNESS;
            
            sensorData.x += sensorData.velocity.x;
            sensorData.y += sensorData.velocity.y;
            
            sensorData.x = Math.max(PRESENCE_RADIUS, Math.min(canvas.width - PRESENCE_RADIUS, sensorData.x));
            sensorData.y = Math.max(PRESENCE_RADIUS, Math.min(canvas.height - PRESENCE_RADIUS, sensorData.y));
            
            console.log(`Sensor [DOMÉSTICO] ${animal.name} rastreando movimento doméstico em (${Math.round(sensorData.x)}, ${Math.round(sensorData.y)})`);
          } else {
            sensorData.velocity.x *= 0.92;
            sensorData.velocity.y *= 0.92;
            
            const timeSinceLastMovement = currentTime - sensorData.lastMovement;
            if (timeSinceLastMovement > INACTIVITY_TIMEOUT) {
              sensorData.isActive = false;
            }
          }
        });
      };
      
      // Enhanced sensor rendering with invasive species highlighting and clickable info
      const drawAnimalSensors = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        animals.forEach(animal => {
          const sensorData = activePresenceSensorsRef.current[animal.name];
          if (!sensorData) return; 
          
          const isInvasive = sensorData.isInvasive;
          const sensorColor = isInvasive ? animalColors.invasivo : getAnimalColor(animal.name);
          const radius = isInvasive ? PRESENCE_RADIUS + 12 : PRESENCE_RADIUS;
          
          if (sensorData.isActive) {
            // Enhanced pulsing animation for invasive species
            const pulseIntensity = isInvasive ? 0.35 : 0.25;
            const pulseScale = 1 + Math.sin(sensorData.pulsePhase) * pulseIntensity;
            const currentRadius = radius * pulseScale;
            
            // Multi-layer sensor visualization with invasive priority
            const gradient = ctx.createRadialGradient(
              sensorData.x, sensorData.y, 0,
              sensorData.x, sensorData.y, currentRadius
            );
            
            if (isInvasive) {
              // Cores mais vibrantes para invasores
              gradient.addColorStop(0, 'rgba(234, 56, 76, 0.95)');
              gradient.addColorStop(0.2, 'rgba(234, 56, 76, 0.8)');
              gradient.addColorStop(0.5, 'rgba(234, 56, 76, 0.5)');
              gradient.addColorStop(0.8, 'rgba(234, 56, 76, 0.2)');
              gradient.addColorStop(1, 'rgba(234, 56, 76, 0.05)');
            } else {
              gradient.addColorStop(0, `${sensorColor}CC`);
              gradient.addColorStop(0.3, `${sensorColor}88`);
              gradient.addColorStop(0.7, `${sensorColor}44`);
              gradient.addColorStop(1, `${sensorColor}11`);
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Clickable inner core with confidence indicator
            const coreSize = isInvasive ? 8 + (sensorData.confidence * 6) : 6 + (sensorData.confidence * 4);
            ctx.fillStyle = sensorColor;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Info icon overlay for clickable interaction
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('i', sensorData.x, sensorData.y);
            
            // Active tracking ring with invasive emphasis
            ctx.strokeStyle = sensorColor;
            ctx.lineWidth = isInvasive ? 3 : 2;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, currentRadius * 0.75, 0, Math.PI * 2);
            ctx.stroke();
            
            // Enhanced status display
            ctx.fillStyle = 'white';
            ctx.font = isInvasive ? 'bold 11px Arial' : 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Background for text
            const textWidth = isInvasive ? 120 : 100;
            const textHeight = 22;
            const textX = sensorData.x - textWidth / 2;
            const textY = sensorData.y + radius + 25 - textHeight / 2;
            
            ctx.fillStyle = `${sensorColor}EE`;
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            // Status text with invasive indicator
            ctx.fillStyle = 'white';
            const statusText = isInvasive ? '🚨 INVASOR DETECTADO' : '🎯 RASTREANDO';
            ctx.fillText(statusText, sensorData.x, sensorData.y + radius + 20);
            ctx.font = '8px Arial';
            ctx.fillText(`${animal.name} - ${Math.round(sensorData.confidence * 100)}%`, sensorData.x, sensorData.y + radius + 35);
            
            // Heat map trace for movement history with reduced intensity
            if (heatMapEnabled) {
              const heatGradient = heatMapCtx.createRadialGradient(
                sensorData.x, sensorData.y, 2,
                sensorData.x, sensorData.y, radius * (isInvasive ? 1.0 : 0.8)
              );
              
              if (isInvasive) {
                // Reduced intensity colors for invasive species heat map
                heatGradient.addColorStop(0, 'rgba(234, 56, 76, 0.3)');
                heatGradient.addColorStop(0.6, 'rgba(234, 56, 76, 0.15)');
                heatGradient.addColorStop(1, 'rgba(234, 56, 76, 0.03)');
              } else {
                // Reduced intensity colors for domestic species heat map
                heatGradient.addColorStop(0, `${sensorColor}40`);
                heatGradient.addColorStop(0.8, `${sensorColor}15`);
                heatGradient.addColorStop(1, 'transparent');
              }
              
              heatMapCtx.fillStyle = heatGradient;
              heatMapCtx.beginPath();
              heatMapCtx.arc(sensorData.x, sensorData.y, radius * (isInvasive ? 1.0 : 0.8), 0, Math.PI * 2);
              heatMapCtx.fill();
            }
          } else {
            // Inactive sensor - standby mode with invasive differentiation
            const standbyColor = isInvasive ? '#ea384c50' : `${sensorColor}50`;
            ctx.strokeStyle = standbyColor;
            ctx.lineWidth = isInvasive ? 3 : 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Inactive core
            ctx.fillStyle = `${sensorColor}30`;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, isInvasive ? 6 : 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Info icon for inactive sensors
            ctx.fillStyle = `${sensorColor}70`;
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('i', sensorData.x, sensorData.y);
            
            // Standby label
            ctx.fillStyle = `${sensorColor}70`;
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const standbyText = isInvasive ? '⚠️ INVASOR EM STANDBY' : '⏸️ AGUARDANDO';
            ctx.fillText(standbyText, sensorData.x, sensorData.y + radius + 15);
          }
        });
      };
      
      // Main animation loop with type-specific tracking
      const animate = () => {
        // Skip animation frame on mobile to prevent performance issues
        if (isMobileDevice) return;
        
        updateAnimalSensorsByType();
        drawAnimalSensors();
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    setupAnimalTracking();
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageUrl, isVideo, videoLoaded, animals, isAnalyzing, heatMapEnabled, isMobileDevice]);

  // Handle sensor click to show species information
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isMobileDevice) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    for (const animal of animals) {
      const sensorData = activePresenceSensorsRef.current[animal.name];
      if (!sensorData) continue;
      
      const distance = Math.sqrt(
        Math.pow(canvasX - sensorData.x, 2) + 
        Math.pow(canvasY - sensorData.y, 2)
      );
      
      const sensorRadius = sensorData.isInvasive ? PRESENCE_RADIUS + 12 : PRESENCE_RADIUS;
      
      if (distance <= sensorRadius) {
        setSelectedAnimalInfo(animal.name);
        break;
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="relative rounded-lg overflow-hidden border bg-background shadow-sm">
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {isVideo ? (
            <>
              {videoError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-lg mb-2">Erro ao carregar vídeo</p>
                    <p className="text-sm text-gray-400">Verifique o formato do arquivo</p>
                  </div>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-contain"
                    onClick={togglePlayPause}
                    playsInline
                    muted
                    loop
                    onLoadedData={() => setVideoLoaded(true)}
                    onError={() => setVideoError(true)}
                  />
                  {!isMobileDevice && (
                    <>
                      <canvas 
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full cursor-pointer"
                        style={{zIndex: 10}}
                        onClick={handleCanvasClick}
                      />
                      <canvas 
                        ref={heatMapCanvasRef}
                        className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!heatMapEnabled ? 'hidden' : ''}`}
                        style={{zIndex: 9}}
                      />
                    </>
                  )}
                  {isMobileDevice && videoLoaded && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                      📱 Modo móvel: Sensores desabilitados para melhor performance
                    </div>
                  )}
                </>
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
              
              {isVideo && (
                <div className="flex flex-col gap-1">
                  {heatMapEnabled && !isMobileDevice && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThermometerSun size={16} className="text-amber-500" />
                      <span>Mapa de calor ativado</span>
                    </div>
                  )}
                  
                  {!isMobileDevice && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Circle size={16} className="text-green-500" />
                      <span>Sensores de presença rastreando movimento - Clique no sensor para mais informações</span>
                    </div>
                  )}
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
            
            {showReanalyze && (
              <Button 
                onClick={onAnalyze} 
                variant="secondary" 
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Reanalisar</span>
              </Button>
            )}
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
                    <Popover key={`${animal.name}-${index}`}>
                      <PopoverTrigger asChild>
                        <div 
                          className={`flex items-center p-2 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors ${isInvasive ? 'border-red-500/70' : ''}`}
                          style={{ borderColor: isInvasive ? '#ea384c80' : getAnimalColor(animal.name) + '80' }}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
                            style={{ backgroundColor: isInvasive ? '#ea384c33' : getAnimalColor(animal.name) + '33' }}
                          >
                            {isInvasive ? (
                              <AlertTriangle size={16} className="text-red-500" />
                            ) : (
                              getAnimalIcon(animal.name) || <ThermometerSun size={16} />
                            )}
                          </div>
                          <div>
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
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">{animal.name}</h4>
                            {animal.scientificName && (
                              <span className="text-sm italic text-muted-foreground">
                                {animal.scientificName}
                              </span>
                            )}
                          </div>
                          
                          {speciesInfo[animal.name] && (
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="font-medium">Descrição:</p>
                                <p className="text-muted-foreground">{speciesInfo[animal.name].description}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium">Habitat:</p>
                                <p className="text-muted-foreground">{speciesInfo[animal.name].habitat}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium">Comportamento:</p>
                                <p className="text-muted-foreground">{speciesInfo[animal.name].behavior}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium">Status de Conservação:</p>
                                <p className={`font-medium ${isInvasive ? 'text-red-600' : 'text-green-600'}`}>
                                  {speciesInfo[animal.name].conservationStatus}
                                </p>
                              </div>
                              
                              <div>
                                <p className="font-medium">Nível de Risco:</p>
                                <p className={`font-medium ${isInvasive ? 'text-red-600' : 'text-green-600'}`}>
                                  {speciesInfo[animal.name].riskLevel}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {animal.description && !speciesInfo[animal.name] && (
                            <div>
                              <p className="font-medium">Descrição:</p>
                              <p className="text-sm text-muted-foreground">{animal.description}</p>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Species Information Modal */}
        {selectedAnimalInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAnimalInfo(null)}>
            <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedAnimalInfo}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAnimalInfo(null)}>
                  <X size={16} />
                </Button>
              </div>
              
              {speciesInfo[selectedAnimalInfo] && (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Descrição:</p>
                    <p className="text-muted-foreground">{speciesInfo[selectedAnimalInfo].description}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Habitat:</p>
                    <p className="text-muted-foreground">{speciesInfo[selectedAnimalInfo].habitat}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Comportamento:</p>
                    <p className="text-muted-foreground">{speciesInfo[selectedAnimalInfo].behavior}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Status de Conservação:</p>
                    <p className={`font-medium ${selectedAnimalInfo.includes('Capivara') || selectedAnimalInfo.includes('Javali') ? 'text-red-600' : 'text-green-600'}`}>
                      {speciesInfo[selectedAnimalInfo].conservationStatus}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Nível de Risco:</p>
                    <p className={`font-medium ${selectedAnimalInfo.includes('Capivara') || selectedAnimalInfo.includes('Javali') ? 'text-red-600' : 'text-green-600'}`}>
                      {speciesInfo[selectedAnimalInfo].riskLevel}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
