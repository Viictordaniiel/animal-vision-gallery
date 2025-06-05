
import { Animal } from '../types/animal';

export const felinosDatabase: Animal[] = [
  { 
    name: 'Onça-pintada', 
    confidence: 0.95, 
    description: 'Maior felino das Américas, predador apex dos ecossistemas brasileiros.', 
    scientificName: 'Panthera onca', 
    category: 'fauna nativa',
    habitat: 'Pantanal, Amazônia, Mata Atlântica',
    diet: 'Carnívoro - jacarés, peixes, mamíferos',
    threats: 'Desmatamento, caça, conflitos com pecuária',
    conservation: 'Vulnerável - proteção crítica'
  },
  { 
    name: 'Jaguatirica', 
    confidence: 0.88, 
    description: 'Felino de médio porte, excelente caçador noturno.', 
    scientificName: 'Leopardus pardalis', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado, caatinga',
    diet: 'Carnívoro - pequenos mamíferos, aves, répteis',
    threats: 'Perda de habitat, caça por pele',
    conservation: 'Quase ameaçado'
  },
  { 
    name: 'Gato-do-mato', 
    confidence: 0.75, 
    description: 'Pequeno felino nativo, muito ágil e territorial.', 
    scientificName: 'Leopardus tigrinus', 
    category: 'fauna nativa',
    habitat: 'Florestas, cerrado, caatinga',
    diet: 'Carnívoro - pequenos mamíferos, aves, répteis',
    threats: 'Perda de habitat, caça',
    conservation: 'Vulnerável'
  }
];
