
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';
import GalleryItem from './GalleryItem';
import { recognizeAnimal } from '@/services/imageRecognition';
import { toast } from '@/components/ui/use-toast';

// Tipo para os animais identificados
type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Tipo para os items da galeria
type GalleryItemType = {
  url: string;
  analyzed: boolean;
  animals: Animal[];
};

// Imagens de exemplo para demonstração
const sampleImages: GalleryItemType[] = [
  {
    url: '/lovable-uploads/ce96c99c-0586-4460-a3af-af02d84fbf45.png',
    analyzed: true,
    animals: [
      { name: 'Javali', confidence: 0.95, description: 'Sus scrofa, mamífero selvagem da família Suidae, causador de danos em plantações.' },
    ],
  },
  {
    url: '/lovable-uploads/fff1fa46-90d0-4f73-a04f-065ad14447f5.png',
    analyzed: true,
    animals: [
      { name: 'Javali Filhote', confidence: 0.92, description: 'Filhote de javali, reconhecível pelas listras no corpo quando jovem.' },
    ],
  },
  {
    url: '/lovable-uploads/c26c1704-463e-4f86-a15c-56901b7ed7ea.png',
    analyzed: true,
    animals: [
      { name: 'Grupo de Javalis', confidence: 0.89, description: 'Vara de javalis, grupo familiar que pode causar grandes danos em áreas agrícolas.' },
    ],
  }
];

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('upload');
  const [currentImage, setCurrentImage] = useState<{url: string, file?: File} | null>(null);
  const [uploadedAnimals, setUploadedAnimals] = useState<Animal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItemType[]>(sampleImages);
  
  const handleImageUpload = (imageUrl: string, file: File) => {
    setCurrentImage({ url: imageUrl, file });
    setUploadedAnimals([]);
  };
  
  const handleCameraCapture = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A captura de câmera estará disponível em breve."
    });
  };
  
  const analyzeImage = async () => {
    if (!currentImage) return;
    
    setIsAnalyzing(true);
    
    try {
      // Adicionar timestamp para evitar cache do navegador
      const imageUrlWithTimestamp = currentImage.url.includes('?') 
        ? `${currentImage.url}&t=${Date.now()}` 
        : `${currentImage.url}?t=${Date.now()}`;
      
      const results = await recognizeAnimal(imageUrlWithTimestamp);
      setUploadedAnimals(results);
      
      // Adicionar à galeria após análise bem-sucedida
      const newItem: GalleryItemType = {
        url: currentImage.url,
        analyzed: true,
        animals: results,
      };
      
      // Verificar se a imagem já existe na galeria e substituí-la
      const exists = galleryItems.findIndex(item => item.url === currentImage.url);
      if (exists >= 0) {
        const updatedItems = [...galleryItems];
        updatedItems[exists] = newItem;
        setGalleryItems(updatedItems);
      } else {
        setGalleryItems(prev => [newItem, ...prev]);
      }
      
      toast({
        title: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''}!`,
        description: results.map(a => a.name).join(', ')
      });
      
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao analisar imagem",
        description: "Não foi possível processar o reconhecimento."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reconhecimento de Animais</h1>
      
      <Tabs 
        defaultValue="upload" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload size={16} />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon size={16} />
            <span>Galeria</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <ImageUploader onImageUpload={handleImageUpload} />
              
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={analyzeImage}
                  className="flex-1 bg-agrotech-blue hover:bg-agrotech-darkblue"
                  disabled={!currentImage || isAnalyzing}
                >
                  {isAnalyzing ? 'Analisando...' : 'Reconhecer Animal'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  className="gap-2"
                >
                  <Camera size={16} />
                  <span className="md:inline hidden">Câmera</span>
                </Button>
              </div>
            </div>
            
            {currentImage && (
              <div>
                <GalleryItem 
                  imageUrl={currentImage.url}
                  animals={uploadedAnimals}
                  onAnalyze={analyzeImage}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="gallery">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={index}
                imageUrl={item.url}
                animals={item.animals}
                onAnalyze={() => {}}
                isAnalyzing={false}
              />
            ))}
            
            {galleryItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">Sua galeria está vazia. Faça upload de imagens para começar.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
