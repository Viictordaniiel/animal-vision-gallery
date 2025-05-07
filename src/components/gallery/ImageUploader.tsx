
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Image, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type ImageUploaderProps = {
  onImageUpload: (imageUrl: string, file: File) => void;
};

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const processUploadedImage = (file: File) => {
    // Validar o arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato não suportado",
        description: "Por favor, envie apenas arquivos de imagem.",
      });
      return;
    }
    
    // Verificar tamanho (limitar a 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é de 5MB.",
      });
      return;
    }
    
    // Criar URL para preview
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    
    // Callback para componente pai
    onImageUpload(imageUrl, file);
    
    toast({
      title: "Imagem carregada com sucesso",
      description: "Pronto para análise.",
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedImage(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-6">
      <Input
        type="file"
        ref={fileInputRef}
        accept="image/*"
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
              <p className="font-medium">Clique para enviar ou arraste uma imagem</p>
              <p className="text-sm mt-1">Suporta JPG, PNG ou GIF até 5MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={preview} 
            alt="Preview da imagem" 
            className="w-full h-auto max-h-96 object-contain"
          />
          <button
            onClick={removeImage}
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
          <Image size={16} />
          <span>Trocar imagem</span>
        </Button>
      )}
    </div>
  );
}
