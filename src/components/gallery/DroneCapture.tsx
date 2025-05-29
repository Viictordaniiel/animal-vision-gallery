
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, Square, Play, Pause } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type DroneCaptureProps = {
  onImageCapture: (imageUrl: string, file: File) => void;
  onClose: () => void;
};

export default function DroneCapture({ onImageCapture, onClose }: DroneCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startStream = async () => {
    try {
      // Simular conexão com drone - em produção seria uma API de drone real
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'environment' // Usar câmera traseira se disponível
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        
        toast({
          title: "Drone conectado",
          description: "Stream de vídeo ativo. Pronto para capturar imagens."
        });
      }
    } catch (error) {
      console.error('Erro ao acessar câmera/drone:', error);
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível conectar com o drone/câmera."
      });
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !isStreaming) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `drone-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          
          onImageCapture(imageUrl, file);
          onClose();
          
          toast({
            title: "Imagem capturada",
            description: "Imagem do drone salva e pronta para análise."
          });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `drone-video-${timestamp}.mp4`, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        
        onImageCapture(videoUrl, file);
        onClose();
        
        toast({
          title: "Vídeo gravado",
          description: "Vídeo do drone salvo e pronto para análise."
        });
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "Gravando vídeo do drone..."
      });
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        variant: "destructive",
        title: "Erro na gravação",
        description: "Não foi possível iniciar a gravação."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Captura via Drone</h2>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isStreaming && (
              <div className="flex items-center justify-center h-full text-white">
                <p>Clique em "Conectar Drone" para iniciar o stream</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-center">
            {!isStreaming ? (
              <Button onClick={startStream} className="flex items-center gap-2">
                <Video size={16} />
                Conectar Drone
              </Button>
            ) : (
              <>
                <Button onClick={captureImage} className="flex items-center gap-2">
                  <Camera size={16} />
                  Capturar Imagem
                </Button>
                
                {!isRecording ? (
                  <Button onClick={startRecording} variant="outline" className="flex items-center gap-2">
                    <Play size={16} />
                    Gravar Vídeo
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                    <Square size={16} />
                    Parar Gravação
                  </Button>
                )}
                
                <Button onClick={stopStream} variant="outline" className="flex items-center gap-2">
                  <Pause size={16} />
                  Desconectar
                </Button>
              </>
            )}
          </div>
          
          {isStreaming && (
            <div className="text-center text-sm text-gray-600">
              <p>Stream ativo • Pronto para capturar imagens ou gravar vídeos</p>
              {isRecording && (
                <p className="text-red-600 font-medium animate-pulse">● Gravando...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
