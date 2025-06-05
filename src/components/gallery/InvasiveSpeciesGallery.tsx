
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, FileText, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type InvasiveSpeciesRecord = {
  id: string;
  name: string;
  confidence: number;
  description?: string;
  scientificName?: string;
  category: string;
  detectedAt: Date;
  imageUrl?: string;
  fileName?: string;
  isVideo: boolean;
};

export default function InvasiveSpeciesGallery() {
  const [invasiveSpecies, setInvasiveSpecies] = useState<InvasiveSpeciesRecord[]>([]);

  // Load invasive species from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('invasiveSpeciesRecords');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const records = parsed.map((record: any) => ({
          ...record,
          detectedAt: new Date(record.detectedAt)
        }));
        setInvasiveSpecies(records);
        console.log('Carregados registros de espécies invasoras:', records);
      } catch (error) {
        console.error('Erro ao carregar registros de espécies invasoras:', error);
      }
    }

    // Listen for new invasive species detections
    const handleNewInvasiveSpecies = (event: CustomEvent) => {
      console.log('Evento de espécie invasora recebido:', event.detail);
      const newRecord = event.detail;
      
      setInvasiveSpecies(prev => {
        const updated = [newRecord, ...prev];
        console.log('Salvando registros atualizados:', updated);
        localStorage.setItem('invasiveSpeciesRecords', JSON.stringify(updated));
        return updated;
      });
    };

    // Add event listener
    window.addEventListener('invasiveSpeciesDetected', handleNewInvasiveSpecies as EventListener);
    console.log('Event listener para espécies invasoras adicionado');

    return () => {
      window.removeEventListener('invasiveSpeciesDetected', handleNewInvasiveSpecies as EventListener);
      console.log('Event listener para espécies invasoras removido');
    };
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (invasiveSpecies.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma espécie invasora detectada
        </h3>
        <p className="text-gray-500">
          Quando espécies invasoras forem identificadas, elas aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold">Galeria de Espécies Invasoras</h1>
        <Badge variant="destructive" className="ml-2">
          {invasiveSpecies.length} {invasiveSpecies.length === 1 ? 'espécie' : 'espécies'}
        </Badge>
      </div>

      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Estas são espécies invasoras detectadas no seu sistema. 
          Recomenda-se contatar as autoridades ambientais competentes para manejo adequado.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invasiveSpecies.map((species) => (
          <Card key={species.id} className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {species.name}
                  </CardTitle>
                  {species.scientificName && (
                    <CardDescription className="italic text-sm mt-1">
                      {species.scientificName}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="destructive" className="text-xs">
                  {Math.round(species.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {species.description && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{species.description}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Detectado em: {formatDate(species.detectedAt)}</span>
              </div>
              
              {species.fileName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Image className="h-4 w-4" />
                  <span className="truncate">
                    {species.fileName} {species.isVideo ? '(Vídeo)' : '(Imagem)'}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                  {species.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
