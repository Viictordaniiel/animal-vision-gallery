
import { Animal } from '../types/animal';

export const canideosDatabase: Animal[] = [
  { 
    name: 'Cachorro', 
    confidence: 0.97, 
    description: 'Canídeo doméstico, considerado o melhor amigo do homem.', 
    scientificName: 'Canis familiaris', 
    category: 'mamífero doméstico',
    habitat: 'Residências, fazendas, áreas urbanas',
    diet: 'Onívoro - ração, carne, vegetais',
    threats: 'Doenças, acidentes, maus-tratos',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Lobo-guará', 
    confidence: 0.91, 
    description: 'Maior canídeo da América do Sul, símbolo do cerrado brasileiro.', 
    scientificName: 'Chrysocyon brachyurus', 
    category: 'fauna nativa',
    habitat: 'Cerrado, campos, áreas abertas',
    diet: 'Onívoro - pequenos mamíferos, frutos, lobeira',
    threats: 'Atropelamentos, perda de habitat, doenças',
    conservation: 'Vulnerável - necessita proteção'
  },
  { 
    name: 'Cachorro-do-mato', 
    confidence: 0.83, 
    description: 'Canídeo nativo brasileiro, menor que o lobo-guará.', 
    scientificName: 'Cerdocyon thous', 
    category: 'fauna nativa',
    habitat: 'Cerrado, caatinga, campos',
    diet: 'Onívoro - pequenos mamíferos, frutos, insetos',
    threats: 'Atropelamentos, perda de habitat',
    conservation: 'Preocupação menor'
  }
];
