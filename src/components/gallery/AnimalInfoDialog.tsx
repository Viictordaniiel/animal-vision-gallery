
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Leaf, Home, Heart, Shield } from 'lucide-react';

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  scientificName?: string;
  category?: string;
  habitat?: string;
  diet?: string;
  threats?: string;
  conservation?: string;
};

type AnimalInfoDialogProps = {
  animal: Animal | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function AnimalInfoDialog({ animal, isOpen, onClose }: AnimalInfoDialogProps) {
  if (!animal) return null;

  const isInvasive = animal.category?.toLowerCase().includes('invasora');
  const isNative = animal.category?.toLowerCase().includes('nativa');
  const isDomestic = animal.category?.toLowerCase().includes('doméstico');

  const getCategoryColor = () => {
    if (isInvasive) return 'destructive';
    if (isNative) return 'default';
    if (isDomestic) return 'secondary';
    return 'outline';
  };

  const getCategoryIcon = () => {
    if (isInvasive) return <AlertTriangle size={16} />;
    if (isNative) return <Leaf size={16} />;
    if (isDomestic) return <Home size={16} />;
    return <Heart size={16} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon()}
            {animal.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={getCategoryColor()}>
              {animal.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Confiança: {Math.round(animal.confidence * 100)}%
            </span>
          </div>

          {animal.description && (
            <p className="text-sm text-muted-foreground">
              {animal.description}
            </p>
          )}

          <Separator />

          <div className="space-y-3">
            {animal.scientificName && (
              <div>
                <h4 className="text-sm font-medium mb-1">Nome Científico</h4>
                <p className="text-sm text-muted-foreground italic">
                  {animal.scientificName}
                </p>
              </div>
            )}

            {animal.habitat && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Home size={14} />
                  Habitat
                </h4>
                <p className="text-sm text-muted-foreground">
                  {animal.habitat}
                </p>
              </div>
            )}

            {animal.diet && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Leaf size={14} />
                  Alimentação
                </h4>
                <p className="text-sm text-muted-foreground">
                  {animal.diet}
                </p>
              </div>
            )}

            {animal.threats && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Ameaças
                </h4>
                <p className="text-sm text-muted-foreground">
                  {animal.threats}
                </p>
              </div>
            )}

            {animal.conservation && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Shield size={14} />
                  Status de Conservação
                </h4>
                <p className="text-sm text-muted-foreground">
                  {animal.conservation}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
