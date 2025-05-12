
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, RotateCw, AlertTriangle } from 'lucide-react';

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
};

export default function GalleryItem({ 
  imageUrl, 
  animals, 
  onAnalyze, 
  isAnalyzing,
  showReanalyze = false
}: GalleryItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Verificar se todos os animais são javalis ou porcos selvagens
  const isWildPig = animals.length > 0 && animals.every(animal => 
    animal.name.toLowerCase().includes('javali') || 
    animal.name.toLowerCase().includes('porco') ||
    animal.name.toLowerCase().includes('cateto') ||
    animal.name.toLowerCase().includes('queixada')
  );
  
  return (
    <Card className="overflow-hidden w-full max-w-md">
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Animal" 
            className="w-full h-64 object-cover"
            onError={(e) => {
              // Fallback para imagem de erro
              e.currentTarget.src = 'https://images.unsplash.com/photo-1501286353178-1ec871214838?auto=format&fit=crop&w=500';
            }}
          />
          
          {/* Overlay de status (quando estiver analisando) */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                <p>Analisando imagem...</p>
              </div>
            </div>
          )}
          
          {/* Alerta para javalis/porcos selvagens com retângulo de captura */}
          {isWildPig && animals.length > 0 && !isAnalyzing && (
            <>
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                  <AlertTriangle size={14} />
                  <span>Espécie Invasora</span>
                </Badge>
              </div>
              
              {/* Retângulo de identificação para espécies invasoras */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="border-2 border-red-500 rounded-md animate-pulse w-4/5 h-4/5"
                  style={{
                    boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
                </div>
              </div>
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
                      title="Reanalisar imagem"
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
                <span>Analisar imagem</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
