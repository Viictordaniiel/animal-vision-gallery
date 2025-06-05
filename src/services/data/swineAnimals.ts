
import { Animal } from '../types/animal';

export const suinosDatabase: Animal[] = [
  { 
    name: 'Javali', 
    confidence: 0.94, 
    description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', 
    scientificName: 'Sus scrofa', 
    category: 'espécie invasora',
    habitat: 'Florestas, campos, áreas agrícolas',
    diet: 'Onívoro - raízes, frutos, pequenos animais',
    threats: 'Controle populacional, caça regulamentada',
    conservation: 'Espécie invasora - manejo necessário'
  },
  { 
    name: 'Porco-do-mato', 
    confidence: 0.89, 
    description: 'Suíno nativo, também conhecido como cateto ou queixada.', 
    scientificName: 'Pecari tajacu', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado, caatinga',
    diet: 'Onívoro - frutos, raízes, pequenos animais',
    threats: 'Desmatamento, caça, fragmentação de habitat',
    conservation: 'Vulnerável em algumas regiões'
  },
  { 
    name: 'Porco Doméstico', 
    confidence: 0.76, 
    description: 'Suíno doméstico criado para consumo.', 
    scientificName: 'Sus scrofa domesticus', 
    category: 'mamífero doméstico',
    habitat: 'Fazendas, chiqueiros, áreas rurais',
    diet: 'Onívoro - ração, restos de comida',
    threats: 'Doenças, predadores',
    conservation: 'Não ameaçado - domesticado'
  }
];
