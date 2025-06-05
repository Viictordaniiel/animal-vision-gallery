
import { Animal } from '../types/animal';

export const roedoresDatabase: Animal[] = [
  { 
    name: 'Capivara', 
    confidence: 0.98, 
    description: 'Maior roedor do mundo, animal nativo da América do Sul.', 
    scientificName: 'Hydrochoerus hydrochaeris', 
    category: 'fauna nativa',
    habitat: 'Próximo a corpos d\'água, áreas alagadas',
    diet: 'Herbívoro - plantas aquáticas, capim',
    threats: 'Caça, perda de habitat, atropelamentos',
    conservation: 'Preocupação menor'
  },
  { 
    name: 'Paca', 
    confidence: 0.85, 
    description: 'Roedor de grande porte, similar à capivara mas menor.', 
    scientificName: 'Cuniculus paca', 
    category: 'fauna nativa',
    habitat: 'Florestas próximas a água, matas ciliares',
    diet: 'Herbívoro - frutos, sementes, brotos',
    threats: 'Caça, desmatamento',
    conservation: 'Vulnerável em algumas regiões'
  },
  { 
    name: 'Cutia', 
    confidence: 0.72, 
    description: 'Roedor nativo brasileiro, importante dispersor de sementes.', 
    scientificName: 'Dasyprocta spp.', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado',
    diet: 'Herbívoro - frutos, sementes, brotos',
    threats: 'Desmatamento, caça predatória',
    conservation: 'Algumas espécies vulneráveis'
  }
];
