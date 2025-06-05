
import { useEffect, useRef, useState } from 'react';
import { Activity, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotionDetectorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnabled: boolean;
  onToggle: () => void;
}

interface MotionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export default function MotionDetector({ videoRef, isEnabled, onToggle }: MotionDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [motionAreas, setMotionAreas] = useState<MotionArea[]>([]);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const previousFrameData = useRef<ImageData | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    if (!isEnabled || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    if (!ctx || !overlayCtx) return;

    const detectMotion = () => {
      if (!video || video.paused || video.ended) {
        animationFrame.current = requestAnimationFrame(detectMotion);
        return;
      }

      // Ajustar tamanho do canvas para o vídeo
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0) {
        animationFrame.current = requestAnimationFrame(detectMotion);
        return;
      }

      canvas.width = videoWidth / 4; // Reduzir resolução para performance
      canvas.height = videoHeight / 4;
      overlayCanvas.width = video.offsetWidth;
      overlayCanvas.height = video.offsetHeight;

      // Desenhar frame atual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (previousFrameData.current) {
        const diff = calculateMotionDifference(previousFrameData.current, currentFrameData);
        const areas = findMotionAreas(diff, canvas.width, canvas.height);
        
        setMotionAreas(areas);
        setMotionIntensity(calculateOverallIntensity(diff));
        
        // Desenhar overlay de movimento
        drawMotionOverlay(overlayCtx, areas, overlayCanvas.width, overlayCanvas.height, canvas.width, canvas.height);
      }

      previousFrameData.current = currentFrameData;
      animationFrame.current = requestAnimationFrame(detectMotion);
    };

    detectMotion();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isEnabled, videoRef]);

  const calculateMotionDifference = (prevFrame: ImageData, currFrame: ImageData): number[] => {
    const diff: number[] = [];
    const threshold = 30; // Limiar de sensibilidade

    for (let i = 0; i < prevFrame.data.length; i += 4) {
      const prevR = prevFrame.data[i];
      const prevG = prevFrame.data[i + 1];
      const prevB = prevFrame.data[i + 2];
      
      const currR = currFrame.data[i];
      const currG = currFrame.data[i + 1];
      const currB = currFrame.data[i + 2];

      const pixelDiff = Math.abs(prevR - currR) + Math.abs(prevG - currG) + Math.abs(prevB - currB);
      diff.push(pixelDiff > threshold ? pixelDiff : 0);
    }

    return diff;
  };

  const findMotionAreas = (diff: number[], width: number, height: number): MotionArea[] => {
    const areas: MotionArea[] = [];
    const minAreaSize = 5;
    const visited = new Set<number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        if (diff[index] > 0 && !visited.has(index)) {
          const area = floodFill(diff, width, height, x, y, visited);
          
          if (area.width >= minAreaSize && area.height >= minAreaSize) {
            areas.push(area);
          }
        }
      }
    }

    return areas.slice(0, 10); // Limitar a 10 áreas mais significativas
  };

  const floodFill = (diff: number[], width: number, height: number, startX: number, startY: number, visited: Set<number>): MotionArea => {
    const queue = [{ x: startX, y: startY }];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let totalIntensity = 0;
    let pixelCount = 0;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const index = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(index) || diff[index] === 0) {
        continue;
      }

      visited.add(index);
      totalIntensity += diff[index];
      pixelCount++;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Adicionar pixels vizinhos
      queue.push(
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      );
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      intensity: totalIntensity / pixelCount
    };
  };

  const calculateOverallIntensity = (diff: number[]): number => {
    const total = diff.reduce((sum, val) => sum + val, 0);
    return Math.min(100, (total / (diff.length * 10)) * 100);
  };

  const drawMotionOverlay = (
    ctx: CanvasRenderingContext2D, 
    areas: MotionArea[], 
    overlayWidth: number, 
    overlayHeight: number,
    sourceWidth: number,
    sourceHeight: number
  ) => {
    ctx.clearRect(0, 0, overlayWidth, overlayHeight);
    
    const scaleX = overlayWidth / sourceWidth;
    const scaleY = overlayHeight / sourceHeight;

    areas.forEach((area, index) => {
      const scaledX = area.x * scaleX;
      const scaledY = area.y * scaleY;
      const scaledWidth = area.width * scaleX;
      const scaledHeight = area.height * scaleY;

      // Desenhar retângulo de movimento
      ctx.strokeStyle = `rgba(255, 0, 0, ${Math.min(1, area.intensity / 100)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Adicionar ponto central
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Adicionar número da área
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`${index + 1}`, scaledX + 5, scaledY + 15);
    });
  };

  return (
    <div className="relative">
      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Canvas de overlay para mostrar detecção */}
      {isEnabled && (
        <canvas 
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-10"
          style={{ width: '100%', height: '100%' }}
        />
      )}
      
      {/* Controles do sensor */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-black/70 rounded-lg p-2">
        <Button
          size="sm"
          variant={isEnabled ? "default" : "secondary"}
          onClick={onToggle}
          className="flex items-center gap-1"
        >
          <Activity size={16} />
          <span className="text-xs">Sensor</span>
        </Button>
        
        {isEnabled && (
          <div className="flex items-center gap-2 text-white text-xs">
            <Eye size={14} />
            <span>{motionAreas.length} áreas</span>
            <div className="w-8 h-2 bg-gray-600 rounded">
              <div 
                className="h-full bg-red-500 rounded transition-all"
                style={{ width: `${motionIntensity}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
