
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target, TargetIcon } from 'lucide-react';

type TrackerProps = {
  isActive: boolean;
  onToggle: () => void;
  animals: any[];
  videoElement: HTMLVideoElement | null;
};

export default function AnimalTracker({ isActive, onToggle, animals, videoElement }: TrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [trackedTargets, setTrackedTargets] = useState<Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    confidence: number;
  }>>([]);

  // Simular detecção e rastreamento de animais
  useEffect(() => {
    if (!isActive || !videoElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateTracking = () => {
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (animals.length > 0) {
        // Simular posições dos animais baseado no tempo
        const time = Date.now() / 1000;
        const newTargets = animals.map((animal, index) => {
          // Movimento simulado para cada animal
          const baseX = 0.3 + (index * 0.3);
          const baseY = 0.4 + Math.sin(time + index) * 0.2;
          
          const x = baseX + Math.sin(time * 0.5 + index) * 0.2;
          const y = baseY + Math.cos(time * 0.3 + index) * 0.15;
          
          return {
            id: `animal-${index}`,
            x: Math.max(0.1, Math.min(0.9, x)),
            y: Math.max(0.1, Math.min(0.9, y)),
            size: 40 + Math.sin(time + index) * 10,
            confidence: animal.confidence
          };
        });

        setTrackedTargets(newTargets);

        // Desenhar elementos de rastreamento
        newTargets.forEach((target, index) => {
          const canvasX = target.x * canvas.width;
          const canvasY = target.y * canvas.height;
          const size = target.size;

          // Desenhar cruz de mira
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;

          // Cruz central
          ctx.beginPath();
          ctx.moveTo(canvasX - size/2, canvasY);
          ctx.lineTo(canvasX + size/2, canvasY);
          ctx.moveTo(canvasX, canvasY - size/2);
          ctx.lineTo(canvasX, canvasY + size/2);
          ctx.stroke();

          // Círculo de rastreamento
          ctx.beginPath();
          ctx.arc(canvasX, canvasY, size/2, 0, 2 * Math.PI);
          ctx.stroke();

          // Cantos do quadrado de detecção
          const cornerSize = 15;
          ctx.lineWidth = 3;
          
          // Canto superior esquerdo
          ctx.beginPath();
          ctx.moveTo(canvasX - size/2, canvasY - size/2 + cornerSize);
          ctx.lineTo(canvasX - size/2, canvasY - size/2);
          ctx.lineTo(canvasX - size/2 + cornerSize, canvasY - size/2);
          ctx.stroke();

          // Canto superior direito
          ctx.beginPath();
          ctx.moveTo(canvasX + size/2 - cornerSize, canvasY - size/2);
          ctx.lineTo(canvasX + size/2, canvasY - size/2);
          ctx.lineTo(canvasX + size/2, canvasY - size/2 + cornerSize);
          ctx.stroke();

          // Canto inferior esquerdo
          ctx.beginPath();
          ctx.moveTo(canvasX - size/2, canvasY + size/2 - cornerSize);
          ctx.lineTo(canvasX - size/2, canvasY + size/2);
          ctx.lineTo(canvasX - size/2 + cornerSize, canvasY + size/2);
          ctx.stroke();

          // Canto inferior direito
          ctx.beginPath();
          ctx.moveTo(canvasX + size/2 - cornerSize, canvasY + size/2);
          ctx.lineTo(canvasX + size/2, canvasY + size/2);
          ctx.lineTo(canvasX + size/2, canvasY + size/2 - cornerSize);
          ctx.stroke();

          // Indicador de confiança (sem texto)
          const confidenceHeight = target.confidence * 20;
          ctx.fillStyle = `rgba(0, 255, 0, ${target.confidence})`;
          ctx.fillRect(canvasX + size/2 + 10, canvasY - confidenceHeight/2, 4, confidenceHeight);
        });
      }

      animationRef.current = requestAnimationFrame(updateTracking);
    };

    updateTracking();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, animals, videoElement]);

  // Ajustar tamanho do canvas quando o vídeo redimensiona
  useEffect(() => {
    if (!videoElement || !canvasRef.current) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas && videoElement) {
        canvas.width = videoElement.offsetWidth;
        canvas.height = videoElement.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [videoElement]);

  return (
    <>
      {/* Controle do rastreador */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={onToggle}
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          {isActive ? <TargetIcon size={16} /> : <Target size={16} />}
          <span className="hidden sm:inline">
            {isActive ? 'Desativar' : 'Rastrear'}
          </span>
        </Button>
      </div>

      {/* Status do rastreamento */}
      {isActive && trackedTargets.length > 0 && (
        <div className="absolute top-4 left-4 z-20 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{trackedTargets.length} alvo{trackedTargets.length !== 1 ? 's' : ''} em rastreamento</span>
          </div>
        </div>
      )}

      {/* Canvas de rastreamento */}
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </>
  );
}
