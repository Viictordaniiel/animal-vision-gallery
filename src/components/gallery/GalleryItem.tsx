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
  const [motionPoints, setMotionPoints] = useState<{x: number, y: number, strength: number, animalType?: string}[]>([]);
  const lastFrameRef = useRef<ImageData | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const referencePointsRef = useRef<{x: number, y: number}[]>([]);
  const lastReferencePointsRef = useRef<{x: number, y: number}[]>([]);
  const frameCountRef = useRef<number>(0);
  const isFirstFrameRef = useRef<boolean>(true);
  const motionHistoryRef = useRef<{x: number, y: number, strength: number, time: number, animalType?: string}[]>([]);
  const animalDetectionZonesRef = useRef<{x1: number, y1: number, x2: number, y2: number, animalType: string}[]>([]);
  const detectedMotionRegionsRef = useRef<{x1: number, y1: number, x2: number, y2: number, confidence: number, animalType: string}[]>([]);
  
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

  // Get the primary animal for motion targeting
  const getPrimaryAnimalForTracking = (): Animal | null => {
    if (animals.length === 0) return null;
    
    // Prioritize invasive species if present
    if (primaryInvasiveAnimal) return primaryInvasiveAnimal;
    
    // Otherwise, use the animal with highest confidence
    return animals.sort((a, b) => b.confidence - a.confidence)[0];
  };

  // Calculate animal detection zones based on detected species - IMPROVED
  useEffect(() => {
    if (animals.length > 0 && canvasRef.current) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      
      // Create detection zones based on animal types to focus motion tracking
      const zones: {x1: number, y1: number, x2: number, y2: number, animalType: string}[] = [];
      
      // Enhanced zone targeting with more granular animal-specific zones
      animals.forEach(animal => {
        const animalClass = getAnimalClassification(animal.name);
        const confidence = animal.confidence;
        
        // Scale the zone based on detection confidence
        // Higher confidence = larger zones focused on animal characteristics
        const confidenceScaling = 0.5 + (confidence * 0.5); // Scale from 50% to 100% based on confidence
        
        if (animalClass === 'invasive') {
          // For invasive species like wild boars, focus heavily on bottom half (ground level)
          // but also add a smaller focus area in the middle (for when they stand up)
          
          // Main ground-level detection zone
          zones.push({
            x1: 0,
            y1: height * (0.5 - (0.1 * confidenceScaling)), // Top edge moves up with higher confidence
            x2: width,
            y2: height,
            animalType: 'invasive'
          });
          
          // Secondary mid-frame detection zone (smaller)
          zones.push({
            x1: width * 0.2,
            y1: height * 0.3,
            x2: width * 0.8,
            y2: height * 0.6,
            animalType: 'invasive'
          });
        } 
        else if (animalClass === 'predator') {
          // For predators, create multiple overlapping detection zones
          // covering different heights since they can move at various levels
          
          // Full frame detection (lower priority)
          zones.push({
            x1: 0,
            y1: 0,
            x2: width,
            y2: height,
            animalType: 'predator'
          });
          
          // Mid-level focus area (higher priority)
          zones.push({
            x1: width * 0.1,
            y1: height * 0.2,
            x2: width * 0.9,
            y2: height * 0.8,
            animalType: 'predator-mid'
          });
          
          // Ground-level focus (higher priority for most predators)
          zones.push({
            x1: width * 0.1,
            y1: height * 0.4,
            x2: width * 0.9,
            y2: height,
            animalType: 'predator-ground'
          });
        } 
        else if (animalClass === 'herbivore') {
          // For herbivores, focus primarily on middle to lower areas
          // Wide horizontally to catch grazing movement
          zones.push({
            x1: 0,
            y1: height * 0.3,
            x2: width,
            y2: height * 0.9,
            animalType: 'herbivore'
          });
          
          // Add second zone for head level movements
          zones.push({
            x1: width * 0.2,
            y1: height * 0.2,
            x2: width * 0.8,
            y2: height * 0.5,
            animalType: 'herbivore-head'
          });
        }
        else if (animalClass === 'domestic') {
          // For domestic animals like dogs, create zones based on typical movement patterns
          zones.push({
            x1: 0,
            y1: height * 0.4,
            x2: width,
            y2: height,
            animalType: 'domestic-body'
          });
          
          // Head/tail movement zone
          zones.push({
            x1: width * 0.1,
            y1: height * 0.2,
            x2: width * 0.9,
            y2: height * 0.6,
            animalType: 'domestic-head'
          });
        }
        else {
          // For unclassified animals, use a generic detection zone
          zones.push({
            x1: 0,
            y1: 0,
            x2: width,
            y2: height,
            animalType: 'generic'
          });
        }
      });
      
      // If no specific zones defined, monitor the whole frame
      if (zones.length === 0) {
        zones.push({
          x1: 0,
          y1: 0,
          x2: width,
          y2: height,
          animalType: 'generic'
        });
      }
      
      animalDetectionZonesRef.current = zones;
      
      // Initialize empty detection regions
      detectedMotionRegionsRef.current = [];
    }
  }, [animals, hasInvasiveSpecies]);
  
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
            
            // Ensure positions are within frame boundaries
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

  // IMPROVED: Function to detect animal-like movement patterns
  const isAnimalMovement = (
    motionHistory: {x: number, y: number, strength: number, time: number, animalType?: string}[], 
    newPoint: {x: number, y: number, strength: number},
    animalType?: string
  ): boolean => {
    // If we don't have enough history yet, consider all movement as potential animal movement
    if (motionHistory.length < 5) return true;
    
    // Get the primary detected animal for targeted tracking
    const primaryAnimal = getPrimaryAnimalForTracking();
    const primaryAnimalClass = primaryAnimal ? getAnimalClassification(primaryAnimal.name) : 'generic';
    
    // Enhanced movement pattern detection based on animal type
    let isAnimalPattern = false;
    
    // Check if the motion is within any detection zone
    const isInDetectionZone = animalDetectionZonesRef.current.some(zone => 
      newPoint.x >= zone.x1 && newPoint.x <= zone.x2 && 
      newPoint.y >= zone.y1 && newPoint.y <= zone.y2 &&
      (!animalType || zone.animalType.includes(animalType))
    );
    
    if (!isInDetectionZone) return false;
    
    // Get recent motion points from the last 1 second (assuming 30fps)
    const recentMotion = motionHistory.slice(-30);
    
    // Calculate motion statistics
    const avgStrength = recentMotion.reduce((sum, p) => sum + p.strength, 0) / recentMotion.length;
    
    // Calculate speed and direction changes
    let directionChanges = 0;
    let consistentDirection = 0;
    let lastDx = 0;
    let lastDy = 0;
    
    for (let i = 1; i < recentMotion.length; i++) {
      const dx = recentMotion[i].x - recentMotion[i-1].x;
      const dy = recentMotion[i].y - recentMotion[i-1].y;
      
      if (i > 1) {
        // Check for direction changes (sign changes in dx or dy)
        if ((dx * lastDx <= 0 && dx !== 0 && lastDx !== 0) || 
            (dy * lastDy <= 0 && dy !== 0 && lastDy !== 0)) {
          directionChanges++;
        }
        
        // Check for consistent direction
        if ((dx * lastDx > 0) || (dy * lastDy > 0)) {
          consistentDirection++;
        }
      }
      
      lastDx = dx;
      lastDy = dy;
    }
    
    // Calculate spatial variance (how spread out the motion is)
    const xValues = recentMotion.map(p => p.x);
    const yValues = recentMotion.map(p => p.y);
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
    const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xValues.length;
    const yVariance = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yValues.length;
    const spatialVariance = Math.sqrt(xVariance + yVariance);
    
    // ENHANCED: Dynamic thresholds based on the specific animal detected
    let directionChangeThreshold = 3; // Default threshold
    let consistencyThreshold = 5;
    let strengthThreshold = 0.3;
    let spatialVarianceMin = 5;
    let spatialVarianceMax = 200;
    
    // Adaptive thresholds based on animal types
    if (primaryAnimalClass === 'invasive') {
      // Wild boars move with more consistency, strength, and sometimes in groups
      directionChangeThreshold = 2;
      consistencyThreshold = 7;
      strengthThreshold = 0.35;
      spatialVarianceMin = 8;
      spatialVarianceMax = 250; // Allow for group movement
    }
    else if (primaryAnimalClass === 'predator') {
      // Predators may move strategically with pauses and direction changes
      directionChangeThreshold = 4;
      consistencyThreshold = 4;
      strengthThreshold = 0.25;
      spatialVarianceMin = 4;
      spatialVarianceMax = 180;
    }
    else if (primaryAnimalClass === 'herbivore') {
      // Herbivores like deer may be more jittery with quick movements
      directionChangeThreshold = 5;
      consistencyThreshold = 3;
      strengthThreshold = 0.28;
      spatialVarianceMin = 6;
      spatialVarianceMax = 220;
    }
    else if (primaryAnimalClass === 'domestic') {
      // Domestic animals like dogs have varied, playful movements
      directionChangeThreshold = 6;
      consistencyThreshold = 4;
      strengthThreshold = 0.25;
      spatialVarianceMin = 8;
      spatialVarianceMax = 250;
    }
    
    // Check if the movement matches animal patterns
    const hasAnimalStrength = newPoint.strength > strengthThreshold;
    const hasAnimalDirectionChanges = directionChanges >= directionChangeThreshold;
    const hasAnimalConsistency = consistentDirection >= consistencyThreshold;
    const hasAppropriateVariance = spatialVariance > spatialVarianceMin && spatialVariance < spatialVarianceMax;
    
    // Different animal classes have different movement patterns
    if (primaryAnimalClass === 'invasive') {
      // Invasive species like wild boars often move in consistent directions with strength
      isAnimalPattern = hasAnimalStrength && hasAnimalConsistency && hasAppropriateVariance;
    } 
    else if (primaryAnimalClass === 'predator') {
      // Predators may have more direction changes and deliberate movements
      isAnimalPattern = hasAnimalStrength && hasAnimalDirectionChanges && hasAppropriateVariance;
    } 
    else if (primaryAnimalClass === 'herbivore') {
      // Herbivores may have quick, jittery movements with less consistency
      isAnimalPattern = hasAnimalStrength && (hasAnimalDirectionChanges || hasAppropriateVariance);
    }
    else if (primaryAnimalClass === 'domestic') {
      // Domestic animals like dogs have playful, varied movements
      isAnimalPattern = hasAnimalStrength && (hasAnimalDirectionChanges || hasAnimalConsistency);
    }
    else {
      // Generic animal detection
      isAnimalPattern = (hasAnimalStrength && hasAnimalDirectionChanges) || 
                        (hasAnimalStrength && hasAnimalConsistency && hasAppropriateVariance);
    }
    
    return isAnimalPattern;
  };

  // IMPROVED: Dynamic region detection to focus on areas with consistent animal-like movement
  const updateDetectedRegions = (newMotionPoint: {x: number, y: number, strength: number, animalType?: string}) => {
    // Only update regions if we have adequate motion history
    if (motionHistoryRef.current.length < 15) return;
    
    const recentHistory = motionHistoryRef.current.slice(-30);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Group motion points by proximity to identify potential animal regions
    const cellSize = 50; // Size of grid cells for clustering
    const motionHeatmap: { [key: string]: { count: number, avgStrength: number, points: {x: number, y: number}[] } } = {};
    
    // Create a density heatmap of recent motion
    recentHistory.forEach(point => {
      // Quantize point to grid cell
      const cellX = Math.floor(point.x / cellSize);
      const cellY = Math.floor(point.y / cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!motionHeatmap[cellKey]) {
        motionHeatmap[cellKey] = { count: 0, avgStrength: 0, points: [] };
      }
      
      motionHeatmap[cellKey].count++;
      motionHeatmap[cellKey].avgStrength = 
        (motionHeatmap[cellKey].avgStrength * (motionHeatmap[cellKey].count - 1) + point.strength) / 
        motionHeatmap[cellKey].count;
      motionHeatmap[cellKey].points.push({x: point.x, y: point.y});
    });
    
    // Convert heatmap to regions by finding cells with sufficient activity
    const newRegions: {x1: number, y1: number, x2: number, y2: number, confidence: number, animalType: string}[] = [];
    
    Object.entries(motionHeatmap).forEach(([cellKey, data]) => {
      // Only consider cells with enough motion points
      if (data.count >= 5 && data.avgStrength > 0.3) {
        // Calculate region boundaries from all points in this cell
        const xValues = data.points.map(p => p.x);
        const yValues = data.points.map(p => p.y);
        
        const minX = Math.max(0, Math.min(...xValues) - cellSize/2);
        const minY = Math.max(0, Math.min(...yValues) - cellSize/2);
        const maxX = Math.min(width, Math.max(...xValues) + cellSize/2);
        const maxY = Math.min(height, Math.max(...yValues) + cellSize/2);
        
        // Calculate confidence based on point count and average strength
        const confidence = Math.min(1, (data.count / 30) * data.avgStrength * 2);
        
        // Get the primary animal for this region
        const primaryAnimal = getPrimaryAnimalForTracking();
        const animalType = primaryAnimal 
          ? getAnimalClassification(primaryAnimal.name) 
          : 'generic';
        
        // Create the detection region
        newRegions.push({
          x1: minX,
          y1: minY,
          x2: maxX,
          y2: maxY,
          confidence,
          animalType
        });
      }
    });
    
    // Merge overlapping regions
    const mergedRegions = mergeOverlappingRegions(newRegions);
    
    // Update the detection regions
    detectedMotionRegionsRef.current = mergedRegions;
  };
  
  // Helper to merge overlapping detection regions
  const mergeOverlappingRegions = (regions: {x1: number, y1: number, x2: number, y2: number, confidence: number, animalType: string}[]) => {
    if (regions.length <= 1) return regions;
    
    const merged: {x1: number, y1: number, x2: number, y2: number, confidence: number, animalType: string}[] = [];
    
    // Sort regions by size (area)
    const sortedRegions = [...regions].sort((a, b) => {
      const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
      const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
      return areaB - areaA; // Largest first
    });
    
    // Start with the largest region
    merged.push(sortedRegions[0]);
    
    // Try to merge remaining regions
    for (let i = 1; i < sortedRegions.length; i++) {
      const region = sortedRegions[i];
      let wasMerged = false;
      
      // Try to merge with existing merged regions
      for (let j = 0; j < merged.length; j++) {
        const mergedRegion = merged[j];
        
        // Check if regions overlap
        const overlaps = !(
          region.x2 < mergedRegion.x1 ||
          region.x1 > mergedRegion.x2 ||
          region.y2 < mergedRegion.y1 ||
          region.y1 > mergedRegion.y2
        );
        
        if (overlaps) {
          // Merge by taking the union of both regions
          merged[j] = {
            x1: Math.min(region.x1, mergedRegion.x1),
            y1: Math.min(region.y1, mergedRegion.y1),
            x2: Math.max(region.x2, mergedRegion.x2),
            y2: Math.max(region.y2, mergedRegion.y2),
            // Take higher confidence
            confidence: Math.max(region.confidence, mergedRegion.confidence),
            // Keep the animal type of the higher confidence region
            animalType: mergedRegion.confidence > region.confidence 
              ? mergedRegion.animalType 
              : region.animalType
          };
          
          wasMerged = true;
          break;
        }
      }
      
      // If region couldn't be merged with any existing region, add it as new
      if (!wasMerged) {
        merged.push(region);
      }
    }
    
    // Limit to top 3 regions by confidence
    return merged
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  };
  
  // Toggle motion detection with drone movement compensation
  useEffect(() => {
    if (isVideo && motionDetection && videoRef.current && canvasRef.current && contextRef.current) {
      // Reset previous motion detection
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        lastFrameRef.current = null;
        isFirstFrameRef.current = true;
        frameCountRef.current = 0;
        motionHistoryRef.current = [];
        detectedMotionRegionsRef.current = [];
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
          
          // IMPROVED: Compare with last frame to detect motion (compensating for drone movement)
          // Focus on detected animal regions for better targeting
          if (lastFrameRef.current) {
            const lastFrame = lastFrameRef.current;
            const motionData = [];
            const blockSize = 8; // Smaller block size for more detailed detection - IMPROVED
            const threshold = droneCompensation ? 28 : 22; // Lower threshold for better sensitivity - IMPROVED
            
            // Get the primary animal for targeting
            const primaryAnimal = getPrimaryAnimalForTracking();
            const animalClass = primaryAnimal ? getAnimalClassification(primaryAnimal.name) : 'generic';
            
            // IMPROVED: Adapt sampling density based on animal type
            // More precise sampling for smaller/faster animals
            let samplingDensity = 2; // Check every 2nd pixel by default
            
            if (animalClass === 'invasive' || animalClass === 'predator') {
              samplingDensity = 2; // More precise for invasive species / predators
            } else if (animalClass === 'herbivore') {
              samplingDensity = 3; // Medium precision for herbivores
            } else {
              samplingDensity = 3; // Default for others
            }
            
            // First, check if we have active detection regions from previous frames
            const detectionRegions = detectedMotionRegionsRef.current;
            const hasActiveRegions = detectionRegions.length > 0;
            
            // Priority areas to check first (either from previous detection or animal zones)
            let priorityAreas: {x1: number, y1: number, x2: number, y2: number, priority: number}[] = [];
            
            // If we have active regions, prioritize them
            if (hasActiveRegions) {
              priorityAreas = detectionRegions.map(region => ({
                x1: region.x1,
                y1: region.y1,
                x2: region.x2,
                y2: region.y2,
                priority: region.confidence * 100 // Higher confidence = higher priority
              }));
            }
            
            // Add animal detection zones as secondary priority areas
            animalDetectionZonesRef.current.forEach(zone => {
              // Calculate priority based on zone type and animal confidence
              let zonePriority = 50; // Base priority
              
              // Adjust priority based on zone type
              if (zone.animalType.includes(animalClass)) {
                zonePriority += 30; // Boost priority if zone matches detected animal
              }
              
              // Add zone to priority areas
              priorityAreas.push({
                x1: zone.x1,
                y1: zone.y1,
                x2: zone.x2,
                y2: zone.y2,
                priority: zonePriority
              });
            });
            
            // Sort priority areas by priority (highest first)
            priorityAreas.sort((a, b) => b.priority - a.priority);
            
            // IMPROVED: Two-pass detection strategy
            // First pass: scan priority areas with high precision
            for (const area of priorityAreas) {
              // Skip if area is invalid
              if (area.x2 <= area.x1 || area.y2 <= area.y1) continue;
              
              // Higher precision in priority areas
              const areaSamplingDensity = Math.max(1, samplingDensity - 1);
              
              // Analyze blocks of pixels for changes in this area
              for (let y = area.y1; y < area.y2; y += blockSize) {
                for (let x = area.x1; x < area.x2; x += blockSize) {
                  let diffCount = 0;
                  let totalDiff = 0;
                  
                  // Check a sampling of pixels in this block
                  for (let by = 0; by < blockSize && y + by < canvas.height; by += areaSamplingDensity) {
                    for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx += areaSamplingDensity) {
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
                          
                          // Lower threshold in priority areas
                          const areaThreshold = threshold * 0.9;
                          
                          if (diff > areaThreshold) {
                            diffCount++;
                            totalDiff += diff;
                          }
                        }
                      }
                    }
                  }
                  
                  // IMPROVED: Adaptive threshold based on area priority
                  // Higher priority areas need fewer changed pixels to be considered motion
                  const minDiffCount = Math.max(3, 6 - Math.floor(area.priority / 20));
                  
                  if (diffCount > minDiffCount) {
                    // Create a motion point with animal type info
                    const motionPoint = {
                      x: x + blockSize / 2, 
                      y: y + blockSize / 2,
                      strength: Math.min(1, totalDiff / (255 * diffCount)),
                      animalType: animalClass
                    };
                    
                    // Add timestamp to motion point for tracking
                    const timestamp = Date.now();
                    
                    // IMPROVED: Only add points that match animal movement patterns
                    if (isAnimalMovement(motionHistoryRef.current, motionPoint, animalClass)) {
                      motionHistoryRef.current.push({
                        ...motionPoint,
                        time: timestamp
                      });
                      
                      motionData.push(motionPoint);
                    }
                  }
                }
              }
            }
            
            // Second pass: quick scan of the rest of the frame at lower resolution
            if (motionData.length < 5) { // Only if we didn't find much in priority areas
              // Scan the whole frame at lower resolution
              for (let y = 0; y < canvas.height; y += blockSize * 2) {
                for (let x = 0; x < canvas.width; x += blockSize * 2) {
                  // Skip areas we've already processed in priority pass
                  if (priorityAreas.some(area => 
                    x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2
                  )) {
                    continue;
                  }
                  
                  let diffCount = 0;
                  let totalDiff = 0;
                  
                  // Scan at lower resolution
                  for (let by = 0; by < blockSize * 2 && y + by < canvas.height; by += samplingDensity * 2) {
                    for (let bx = 0; bx < blockSize * 2 && x + bx < canvas.width; bx += samplingDensity * 2) {
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
                  
                  // Higher threshold for non-priority areas
                  const minDiffCount = droneCompensation ? 5 : 4;
                  
                  if (diffCount > minDiffCount) {
                    const motionPoint = {
                      x: x + blockSize, 
                      y: y + blockSize,
                      strength: Math.min(1, totalDiff / (255 * diffCount))
                    };
                    
                    // Add timestamp to motion point
                    const timestamp = Date.now();
                    
                    // Only add points that match animal movement patterns
                    if (isAnimalMovement(motionHistoryRef.current, motionPoint)) {
                      motionHistoryRef.current.push({
                        ...motionPoint,
                        time: timestamp
                      });
                      
                      motionData.push(motionPoint);
                    }
                  }
                }
              }
            }
            
            // Limit motion history size
            if (motionHistoryRef.current.length > 120) {
              motionHistoryRef.current = motionHistoryRef.current.slice(-120);
            }
            
            // Update motion points
            setMotionPoints(motionData);
            
            // Update detected motion regions (every 5 frames)
            if (frameCountRef.current % 5 === 0 && motionData.length > 0) {
              // Use the most confident motion point to update regions
              const strongestPoint = [...motionData].sort((a, b) => b.strength - a.strength)[0];
              updateDetectedRegions(strongestPoint);
            }
            
            // IMPROVED: Visualization of detection regions and animal zones
            // Draw detection zones on overlay with labels
            overlayContext.lineWidth = 2;
            
            // Draw active motion regions
            detectedMotionRegionsRef.current.forEach(region => {
              // Color based on confidence (green to red gradient)
              const intensity = Math.min(255, Math.round(region.confidence * 255));
              const r = intensity;
              const g = 255 - intensity;
              const b = 0;
              
              overlayContext.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
              overlayContext.strokeRect(
                region.x1, 
                region.y1, 
                region.x2 - region.x1, 
                region.y2 - region.y1
              );
              
              // Label for the region
              overlayContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
              overlayContext.fillRect(region.x1, region.y1 - 20, 100, 20);
              overlayContext.font = '12px Arial';
              overlayContext.fillStyle = 'white';
              overlayContext.fillText(
                `${region.animalType.charAt(0).toUpperCase() + region.animalType.slice(1)} ${(region.confidence * 100).toFixed(0)}%`, 
                region.x1 + 5, 
                region.y1 - 5
              );
            });
            
            // Every 30 frames, draw the animal detection zones (less frequently to reduce visual clutter)
            if (frameCountRef.current % 30 === 0) {
              animalDetectionZonesRef.current.forEach(zone => {
                // Different colors for different animal types
                let zoneColor = 'rgba(0, 255, 0, 0.3)'; // Default
                
                if (zone.animalType.includes('invasive')) {
                  zoneColor = 'rgba(255, 0, 0, 0.3)';
                } else if (zone.animalType.includes('predator')) {
                  zoneColor = 'rgba(255, 165, 0, 0.3)';
                } else if (zone.animalType.includes('herbivore')) {
                  zoneColor = 'rgba(0, 128, 0, 0.3)';
                } else if (zone.animalType.includes('domestic')) {
                  zoneColor = 'rgba(0, 0, 255, 0.3)';
                }
                
                overlayContext.strokeStyle = zoneColor;
                overlayContext.setLineDash([5, 5]); // Dashed lines for zones
                overlayContext.strokeRect(
                  zone.x1, 
                  zone.y1, 
                  zone.x2 - zone.x1, 
                  zone.y2 - zone.y1
                );
                overlayContext.setLineDash([]); // Reset to solid lines
              });
            }
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
      
      // Automatically activate the detection after a small delay to let the video initialize
      setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          toast({
            title: "Sensor de movimento ativado",
            description: "O algoritmo aprimorado está monitorando os animais em tempo real.",
          });
        }
      }, 500);
      
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
      motionHistoryRef.current = [];
    }
  }, [motionDetection, droneCompensation, isVideo, animals, hasInvasiveSpecies]);
  
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
  
  // Autostart motion detection for videos
  useEffect(() => {
    if (isVideo && !motionDetection && animals.length > 0 && !isAnalyzing) {
      // Auto-activate motion detection after video analysis
      setMotionDetection(true);
    }
  }, [isVideo, animals, isAnalyzing, motionDetection]);
  
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
                autoPlay
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
              {motionDetection && motionPoints.map((point, i) => {
                // IMPROVED: Color and size based on animal type and confidence
                let pointColor = 'rgba(255, 0, 0, 0.8)'; // Default red
                let baseSize = 12;
                
                // Determine size and color based on animal type
                if (point.animalType) {
                  switch (point.animalType) {
                    case 'invasive':
                      pointColor = 'rgba(255, 0, 0, 0.8)'; // Red for invasive
                      baseSize = 14;
                      break;
                    case 'predator':
                      pointColor = 'rgba(255, 140, 0, 0.8)'; // Orange for predators
                      baseSize = 13;
                      break;
                    case 'herbivore':
                      pointColor = 'rgba(0, 180, 0, 0.8)'; // Green for herbivores
                      baseSize = 12;
                      break;
                    case 'domestic':
                      pointColor = 'rgba(30, 144, 255, 0.8)'; // Blue for domestic
                      baseSize = 12;
                      break;
                    default:
                      pointColor = 'rgba(255, 0, 100, 0.8)'; // Pink for others
                      baseSize = 10;
                  }
                }
                
                // Calculate size based on motion strength
                const size = baseSize + point.strength * 20;
                
                return (
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
                      className="animate-ping rounded-full"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: pointColor,
                        opacity: 0.6 + point.strength * 0.4
                      }}
                    />
                  </div>
                );
              })}
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
