
// Type for identified animals
export type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Type for gallery items
export type GalleryItemType = {
  url: string;
  analyzed: boolean;
  animals: Animal[];
  timestamp?: number;
  type: 'image' | 'video';
  heatMapEnabled?: boolean;
};
