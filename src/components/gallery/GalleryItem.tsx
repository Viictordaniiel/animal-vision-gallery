import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThermometerSun, Cat, Dog, Bird, Fish, Mouse, AlertTriangle } from 'lucide-react';
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

// Improved motion tracking parameters for better accuracy
const TRACKING_PRECISION = 0.95;  // Higher precision for more accurate tracking
const MOTION_SENSITIVITY = 0.75;  // Increased sensitivity to detect subtle movements
const PATTERN_RECOGNITION = 3.0;  // Enhanced pattern recognition for better movement prediction
const MOTION_THRESHOLD = 15;      // Lower threshold to detect more subtle movement changes

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
  const previousFrameDataRef = useRef<ImageData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const animalPositionsRef = useRef<{[key: string]: {x: number, y: number, timestamp: number}[]}>({});
  const videoTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const { toast } = useToast();
  // Flag to track if invasive species alert has been shown
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

  // Show alert for invasive species
  useEffect(() => {
    // Check if there are any invasive species in the detected animals
    if (!isAnalyzing && animals.length > 0 && !invasiveAlertShownRef.current) {
      const invasiveSpecies = animals.filter(animal => {
        const isInvasive = 
          animal.category?.toLowerCase().includes('invasora') ||
          animal.category?.toLowerCase().includes('invasor') ||
          animal.name.toLowerCase().includes('javali');
        return isInvasive;
      });
      
      if (invasiveSpecies.length > 0) {
        // Show alert for each invasive species
        invasiveSpecies.forEach(species => {
          toast({
            title: "⚠️ Espécie Invasora Detectada!",
            description: `${species.name} foi identificado com ${Math.round(species.confidence * 100)}% de confiança.`,
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

  // Advanced motion detection and improved animal tracking
  useEffect(() => {
    if (!isVideo || !videoLoaded || !animals.length || isAnalyzing) return;
    
    // Initialize animal regions with intelligent positioning based on animal type
    const initializeAnimalPositions = (width: number, height: number) => {
      // For videos, place animals in more logical regions
      // based on animal type and typical behavior
      animals.forEach(animal => {
        const type = animal.name.toLowerCase();
        
        // Different initial positions based on animal type for more accurate initial placement
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
          case 'rato':
          case 'rat':
            // Ground animals often at the bottom
            initialX = Math.random() * width * 0.8 + width * 0.1;
            initialY = Math.random() * height * 0.3 + height * 0.6;
            break;
          case 'javali':
          case 'porco':
          case 'porco-do-mato':
            // Wild boars usually move in lower areas or mid-screen
            initialX = Math.random() * width * 0.7 + width * 0.15;
            initialY = Math.random() * height * 0.3 + height * 0.5;
            break;
          default:
            // Others more evenly distributed but avoiding edges for better tracking
            initialX = Math.random() * width * 0.7 + width * 0.15;
            initialY = Math.random() * height * 0.7 + height * 0.15;
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
    
    // Set up canvas for enhanced motion detection
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
        initializeAnimalPositions(width, height);
      };
      
      setCanvasSize();
      
      // Clear previous animation frame
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Setup hidden canvas for motion detection with improved precision
      const motionCanvas = document.createElement('canvas');
      const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
      motionCanvas.width = canvas.width;
      motionCanvas.height = canvas.height;
      
      // Drawing context setup
      const ctx = canvas.getContext('2d');
      const heatMapCtx = heatMapCanvas.getContext('2d');
      
      if (!ctx || !heatMapCtx || !motionCtx) return;
      
      // Clear heat map canvas initially
      heatMapCtx.clearRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
      
      // Set up for heat map with improved visualization
      if (heatMapEnabled) {
        heatMapCtx.globalAlpha = 0.12; // Slightly increased opacity for better visibility
      }
      
      // Enhanced maximum movement distance calculation based on animal type
      const getMaxMovementDistance = (animalType: string): number => {
        // More accurate distance in pixels per frame based on animal type
        const lowerType = animalType.toLowerCase();
        if (lowerType.includes('bird') || lowerType.includes('ave')) return 22; // Birds can move quickly
        if (lowerType.includes('cat') || lowerType.includes('gato')) return 16;
        if (lowerType.includes('dog') || lowerType.includes('cachorro') || lowerType.includes('cão')) return 19;
        if (lowerType.includes('fish') || lowerType.includes('peixe')) return 13;
        if (lowerType.includes('javali') || lowerType.includes('porco')) return 17; // Wild boars move at moderate speed
        if (lowerType.includes('mouse') || lowerType.includes('rato')) return 11;
        if (lowerType.includes('deer') || lowerType.includes('veado')) return 20; // Deer are fast
        // Default movement distance
        return 16;
      };
      
      // Improved animal speed calculation based on type
      const getAnimalSpeed = (animalType: string): number => {
        // More accurate speed in pixels per frame
        const lowerType = animalType.toLowerCase();
        if (lowerType.includes('bird') || lowerType.includes('ave')) return 3.2;
        if (lowerType.includes('cat') || lowerType.includes('gato')) return 2.7;
        if (lowerType.includes('dog') || lowerType.includes('cachorro') || lowerType.includes('cão')) return 3.0;
        if (lowerType.includes('fish') || lowerType.includes('peixe')) return 2.2;
        if (lowerType.includes('javali') || lowerType.includes('porco')) return 2.6; // Wild boars have moderate speed
        if (lowerType.includes('mouse') || lowerType.includes('rato')) return 1.9;
        if (lowerType.includes('deer') || lowerType.includes('veado')) return 3.3; // Deer are fast
        // Default speed
        return 2.5;
      };
      
      // Enhanced natural movement patterns to make tracking more realistic
      const applyMovementPattern = (
        animalType: string, 
        dx: number, 
        dy: number, 
        frameCount: number
      ): { patternDx: number, patternDy: number } => {
        let patternDx = dx;
        let patternDy = dy;
        const lowerType = animalType.toLowerCase();
        
        // Apply type-specific movement patterns with improved realism
        if (lowerType.includes('bird') || lowerType.includes('ave')) {
          // Birds have more vertical and erratic movement
          patternDx = dx * (1 + Math.sin(frameCount * 0.12) * 0.35);
          patternDy = dy * (1 + Math.cos(frameCount * 0.12) * 0.35);
        } else if (lowerType.includes('fish') || lowerType.includes('peixe')) {
          // Fish move in flowing, wave-like patterns
          patternDx = dx * (1 + Math.sin(frameCount * 0.09) * 0.45);
          patternDy = dy * (1 + Math.sin(frameCount * 0.09 + Math.PI/2) * 0.45);
        } else if (lowerType.includes('cat') || lowerType.includes('gato')) {
          // Cats move deliberately with pauses and sudden bursts
          const catPause = Math.sin(frameCount * 0.06) > 0.75;
          patternDx = catPause ? dx * 0.15 : dx * 1.25;
          patternDy = catPause ? dy * 0.15 : dy * 1.25;
        } else if (lowerType.includes('dog') || lowerType.includes('cachorro') || lowerType.includes('cão')) {
          // Dogs move more energetically with occasional direction changes
          patternDx = dx * (1 + Math.sin(frameCount * 0.17) * 0.3);
          patternDy = dy * (1 + Math.cos(frameCount * 0.17) * 0.3);
        } else if (lowerType.includes('javali') || lowerType.includes('porco')) {
          // Wild boars move more determinedly with occasional pauses
          const boarPause = Math.sin(frameCount * 0.05) > 0.8;
          patternDx = boarPause ? dx * 0.2 : dx * 1.1;
          patternDy = boarPause ? dy * 0.2 : dy * 1.1;
        } else if (lowerType.includes('deer') || lowerType.includes('veado')) {
          // Deer have elegant but quick movements, sometimes freezing
          const deerPause = Math.sin(frameCount * 0.04) > 0.85;
          patternDx = deerPause ? dx * 0.05 : dx * 1.3;
          patternDy = deerPause ? dy * 0.05 : dy * 1.3;
        } else if (lowerType.includes('mouse') || lowerType.includes('rato')) {
          // Small rodents have more erratic, quick movements
          patternDx = dx * (1 + Math.sin(frameCount * 0.25) * 0.6);
          patternDy = dy * (1 + Math.cos(frameCount * 0.25) * 0.6);
        } else {
          // Default pattern with slight randomness
          patternDx = dx * (1 + Math.sin(frameCount * 0.1) * 0.25);
          patternDy = dy * (1 + Math.cos(frameCount * 0.1) * 0.25);
        }
        
        return { patternDx, patternDy };
      };
      
      // Improved motion detection between frames for more accurate animal tracking
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
        const blockSize = 15; // Smaller blocks for more precise detection
        
        // Analyze video in blocks to detect motion with enhanced sensitivity
        for (let y = 0; y < motionCanvas.height; y += blockSize) {
          for (let x = 0; x < motionCanvas.width; x += blockSize) {
            let diffCount = 0;
            let totalDiff = 0;
            
            // Check each pixel in the block with improved sensitivity
            for (let blockY = 0; blockY < blockSize && y + blockY < motionCanvas.height; blockY++) {
              for (let blockX = 0; blockX < blockSize && x + blockX < motionCanvas.width; blockX++) {
                const pixelPos = ((y + blockY) * motionCanvas.width + (x + blockX)) * 4;
                
                // Calculate difference between current and previous frame with enhanced precision
                const rDiff = Math.abs(currentFrameData.data[pixelPos] - previousFrameDataRef.current.data[pixelPos]);
                const gDiff = Math.abs(currentFrameData.data[pixelPos + 1] - previousFrameDataRef.current.data[pixelPos + 1]);
                const bDiff = Math.abs(currentFrameData.data[pixelPos + 2] - previousFrameDataRef.current.data[pixelPos + 2]);
                
                // Weighted color difference for better motion detection
                const pixelDiff = (rDiff * 0.3) + (gDiff * 0.59) + (bDiff * 0.11);
                totalDiff += pixelDiff;
                
                // If significant change in color, count as motion
                if (rDiff > MOTION_THRESHOLD || gDiff > MOTION_THRESHOLD || bDiff > MOTION_THRESHOLD) {
                  diffCount++;
                }
              }
            }
            
            // If enough pixels changed, mark this region as having motion
            const motionThreshold = (blockSize * blockSize) * MOTION_SENSITIVITY * 0.1;
            if (diffCount > motionThreshold) {
              // Calculate motion intensity for more accurate tracking
              const intensity = totalDiff / (blockSize * blockSize * 255 * 3);
              motionRegions.push({
                x: x + blockSize/2,
                y: y + blockSize/2,
                intensity: Math.min(1.0, intensity * 5) // Scale and cap intensity
              });
            }
          }
        }
        
        // Store current frame as previous for next comparison
        previousFrameDataRef.current = currentFrameData;
        
        return motionRegions;
      };
      
      // Update animal positions based on detected motion with improved accuracy
      const updateAnimalPositions = (motionRegions: Array<{x: number, y: number, intensity: number}>) => {
        if (!motionRegions.length) return;
        
        // Current video time for synchronized animation
        const currentVideoTime = videoRef.current ? videoRef.current.currentTime : 0;
        videoTimeRef.current = currentVideoTime;
        frameCountRef.current++;
        
        // Update each animal's position with enhanced tracking
        animals.forEach(animal => {
          const animalType = animal.name.toLowerCase();
          const animalConfidence = animal.confidence;
          
          // Skip if no positions yet
          if (!animalPositionsRef.current[animal.name] || !animalPositionsRef.current[animal.name].length) return;
          
          // Get current position
          const currentPos = animalPositionsRef.current[animal.name][animalPositionsRef.current[animal.name].length - 1];
          
          // Parameters affecting movement with improved tracking
          const confidenceWeight = animalConfidence * TRACKING_PRECISION;
          
          // Find motion regions that could correspond to this animal with improved filtering
          const relevantMotionRegions = motionRegions
            .filter(region => {
              // Calculate distance from current position
              const dx = region.x - currentPos.x;
              const dy = region.y - currentPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Only consider regions within a reasonable distance based on animal type
              const maxDistance = getMaxMovementDistance(animalType) * PATTERN_RECOGNITION;
              return distance < maxDistance;
            })
            .sort((a, b) => {
              // Sort by intensity but also consider proximity for more accurate tracking
              const distA = Math.sqrt(Math.pow(a.x - currentPos.x, 2) + Math.pow(a.y - currentPos.y, 2));
              const distB = Math.sqrt(Math.pow(b.x - currentPos.x, 2) + Math.pow(b.y - currentPos.y, 2));
              
              // Blend intensity and proximity factors
              const scoreA = (a.intensity * 0.7) + ((1 - distA/maxDistance) * 0.3);
              const scoreB = (b.intensity * 0.7) + ((1 - distB/maxDistance) * 0.3);
              
              return scoreB - scoreA;
            });
          
          // If relevant regions found, move toward the most active one
          // with influence from confidence level
          if (relevantMotionRegions.length > 0) {
            const targetRegion = relevantMotionRegions[0];
            
            // Calculate vector toward motion with improved precision
            const dx = targetRegion.x - currentPos.x;
            const dy = targetRegion.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if already at target
            if (distance < 1) return;
            
            // Normalize and scale by confidence
            const moveSpeed = getAnimalSpeed(animalType) * confidenceWeight * targetRegion.intensity;
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
            
            // Limit position history for optimal performance
            if (animalPositionsRef.current[animal.name].length > 40) { // Increased history for smoother trails
              animalPositionsRef.current[animal.name].shift();
            }
          } else {
            // No relevant motion - apply subtle random movement to prevent static appearance
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDistance = Math.random() * 1.8; // Small random movement
            
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
        if (movementHistoryRef.current.length > 600) { // Increased for better heat map visualization
          movementHistoryRef.current.shift();
        }
      };
      
      // Draw animal positions and movement trails with improved visualization
      const draw = () => {
        if (!ctx || !heatMapCtx || !video) return;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw heat map if enabled with enhanced visualization
        if (heatMapEnabled) {
          // Fade out previous heat map slightly
          heatMapCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          heatMapCtx.fillRect(0, 0, heatMapCanvas.width, heatMapCanvas.height);
          
          // Draw heat points for each movement in history with improved gradient
          movementHistoryRef.current.forEach(point => {
            const color = getAnimalColor(point.animalName);
            const isInvasive = point.animalName.toLowerCase().includes('javali') || 
                               point.animalName.toLowerCase().includes('porco-do-mato');
            
            const gradient = heatMapCtx.createRadialGradient(
              point.x, point.y, 1,
              point.x, point.y, isInvasive ? 25 : 20 // Larger radius for invasive species
            );
            
            if (isInvasive) {
              // Redder gradient for invasive species
              gradient.addColorStop(0, `rgba(234, 56, 76, 0.7)`); // Brighter red
              gradient.addColorStop(0.6, `rgba(234, 56, 76, 0.3)`);
              gradient.addColorStop(1, 'transparent');
            } else {
              gradient.addColorStop(0, `${color}99`); // Semi-transparent
              gradient.addColorStop(0.7, `${color}33`);
              gradient.addColorStop(1, 'transparent');
            }
            
            heatMapCtx.fillStyle = gradient;
            heatMapCtx.beginPath();
            heatMapCtx.arc(point.x, point.y, isInvasive ? 25 : 20, 0, Math.PI * 2);
            heatMapCtx.fill();
          });
        }
        
        // Draw each animal's tracking with improved visualization
        animals.forEach(animal => {
          const positions = animalPositionsRef.current[animal.name];
          if (!positions || positions.length <= 1) return;
          
          const isInvasive = animal.name.toLowerCase().includes('javali') || 
                            animal.category?.toLowerCase().includes('invasora');
          
          const color = isInvasive ? '#ea384c' : getAnimalColor(animal.name);
          
          // Draw movement trail with improved opacity gradient
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          
          for (let i = 1; i < positions.length; i++) {
            // Set varying opacity based on position age with improved gradient
            const opacity = Math.pow(i / positions.length, 1.5); // More pronounced fade for older points
            ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = isInvasive ? 2.5 : 2; // Thicker lines for invasive species
            
            ctx.lineTo(positions[i].x, positions[i].y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
          }
          
          // Draw current position indicator with improved visibility
          const current = positions[positions.length - 1];
            
          // Draw larger highlight circle
          ctx.fillStyle = color + '33'; // Very transparent
          ctx.beginPath();
          ctx.arc(current.x, current.y, isInvasive ? 35 : 30, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw middle highlight circle for improved visibility
          ctx.fillStyle = color + '66'; // Semi-transparent
          ctx.beginPath();
          ctx.arc(current.x, current.y, isInvasive ? 18 : 15, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw smaller solid circle
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(current.x, current.y, isInvasive ? 10 : 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw animal label with improved visibility
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = isInvasive ? 'bold 15px Arial' : '14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.strokeText(animal.name, current.x, current.y - 15);
          ctx.fillText(animal.name, current.x, current.y - 15);
          
          // Draw confidence percentage
          ctx.font = isInvasive ? 'bold 13px Arial' : '12px Arial';
          ctx.strokeText(`${Math.round(animal.confidence * 100)}%`, current.x, current.y - 32);
          ctx.fillText(`${Math.round(animal.confidence * 100)}%`, current.x, current.y - 32);
          
          // Add warning icon for invasive species
          if (isInvasive) {
            ctx.fillStyle = '#ea384c';
            ctx.beginPath();
            ctx.arc(current.x - 35, current.y - 25, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.fillText("!", current.x - 35, current.y - 21);
          }
        });
      };
      
      // Animation loop with motion detection
      const animate = () => {
        // Detect motion in current frame with improved sensitivity
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
            
            {/* Invasive species indicator */}
            {!isAnalyzing && animals.some(animal => 
              animal.category?.toLowerCase().includes('invasora') || 
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
                const isInvasive = animal.name.toLowerCase().includes('javali') || 
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
