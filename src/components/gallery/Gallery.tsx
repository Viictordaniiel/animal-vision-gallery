
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Image as ImageIcon, Video, RotateCw } from 'lucide-react';
import ImageUploader from './ImageUploader';
import GalleryItem from './GalleryItem';
import { recognizeAnimal } from '@/services/imageRecognition';
import { toast } from '@/components/ui/use-toast';

// Type for identified animals
type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Type for gallery items
type GalleryItemType = {
  url: string;
  analyzed: boolean;
  animals: Animal[];
  timestamp?: number;
  type: 'image' | 'video';
};

// Sample images for demonstration
const sampleImages: GalleryItemType[] = [
  {
    url: '/lovable-uploads/ce96c99c-0586-4460-a3af-af02d84fbf45.png',
    analyzed: true,
    animals: [
      { name: 'Javali', confidence: 0.95, description: 'Sus scrofa, mamífero selvagem da família Suidae, causador de danos em plantações.' },
    ],
    timestamp: Date.now(),
    type: 'image'
  },
  {
    url: '/lovable-uploads/fff1fa46-90d0-4f73-a04f-065ad14447f5.png',
    analyzed: true,
    animals: [
      { name: 'Javali Filhote', confidence: 0.92, description: 'Filhote de javali, reconhecível pelas listras no corpo quando jovem.' },
    ],
    timestamp: Date.now(),
    type: 'image'
  },
  {
    url: '/lovable-uploads/c26c1704-463e-4f86-a15c-56901b7ed7ea.png',
    analyzed: true,
    animals: [
      { name: 'Grupo de Javalis', confidence: 0.89, description: 'Vara de javalis, grupo familiar que pode causar grandes danos em áreas agrícolas.' },
    ],
    timestamp: Date.now(),
    type: 'image'
  }
];

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('upload');
  const [currentImage, setCurrentImage] = useState<{url: string, file?: File, type: 'image' | 'video'} | null>(null);
  const [uploadedAnimals, setUploadedAnimals] = useState<Animal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItemType[]>([]);
  
  // Load and persist gallery images
  useEffect(() => {
    // Try to load saved images from localStorage
    try {
      const savedItems = localStorage.getItem('galleryItems');
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        setGalleryItems(parsedItems);
      } else {
        // Initialize with sample images if none are saved
        setGalleryItems(sampleImages);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens salvas:', error);
      setGalleryItems(sampleImages);
    }
  }, []);

  // Persist gallery changes
  useEffect(() => {
    if (galleryItems.length > 0) {
      try {
        localStorage.setItem('galleryItems', JSON.stringify(galleryItems));
      } catch (error) {
        console.error('Erro ao salvar imagens:', error);
      }
    }
  }, [galleryItems]);
  
  const handleImageUpload = (imageUrl: string, file: File) => {
    // Determine if it's an image or video
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    
    // Update state with new media
    setCurrentImage({ url: imageUrl, file, type: mediaType });
    setUploadedAnimals([]);

    // Show appropriate toast message
    if (isVideo) {
      toast({
        title: "Vídeo detectado",
        description: "Pronto para análise de invasores em modo vídeo."
      });
    }
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
      // Add timestamp to avoid browser cache and ensure uniqueness
      const timestamp = Date.now();
      const imageUrlWithTimestamp = currentImage.url.includes('?') 
        ? `${currentImage.url}&t=${timestamp}` 
        : `${currentImage.url}?t=${timestamp}`;
      
      // For videos, notify that we're processing frames
      if (currentImage.type === 'video') {
        toast({
          title: "Processando vídeo",
          description: "Analisando quadros para identificar espécies invasoras."
        });
      }
      
      console.log(`Analisando ${currentImage.type} com sistema aprimorado: ${imageUrlWithTimestamp}`);
      
      const results = await recognizeAnimal(imageUrlWithTimestamp);
      setUploadedAnimals(results);
      
      // Add to gallery after successful analysis
      const newItem: GalleryItemType = {
        url: currentImage.url,
        analyzed: true,
        animals: results,
        timestamp: timestamp,
        type: currentImage.type
      };
      
      // Check if the media already exists in the gallery and replace it
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
      console.error('Erro ao analisar mídia:', error);
      toast({
        variant: "destructive",
        title: `Erro ao analisar ${currentImage.type === 'video' ? 'vídeo' : 'imagem'}`,
        description: "Não foi possível processar o reconhecimento."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to reanalyze a gallery item
  const reanalyzeGalleryImage = async (index: number) => {
    const item = galleryItems[index];
    if (!item) return;
    
    // Create an updated copy of the item
    const updatedItems = [...galleryItems];
    updatedItems[index] = { ...item, analyzed: false };
    setGalleryItems(updatedItems);
    
    try {
      // Add timestamp to avoid browser cache
      const timestamp = Date.now();
      const mediaUrlWithTimestamp = item.url.includes('?') 
        ? `${item.url}&t=${timestamp}` 
        : `${item.url}?t=${timestamp}`;
      
      // Show appropriate message for video processing
      if (item.type === 'video') {
        toast({
          title: "Processando vídeo",
          description: "Reanalisando quadros do vídeo..."
        });
      }
      
      const results = await recognizeAnimal(mediaUrlWithTimestamp);
      
      // Update the item in the gallery with the new results
      const updatedItem: GalleryItemType = {
        ...item,
        analyzed: true,
        animals: results,
        timestamp: timestamp
      };
      
      updatedItems[index] = updatedItem;
      setGalleryItems(updatedItems);
      
      toast({
        title: "Reanálise concluída",
        description: `${results.length} ${results.length === 1 ? 'animal' : 'animais'} identificado${results.length !== 1 ? 's' : ''}`
      });
      
    } catch (error) {
      console.error('Erro ao reanalisar mídia:', error);
      
      // Restore previous state in case of failure
      updatedItems[index] = { ...item, analyzed: true };
      setGalleryItems(updatedItems);
      
      toast({
        variant: "destructive",
        title: "Erro na reanálise",
        description: "Não foi possível processar o reconhecimento."
      });
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
                  {isAnalyzing ? 'Analisando...' : `Reconhecer ${currentImage?.type === 'video' ? 'Vídeo' : 'Imagem'}`}
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
                  isVideo={currentImage.type === 'video'}
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="gallery">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={`${item.url}-${item.timestamp || index}`}
                imageUrl={item.url}
                animals={item.animals}
                onAnalyze={() => reanalyzeGalleryImage(index)}
                isAnalyzing={!item.analyzed}
                showReanalyze={item.analyzed}
                isVideo={item.type === 'video'}
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
