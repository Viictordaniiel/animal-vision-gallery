
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';
import GalleryItem from './GalleryItem';
import { recognizeAnimal } from '@/services/imageRecognition';
import { toast } from '@/components/ui/use-toast';

// Imagens de exemplo para demonstração
const sampleImages = [
  {
    url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=500',
    analyzed: true,
    animals: [
      { name: 'Veado', confidence: 0.94, description: 'Mamífero ruminante da família dos cervídeos.' },
    ],
  },
  {
    url: 'https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&w=500',
    analyzed: true,
    animals: [
      { name: 'Boi', confidence: 0.98, description: 'Bovino doméstico de grande porte.' },
    ],
  },
  {
    url: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=500',
    analyzed: true,
    animals: [
      { name: 'Gato', confidence: 0.95, description: 'Felino doméstico comum como animal de estimação.' },
    ],
  }
];

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('upload');
  const [currentImage, setCurrentImage] = useState<{url: string, file?: File} | null>(null);
  const [uploadedAnimals, setUploadedAnimals] = useState<{name: string, confidence: number, description?: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [galleryItems, setGalleryItems] = useState(sampleImages);
  
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
      const results = await recognizeAnimal(currentImage.url);
      setUploadedAnimals(results);
      
      // Adicionar à galeria após análise bem-sucedida
      const newItem = {
        url: currentImage.url,
        analyzed: true,
        animals: results,
      };
      
      setGalleryItems(prev => [newItem, ...prev]);
      
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
