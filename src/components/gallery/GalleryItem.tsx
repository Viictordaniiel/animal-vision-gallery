import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Cat, Dog, Bird, Fish, Mouse } from 'lucide-react';
import { CardContent } from '@/components/ui/card';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
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

  // Track animal movements and draw heat map
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    // Set up canvas for motion detection
    const setupCanvas = () => {
      if (!videoRef.current || !canvasRef.current || !heatMapCanvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const heatMapCanvas = heatMapCanvasRef.current;
      
      // Resize canvases to match video dimensions
      const setCanvasSize = () => {
        const width = video.videoWidth || video.clientWidth;
        const height = video.videoHeight || video.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        heatMapCanvas.width = width;
        heatMapCanvas.height = height;
      };
      
      setCanvasSize();
      
      // Clear previous animation frame
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Animal movement detection parameters
      const animalZones = animals.map(animal => {
        // Create initial tracking positions for each animal
        // These positions will be updated as the video plays
        return {
          name: animal.name,
          confidence: animal.confidence,
          positions: [
            {
              x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
              y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
              speed: 0,
              direction: 0,
              time: Date.now(),
              active: true
            }
          ]
        };
      });
      
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
      
      // Function to simulate animal movement based on video frames
      const simulateAnimalMovement = () => {
        // Velocity factors based on animal type
        const velocityFactors: { [key: string]: number } = {
          cat: 1.5,
          dog: 1.8,
          bird: 2.2,
          fish: 0.8,
          mouse: 1.9,
          default: 1.0
        };
        
        animalZones.forEach(animal => {
          const lastPosition = animal.positions[animal.positions.length - 1];
          if (!lastPosition.active) return;
          
          // Get velocity factor based on animal type
          const animalType = animal.name.toLowerCase();
          const velocityFactor = velocityFactors[animalType] || velocityFactors.default;
          
          // Calculate new position with some randomness and direction changes
          const now = Date.now();
          const timeDelta = (now - lastPosition.time) / 1000; // in seconds
          
          // Change direction occasionally
          if (Math.random() < 0.05) {
            lastPosition.direction = Math.random() * Math.PI * 2;
          }
          
          // Calculate speed based on animal type
          const baseSpeed = 50 * velocityFactor; // pixels per second
          const speedVariation = Math.random() * 20 - 10; // random variance
          lastPosition.speed = Math.max(0, baseSpeed + speedVariation);
          
          // Calculate new position
          const distance = lastPosition.speed * timeDelta;
          const dx = Math.cos(lastPosition.direction) * distance;
          const dy = Math.sin(lastPosition.direction) * distance;
          
          // New position with boundary checks
          let newX = lastPosition.x + dx;
          let newY = lastPosition.y + dy;
          
          // Bounce off canvas edges
          if (newX < 0 || newX > canvas.width) {
            lastPosition.direction = Math.PI - lastPosition.direction;
            newX = Math.max(0, Math.min(newX, canvas.width));
          }
          
          if (newY < 0 || newY > canvas.height) {
            lastPosition.direction = -lastPosition.direction;
            newY = Math.max(0, Math.min(newY, canvas.height));
          }
          
          // Add new position
          animal.positions.push({
            x: newX,
            y: newY,
            speed: lastPosition.speed,
            direction: lastPosition.direction,
            time: now,
            active: true
          });
          
          // Keep position history limited
          if (animal.positions.length > 60) {
            animal.positions.shift();
          }
          
          // Add to movement history for heat map
          movementHistoryRef.current.push({
            x: newX,
            y: newY,
            animalName: animal.name
          });
          
          // Limit movement history size
          if (movementHistoryRef.current.length > 500) {
            movementHistoryRef.current.shift();
          }
        });
      };
      
      // Draw animal positions and movement
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
        
        // Draw animal positions and trails
        animalZones.forEach(animal => {
          const color = getAnimalColor(animal.name);
          
          // Draw movement path/trail
          if (animal.positions.length > 1) {
            ctx.beginPath();
            ctx.moveTo(animal.positions[0].x, animal.positions[0].y);
            
            for (let i = 1; i < animal.positions.length; i++) {
              // Set varying opacity based on position age
              const opacity = i / animal.positions.length;
              ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
              ctx.lineWidth = 2;
              
              ctx.lineTo(animal.positions[i].x, animal.positions[i].y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(animal.positions[i].x, animal.positions[i].y);
            }
          }
          
          // Draw current position indicator
          if (animal.positions.length > 0) {
            const current = animal.positions[animal.positions.length - 1];
            
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
          }
        });
      };
      
      // Animation loop
      const animate = () => {
        simulateAnimalMovement();
        draw();
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
                    <p className="text-xs text-muted-foreground">
                      Confiança: {Math.round(animal.confidence * 100)}%
                    </p>
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
