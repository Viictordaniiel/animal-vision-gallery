
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, Target, Move, Shield, Crosshair } from 'lucide-react';

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
  const detectionBoxRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingQuality, setTrackingQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Enhanced detection function to classify invasive species
  const isInvasiveSpecies = (animalName: string): boolean => {
    const invasiveTerms = [
      'javali', 'porco', 'cateto', 'queixada', 'suíno', 'suino', 'wild boar', 'wild pig'
    ];
    const lowerName = animalName.toLowerCase();
    return invasiveTerms.some(term => lowerName.includes(term));
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
  
  useEffect(() => {
    // Set up video playback if this is a video element
    if (isVideo && videoRef.current) {
      videoRef.current.src = imageUrl;
      
      // Add event listeners for video playback to update detection box
      const handleVideoPlay = () => {
        console.log("Video playback started");
        setIsTracking(true);
      };
      
      const handleVideoPause = () => {
        console.log("Video playback paused");
        setIsTracking(false);
      };
      
      const handleVideoEnded = () => {
        console.log("Video playback ended");
        setIsTracking(false);
      };
      
      // Enhanced tracking events for the detection rectangle with advanced motion tracking simulation
      const handleTimeUpdate = () => {
        if (hasInvasiveSpecies && detectionBoxRef.current && videoRef.current) {
          // Get current playback position
          const videoProgress = videoRef.current.currentTime;
          const videoDuration = videoRef.current.duration || 1;
          const progressPercent = videoProgress / videoDuration;
          
          // Generate more natural-looking motion patterns based on time
          // More focused tracking pattern with reduced jitter for better precision
          
          // Base movement path - using sin and cos with offsets to create natural path
          const baseX = Math.sin(progressPercent * Math.PI * 3) * 8;
          const baseY = Math.cos(progressPercent * Math.PI * 2) * 6;
          
          // Add some randomized micro-movements based on frame position
          // Use deterministic pattern based on the current time to make it look consistent
          const microX = Math.sin(videoProgress * 2) * 2;
          const microY = Math.cos(videoProgress * 3) * 2;
          
          // Add "detection jitter" to simulate tracking algorithm adjustments
          // Reduced jitter for more precise tracking
          const jitterX = isTracking ? (Math.sin(videoProgress * 12) * 1) : 0;
          const jitterY = isTracking ? (Math.cos(videoProgress * 15) * 1) : 0;
          
          // Combine all movement components
          const offsetX = baseX + microX + jitterX;
          const offsetY = baseY + microY + jitterY;
          
          // Apply transform with easing to make movements smoother
          detectionBoxRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${1 + Math.sin(videoProgress) * 0.02})`;
          
          // Simulate tracking quality changes - improved algorithm has more consistent quality
          if (progressPercent > 0.8) {
            // Simulate reduced tracking quality near the end
            const qualityRandom = Math.random();
            if (qualityRandom > 0.8) {
              setTrackingQuality('medium');
            } else if (qualityRandom > 0.95) {
              setTrackingQuality('low');
            }
          } else {
            setTrackingQuality('high');
          }
        }
      };
      
      videoRef.current.addEventListener('play', handleVideoPlay);
      videoRef.current.addEventListener('pause', handleVideoPause);
      videoRef.current.addEventListener('ended', handleVideoEnded);
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('play', handleVideoPlay);
          videoRef.current.removeEventListener('pause', handleVideoPause);
          videoRef.current.removeEventListener('ended', handleVideoEnded);
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, [imageUrl, isVideo, hasInvasiveSpecies]);
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative">
          {isVideo ? (
            <video 
              ref={videoRef}
              controls
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error("Error loading video:", e);
                // Fallback for video error
                e.currentTarget.poster = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          ) : (
            <img 
              src={imageUrl} 
              alt="Animal" 
              className="w-full h-64 object-cover"
              onError={(e) => {
                // Fallback for image error
                e.currentTarget.src = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
              }}
            />
          )}
          
          {/* Status overlay (when analyzing) */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                <p>Analisando {isVideo ? 'vídeo' : 'imagem'}...</p>
              </div>
            </div>
          )}
          
          {/* Alert for invasive species with enhanced capture rectangle */}
          {hasInvasiveSpecies && animals.length > 0 && !isAnalyzing && (
            <>
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                  <AlertTriangle size={14} />
                  <span>Espécie Invasora</span>
                </Badge>
              </div>
              
              {/* Enhanced detection rectangle for invasive species with tracking */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  ref={detectionBoxRef}
                  className={`border-4 ${
                    trackingQuality === 'high' ? 'border-red-500' : 
                    trackingQuality === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                  } rounded-md ${isTracking ? 'animate-pulse' : ''}`}
                  style={{
                    width: isVideo ? '65%' : '85%',
                    height: isVideo ? '65%' : '85%',
                    boxShadow: `0 0 10px ${
                      trackingQuality === 'high' ? 'rgba(220, 38, 38, 0.8)' : 
                      trackingQuality === 'medium' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(234, 179, 8, 0.8)'
                    }`,
                    position: 'absolute',
                    zIndex: 50,
                    transition: 'transform 0.12s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
                  }}
                >
                  <div className={`absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 ${
                    trackingQuality === 'high' ? 'border-red-500' : 
                    trackingQuality === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                  }`}></div>
                  <div className={`absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 ${
                    trackingQuality === 'high' ? 'border-red-500' : 
                    trackingQuality === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                  }`}></div>
                  <div className={`absolute -bottom-2 -left-2 w-5 h-5 border-b-4 border-l-4 ${
                    trackingQuality === 'high' ? 'border-red-500' : 
                    trackingQuality === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                  }`}></div>
                  <div className={`absolute -bottom-2 -right-2 w-5 h-5 border-b-4 border-r-4 ${
                    trackingQuality === 'high' ? 'border-red-500' : 
                    trackingQuality === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                  }`}></div>
                  
                  {/* Enhanced target icon in the center for videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <Crosshair 
                          className={`${
                            trackingQuality === 'high' ? 'text-red-500' : 
                            trackingQuality === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                          } opacity-80`} 
                          size={28} 
                        />
                        {isTracking && (
                          <Target 
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                              trackingQuality === 'high' ? 'text-red-500' : 
                              trackingQuality === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                            } opacity-60`} 
                            size={36}
                            style={{
                              animation: 'pulse 1.5s infinite'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Frame indicator icon for videos */}
              {isVideo && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-black/70 text-white border-none flex items-center gap-1 px-2 py-1">
                    <Frame size={14} />
                    <span>Detecção em vídeo</span>
                  </Badge>
                </div>
              )}
              
              {/* Improved tracking quality indicator */}
              {isVideo && isTracking && (
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant="outline" 
                    className={`border-none flex items-center gap-1 px-2 py-1 ${
                      trackingQuality === 'high' ? 'bg-green-500/80 text-white' : 
                      trackingQuality === 'medium' ? 'bg-orange-500/80 text-white' : 'bg-yellow-500/80 text-black'
                    }`}
                  >
                    <span>Sensor: {
                      trackingQuality === 'high' ? 'Ótimo' : 
                      trackingQuality === 'medium' ? 'Médio' : 'Baixo'
                    }</span>
                  </Badge>
                </div>
              )}
            </>
          )}
          
          {/* Non-invasive species identification */}
          {!hasInvasiveSpecies && animals.length > 0 && !isAnalyzing && primaryNonInvasiveAnimal && (
            <>
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500 flex items-center gap-1 px-2 py-1">
                  <Shield size={14} />
                  <span>Espécie Nativa</span>
                </Badge>
              </div>
              
              {/* Gentle highlight for non-invasive species */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="border-2 border-green-500 rounded-md"
                  style={{
                    width: isVideo ? '70%' : '90%',
                    height: isVideo ? '70%' : '90%',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)',
                    position: 'absolute',
                    zIndex: 50,
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
                </div>
              </div>
              
              {/* Frame indicator icon for videos */}
              {isVideo && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-black/60 text-white border-none flex items-center gap-1 px-2 py-1">
                    <Frame size={14} />
                    <span>Monitoramento</span>
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
        
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
                {animals.map((animal, index) => {
                  const isInvasive = isInvasiveSpecies(animal.name);
                  
                  return (
                    <Badge 
                      key={index} 
                      variant={isInvasive ? "destructive" : "outline"}
                      className={isInvasive 
                        ? "bg-red-100 border-red-600 text-red-800 px-2 py-1" 
                        : "bg-green-100 border-green-600 text-green-800 px-2 py-1"}
                    >
                      {animal.name} - {formatConfidence(animal.confidence)}
                    </Badge>
                  );
                })}
              </div>
              
              {showDetails && (
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Detalhes</h4>
                  {animals.map((animal, index) => {
                    const isInvasive = isInvasiveSpecies(animal.name);
                    
                    return (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${isInvasive ? 'text-red-800' : 'text-green-800'}`}>
                            {animal.name}
                            {isInvasive && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Invasor</span>}
                          </span>
                          <Badge variant={isInvasive ? "destructive" : "outline"} className={!isInvasive ? "bg-green-100 text-green-800" : ""}>
                            {formatConfidence(animal.confidence)}
                          </Badge>
                        </div>
                        {animal.description && (
                          <p className="text-sm mt-1 text-gray-600">{animal.description}</p>
                        )}
                      </div>
                    );
                  })}
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
