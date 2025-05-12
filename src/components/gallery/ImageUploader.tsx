import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Image, Video, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type ImageUploaderProps = {
  onImageUpload: (imageUrl: string, file: File) => void;
};

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const processUploadedFile = (file: File) => {
    // Check if it's a video
    const fileIsVideo = file.type.startsWith('video/');
    setIsVideo(fileIsVideo);
    
    // Validate file
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: "Formato não suportado",
        description: "Por favor, envie apenas arquivos de imagem ou vídeo.",
      });
      return;
    }
    
    // Check size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é de 10MB.",
      });
      return;
    }
    
    // Create URL for preview
    const fileUrl = URL.createObjectURL(file);
    setPreview(fileUrl);
    
    // Callback to parent component
    onImageUpload(fileUrl, file);
    
    toast({
      title: `${fileIsVideo ? 'Vídeo' : 'Imagem'} carregado com sucesso`,
      description: "Pronto para análise.",
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setPreview(null);
    setIsVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-6">
      <Input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive 
              ? 'border-agrotech-blue bg-agrotech-blue/10' 
              : 'border-gray-300 hover:border-agrotech-blue'
          } transition-colors cursor-pointer`}
          onClick={handleButtonClick}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <UploadCloud className="h-10 w-10 text-gray-400" />
            <div className="text-gray-600 text-center">
              <p className="font-medium">Clique para enviar ou arraste uma imagem/vídeo</p>
              <p className="text-sm mt-1">Suporta JPG, PNG, GIF, MP4 até 10MB</p>
            </div>
          </div>
        </div>
      ) : isVideo ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <video 
            ref={videoRef}
            controls
            className="w-full h-auto max-h-96 object-contain"
            src={preview}
          />
          <button
            onClick={removeFile}
            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
            aria-label="Remover vídeo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={preview} 
            alt="Preview da imagem" 
            className="w-full h-auto max-h-96 object-contain"
          />
          <button
            onClick={removeFile}
            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
            aria-label="Remover imagem"
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {preview && (
        <Button
          onClick={handleButtonClick}
          variant="outline"
          className="mt-3 flex items-center gap-2"
        >
          {isVideo ? <Video size={16} /> : <Image size={16} />}
          <span>Trocar {isVideo ? 'vídeo' : 'imagem'}</span>
        </Button>
      )}
      
      {/* Vídeo oculto para referência */}
      <video ref={videoRef} className="hidden" />
    </div>
  );
}
