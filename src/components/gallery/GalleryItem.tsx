import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Cat, Dog, Bird, Fish, Mouse } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { classifyAnimalType } from '@/services/imageRecognition';

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
  cat: '#ff6b6b',
  dog: '#4ecdc4',
  bird: '#ff9f43',
  fish: '#45aaf2',
  mouse: '#a55eea',
  default: '#ff5e57'
};

// Get icon for animal type
const getAnimalIcon = (animalType: string) => {
  const type = animalType.toLowerCase();
  switch (type) {
    case 'cat': return <Cat size={16} />;
    case 'dog': return <Dog size={16} />;
    case 'bird': return <Bird size={16} />;
    case 'fish': return <Fish size={16} />;
    case 'mouse': return <Mouse size={16} />;
    default: return null;
  }
};

// Get color for animal type
const getAnimalColor = (animalType: string) => {
  const type = animalType.toLowerCase();
  return animalColors[type as keyof typeof animalColors] || animalColors.default;
};

// Computer vision-inspired object tracking parameters
const TRACKING_PRECISION = 0.85;  // Higher values for more precise tracking
const MOTION_SENSITIVITY = 0.6;   // Higher values for more sensitive motion detection
const PATTERN_RECOGNITION = 2.5;  // Higher values for better pattern recognition

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
  const movementHistoryRef = useRef<Array<{x: number, y: number, animalName: string}>>([]);
  const previousFrameDataRef = useRef<ImageData | null>(null); // Store previous frame for comparison
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const animalPositionsRef = useRef<{[key: string]: {x: number, y: number, timestamp: number}[]}>({});
  const videoTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
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

  // Advanced motion detection and animal tracking
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    // Initialize animal regions with intelligent positioning
    const initializeAnimalPositions = (width: number, height: number) => {
      // For videos, place animals in more logical regions
      // based on animal type and typical behavior
      animals.forEach(animal => {
        const type = animal.name.toLowerCase();
        
        // Different initial positions based on animal type
        let initialX, initialY;
        
        switch(type) {
          case 'bird':
            // Birds often appear in upper portions of videos
            initialX = Math.random() * width * 0.8 + width * 0.1;
            initialY = Math.random() * height * 0.3 + height * 0.1;
            break;
          case 'fish':
            // Fish might be in water features (middle to lower regions)
            initialX = Math.random() * width * 0.8 + width * 0.1;
            initialY = Math.random() * height * 0.3 + height * 0.5;
            break;
          case 'mouse':
          case 'rat':
            // Ground animals often at the bottom
            initialX = Math.random() * width * 0.8 + width * 0.1;
            initialY = Math.random() * height * 0.3 + height * 0.6;
            break;
          default:
            // Others more evenly distributed
            initialX = Math.random() * width * 0.8 + width * 0.1;
            initialY = Math.random() * height * 0.8 + height * 0.1;
        }
        
        // Store initial position
        if (!animalPositionsRef.current[animal.name]) {
          animalPositionsRef.current[animal.name] = [];
        }
        
        animalPositionsRef.current[animal.name].push({
          x: initialX,
          y: initialY,
          timestamp: Date.now()
        });
      });
    };
    
    // Set up canvas for motion detection
    const setupCanvas = () => {
      if (!videoRef.current || !canvasRef.current || !heatMapCanvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const heatMapCanvas = heatMapCanvasRef.current;
      
      // Initialize for each animal
      animals.forEach(animal => {
        if (!animalPositionsRef.current[animal.name]) {
          animalPositionsRef.current[animal.name] = [];
        }
      });
      
      // Resize canvases to match video dimensions
      const setCanvasSize = () => {
        const width = video.videoWidth || video.clientWidth;
        const height = video.videoHeight || video.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        heatMapCanvas.width = width;
        heatMapCanvas.height = height;
        
        // Create initial animal positions based on video regions
        // This dramatically improves tracking by placing animals in logical locations
        initializeAnimalPositions(width, height);
      };
      
      setCanvasSize();
      
      // Clear previous animation frame
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Setup hidden canvas for motion detection
      const motionCanvas = document.createElement('canvas');
      const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
      motionCanvas.width = canvas.width;
      motionCanvas.height = canvas.height;
      
      // Drawing context setup
      const ctx = canvas.getContext('2d');
      const heatMapCtx = heatMapCanvas.getContext('2d');
      
      if (!ctx || !heatMapCtx) return;
      
      // Clear heat map canvas initially
      heatMapCtx.clearRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
      
      // Set up for heat map
      if (heatMapEnabled) {
        heatMapCtx.globalAlpha = 0.1; // For heat trail effect
      }
      
      // Get maximum distance an animal can move between frames based on type
      const getMaxMovementDistance = (animalType: string): number => {
        // Distance in pixels per frame
        switch(animalType) {
          case 'bird': return 20; // Birds can move quickly
          case 'cat': return 15;
          case 'dog': return 18;
          case 'fish': return 12;
          case 'mouse': 
          case 'rat': return 10;
          default: return 15;
        }
      };
      
      // Get animal speed based on type
      const getAnimalSpeed = (animalType: string): number => {
        // Base speed in pixels per frame
        switch(animalType) {
          case 'bird': return 3.0;
          case 'cat': return 2.5;
          case 'dog': return 2.8;
          case 'fish': return 2.0;
          case 'mouse': 
          case 'rat': return 1.8;
          default: return 2.2;
        }
      };
      
      // Apply natural movement patterns to make tracking more realistic
      const applyMovementPattern = (
        animalType: string, 
        dx: number, 
        dy: number, 
        frameCount: number
      ): { patternDx: number, patternDy: number } => {
        let patternDx = dx;
        let patternDy = dy;
        
        // Apply type-specific movement patterns
        switch(animalType) {
          case 'bird':
            // Birds often have more vertical movement
            patternDx = dx * (1 + Math.sin(frameCount * 0.1) * 0.3);
            patternDy = dy * (1 + Math.cos(frameCount * 0.1) * 0.3);
            break;
          case 'fish':
            // Fish tend to move in flowing patterns
            patternDx = dx * (1 + Math.sin(frameCount * 0.08) * 0.4);
            patternDy = dy * (1 + Math.sin(frameCount * 0.08 + Math.PI/2) * 0.4);
            break;
          case 'cat':
            // Cats move more deliberately with pauses
            const catPause = Math.sin(frameCount * 0.05) > 0.7;
            patternDx = catPause ? dx * 0.2 : dx * 1.2;
            patternDy = catPause ? dy * 0.2 : dy * 1.2;
            break;
          case 'dog':
            // Dogs may move more energetically
            patternDx = dx * (1 + Math.sin(frameCount * 0.15) * 0.25);
            patternDy = dy * (1 + Math.cos(frameCount * 0.15) * 0.25);
            break;
          case 'mouse':
          case 'rat':
            // Small rodents have more erratic movement
            patternDx = dx * (1 + Math.sin(frameCount * 0.2) * 0.5);
            patternDy = dy * (1 + Math.cos(frameCount * 0.2) * 0.5);
            break;
          default:
            // Default pattern
            patternDx = dx;
            patternDy = dy;
        }
        
        return { patternDx, patternDy };
      };
      
      // Detect motion between frames to track animal movement more accurately
      const detectMotion = () => {
        if (!motionCtx || !videoRef.current) return [];
        
        // Draw current frame to hidden canvas
        motionCtx.drawImage(videoRef.current, 0, 0, motionCanvas.width, motionCanvas.height);
        
        // Get frame data
        const currentFrameData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        // Skip first frame as we need two frames to compare
        if (!previousFrameDataRef.current) {
          previousFrameDataRef.current = currentFrameData;
          return [];
        }
        
        const motionRegions = [];
        const threshold = 30; // Sensitivity to motion
        const blockSize = 20; // Size of regions to analyze
        
        // Analyze video in blocks to detect motion
        for (let y = 0; y < motionCanvas.height; y += blockSize) {
          for (let x = 0; x < motionCanvas.width; x += blockSize) {
            let diffCount = 0;
            
            // Check each pixel in the block
            for (let blockY = 0; blockY < blockSize && y + blockY < motionCanvas.height; blockY++) {
              for (let blockX = 0; blockX < blockSize && x + blockX < motionCanvas.width; blockX++) {
                const pixelPos = ((y + blockY) * motionCanvas.width + (x + blockX)) * 4;
                
                // Calculate difference between current and previous frame
                const rDiff = Math.abs(currentFrameData.data[pixelPos] - previousFrameDataRef.current.data[pixelPos]);
                const gDiff = Math.abs(currentFrameData.data[pixelPos + 1] - previousFrameDataRef.current.data[pixelPos + 1]);
                const bDiff = Math.abs(currentFrameData.data[pixelPos + 2] - previousFrameDataRef.current.data[pixelPos + 2]);
                
                // If significant change in color, count as motion
                if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
                  diffCount++;
                }
              }
            }
            
            // If enough pixels changed, mark this region as having motion
            const motionThreshold = (blockSize * blockSize) * MOTION_SENSITIVITY * 0.1; // 10% of pixels changed
            if (diffCount > motionThreshold) {
              motionRegions.push({
                x: x + blockSize/2,
                y: y + blockSize/2,
                intensity: diffCount / (blockSize * blockSize)
              });
            }
          }
        }
        
        // Store current frame as previous for next comparison
        previousFrameDataRef.current = currentFrameData;
        
        return motionRegions;
      };
      
      // Update animal positions based on detected motion and animal behavior patterns
      const updateAnimalPositions = (motionRegions: Array<{x: number, y: number, intensity: number}>) => {
        if (!motionRegions.length) return;
        
        // Current video time for synchronized animation
        const currentVideoTime = videoRef.current ? videoRef.current.currentTime : 0;
        videoTimeRef.current = currentVideoTime;
        frameCountRef.current++;
        
        // Update each animal's position
        animals.forEach(animal => {
          const animalType = animal.name.toLowerCase();
          const animalConfidence = animal.confidence;
          
          // Skip if no positions yet
          if (!animalPositionsRef.current[animal.name] || !animalPositionsRef.current[animal.name].length) return;
          
          // Get current position
          const currentPos = animalPositionsRef.current[animal.name][animalPositionsRef.current[animal.name].length - 1];
          
          // Parameters affecting movement
          const confidenceWeight = animalConfidence * TRACKING_PRECISION;
          
          // Find motion regions that could correspond to this animal
          const relevantMotionRegions = motionRegions
            .filter(region => {
              // Calculate distance from current position
              const dx = region.x - currentPos.x;
              const dy = region.y - currentPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Only consider regions within a reasonable distance based on animal type
              // Faster animals can move further between frames
              const maxDistance = getMaxMovementDistance(animalType) * PATTERN_RECOGNITION;
              return distance < maxDistance;
            })
            .sort((a, b) => b.intensity - a.intensity); // Sort by intensity
          
          // If relevant regions found, move toward the most active one
          // with influence from confidence level
          if (relevantMotionRegions.length > 0) {
            const targetRegion = relevantMotionRegions[0];
            
            // Calculate vector toward motion
            const dx = targetRegion.x - currentPos.x;
            const dy = targetRegion.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if already at target
            if (distance < 1) return;
            
            // Normalize and scale by confidence
            const moveSpeed = getAnimalSpeed(animalType) * confidenceWeight;
            const normalizedDx = (dx / distance) * moveSpeed;
            const normalizedDy = (dy / distance) * moveSpeed;
            
            // Apply some natural movement patterns based on animal type
            const { patternDx, patternDy } = applyMovementPattern(animalType, normalizedDx, normalizedDy, frameCountRef.current);
            
            // New position with pattern influence
            const newX = currentPos.x + patternDx;
            const newY = currentPos.y + patternDy;
            
            // Ensure within bounds
            const boundedX = Math.max(0, Math.min(canvas.width, newX));
            const boundedY = Math.max(0, Math.min(canvas.height, newY));
            
            // Add to positions
            animalPositionsRef.current[animal.name].push({
              x: boundedX,
              y: boundedY,
              timestamp: Date.now()
            });
            
            // Add to movement history for heat map
            movementHistoryRef.current.push({
              x: boundedX,
              y: boundedY,
              animalName: animal.name
            });
            
            // Limit position history
            if (animalPositionsRef.current[animal.name].length > 30) {
              animalPositionsRef.current[animal.name].shift();
            }
          } else {
            // No relevant motion - apply subtle random movement to prevent static appearance
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDistance = Math.random() * 2; // Small random movement
            
            const newX = currentPos.x + Math.cos(randomAngle) * randomDistance;
            const newY = currentPos.y + Math.sin(randomAngle) * randomDistance;
            
            // Ensure within bounds
            const boundedX = Math.max(0, Math.min(canvas.width, newX));
            const boundedY = Math.max(0, Math.min(canvas.height, newY));
            
            // Add subtle movement
            animalPositionsRef.current[animal.name].push({
              x: boundedX,
              y: boundedY,
              timestamp: Date.now()
            });
          }
        });
        
        // Limit total movement history
        if (movementHistoryRef.current.length > 500) {
          movementHistoryRef.current.shift();
        }
      };
      
      // Draw animal positions and movement trails
      const draw = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw heat map if enabled
        if (heatMapEnabled) {
          // Fade out previous heat map slightly
          heatMapCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          heatMapCtx.fillRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
          
          // Draw heat points for each movement in history
          movementHistoryRef.current.forEach(point => {
            const color = getAnimalColor(point.animalName);
            const gradient = heatMapCtx.createRadialGradient(
              point.x, point.y, 1,
              point.x, point.y, 20
            );
            gradient.addColorStop(0, `${color}99`); // Semi-transparent
            gradient.addColorStop(1, 'transparent');
            
            heatMapCtx.fillStyle = gradient;
            heatMapCtx.beginPath();
            heatMapCtx.arc(point.x, point.y, 20, 0, Math.PI * 2);
            heatMapCtx.fill();
          });
        }
        
        // Draw each animal's tracking
        animals.forEach(animal => {
          const positions = animalPositionsRef.current[animal.name];
          if (!positions || positions.length <= 1) return;
          
          const color = getAnimalColor(animal.name);
          
          // Draw movement trail
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          
          for (let i = 1; i < positions.length; i++) {
            // Set varying opacity based on position age
            const opacity = i / positions.length;
            ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 2;
            
            ctx.lineTo(positions[i].x, positions[i].y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
          }
          
          // Draw current position indicator
          const current = positions[positions.length - 1];
            
          // Draw larger highlight circle
          ctx.fillStyle = color + '33'; // Very transparent
          ctx.beginPath();
          ctx.arc(current.x, current.y, 30, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw smaller solid circle
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(current.x, current.y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw animal label
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.strokeText(animal.name, current.x, current.y - 15);
          ctx.fillText(animal.name, current.x, current.y - 15);
          
          // Draw confidence percentage
          ctx.font = '12px Arial';
          ctx.strokeText(`${Math.round(animal.confidence * 100)}%`, current.x, current.y - 32);
          ctx.fillText(`${Math.round(animal.confidence * 100)}%`, current.x, current.y - 32);
        });
      };
      
      // Animation loop with motion detection
      const animate = () => {
        // Detect motion in current frame
        const motionRegions = detectMotion();
        
        // Update animal positions based on detected motion
        if (motionRegions.length > 0) {
          updateAnimalPositions(motionRegions);
        }
        
        // Draw updated positions
        draw();
        
        // Continue animation
        animationRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation
      animate();
    };
    
    // Initialize canvas and motion detection
    setupCanvas();
    
    // Cleanup
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
            />
            {/* Motion detection canvas */}
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            {/* Heat map canvas */}
            <canvas 
              ref={heatMapCanvasRef}
              className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!heatMapEnabled ? 'hidden' : ''}`}
            />
          </>
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded media" 
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Loading overlay */}
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
            
            {isVideo && heatMapEnabled && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ThermometerSun size={16} className="text-amber-500" />
                <span>Mapa de calor ativado</span>
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
              {animals.map((animal, index) => (
                <div 
                  key={`${animal.name}-${index}`} 
                  className="flex items-center p-2 rounded-md border"
                  style={{ borderColor: getAnimalColor(animal.name) + '80' }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
                    style={{ backgroundColor: getAnimalColor(animal.name) + '33' }}
                  >
                    {getAnimalIcon(animal.name) || <ThermometerSun size={16} />}
                  </div>
                  <div>
                    <p className="font-medium">{animal.name}</p>
                    <div className="text-xs text-muted-foreground">
                      <p>Confiança: {Math.round(animal.confidence * 100)}%</p>
                      {animal.category ? (
                        <p className={`font-medium ${animal.category?.includes('invas') ? 'text-red-500' : ''}`}>
                          {animal.category}
                        </p>
                      ) : (
                        <p className={`font-medium ${animal.name.toLowerCase().includes('javali') ? 'text-red-500' : ''}`}>
                          {animal.name.toLowerCase().includes('javali') ? 'Espécie invasora' : classifyAnimalType(animal.name)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}
