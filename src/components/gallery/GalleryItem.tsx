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
    return animalColors.default;
  }
};

// Enhanced motion tracking parameters for better animal tracking
const MOTION_THRESHOLD = 8; // Lower threshold for better sensitivity
const MOVEMENT_INTENSITY_THRESHOLD = 0.15; // More sensitive detection
const TRACKING_SMOOTHNESS = 0.6; // Balanced movement tracking
const PRESENCE_RADIUS = 40; // Larger radius for better visibility
const INACTIVITY_TIMEOUT = 3000; // Time before sensor becomes inactive

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
  // Enhanced presence sensors tracking
  const activePresenceSensorsRef = useRef<{[key: string]: {
    x: number, 
    y: number, 
    lastMovement: number, 
    isActive: boolean, 
    pulsePhase: number,
    velocity: {x: number, y: number},
    confidence: number
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

  // Initialize presence sensors with improved positioning
  const initializePresenceSensors = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;
    
    console.log(`Inicializando sensores para ${animals.length} animais em área ${width}x${height}`);
    
    // Position sensors strategically across the video area
    animals.forEach((animal, index) => {
      // Distribute sensors more naturally across the frame
      const cols = Math.ceil(Math.sqrt(animals.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const xPos = width * (0.15 + (col * 0.7) / Math.max(1, cols - 1));
      const yPos = height * (0.2 + (row * 0.6) / Math.max(1, Math.ceil(animals.length / cols) - 1));
      
      activePresenceSensorsRef.current[animal.name] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2, // Random initial phase
        velocity: {x: 0, y: 0},
        confidence: animal.confidence
      };
    });
    
    console.log("Sensores de presença inicializados:", activePresenceSensorsRef.current);
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
            description: `${species.name} foi identificada com ${Math.round(species.confidence * 100)}% de confiança.`,
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

  // Enhanced animal tracking system
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    console.log("Iniciando sistema de rastreamento aprimorado para", animals.length, "animais");
    
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
        heatMapCtx.globalAlpha = 0.2;
      }
      
      // Enhanced motion detection for animal tracking
      const detectAnimalMovement = () => {
        if (!motionCtx || !videoRef.current) return [];
        
        motionCtx.drawImage(videoRef.current, 0, 0, motionCanvas.width, motionCanvas.height);
        const currentFrameData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        if (!previousFrameDataRef.current) {
          previousFrameDataRef.current = currentFrameData;
          return [];
        }
        
        const movementAreas = [];
        const blockSize = 12; // Smaller blocks for better precision
        
        for (let y = 0; y < motionCanvas.height; y += blockSize) {
          for (let x = 0; x < motionCanvas.width; x += blockSize) {
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
            
            if (intensity > MOVEMENT_INTENSITY_THRESHOLD) {
              movementAreas.push({
                x: x + blockSize / 2,
                y: y + blockSize / 2,
                intensity: Math.min(1.0, intensity * 2), // Amplify intensity for better tracking
                area: pixelCount
              });
            }
          }
        }
        
        previousFrameDataRef.current = currentFrameData;
        return movementAreas;
      };
      
      // Update sensor positions based on animal movement
      const updateAnimalSensors = (movementAreas: Array<{x: number, y: number, intensity: number, area: number}>) => {
        const currentTime = Date.now();
        
        animals.forEach(animal => {
          const sensorData = activePresenceSensorsRef.current[animal.name];
          if (!sensorData) return;
          
          // Update pulse phase for smooth animation
          sensorData.pulsePhase += 0.08;
          
          // Find the most significant movement near this sensor
          let bestMovement = null;
          let maxScore = 0;
          
          movementAreas.forEach(movement => {
            const distance = Math.sqrt(
              Math.pow(movement.x - sensorData.x, 2) + 
              Math.pow(movement.y - sensorData.y, 2)
            );
            
            // Score based on distance, intensity, and area
            const distanceScore = Math.max(0, 1 - distance / 200);
            const score = movement.intensity * movement.area * distanceScore;
            
            if (score > maxScore && distance < 180) {
              maxScore = score;
              bestMovement = movement;
            }
          });
          
          if (bestMovement) {
            sensorData.isActive = true;
            sensorData.lastMovement = currentTime;
            
            // Calculate velocity for smoother tracking
            const deltaX = bestMovement.x - sensorData.x;
            const deltaY = bestMovement.y - sensorData.y;
            
            sensorData.velocity.x = deltaX * TRACKING_SMOOTHNESS;
            sensorData.velocity.y = deltaY * TRACKING_SMOOTHNESS;
            
            // Update position with velocity
            sensorData.x += sensorData.velocity.x;
            sensorData.y += sensorData.velocity.y;
            
            // Keep sensors within bounds
            sensorData.x = Math.max(PRESENCE_RADIUS, Math.min(canvas.width - PRESENCE_RADIUS, sensorData.x));
            sensorData.y = Math.max(PRESENCE_RADIUS, Math.min(canvas.height - PRESENCE_RADIUS, sensorData.y));
            
            console.log(`Sensor ${animal.name} rastreando movimento em (${Math.round(sensorData.x)}, ${Math.round(sensorData.y)})`);
          } else {
            // Gradual velocity decay when no movement detected
            sensorData.velocity.x *= 0.95;
            sensorData.velocity.y *= 0.95;
            
            // Check for inactivity
            const timeSinceLastMovement = currentTime - sensorData.lastMovement;
            if (timeSinceLastMovement > INACTIVITY_TIMEOUT) {
              sensorData.isActive = false;
            }
          }
        });
      };
      
      // Enhanced sensor rendering
      const drawAnimalSensors = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        animals.forEach(animal => {
          const sensorData = activePresenceSensorsRef.current[animal.name];
          if (!sensorData) return; 
          
          const isInvasive = animal.name.toLowerCase().includes('capivara') || 
                            animal.name.toLowerCase().includes('javali') || 
                            animal.category?.toLowerCase().includes('invasora');
          
          const sensorColor = getAnimalColor(animal.name);
          const radius = isInvasive ? PRESENCE_RADIUS + 8 : PRESENCE_RADIUS;
          
          if (sensorData.isActive) {
            // Enhanced pulsing animation
            const pulseScale = 1 + Math.sin(sensorData.pulsePhase) * 0.25;
            const currentRadius = radius * pulseScale;
            
            // Multi-layer sensor visualization
            const gradient = ctx.createRadialGradient(
              sensorData.x, sensorData.y, 0,
              sensorData.x, sensorData.y, currentRadius
            );
            
            if (isInvasive) {
              gradient.addColorStop(0, 'rgba(234, 56, 76, 0.9)');
              gradient.addColorStop(0.3, 'rgba(234, 56, 76, 0.6)');
              gradient.addColorStop(0.7, 'rgba(234, 56, 76, 0.3)');
              gradient.addColorStop(1, 'rgba(234, 56, 76, 0.1)');
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
            const coreSize = 6 + (sensorData.confidence * 4);
            ctx.fillStyle = isInvasive ? '#ea384c' : sensorColor;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Active tracking ring
            ctx.strokeStyle = isInvasive ? '#ea384c' : sensorColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, currentRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Enhanced status display
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Background for text
            const textWidth = 100;
            const textHeight = 20;
            const textX = sensorData.x - textWidth / 2;
            const textY = sensorData.y + radius + 20 - textHeight / 2;
            
            ctx.fillStyle = `${sensorColor}EE`;
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            // Status text
            ctx.fillStyle = 'white';
            ctx.fillText('🎯 RASTREANDO', sensorData.x, sensorData.y + radius + 18);
            ctx.font = '8px Arial';
            ctx.fillText(`${animal.name} - ${Math.round(sensorData.confidence * 100)}%`, sensorData.x, sensorData.y + radius + 30);
            
            // Heat map trace for movement history
            if (heatMapEnabled) {
              const heatGradient = heatMapCtx.createRadialGradient(
                sensorData.x, sensorData.y, 2,
                sensorData.x, sensorData.y, radius * 0.8
              );
              
              if (isInvasive) {
                heatGradient.addColorStop(0, 'rgba(234, 56, 76, 0.7)');
                heatGradient.addColorStop(0.8, 'rgba(234, 56, 76, 0.2)');
              } else {
                heatGradient.addColorStop(0, `${sensorColor}BB`);
                heatGradient.addColorStop(0.8, `${sensorColor}22`);
              }
              heatGradient.addColorStop(1, 'transparent');
              
              heatMapCtx.fillStyle = heatGradient;
              heatMapCtx.beginPath();
              heatMapCtx.arc(sensorData.x, sensorData.y, radius * 0.8, 0, Math.PI * 2);
              heatMapCtx.fill();
            }
          } else {
            // Inactive sensor - standby mode
            ctx.strokeStyle = `${sensorColor}50`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Inactive core
            ctx.fillStyle = `${sensorColor}30`;
            ctx.beginPath();
            ctx.arc(sensorData.x, sensorData.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Standby label
            ctx.fillStyle = `${sensorColor}70`;
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⏸️ AGUARDANDO', sensorData.x, sensorData.y + radius + 12);
          }
        });
      };
      
      // Main animation loop
      const animate = () => {
        const movementAreas = detectAnimalMovement();
        updateAnimalSensors(movementAreas);
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
