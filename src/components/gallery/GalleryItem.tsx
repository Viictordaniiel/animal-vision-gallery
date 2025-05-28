import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Dog, Rat, AlertTriangle, Circle, Heart } from 'lucide-react';
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

// Define colors for different animal species
const animalColors = {
  capivara: '#ff6b6b',
  javali: '#b76d2b',
  cachorro: '#4ecdc4',
  default: '#ff5e57'
};

// Get icon for animal species
const getAnimalIcon = (animalName: string) => {
  const name = animalName.toLowerCase();
  if (name.includes('cachorro') || name.includes('cão') || name.includes('dog')) {
    return <Dog size={16} />;
  } else if (name.includes('capivara') || name.includes('javali')) {
    return <Rat size={16} />;
  } else {
    return null;
  }
};

// Get color for animal species
const getAnimalColor = (animalName: string) => {
  const name = animalName.toLowerCase();
  if (name.includes('capivara')) {
    return animalColors.capivara;
  } else if (name.includes('javali')) {
    return animalColors.javali;
  } else if (name.includes('cachorro') || name.includes('cão') || name.includes('dog')) {
    return animalColors.cachorro;
  } else {
    return animalColors.default;
  }
};

// Enhanced motion tracking parameters
const MOTION_THRESHOLD = 8;
const MOVEMENT_INTENSITY_THRESHOLD = 0.15;
const TRACKING_SMOOTHNESS = 0.8;
const PRESENCE_RADIUS = 50;
const INACTIVITY_TIMEOUT = 3000;

// Capivara sensor parameters
const CAPIVARA_DETECTION_ZONES = {
  preferredY: { min: 0.0, max: 1.0 },
  preferredX: { min: 0.0, max: 1.0 },
  sensitivity: 2.0, // Very high sensitivity for capivara
  trackingRadius: 220,
  priorityBoost: 2.5
};

// Cachorro sensor parameters  
const CACHORRO_DETECTION_ZONES = {
  preferredY: { min: 0.1, max: 0.9 },
  preferredX: { min: 0.1, max: 0.9 },
  sensitivity: 1.6, // High sensitivity for cachorro
  trackingRadius: 180,
  priorityBoost: 1.8
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
  
  // Species-specific sensor tracking
  const capivaraSensorsRef = useRef<{[key: string]: {
    x: number, 
    y: number, 
    lastMovement: number, 
    isActive: boolean, 
    pulsePhase: number,
    velocity: {x: number, y: number},
    confidence: number,
    intensity: number,
    detectionCount: number,
    alertLevel: 'low' | 'medium' | 'high' | 'critical'
  }}>({});

  const cachorroSensorsRef = useRef<{[key: string]: {
    x: number, 
    y: number, 
    lastMovement: number, 
    isActive: boolean, 
    pulsePhase: number,
    velocity: {x: number, y: number},
    confidence: number,
    intensity: number,
    detectionCount: number,
    alertLevel: 'low' | 'medium' | 'high' | 'active'
  }}>({});
  
  const { toast } = useToast();
  const capivaraAlertShownRef = useRef<boolean>(false);
  const cachorroAlertShownRef = useRef<boolean>(false);
  
  // Initialize video element
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log(`🎥 Configurando reprodução de vídeo: ${imageUrl}`);
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
            initializeAllSensors();
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

  // Initialize species-specific sensors
  const initializeAllSensors = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;
    
    console.log(`🎯 Inicializando sensores específicos para ${animals.length} animais em área ${width}x${height}`);
    
    // Clear existing sensors
    capivaraSensorsRef.current = {};
    cachorroSensorsRef.current = {};
    
    // Identify capivaras
    const capivaras = animals.filter(animal => 
      animal.name.toLowerCase().includes('capivara')
    );

    // Identify cachorros
    const cachorros = animals.filter(animal => 
      animal.name.toLowerCase().includes('cachorro') ||
      animal.name.toLowerCase().includes('cão') ||
      animal.name.toLowerCase().includes('dog')
    );
    
    console.log(`🔴 Detectadas ${capivaras.length} capivaras:`, capivaras.map(a => a.name));
    console.log(`🔵 Detectados ${cachorros.length} cachorros:`, cachorros.map(a => a.name));
    
    // Create sensors for capivaras
    capivaras.forEach((capivara, index) => {
      let xPos, yPos;
      if (capivaras.length === 1) {
        // Single capivara: center position
        xPos = width * 0.4;
        yPos = height * 0.4;
      } else {
        // Multiple capivaras: distributed positioning
        const angle = (index / capivaras.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.25;
        xPos = width * 0.4 + Math.cos(angle) * radius;
        yPos = height * 0.4 + Math.sin(angle) * radius;
      }
      
      // Ensure within bounds
      xPos = Math.max(PRESENCE_RADIUS, Math.min(width - PRESENCE_RADIUS, xPos));
      yPos = Math.max(PRESENCE_RADIUS, Math.min(height - PRESENCE_RADIUS, yPos));
      
      const sensorKey = `capivara_${index}`;
      capivaraSensorsRef.current[sensorKey] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
        velocity: {x: 0, y: 0},
        confidence: capivara.confidence,
        intensity: 0,
        detectionCount: 0,
        alertLevel: 'medium'
      };
      
      console.log(`🔴 SENSOR CAPIVARA [${index}] posicionado em (${Math.round(xPos)}, ${Math.round(yPos)})`);
    });

    // Create sensors for cachorros
    cachorros.forEach((cachorro, index) => {
      let xPos, yPos;
      if (cachorros.length === 1) {
        // Single cachorro: offset position
        xPos = width * 0.7;
        yPos = height * 0.3;
      } else {
        // Multiple cachorros: distributed positioning
        const angle = (index / cachorros.length) * Math.PI * 2 + Math.PI; // Offset from capivaras
        const radius = Math.min(width, height) * 0.2;
        xPos = width * 0.7 + Math.cos(angle) * radius;
        yPos = height * 0.3 + Math.sin(angle) * radius;
      }
      
      // Ensure within bounds
      xPos = Math.max(PRESENCE_RADIUS, Math.min(width - PRESENCE_RADIUS, xPos));
      yPos = Math.max(PRESENCE_RADIUS, Math.min(height - PRESENCE_RADIUS, yPos));
      
      const sensorKey = `cachorro_${index}`;
      cachorroSensorsRef.current[sensorKey] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(),
        isActive: true,
        pulsePhase: Math.random() * Math.PI * 2,
        velocity: {x: 0, y: 0},
        confidence: cachorro.confidence,
        intensity: 0,
        detectionCount: 0,
        alertLevel: 'low'
      };
      
      console.log(`🔵 SENSOR CACHORRO [${index}] posicionado em (${Math.round(xPos)}, ${Math.round(yPos)})`);
    });
  };
  
  // Show alert for capivaras
  useEffect(() => {
    if (!isAnalyzing && animals.length > 0 && !capivaraAlertShownRef.current) {
      const capivaras = animals.filter(animal => 
        animal.name.toLowerCase().includes('capivara')
      );
      
      if (capivaras.length > 0) {
        capivaras.forEach(capivara => {
          toast({
            title: "🚨 ALERTA: Capivara Detectada!",
            description: `Capivara identificada com ${Math.round(capivara.confidence * 100)}% de confiança. Sensor específico ativado para rastreamento prioritário.`,
            variant: "destructive",
            duration: 8000,
          });
        });
        
        capivaraAlertShownRef.current = true;
      }
    }
  }, [animals, isAnalyzing, toast]);

  // Show alert for cachorros
  useEffect(() => {
    if (!isAnalyzing && animals.length > 0 && !cachorroAlertShownRef.current) {
      const cachorros = animals.filter(animal => 
        animal.name.toLowerCase().includes('cachorro') ||
        animal.name.toLowerCase().includes('cão') ||
        animal.name.toLowerCase().includes('dog')
      );
      
      if (cachorros.length > 0) {
        cachorros.forEach(cachorro => {
          toast({
            title: "💙 Cachorro Detectado",
            description: `Cachorro identificado com ${Math.round(cachorro.confidence * 100)}% de confiança. Sensor específico ativado para monitoramento.`,
            duration: 6000,
          });
        });
        
        cachorroAlertShownRef.current = true;
      }
    }
  }, [animals, isAnalyzing, toast]);

  useEffect(() => {
    if (isAnalyzing) {
      capivaraAlertShownRef.current = false;
      cachorroAlertShownRef.current = false;
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

  // Enhanced tracking system for species-specific animals
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    const capivaras = animals.filter(animal => 
      animal.name.toLowerCase().includes('capivara')
    );

    const cachorros = animals.filter(animal => 
      animal.name.toLowerCase().includes('cachorro') ||
      animal.name.toLowerCase().includes('cão') ||
      animal.name.toLowerCase().includes('dog')
    );
    
    if (capivaras.length === 0 && cachorros.length === 0) return;
    
    console.log("🎯 Iniciando sistema de rastreamento para", capivaras.length, "capivaras e", cachorros.length, "cachorros");
    
    const setupTracking = () => {
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
        
        console.log(`📐 Dimensões do canvas: ${width}x${height}`);
        
        if (Object.keys(capivaraSensorsRef.current).length === 0 && Object.keys(cachorroSensorsRef.current).length === 0) {
          initializeAllSensors();
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
        heatMapCtx.globalAlpha = 0.08;
      }
      
      // Enhanced motion detection for different zones
      const detectMovement = (zone: any, boost: number) => {
        if (!motionCtx || !videoRef.current) return [];
        
        motionCtx.drawImage(videoRef.current, 0, 0, motionCanvas.width, motionCanvas.height);
        const currentFrameData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        if (!previousFrameDataRef.current) {
          previousFrameDataRef.current = currentFrameData;
          return [];
        }
        
        const movementAreas = [];
        const blockSize = 6;
        
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
                intensity: Math.min(1.0, intensity * zone.sensitivity * zone.priorityBoost),
                area: pixelCount
              });
            }
          }
        }
        
        previousFrameDataRef.current = currentFrameData;
        return movementAreas;
      };
      
      // Update capivara sensors
      const updateCapivaraSensors = () => {
        const currentTime = Date.now();
        const movements = detectMovement(CAPIVARA_DETECTION_ZONES, 2.5);
        
        Object.keys(capivaraSensorsRef.current).forEach(sensorKey => {
          const sensor = capivaraSensorsRef.current[sensorKey];
          if (!sensor) return;
          
          sensor.pulsePhase += 0.18; // Faster pulse for capivaras
          
          let bestMovement = null;
          let maxScore = 0;
          
          const detectionRadius = CAPIVARA_DETECTION_ZONES.trackingRadius;
          
          movements.forEach(movement => {
            const distance = Math.sqrt(
              Math.pow(movement.x - sensor.x, 2) + 
              Math.pow(movement.y - sensor.y, 2)
            );
            
            const distanceScore = Math.max(0, 1 - distance / detectionRadius);
            const score = movement.intensity * movement.area * distanceScore * 2.5;
            
            if (score > maxScore && distance < detectionRadius) {
              maxScore = score;
              bestMovement = movement;
            }
          });
          
          if (bestMovement) {
            sensor.isActive = true;
            sensor.lastMovement = currentTime;
            sensor.intensity = bestMovement.intensity;
            sensor.detectionCount++;
            
            if (bestMovement.intensity > 0.8) {
              sensor.alertLevel = 'critical';
            } else if (bestMovement.intensity > 0.6) {
              sensor.alertLevel = 'high';
            } else if (bestMovement.intensity > 0.3) {
              sensor.alertLevel = 'medium';
            } else {
              sensor.alertLevel = 'low';
            }
            
            const deltaX = bestMovement.x - sensor.x;
            const deltaY = bestMovement.y - sensor.y;
            
            sensor.velocity.x = deltaX * TRACKING_SMOOTHNESS;
            sensor.velocity.y = deltaY * TRACKING_SMOOTHNESS;
            
            sensor.x += sensor.velocity.x;
            sensor.y += sensor.velocity.y;
            
            sensor.x = Math.max(PRESENCE_RADIUS, Math.min(canvas.width - PRESENCE_RADIUS, sensor.x));
            sensor.y = Math.max(PRESENCE_RADIUS, Math.min(canvas.height - PRESENCE_RADIUS, sensor.y));
            
            console.log(`🔴 SENSOR CAPIVARA rastreando em (${Math.round(sensor.x)}, ${Math.round(sensor.y)}) - Intensidade: ${(bestMovement.intensity * 100).toFixed(1)}% - Nível: ${sensor.alertLevel.toUpperCase()}`);
          } else {
            sensor.velocity.x *= 0.9;
            sensor.velocity.y *= 0.9;
            sensor.intensity *= 0.95;
            
            const timeSinceLastMovement = currentTime - sensor.lastMovement;
            if (timeSinceLastMovement > INACTIVITY_TIMEOUT) {
              sensor.isActive = false;
              sensor.alertLevel = 'low';
            }
          }
        });
      };

      // Update cachorro sensors
      const updateCachorroSensors = () => {
        const currentTime = Date.now();
        const movements = detectMovement(CACHORRO_DETECTION_ZONES, 1.8);
        
        Object.keys(cachorroSensorsRef.current).forEach(sensorKey => {
          const sensor = cachorroSensorsRef.current[sensorKey];
          if (!sensor) return;
          
          sensor.pulsePhase += 0.12; // Slower pulse for cachorros
          
          let bestMovement = null;
          let maxScore = 0;
          
          const detectionRadius = CACHORRO_DETECTION_ZONES.trackingRadius;
          
          movements.forEach(movement => {
            const distance = Math.sqrt(
              Math.pow(movement.x - sensor.x, 2) + 
              Math.pow(movement.y - sensor.y, 2)
            );
            
            const distanceScore = Math.max(0, 1 - distance / detectionRadius);
            const score = movement.intensity * movement.area * distanceScore * 1.8;
            
            if (score > maxScore && distance < detectionRadius) {
              maxScore = score;
              bestMovement = movement;
            }
          });
          
          if (bestMovement) {
            sensor.isActive = true;
            sensor.lastMovement = currentTime;
            sensor.intensity = bestMovement.intensity;
            sensor.detectionCount++;
            
            if (bestMovement.intensity > 0.7) {
              sensor.alertLevel = 'active';
            } else if (bestMovement.intensity > 0.4) {
              sensor.alertLevel = 'high';
            } else if (bestMovement.intensity > 0.2) {
              sensor.alertLevel = 'medium';
            } else {
              sensor.alertLevel = 'low';
            }
            
            const deltaX = bestMovement.x - sensor.x;
            const deltaY = bestMovement.y - sensor.y;
            
            sensor.velocity.x = deltaX * TRACKING_SMOOTHNESS * 0.8;
            sensor.velocity.y = deltaY * TRACKING_SMOOTHNESS * 0.8;
            
            sensor.x += sensor.velocity.x;
            sensor.y += sensor.velocity.y;
            
            sensor.x = Math.max(PRESENCE_RADIUS, Math.min(canvas.width - PRESENCE_RADIUS, sensor.x));
            sensor.y = Math.max(PRESENCE_RADIUS, Math.min(canvas.height - PRESENCE_RADIUS, sensor.y));
            
            console.log(`🔵 SENSOR CACHORRO rastreando em (${Math.round(sensor.x)}, ${Math.round(sensor.y)}) - Intensidade: ${(bestMovement.intensity * 100).toFixed(1)}% - Nível: ${sensor.alertLevel.toUpperCase()}`);
          } else {
            sensor.velocity.x *= 0.9;
            sensor.velocity.y *= 0.9;
            sensor.intensity *= 0.95;
            
            const timeSinceLastMovement = currentTime - sensor.lastMovement;
            if (timeSinceLastMovement > INACTIVITY_TIMEOUT) {
              sensor.isActive = false;
              sensor.alertLevel = 'low';
            }
          }
        });
      };
      
      // Enhanced sensor rendering for both species
      const drawAllSensors = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw capivara sensors
        Object.keys(capivaraSensorsRef.current).forEach(sensorKey => {
          const sensor = capivaraSensorsRef.current[sensorKey];
          if (!sensor) return;
          
          const alertColors = {
            low: '#ff6b6b80',
            medium: '#ff6b6b',
            high: '#ff1744',
            critical: '#d50000'
          };
          
          const sensorColor = alertColors[sensor.alertLevel];
          const baseRadius = PRESENCE_RADIUS + (sensor.alertLevel === 'critical' ? 25 : sensor.alertLevel === 'high' ? 20 : 15);
          
          if (sensor.isActive) {
            const pulseIntensity = sensor.alertLevel === 'critical' ? 0.6 : 
                                  sensor.alertLevel === 'high' ? 0.5 : 
                                  sensor.alertLevel === 'medium' ? 0.4 : 0.3;
            const pulseScale = 1 + Math.sin(sensor.pulsePhase) * pulseIntensity;
            const currentRadius = baseRadius * pulseScale;
            
            const gradient = ctx.createRadialGradient(
              sensor.x, sensor.y, 0,
              sensor.x, sensor.y, currentRadius
            );
            
            gradient.addColorStop(0, sensorColor + 'FF');
            gradient.addColorStop(0.2, sensorColor + 'CC');
            gradient.addColorStop(0.4, sensorColor + '88');
            gradient.addColorStop(0.7, sensorColor + '44');
            gradient.addColorStop(1, sensorColor + '11');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sensor.x, sensor.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            if (sensor.alertLevel === 'critical' || sensor.alertLevel === 'high') {
              ctx.strokeStyle = '#ff1744';
              ctx.lineWidth = 4;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.arc(sensor.x, sensor.y, currentRadius * 1.2, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            
            const coreSize = 12 + (sensor.intensity * 10);
            ctx.fillStyle = sensorColor;
            ctx.beginPath();
            ctx.arc(sensor.x, sensor.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textWidth = 150;
            const textHeight = 35;
            const textX = sensor.x - textWidth / 2;
            const textY = sensor.y + baseRadius + 40 - textHeight / 2;
            
            ctx.fillStyle = sensorColor + 'EE';
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            ctx.fillStyle = 'white';
            const alertText = sensor.alertLevel === 'critical' ? '🚨 CAPIVARA CRÍTICO!' :
                             sensor.alertLevel === 'high' ? '⚠️ CAPIVARA ALTO!' :
                             sensor.alertLevel === 'medium' ? '🔴 CAPIVARA DETECTADA' :
                             '👁️ SENSOR CAPIVARA';
            ctx.fillText(alertText, sensor.x, sensor.y + baseRadius + 30);
            ctx.font = '9px Arial';
            ctx.fillText(`Confiança: ${Math.round(sensor.confidence * 100)}% - Det: ${sensor.detectionCount}`, sensor.x, sensor.y + baseRadius + 45);
            
            if (heatMapEnabled) {
              const heatGradient = heatMapCtx.createRadialGradient(
                sensor.x, sensor.y, 5,
                sensor.x, sensor.y, baseRadius * 1.1
              );
              
              heatGradient.addColorStop(0, 'rgba(255, 107, 107, 0.18)');
              heatGradient.addColorStop(0.6, 'rgba(255, 107, 107, 0.10)');
              heatGradient.addColorStop(1, 'rgba(255, 107, 107, 0.03)');
              
              heatMapCtx.fillStyle = heatGradient;
              heatMapCtx.beginPath();
              heatMapCtx.arc(sensor.x, sensor.y, baseRadius * 1.1, 0, Math.PI * 2);
              heatMapCtx.fill();
            }
          }
        });

        // Draw cachorro sensors
        Object.keys(cachorroSensorsRef.current).forEach(sensorKey => {
          const sensor = cachorroSensorsRef.current[sensorKey];
          if (!sensor) return;
          
          const domesticColors = {
            low: '#4ecdc480',
            medium: '#4ecdc4',
            high: '#2eb8b8',
            active: '#26a0a0'
          };
          
          const sensorColor = domesticColors[sensor.alertLevel];
          const baseRadius = PRESENCE_RADIUS * 0.85;
          
          if (sensor.isActive) {
            const pulseIntensity = sensor.alertLevel === 'active' ? 0.35 : 
                                  sensor.alertLevel === 'high' ? 0.3 : 
                                  sensor.alertLevel === 'medium' ? 0.25 : 0.2;
            const pulseScale = 1 + Math.sin(sensor.pulsePhase) * pulseIntensity;
            const currentRadius = baseRadius * pulseScale;
            
            const gradient = ctx.createRadialGradient(
              sensor.x, sensor.y, 0,
              sensor.x, sensor.y, currentRadius
            );
            
            gradient.addColorStop(0, sensorColor + 'FF');
            gradient.addColorStop(0.3, sensorColor + 'AA');
            gradient.addColorStop(0.6, sensorColor + '66');
            gradient.addColorStop(1, sensorColor + '22');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sensor.x, sensor.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            const coreSize = 10 + (sensor.intensity * 8);
            ctx.fillStyle = sensorColor;
            ctx.beginPath();
            ctx.arc(sensor.x, sensor.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textWidth = 130;
            const textHeight = 30;
            const textX = sensor.x - textWidth / 2;
            const textY = sensor.y + baseRadius + 35 - textHeight / 2;
            
            ctx.fillStyle = sensorColor + 'DD';
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            ctx.fillStyle = 'white';
            const alertText = sensor.alertLevel === 'active' ? '💙 CACHORRO ATIVO' :
                             sensor.alertLevel === 'high' ? '🔵 CACHORRO DETECTADO' :
                             sensor.alertLevel === 'medium' ? '🟦 CACHORRO' :
                             '👁️ SENSOR CACHORRO';
            ctx.fillText(alertText, sensor.x, sensor.y + baseRadius + 25);
            ctx.font = '8px Arial';
            ctx.fillText(`Confiança: ${Math.round(sensor.confidence * 100)}% - Det: ${sensor.detectionCount}`, sensor.x, sensor.y + baseRadius + 37);
            
            if (heatMapEnabled) {
              const heatGradient = heatMapCtx.createRadialGradient(
                sensor.x, sensor.y, 3,
                sensor.x, sensor.y, baseRadius * 1.1
              );
              
              heatGradient.addColorStop(0, 'rgba(78, 205, 196, 0.15)');
              heatGradient.addColorStop(0.6, 'rgba(78, 205, 196, 0.08)');
              heatGradient.addColorStop(1, 'rgba(78, 205, 196, 0.02)');
              
              heatMapCtx.fillStyle = heatGradient;
              heatMapCtx.beginPath();
              heatMapCtx.arc(sensor.x, sensor.y, baseRadius * 1.1, 0, Math.PI * 2);
              heatMapCtx.fill();
            }
          }
        });
      };
      
      // Main animation loop
      const animate = () => {
        updateCapivaraSensors();
        updateCachorroSensors();
        drawAllSensors();
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    setupTracking();
    
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
                
                {!isAnalyzing && animals.some(animal => 
                  animal.name.toLowerCase().includes('capivara')
                ) && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <Circle size={16} className="text-red-500" />
                    <span>Sensor capivara rastreando movimento</span>
                  </div>
                )}

                {!isAnalyzing && animals.some(animal => 
                  animal.name.toLowerCase().includes('cachorro') ||
                  animal.name.toLowerCase().includes('cão') ||
                  animal.name.toLowerCase().includes('dog')
                ) && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Heart size={16} className="text-blue-500" />
                    <span>Sensor cachorro rastreando movimento</span>
                  </div>
                )}
              </div>
            )}
            
            {!isAnalyzing && animals.some(animal => 
              animal.name.toLowerCase().includes('capivara')
            ) && (
              <div className="flex items-center gap-1 text-sm text-red-500 font-medium mt-1">
                <AlertTriangle size={16} className="text-red-500" />
                <span>Sensor capivara ativado!</span>
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
                const isCapivara = animal.name.toLowerCase().includes('capivara');
                const isCachorro = animal.name.toLowerCase().includes('cachorro') ||
                                  animal.name.toLowerCase().includes('cão') ||
                                  animal.name.toLowerCase().includes('dog');
                return (
                  <div 
                    key={`${animal.name}-${index}`} 
                    className={`flex items-center p-2 rounded-md border ${
                      isCapivara ? 'border-red-500/70 bg-red-50/30' : 
                      isCachorro ? 'border-blue-500/70 bg-blue-50/30' : ''
                    }`}
                    style={{ borderColor: isCapivara ? '#ff6b6b80' : isCachorro ? '#4ecdc480' : getAnimalColor(animal.name) + '80' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
                      style={{ backgroundColor: isCapivara ? '#ff6b6b33' : isCachorro ? '#4ecdc433' : getAnimalColor(animal.name) + '33' }}
                    >
                      {isCapivara ? (
                        <AlertTriangle size={16} className="text-red-500" />
                      ) : isCachorro ? (
                        <Heart size={16} className="text-blue-500" />
                      ) : (
                        getAnimalIcon(animal.name) || <ThermometerSun size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{animal.name}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Confiança: {Math.round(animal.confidence * 100)}%</p>
                        {animal.category ? (
                          <p className={`font-medium ${isCapivara ? 'text-red-600' : isCachorro ? 'text-blue-600' : ''}`}>
                            {animal.category}
                          </p>
                        ) : (
                          <p className={`font-medium ${isCapivara ? 'text-red-600' : isCachorro ? 'text-blue-600' : ''}`}>
                            {isCapivara ? 'Espécie invasora - SENSOR ATIVO' : 
                             isCachorro ? 'Animal doméstico - SENSOR ATIVO' :
                             classifyAnimalType(animal.name)}
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
