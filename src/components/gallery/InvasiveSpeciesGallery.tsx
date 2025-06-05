
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, FileText, Image, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
    console.log('🔄 InvasiveSpeciesGallery: Carregando componente...');
    
    const loadStoredRecords = () => {
      const stored = localStorage.getItem('invasiveSpeciesRecords');
      console.log('📁 localStorage invasiveSpeciesRecords:', stored);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('📦 Dados parseados:', parsed);
          
          // Convert date strings back to Date objects
          const records = parsed.map((record: any) => ({
            ...record,
            detectedAt: new Date(record.detectedAt)
          }));
          
          console.log('✅ Registros processados:', records.length);
          setInvasiveSpecies(records);
        } catch (error) {
          console.error('❌ Erro ao carregar registros de espécies invasoras:', error);
        }
      } else {
        console.log('ℹ️ Nenhum registro encontrado no localStorage');
      }
    };

    // Load initial records
    loadStoredRecords();

    // Listen for new invasive species detections
    const handleNewInvasiveSpecies = (event: CustomEvent) => {
      console.log('🚨 EVENTO CAPTURADO na galeria:', event.detail);
      const newRecord = event.detail;
      
      setInvasiveSpecies(prev => {
        console.log('📊 Estado atual da galeria:', prev.length, 'registros');
        
        // Check if record already exists to avoid duplicates
        const exists = prev.find(item => item.id === newRecord.id);
        if (exists) {
          console.log('⚠️ Registro já existe, ignorando duplicata:', newRecord.id);
          return prev;
        }
        
        console.log('➕ Adicionando novo registro à galeria');
        const updated = [newRecord, ...prev];
        console.log('📈 Total de registros após adição:', updated.length);
        
        return updated;
      });
    };

    // Add event listener with proper type casting
    const eventHandler = handleNewInvasiveSpecies as EventListener;
    window.addEventListener('invasiveSpeciesDetected', eventHandler);
    console.log('👂 Event listener para espécies invasoras adicionado');

    // Cleanup function
    return () => {
      window.removeEventListener('invasiveSpeciesDetected', eventHandler);
      console.log('🧹 Event listener para espécies invasoras removido');
    };
  }, []);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('📊 ESTADO ATUALIZADO - Total de espécies invasoras:', invasiveSpecies.length);
    invasiveSpecies.forEach((species, index) => {
      console.log(`  ${index + 1}. ${species.name} (${species.id})`);
    });
  }, [invasiveSpecies]);

  // Function to delete a species record
  const deleteSpecies = (speciesId: string) => {
    console.log('🗑️ Excluindo espécie com ID:', speciesId);
    
    setInvasiveSpecies(prev => {
      const updated = prev.filter(species => species.id !== speciesId);
      console.log('📉 Total de registros após exclusão:', updated.length);
      
      // Update localStorage
      localStorage.setItem('invasiveSpeciesRecords', JSON.stringify(updated));
      console.log('💾 localStorage atualizado após exclusão');
      
      return updated;
    });

    toast({
      title: "Espécie removida",
      description: "Registro excluído da galeria de invasoras."
    });
  };

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
        <div className="mt-4 text-xs text-gray-400">
          <p>Debug: Aguardando eventos 'invasiveSpeciesDetected'</p>
        </div>
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
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {Math.round(species.confidence * 100)}%
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteSpecies(species.id)}
                    title="Excluir registro"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
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
