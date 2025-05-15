
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, MoveHorizontal, Target, Move, MoveVertical, Radar, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [motionDetection, setMotionDetection] = useState(false);
  const [droneCompensation, setDroneCompensation] = useState(false);
  const [motionPoints, setMotionPoints] = useState<{x: number, y: number, strength: number}[]>([]);
  const lastFrameRef = useRef<ImageData | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const referencePointsRef = useRef<{x: number, y: number}[]>([]);
  const lastReferencePointsRef = useRef<{x: number, y: number}[]>([]);
  const frameCountRef = useRef<number>(0);
  const isFirstFrameRef = useRef<boolean>(true);
  
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
  
  // Enhanced detection function to classify invasive species
  const isInvasiveSpecies = (animalName: string): boolean => {
    const invasiveTerms = [
      'javali', 'porco', 'cateto', 'queixada', 'suino', 'suíno', 'wild boar', 'wild pig',
      'sus scrofa', 'pecari', 'tayassu'
    ];
    const lowerName = animalName.toLowerCase();
    return invasiveTerms.some(term => lowerName.includes(term));
  };
  
  // Enhanced function to determine if it's a dog with expanded terminology (Stanford Dogs Dataset)
  const isDog = (animalName: string): boolean => {
    const dogTerms = [
      'cachorro', 'dog', 'canino', 'canídeo', 'pastor', 'labrador', 'golden', 
      'vira-lata', 'caramelo', 'canis familiaris', 'cão', 'cao', 'husky', 'bulldog',
      'poodle', 'dálmata', 'dalmata', 'boxer', 'beagle', 'chihuahua', 'cocker', 
      'dachshund', 'doberman', 'pug', 'rottweiler', 'shih tzu', 'yorkshire', 
      'border collie', 'akita', 'bull terrier', 'pit bull', 'terrier', 'spaniel',
      'retriever', 'shepherd', 'hound', 'mastiff', 'setter', 'collie', 'corgi'
    ];
    const lowerName = animalName.toLowerCase();
    return dogTerms.some(term => lowerName.includes(term));
  };
  
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
  
  // Advanced classification for specialized sensor tracking
  const getAnimalClassification = (animalName: string): 'invasive' | 'domestic' | 'predator' | 'herbivore' | 'other' => {
    if (isInvasiveSpecies(animalName)) return 'invasive';
    if (isDog(animalName)) return 'domestic';
    if (isPredator(animalName)) return 'predator';
    if (isHerbivore(animalName)) return 'herbivore';
    return 'other';
  };
  
  // Check if any animal is an invasive species
  const hasInvasiveSpecies = animals.length > 0 && animals.some(animal => isInvasiveSpecies(animal.name));
  
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
  
  // Set up video playback and canvases
  useEffect(() => {
    if (isVideo && videoRef.current) {
      console.log("Setting up video playback with src:", imageUrl);
      videoRef.current.src = imageUrl;
      
      const handleTimeUpdate = () => {
        if (videoRef.current) {
          const progress = videoRef.current.currentTime / (videoRef.current.duration || 1);
          setVideoProgress(progress);
        }
      };
      
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      // Set up canvas for motion detection
      if (canvasRef.current) {
        contextRef.current = canvasRef.current.getContext('2d');
      }

      // Set up overlay canvas for visualization
      if (overlayCanvasRef.current) {
        overlayContextRef.current = overlayCanvasRef.current.getContext('2d');
      }
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
        
        // Clean up motion detection
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [imageUrl, isVideo]);
  
  // Toggle motion detection with drone movement compensation
  useEffect(() => {
    if (isVideo && motionDetection && videoRef.current && canvasRef.current && contextRef.current) {
      // Reset previous motion detection
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        lastFrameRef.current = null;
        isFirstFrameRef.current = true;
        frameCountRef.current = 0;
      }
      
      // Start motion detection with or without drone compensation
      const detectMotion = () => {
        frameCountRef.current++;
        
        if (videoRef.current && canvasRef.current && contextRef.current && overlayCanvasRef.current && overlayContextRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = contextRef.current;
          const overlayCanvas = overlayCanvasRef.current;
          const overlayContext = overlayContextRef.current;
          
          // Set canvas dimensions to match video
          if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            overlayCanvas.width = video.videoWidth;
            overlayCanvas.height = video.videoHeight;
          }
          
          // Clear overlay canvas
          overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          
          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data for current frame
          const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // If drone compensation is enabled, determine reference points and calculate global movement
          let globalOffsetX = 0;
          let globalOffsetY = 0;
          
          if (droneCompensation) {
            // Every 15 frames, recalculate reference points
            if (frameCountRef.current % 15 === 0 || isFirstFrameRef.current) {
              // Find stable reference points (high contrast areas)
              const tempReferencePoints = findReferencePoints(currentFrame, canvas.width, canvas.height);
              
              // Only update if we found enough reference points
              if (tempReferencePoints.length >= 5) {
                referencePointsRef.current = tempReferencePoints;
                
                // Draw reference points on overlay canvas for visualization
                overlayContext.fillStyle = 'rgba(0, 255, 255, 0.7)';
                referencePointsRef.current.forEach(point => {
                  overlayContext.beginPath();
                  overlayContext.arc(point.x, point.y, 3, 0, Math.PI * 2);
                  overlayContext.fill();
                });
              }
            }
            
            // If we have reference points from last frame, calculate movement
            if (!isFirstFrameRef.current && 
                lastFrameRef.current && 
                referencePointsRef.current.length > 0 && 
                lastReferencePointsRef.current.length > 0) {
              
              // Match reference points between frames and calculate global motion vector
              const matchedPoints = matchReferencePoints(
                lastReferencePointsRef.current, 
                referencePointsRef.current,
                lastFrameRef.current,
                currentFrame,
                canvas.width,
                canvas.height
              );
              
              if (matchedPoints.length >= 3) {
                // Calculate average movement vector from matched points
                const movements = matchedPoints.map(match => ({
                  dx: match.current.x - match.previous.x,
                  dy: match.current.y - match.previous.y
                }));
                
                // Remove outliers (points with extreme movement)
                const validMovements = filterOutliers(movements);
                
                if (validMovements.length >= 2) {
                  // Calculate average movement
                  globalOffsetX = validMovements.reduce((sum, m) => sum + m.dx, 0) / validMovements.length;
                  globalOffsetY = validMovements.reduce((sum, m) => sum + m.dy, 0) / validMovements.length;
                  
                  // Draw drone movement vector on overlay canvas
                  overlayContext.strokeStyle = 'rgba(255, 255, 0, 0.7)';
                  overlayContext.lineWidth = 2;
                  overlayContext.beginPath();
                  const centerX = canvas.width / 2;
                  const centerY = canvas.height / 2;
                  overlayContext.moveTo(centerX, centerY);
                  overlayContext.lineTo(centerX + globalOffsetX * 10, centerY + globalOffsetY * 10);
                  overlayContext.stroke();
                  
                  // Draw label for drone movement
                  overlayContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
                  overlayContext.fillRect(10, 10, 200, 25);
                  overlayContext.font = '12px Arial';
                  overlayContext.fillStyle = 'white';
                  overlayContext.fillText(
                    `Drone: dx=${globalOffsetX.toFixed(1)}, dy=${globalOffsetY.toFixed(1)}`, 
                    15, 
                    25
                  );
                }
              }
            }
            
            // Store current reference points for next frame
            lastReferencePointsRef.current = [...referencePointsRef.current];
          }
          
          // Compare with last frame to detect motion (compensating for drone movement)
          if (lastFrameRef.current) {
            const lastFrame = lastFrameRef.current;
            const motionData = [];
            const blockSize = 16; // Size of blocks to analyze for motion
            const threshold = droneCompensation ? 35 : 30; // Higher threshold when compensation is on
            
            // Analyze blocks of pixels for changes
            for (let y = 0; y < canvas.height; y += blockSize) {
              for (let x = 0; x < canvas.width; x += blockSize) {
                let diffCount = 0;
                let totalDiff = 0;
                
                // Check a sampling of pixels in this block
                for (let by = 0; by < blockSize && y + by < canvas.height; by += 4) {
                  for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx += 4) {
                    // Calculate adjusted position based on global motion
                    let prevX = x + bx - globalOffsetX;
                    let prevY = y + by - globalOffsetY;
                    
                    // Check if the adjusted position is within frame boundaries
                    if (prevX >= 0 && prevX < canvas.width && prevY >= 0 && prevY < canvas.height) {
                      const currPos = ((y + by) * canvas.width + (x + bx)) * 4;
                      const prevPos = Math.floor(prevY * canvas.width + prevX) * 4;
                      
                      if (prevPos >= 0 && prevPos < lastFrame.data.length - 4) {
                        // Calculate difference between frames for this pixel
                        const rDiff = Math.abs(currentFrame.data[currPos] - lastFrame.data[prevPos]);
                        const gDiff = Math.abs(currentFrame.data[currPos + 1] - lastFrame.data[prevPos + 1]);
                        const bDiff = Math.abs(currentFrame.data[currPos + 2] - lastFrame.data[prevPos + 2]);
                        
                        const diff = (rDiff + gDiff + bDiff) / 3;
                        if (diff > threshold) {
                          diffCount++;
                          totalDiff += diff;
                        }
                      }
                    }
                  }
                }
                
                // If enough pixels changed, mark this as a motion point
                // More strict threshold when drone compensation is on
                const minDiffCount = droneCompensation ? 5 : 3;
                if (diffCount > minDiffCount) {
                  motionData.push({
                    x: x + blockSize / 2, 
                    y: y + blockSize / 2,
                    strength: Math.min(1, totalDiff / (255 * diffCount))
                  });
                }
              }
            }
            
            // Update motion points
            setMotionPoints(motionData);
          }
          
          // Save current frame for next comparison
          lastFrameRef.current = currentFrame;
          isFirstFrameRef.current = false;
          
          // Continue detection loop
          animationRef.current = requestAnimationFrame(detectMotion);
        }
      };
      
      // Start the detection loop
      detectMotion();
      
      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else if (!motionDetection && animationRef.current !== null) {
      // Stop motion detection
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
      setMotionPoints([]);
    }
  }, [motionDetection, droneCompensation, isVideo]);
  
  // Helper function to find good reference points for tracking
  const findReferencePoints = (imageData: ImageData, width: number, height: number): {x: number, y: number}[] => {
    const points: {x: number, y: number, score: number}[] = [];
    const blockSize = 32;
    const sampleSize = 16;
    
    // Divide image into blocks and calculate variance
    for (let y = blockSize; y < height - blockSize; y += blockSize) {
      for (let x = blockSize; x < width - blockSize; x += blockSize) {
        // Sample pixels around this point to calculate variance
        let values: number[] = [];
        
        for (let dy = -sampleSize/2; dy < sampleSize/2; dy++) {
          for (let dx = -sampleSize/2; dx < sampleSize/2; dx++) {
            const pixelPos = ((y + dy) * width + (x + dx)) * 4;
            if (pixelPos >= 0 && pixelPos < imageData.data.length - 4) {
              const r = imageData.data[pixelPos];
              const g = imageData.data[pixelPos + 1];
              const b = imageData.data[pixelPos + 2];
              // Convert to grayscale
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              values.push(gray);
            }
          }
        }
        
        // Calculate variance (higher variance = better tracking point)
        if (values.length > 0) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          
          // Only consider points with high variance (high contrast areas)
          if (variance > 300) {
            points.push({x, y, score: variance});
          }
        }
      }
    }
    
    // Sort by variance score and return top points
    return points.sort((a, b) => b.score - a.score).slice(0, 15).map(p => ({x: p.x, y: p.y}));
  };
  
  // Helper function to match reference points between frames
  const matchReferencePoints = (
    prevPoints: {x: number, y: number}[],
    currPoints: {x: number, y: number}[],
    prevFrame: ImageData,
    currFrame: ImageData,
    width: number,
    height: number
  ) => {
    const matches: {previous: {x: number, y: number}, current: {x: number, y: number}, score: number}[] = [];
    const patchSize = 11; // Size of patch to compare
    
    // For each previous point, find best matching current point
    for (const prevPoint of prevPoints) {
      let bestMatch = { point: null as {x: number, y: number} | null, score: 999999 };
      
      for (const currPoint of currPoints) {
        // Calculate difference between patches
        let totalDiff = 0;
        let samplesCompared = 0;
        
        // Compare patches around the points
        for (let dy = -patchSize/2; dy <= patchSize/2; dy++) {
          for (let dx = -patchSize/2; dx <= patchSize/2; dx++) {
            const prevX = prevPoint.x + dx;
            const prevY = prevPoint.y + dy;
            const currX = currPoint.x + dx;
            const currY = currPoint.y + dy;
            
            // Ensure positions are within frame
            if (prevX >= 0 && prevX < width && prevY >= 0 && prevY < height &&
                currX >= 0 && currX < width && currY >= 0 && currY < height) {
              const prevPos = (prevY * width + prevX) * 4;
              const currPos = (currY * width + currX) * 4;
              
              if (prevPos >= 0 && prevPos < prevFrame.data.length - 4 &&
                  currPos >= 0 && currPos < currFrame.data.length - 4) {
                // Calculate RGB difference
                const rDiff = Math.abs(prevFrame.data[prevPos] - currFrame.data[currPos]);
                const gDiff = Math.abs(prevFrame.data[prevPos + 1] - currFrame.data[currPos + 1]);
                const bDiff = Math.abs(prevFrame.data[prevPos + 2] - currFrame.data[currPos + 2]);
                
                totalDiff += (rDiff + gDiff + bDiff) / 3;
                samplesCompared++;
              }
            }
          }
        }
        
        // Calculate average difference
        const avgDiff = samplesCompared > 0 ? totalDiff / samplesCompared : 9999;
        
        // Update best match if this is better
        if (avgDiff < bestMatch.score) {
          bestMatch = { point: currPoint, score: avgDiff };
        }
      }
      
      // If we found a good match with low difference
      if (bestMatch.point && bestMatch.score < 50) {
        matches.push({
          previous: prevPoint,
          current: bestMatch.point,
          score: bestMatch.score
        });
      }
    }
    
    return matches;
  };
  
  // Helper function to filter outliers in movement vectors
  const filterOutliers = (movements: {dx: number, dy: number}[]) => {
    if (movements.length <= 3) return movements;
    
    // Calculate median values
    const sortedX = [...movements].sort((a, b) => a.dx - b.dx);
    const sortedY = [...movements].sort((a, b) => a.dy - b.dy);
    const medianX = sortedX[Math.floor(sortedX.length / 2)].dx;
    const medianY = sortedY[Math.floor(sortedY.length / 2)].dy;
    
    // Filter points that are too far from median
    return movements.filter(m => {
      const xDiff = Math.abs(m.dx - medianX);
      const yDiff = Math.abs(m.dy - medianY);
      return xDiff < 8 && yDiff < 8;
    });
  };
  
  // Get the appropriate badge colors based on animal type
  const getBadgeStyle = (animalName: string): string => {
    const animalClass = getAnimalClassification(animalName);
    
    switch (animalClass) {
      case 'invasive':
        return 'bg-red-100 border-red-600 text-red-800';
      case 'domestic':
        return 'bg-blue-100 border-blue-600 text-blue-800';
      case 'predator':
        return 'bg-orange-100 border-orange-600 text-orange-800';
      case 'herbivore':
        return 'bg-green-100 border-green-600 text-green-800';
      default:
        return 'bg-purple-100 border-purple-600 text-purple-800';
    }
  };
  
  // Toggle motion detection
  const toggleMotionDetection = () => {
    // Only allow toggling on videos
    if (!isVideo) {
      toast({
        title: "Sensor de movimento",
        description: "Detecção de movimento disponível apenas para vídeos.",
      });
      return;
    }
    
    if (!motionDetection) {
      toast({
        title: "Sensor de movimento ativado",
        description: "Monitorando movimentos no vídeo em tempo real.",
      });
    }
    
    setMotionDetection(!motionDetection);
  };

  // Toggle drone movement compensation
  const toggleDroneCompensation = () => {
    if (!isVideo || !motionDetection) {
      toast({
        title: "Compensação de drone",
        description: "Ative primeiro o sensor de movimento.",
      });
      return;
    }
    
    setDroneCompensation(!droneCompensation);
    
    toast({
      title: droneCompensation ? "Compensação de drone desativada" : "Compensação de drone ativada",
      description: droneCompensation 
        ? "Detector de movimento padrão restaurado." 
        : "Compensando o movimento do drone para melhor detecção de animais.",
    });

    // Reset detection when toggling compensation
    lastFrameRef.current = null;
    isFirstFrameRef.current = true;
  };
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative">
          {isVideo ? (
            <>
              <video 
                ref={videoRef}
                controls
                className="w-full h-64 object-cover"
                onError={(e) => {
                  console.error("Error loading video:", e);
                  e.currentTarget.poster = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-64 pointer-events-none opacity-0"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-64 pointer-events-none"
                style={{ opacity: motionDetection ? 0.9 : 0 }}
              />
              {motionDetection && motionPoints.map((point, i) => (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(point.x / (canvasRef.current?.width || 1)) * 100}%`,
                    top: `${(point.y / (canvasRef.current?.height || 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                >
                  <div 
                    className="animate-ping rounded-full bg-red-500"
                    style={{
                      width: `${12 + point.strength * 16}px`,
                      height: `${12 + point.strength * 16}px`,
                      opacity: 0.5 + point.strength * 0.3
                    }}
                  />
                </div>
              ))}
            </>
          ) : (
            <img 
              src={imageUrl} 
              alt="Animal" 
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          )}
          
          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                <p>Analisando {isVideo ? 'vídeo' : 'imagem'}...</p>
              </div>
            </div>
          )}
          
          {animals.length > 0 && !isAnalyzing && (
            <>
              {/* Warning badge for invasive species */}
              {hasInvasiveSpecies && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                    <AlertTriangle size={14} />
                    <span>Espécie Invasora</span>
                  </Badge>
                </div>
              )}
              
              {/* Video indicator */}
              {isVideo && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    <Frame size={14} />
                    <span>Detecção em vídeo</span>
                  </Badge>
                </div>
              )}
              
              {/* Animal counter */}
              {animals.length > 1 && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    {animals.length} animais detectados
                  </Badge>
                </div>
              )}
            </>
          )}
          
          {/* Control buttons for videos - motion detection and drone compensation */}
          {animals.length > 0 && !isAnalyzing && isVideo && (
            <div className="absolute bottom-2 left-2 flex gap-2">
              <Button 
                size="sm"
                variant={motionDetection ? "default" : "outline"}
                className={`flex items-center gap-1 text-xs ${
                  motionDetection ? 'bg-red-600 hover:bg-red-700' : 'bg-black/50 hover:bg-black/70 text-white border-none'
                }`}
                onClick={toggleMotionDetection}
              >
                {motionDetection ? (
                  <>
                    <Radar size={14} />
                    <span>Sensor ativo</span>
                  </>
                ) : (
                  <>
                    <Target size={14} />
                    <span>Detectar movimento</span>
                  </>
                )}
              </Button>
              
              {motionDetection && (
                <Button 
                  size="sm"
                  variant={droneCompensation ? "default" : "outline"}
                  className={`flex items-center gap-1 text-xs ${
                    droneCompensation ? 'bg-green-600 hover:bg-green-700' : 'bg-black/50 hover:bg-black/70 text-white border-none'
                  }`}
                  onClick={toggleDroneCompensation}
                  title="Compensar movimento do drone"
                >
                  <MoveVertical size={14} />
                  <span>Compensar drone</span>
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Details panel */}
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
                    className={getBadgeStyle(animal.name)}
                  >
                    {animal.name} - {formatConfidence(animal.confidence)}
                  </Badge>
                ))}
              </div>
              
              {showDetails && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Detalhes</h4>
                  {animals.map((animal, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {getDetailedSpecies(animal.name)}
                        </span>
                        <Badge 
                          variant={isInvasiveSpecies(animal.name) ? "destructive" : "outline"} 
                          className={getBadgeStyle(animal.name)}
                        >
                          {formatConfidence(animal.confidence)}
                        </Badge>
                      </div>
                      {animal.description && (
                        <p className="text-sm mt-1 text-gray-600">{animal.description}</p>
                      )}
                    </div>
                  ))}
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
    </Card>
  );
}
