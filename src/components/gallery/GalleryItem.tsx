
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Dog, Rat, AlertTriangle, Square } from 'lucide-react';
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

// Enhanced motion tracking parameters focused on actual movement
const MOTION_THRESHOLD = 20; // Reduced for better sensitivity
const MOVEMENT_INTENSITY_THRESHOLD = 0.25; // Reduced for better detection
const TRACKING_SMOOTHNESS = 0.7; // Slightly reduced for more responsive tracking

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
  const [showOverlay, setShowOverlay] = useState(true); // Always show overlay initially
  // Store active moving animals with their positions
  const activeMovingAnimalsRef = useRef<{[key: string]: {x: number, y: number, lastMovement: number, isMoving: boolean}}>({});
  const { toast } = useToast();
  const invasiveAlertShownRef = useRef<boolean>(false);
  
  // Initialize video element
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log(`Setting up video playback with src: ${imageUrl}`);
      videoRef.current.src = imageUrl;
      
      // Reset video load state
      setVideoLoaded(false);
      
      const handleLoadedData = () => {
        setVideoLoaded(true);
        if (videoRef.current) {
          videoRef.current.play().catch(error => {
            console.error("Error playing video:", error);
          });
          setIsPlaying(true);
          
          // Initialize animal tracking - ensure we start tracking immediately
          if (animals.length > 0) {
            initializeAnimalTracking();
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

  // Initialize animal tracking positions - new function to ensure tracking starts properly
  const initializeAnimalTracking = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const width = videoRef.current.videoWidth || videoRef.current.clientWidth;
    const height = videoRef.current.videoHeight || videoRef.current.clientHeight;
    
    // Position animals across the video
    animals.forEach((animal, index) => {
      // Distribute animals across the video frame initially
      const xPos = width * (0.3 + (index % 3) * 0.2);
      const yPos = height * (0.3 + Math.floor(index / 3) * 0.2);
      
      activeMovingAnimalsRef.current[animal.name] = {
        x: xPos,
        y: yPos,
        lastMovement: Date.now(), // Consider them moving at start
        isMoving: true // Start as moving for visibility
      };
    });
    
    console.log("Animal tracking initialized with positions:", activeMovingAnimalsRef.current);
  };
  
  // Show alert for invasive species (capivaras e javalis)
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

  // Reset invasive alert flag when new analysis starts
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
        console.error("Error playing video:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  // Enhanced motion-focused tracking system
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    console.log("Setting up motion tracking for", animals.length, "animals");
    
    const setupMotionTracking = () => {
      if (!videoRef.current || !canvasRef.current || !heatMapCanvasRef.current) {
        console.error("Missing video or canvas reference");
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const heatMapCanvas = heatMapCanvasRef.current;
      
      // Initialize canvas dimensions
      const setCanvasSize = () => {
        const width = video.videoWidth || video.clientWidth;
        const height = video.videoHeight || video.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        heatMapCanvas.width = width;
        heatMapCanvas.height = height;
        
        console.log(`Canvas dimensions set to: ${width}x${height}`);
        
        // Initialize animal tracking data if not already set
        if (Object.keys(activeMovingAnimalsRef.current).length === 0) {
          initializeAnimalTracking();
        }
      };
      
      setCanvasSize();
      
      // Clear previous animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Motion detection canvas
      const motionCanvas = document.createElement('canvas');
      const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
      motionCanvas.width = canvas.width;
      motionCanvas.height = canvas.height;
      
      const ctx = canvas.getContext('2d');
      const heatMapCtx = heatMapCanvas.getContext('2d');
      
      if (!ctx || !heatMapCtx || !motionCtx) {
        console.error("Failed to get canvas contexts");
        return;
      }
      
      // Clear heat map initially
      heatMapCtx.clearRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
      if (heatMapEnabled) {
        heatMapCtx.globalAlpha = 0.15;
      }
      
      // Detect motion between frames
      const detectRealMotion = () => {
        if (!motionCtx || !videoRef.current) return [];
        
        motionCtx.drawImage(videoRef.current, 0, 0, motionCanvas.width, motionCanvas.height);
        const currentFrameData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        if (!previousFrameDataRef.current) {
          previousFrameDataRef.current = currentFrameData;
          return [];
        }
        
        const motionAreas = [];
        const blockSize = 20;
        
        // Analyze frame differences to detect movement
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
            
            // Calculate movement intensity
            const intensity = pixelCount > 0 ? totalDifference / (blockSize * blockSize) / 255 : 0;
            
            // Only register significant motion
            if (intensity > MOVEMENT_INTENSITY_THRESHOLD) {
              motionAreas.push({
                x: x + blockSize / 2,
                y: y + blockSize / 2,
                intensity: Math.min(1.0, intensity)
              });
            }
          }
        }
        
        previousFrameDataRef.current = currentFrameData;
        return motionAreas;
      };
      
      // Update animal positions based on detected motion
      const updateAnimalMovement = (motionAreas: Array<{x: number, y: number, intensity: number}>) => {
        const currentTime = Date.now();
        
        // Force at least one animal to be "moving" initially so rectangles show
        let anyMoving = false;
        
        animals.forEach(animal => {
          const animalData = activeMovingAnimalsRef.current[animal.name];
          if (!animalData) return;
          
          // Find closest motion area to current animal position
          let closestMotion = null;
          let minDistance = Infinity;
          
          // Always check for any motion, even if far away initially
          motionAreas.forEach(motion => {
            const distance = Math.sqrt(
              Math.pow(motion.x - animalData.x, 2) + 
              Math.pow(motion.y - animalData.y, 2)
            );
            
            if (distance < minDistance && distance < 200) { // Increased tracking distance
              minDistance = distance;
              closestMotion = motion;
            }
          });
          
          if (closestMotion) {
            // Animal is moving - update position
            animalData.isMoving = true;
            animalData.lastMovement = currentTime;
            anyMoving = true;
            
            // Smooth movement towards detected motion
            animalData.x += (closestMotion.x - animalData.x) * TRACKING_SMOOTHNESS;
            animalData.y += (closestMotion.y - animalData.y) * TRACKING_SMOOTHNESS;
            
            // Keep within bounds
            animalData.x = Math.max(50, Math.min(canvas.width - 50, animalData.x));
            animalData.y = Math.max(30, Math.min(canvas.height - 30, animalData.y));
            
          } else {
            // No motion detected - check if animal should still be considered moving
            const timeSinceLastMovement = currentTime - animalData.lastMovement;
            if (timeSinceLastMovement > 1500) { // 1.5 seconds without movement
              animalData.isMoving = false;
            }
          }
        });
        
        // Force at least one animal to be "moving" during the first 5 seconds
        if (!anyMoving && Date.now() - video.currentTime * 1000 < 5000) {
          const firstAnimal = Object.keys(activeMovingAnimalsRef.current)[0];
          if (firstAnimal) {
            activeMovingAnimalsRef.current[firstAnimal].isMoving = true;
          }
        }
      };
      
      // Draw both moving and static animals (with different styles)
      const drawAnimals = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame first
        // ctx.drawImage(video, 0, 0, canvas.width, canvas.height); 
        // Removed - we want the canvas to be transparent overlay
        
        // Draw all tracked animals
        animals.forEach(animal => {
          const animalData = activeMovingAnimalsRef.current[animal.name];
          if (!animalData) return; 
          
          const isInvasive = animal.name.toLowerCase().includes('capivara') || 
                            animal.name.toLowerCase().includes('javali') || 
                            animal.category?.toLowerCase().includes('invasora');
          
          const rectColor = getAnimalColor(animal.name);
          const rectWidth = isInvasive ? 90 : 70;
          const rectHeight = isInvasive ? 70 : 50;
          
          const rectX = animalData.x - rectWidth / 2;
          const rectY = animalData.y - rectHeight / 2;
          
          if (animalData.isMoving) {
            // Draw filled rectangle with higher opacity for moving animals
            ctx.fillStyle = `${rectColor}60`;
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            
            // Draw bright border for moving animals
            ctx.strokeStyle = rectColor;
            ctx.lineWidth = isInvasive ? 4 : 3;
            ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
            
            // Add "MOVIMENTO" indicator
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Background for text
            const textWidth = 80;
            const textHeight = 14;
            const textX = animalData.x - textWidth / 2;
            const textY = animalData.y - textHeight / 2;
            
            ctx.fillStyle = `${rectColor}DD`;
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            // Movement text
            ctx.fillStyle = 'white';
            ctx.fillText('EM MOVIMENTO', animalData.x, animalData.y - 5);
            ctx.font = '9px Arial';
            ctx.fillText(`${animal.name}`, animalData.x, animalData.y + 8);
            
            // Add heat map trace if enabled
            if (heatMapEnabled) {
              const gradient = heatMapCtx.createRadialGradient(
                animalData.x, animalData.y, 1,
                animalData.x, animalData.y, 30
              );
              
              if (isInvasive) {
                gradient.addColorStop(0, 'rgba(234, 56, 76, 0.8)');
                gradient.addColorStop(0.7, 'rgba(234, 56, 76, 0.4)');
              } else {
                gradient.addColorStop(0, `${rectColor}CC`);
                gradient.addColorStop(0.7, `${rectColor}44`);
              }
              gradient.addColorStop(1, 'transparent');
              
              heatMapCtx.fillStyle = gradient;
              heatMapCtx.beginPath();
              heatMapCtx.arc(animalData.x, animalData.y, 30, 0, Math.PI * 2);
              heatMapCtx.fill();
            }
            
            // Corner indicators for active tracking
            const cornerSize = 6;
            ctx.fillStyle = '#00ff00'; // Green corners for moving animals
            
            // Top corners
            ctx.fillRect(rectX, rectY, cornerSize, 2);
            ctx.fillRect(rectX, rectY, 2, cornerSize);
            ctx.fillRect(rectX + rectWidth - cornerSize, rectY, cornerSize, 2);
            ctx.fillRect(rectX + rectWidth - 2, rectY, 2, cornerSize);
            
            // Bottom corners
            ctx.fillRect(rectX, rectY + rectHeight - 2, cornerSize, 2);
            ctx.fillRect(rectX, rectY + rectHeight - cornerSize, 2, cornerSize);
            ctx.fillRect(rectX + rectWidth - cornerSize, rectY + rectHeight - 2, cornerSize, 2);
            ctx.fillRect(rectX + rectWidth - 2, rectY + rectHeight - cornerSize, 2, cornerSize);
          } else {
            // Draw lighter/transparent rectangle for non-moving animals
            ctx.strokeStyle = `${rectColor}80`;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
            
            // Add static label
            ctx.fillStyle = `${rectColor}80`;
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(animal.name, animalData.x, animalData.y);
          }
        });
      };
      
      // Animation loop focused on motion detection
      const animate = () => {
        const motionAreas = detectRealMotion();
        updateAnimalMovement(motionAreas);
        drawAnimals();
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    setupMotionTracking();
    
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
              style={{zIndex: 10}} // Ensure canvas is on top
            />
            <canvas 
              ref={heatMapCanvasRef}
              className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!heatMapEnabled ? 'hidden' : ''}`}
              style={{zIndex: 9}} // Below tracking canvas but above video
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
                  <Square size={16} className="text-green-500" />
                  <span>Sensor focado em movimento</span>
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
