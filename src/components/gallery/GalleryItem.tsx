
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle, Video, Frame, Target, Move } from 'lucide-react';

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

  // Check if all animals are wild pigs or related invasive species
  const isWildPig = animals.length > 0 && animals.every(animal => 
    animal.name.toLowerCase().includes('javali') || 
    animal.name.toLowerCase().includes('porco') ||
    animal.name.toLowerCase().includes('cateto') ||
    animal.name.toLowerCase().includes('queixada')
  );
  
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
        if (isWildPig && detectionBoxRef.current && videoRef.current) {
          // Get current playback position
          const videoProgress = videoRef.current.currentTime;
          const videoDuration = videoRef.current.duration || 1;
          const progressPercent = videoProgress / videoDuration;
          
          // Generate more natural-looking motion patterns based on time
          // This simulates the animal moving in a somewhat unpredictable pattern
          
          // Base movement path - using sin and cos with offsets to create natural path
          const baseX = Math.sin(progressPercent * Math.PI * 4) * 10;
          const baseY = Math.cos(progressPercent * Math.PI * 3) * 8;
          
          // Add some randomized micro-movements based on frame position
          // Use deterministic pattern based on the current time to make it look consistent
          const microX = Math.sin(videoProgress * 2.5) * 3;
          const microY = Math.cos(videoProgress * 3.5) * 3;
          
          // Add "detection jitter" to simulate tracking algorithm adjustments
          const jitterX = isTracking ? (Math.sin(videoProgress * 15) * 1.5) : 0;
          const jitterY = isTracking ? (Math.cos(videoProgress * 20) * 1.5) : 0;
          
          // Combine all movement components
          const offsetX = baseX + microX + jitterX;
          const offsetY = baseY + microY + jitterY;
          
          // Apply transform with easing to make movements smoother
          detectionBoxRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${1 + Math.sin(videoProgress) * 0.03})`;
          
          // Simulate tracking quality changes
          if (progressPercent > 0.7) {
            // Simulate reduced tracking quality near the end
            const qualityRandom = Math.random();
            if (qualityRandom > 0.7) {
              setTrackingQuality('medium');
            } else if (qualityRandom > 0.9) {
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
  }, [imageUrl, isVideo, isWildPig]);
  
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
          
          {/* Alert for invasive species with capture rectangle */}
          {isWildPig && animals.length > 0 && !isAnalyzing && (
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
                    width: isVideo ? '60%' : '80%',
                    height: isVideo ? '60%' : '80%',
                    boxShadow: `0 0 8px ${
                      trackingQuality === 'high' ? 'rgba(220, 38, 38, 0.8)' : 
                      trackingQuality === 'medium' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(234, 179, 8, 0.8)'
                    }`,
                    position: 'absolute',
                    zIndex: 50,
                    transition: 'transform 0.15s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
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
                  
                  {/* Target icon in the center for videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <Target 
                          className={`${
                            trackingQuality === 'high' ? 'text-red-500' : 
                            trackingQuality === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                          } opacity-70`} 
                          size={24} 
                        />
                        {isTracking && (
                          <Move 
                            className={`absolute -top-0.5 -left-0.5 ${
                              trackingQuality === 'high' ? 'text-red-500' : 
                              trackingQuality === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                            } opacity-50`} 
                            size={25}
                            style={{
                              animation: 'pulse 2s infinite'
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
              
              {/* Tracking quality indicator */}
              {isVideo && isTracking && (
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant="outline" 
                    className={`border-none flex items-center gap-1 px-2 py-1 ${
                      trackingQuality === 'high' ? 'bg-green-500/70 text-white' : 
                      trackingQuality === 'medium' ? 'bg-orange-500/70 text-white' : 'bg-yellow-500/70 text-black'
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
                  const isWildPigItem = animal.name.toLowerCase().includes('javali') || 
                                       animal.name.toLowerCase().includes('porco') ||
                                       animal.name.toLowerCase().includes('cateto') ||
                                       animal.name.toLowerCase().includes('queixada');
                  
                  return (
                    <Badge 
                      key={index} 
                      variant={isWildPigItem ? "destructive" : "outline"}
                      className={isWildPigItem 
                        ? "bg-red-100 border-red-600 text-red-800 px-2 py-1" 
                        : "bg-agrotech-blue/10 border-agrotech-blue text-agrotech-blue px-2 py-1"}
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
                    const isWildPigItem = animal.name.toLowerCase().includes('javali') || 
                                         animal.name.toLowerCase().includes('porco') ||
                                         animal.name.toLowerCase().includes('cateto') ||
                                         animal.name.toLowerCase().includes('queixada');
                    
                    return (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${isWildPigItem ? 'text-red-800' : ''}`}>{animal.name}</span>
                          <Badge variant={isWildPigItem ? "destructive" : "outline"}>
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
