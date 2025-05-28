
import { Button } from '@/components/ui/button';
import { Upload, Play } from 'lucide-react';
import GalleryItem from './GalleryItem';
import { GalleryItemType } from './types';

type MediaDisplayProps = {
  currentMedia: GalleryItemType | null;
  isAnalyzing: boolean;
  pendingFile: File | null;
  onStartAnalysis: () => void;
  onReanalyze: () => void;
  onToggleHeatMap: () => void;
  onNewUpload: () => void;
};

export default function MediaDisplay({
  currentMedia,
  isAnalyzing,
  pendingFile,
  onStartAnalysis,
  onReanalyze,
  onToggleHeatMap,
  onNewUpload
}: MediaDisplayProps) {
  if (!currentMedia) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregue um vídeo ou imagem para começar a detecção de animais.</p>
        <Button 
          onClick={onNewUpload}
          className="mt-4"
        >
          Carregar Mídia
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 w-full flex justify-between items-center">
        <h2 className="text-xl">Análise de {currentMedia.type === 'video' ? 'Vídeo' : 'Imagem'}</h2>
        <div className="flex gap-2">
          {!currentMedia.analyzed && (
            <Button 
              onClick={onStartAnalysis} 
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play size={16} />
              <span>{isAnalyzing ? 'Analisando...' : 'Analisar'}</span>
            </Button>
          )}
          {currentMedia.type === 'video' && currentMedia.analyzed && (
            <Button 
              onClick={onToggleHeatMap} 
              variant={currentMedia.heatMapEnabled ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              {currentMedia.heatMapEnabled ? "Desativar" : "Ativar"} Mapa de Calor
            </Button>
          )}
          <Button 
            onClick={onNewUpload} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            <span>Nova Análise</span>
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-3xl">
        <GalleryItem
          imageUrl={currentMedia.url}
          animals={currentMedia.animals}
          onAnalyze={onReanalyze}
          isAnalyzing={isAnalyzing}
          showReanalyze={currentMedia.analyzed}
          isVideo={currentMedia.type === 'video'}
          heatMapEnabled={currentMedia.heatMapEnabled}
        />
      </div>
    </div>
  );
}
