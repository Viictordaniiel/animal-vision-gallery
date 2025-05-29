
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, Activity } from 'lucide-react';

type TrackedAnimal = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

type AnimalTrackerProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  animals: Array<{ name: string; confidence: number }>;
  isActive: boolean;
};

export default function AnimalTracker({ videoRef, animals, isActive }: AnimalTrackerProps) {
  const [trackedAnimals, setTrackedAnimals] = useState<TrackedAnimal[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout>();

  // Simular detecção de movimento dos animais
  const simulateAnimalMovement = () => {
    if (!videoRef.current || animals.length === 0) return;

    const videoRect = videoRef.current.getBoundingClientRect();
    const videoWidth = videoRect.width;
    const videoHeight = videoRect.height;

    const newTrackedAnimals: TrackedAnimal[] = animals.map((animal, index) => {
      // Simular movimento aleatório dos animais
      const baseX = (index * 150) % (videoWidth - 100);
      const baseY = (index * 100) % (videoHeight - 80);
      
      // Adicionar movimento oscilatório
      const time = Date.now() / 1000;
      const offsetX = Math.sin(time + index) * 30;
      const offsetY = Math.cos(time * 0.5 + index) * 20;

      return {
        id: `animal-${index}`,
        name: animal.name,
        x: Math.max(0, Math.min(videoWidth - 100, baseX + offsetX)),
        y: Math.max(0, Math.min(videoHeight - 60, baseY + offsetY)),
        width: 80 + Math.sin(time) * 10,
        height: 50 + Math.cos(time) * 5,
        confidence: animal.confidence
      };
    });

    setTrackedAnimals(newTrackedAnimals);
  };

  useEffect(() => {
    if (isActive && animals.length > 0) {
      setIsTracking(true);
      console.log('Iniciando rastreamento de animais:', animals.map(a => a.name).join(', '));
      
      // Atualizar posições a cada 100ms para movimento suave
      trackingIntervalRef.current = setInterval(simulateAnimalMovement, 100);
    } else {
      setIsTracking(false);
      setTrackedAnimals([]);
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isActive, animals, videoRef]);

  if (!isActive || !isTracking || trackedAnimals.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Indicador de status do tracking */}
      <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
        <Activity size={12} className="animate-pulse text-green-400" />
        <span>Rastreando {trackedAnimals.length} {trackedAnimals.length === 1 ? 'animal' : 'animais'}</span>
      </div>

      {/* Caixas de rastreamento dos animais */}
      {trackedAnimals.map((animal) => (
        <div
          key={animal.id}
          className="absolute border-2 border-red-500 bg-red-500/10 rounded-md transition-all duration-100"
          style={{
            left: `${animal.x}px`,
            top: `${animal.y}px`,
            width: `${animal.width}px`,
            height: `${animal.height}px`,
          }}
        >
          {/* Mira de rastreamento */}
          <div className="absolute -top-1 -left-1 w-3 h-3">
            <Target size={12} className="text-red-500 animate-pulse" />
          </div>
          
          {/* Label do animal */}
          <div className="absolute -top-6 left-0 bg-red-500 text-white px-1 py-0.5 rounded text-xs whitespace-nowrap">
            {animal.name} ({Math.round(animal.confidence * 100)}%)
          </div>
          
          {/* Ponto central de tracking */}
          <div 
            className="absolute bg-red-500 rounded-full animate-ping"
            style={{
              width: '4px',
              height: '4px',
              left: `${animal.width / 2 - 2}px`,
              top: `${animal.height / 2 - 2}px`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
