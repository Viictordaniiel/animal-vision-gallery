import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Dog, Rat, AlertTriangle, Circle } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { classifyAnimalType } from '@/services/imageRecognition';
import { useToast } from '@/hooks/use-toast';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  category?: string;
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
    // Zonas preferenciais para invasores (parte superior e central)
    preferredY: { min: 0.1, max: 0.6 },
    preferredX: { min: 0.2, max: 0.8 },
    sensitivity: 1.4, // Maior sensibilidade para invasores
    trackingRadius: 180
  },
  domestic: {
    // Zonas preferenciais para domésticos (parte inferior)
    preferredY: { min: 0.4, max: 0.9 },
    preferredX: { min: 0.1, max: 0.9 },
    sensitivity: 1.0,
    trackingRadius: 150
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
          
          if (animals.length > 0) {
            initializePresenceSensors();
          }
        }
      };
      
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
      };
    }
  }, [imageUrl, isVideo]);

  // Initialize presence sensors with specific animal type zones
  const initializePresenceSensors = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;
    
    console.log(`Inicializando sensores específicos para ${animals.length} animais em área ${width}x${height}`);
    
    // Clear existing sensors
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
    
    // Position invasive animal sensors in their preferred zones
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
    
    // Position domestic animal sensors in their preferred zones
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

  // Enhanced animal tracking system with type-specific detection
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
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
        heatMapCtx.globalAlpha = 0.3;
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
      
      // Enhanced sensor rendering with invasive species highlighting
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
            
            // Inner core with confidence indicator
            const coreSize = isInvasive ? 8 + (sensorData.confidence * 6) : 6 + (sensorData.confidence * 4);
            ctx.fillStyle = sensorColor;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
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
            
            // Heat map trace for movement history with invasive emphasis
            if (heatMapEnabled) {
              const heatGradient = heatMapCtx.createRadialGradient(
                sensorData.x, sensorData.y, 2,
                sensorData.x, sensorData.y, radius * (isInvasive ? 1.0 : 0.8)
              );
              
              if (isInvasive) {
                heatGradient.addColorStop(0, 'rgba(234, 56, 76, 0.8)');
                heatGradient.addColorStop(0.6, 'rgba(234, 56, 76, 0.4)');
                heatGradient.addColorStop(1, 'rgba(234, 56, 76, 0.1)');
              } else {
                heatGradient.addColorStop(0, `${sensorColor}BB`);
                heatGradient.addColorStop(0.8, `${sensorColor}33`);
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
  }, [imageUrl, isVideo, videoLoaded, animals, isAnalyzing, heatMapEnabled]);

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
            />
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{zIndex: 10}}
            />
            <canvas 
              ref={heatMapCanvasRef}
              className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!heatMapEnabled ? 'hidden' : ''}`}
              style={{zIndex: 9}}
            />
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
                {heatMapEnabled && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ThermometerSun size={16} className="text-amber-500" />
                    <span>Mapa de calor ativado</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Circle size={16} className="text-green-500" />
                  <span>Sensores de presença rastreando movimento</span>
                </div>
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
                  <div 
                    key={`${animal.name}-${index}`} 
                    className={`flex items-center p-2 rounded-md border ${isInvasive ? 'border-red-500/70' : ''}`}
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
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}
