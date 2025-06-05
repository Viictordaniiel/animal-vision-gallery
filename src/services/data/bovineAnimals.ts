
import { Animal } from '../types/animal';

export const bovinosDatabase: Animal[] = [
  { 
    name: 'Vaca', 
    confidence: 0.98, 
    description: 'Bovino doméstico, animal de criação importante para a pecuária.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas e áreas rurais',
    diet: 'Herbívoro - capim, feno, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Boi', 
    confidence: 0.92, 
    description: 'Bovino macho adulto, usado principalmente para trabalho e carne.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas e áreas rurais',
    diet: 'Herbívoro - capim, feno, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Búfalo', 
    confidence: 0.78, 
    description: 'Bovino de origem asiática, robusto e resistente.', 
    scientificName: 'Bubalus bubalis', 
    category: 'mamífero doméstico',
    habitat: 'Áreas alagadas, pastos úmidos',
    diet: 'Herbívoro - plantas aquáticas, capim',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  }
];

export const bovinosSimilares: Animal[] = [
  { 
    name: 'Bisão', 
    confidence: 0.85, 
    description: 'Grande mamífero herbívoro da família dos bovídeos, nativo da América do Norte.', 
    scientificName: 'Bison bison', 
    category: 'fauna silvestre',
    habitat: 'Pradarias, campos abertos',
    diet: 'Herbívoro - gramíneas, ervas',
    threats: 'Perda de habitat, caça histórica',
    conservation: 'Recuperação populacional'
  },
  { 
    name: 'Antílope', 
    confidence: 0.79, 
    description: 'Mamífero herbívoro ágil e elegante, com chifres característicos.', 
    scientificName: 'Antilopinae spp.', 
    category: 'fauna silvestre',
    habitat: 'Savanas, pradarias, áreas abertas',
    diet: 'Herbívoro - gramíneas, folhas, brotos',
    threats: 'Predação, perda de habitat',
    conservation: 'Varia por espécie'
  },
  { 
    name: 'Cabra', 
    confidence: 0.82, 
    description: 'Pequeno ruminante doméstico, adaptável a diversos ambientes.', 
    scientificName: 'Capra aegagrus hircus', 
    category: 'mamífero doméstico',
    habitat: 'Fazendas, áreas montanhosas, diversos terrenos',
    diet: 'Herbívoro - folhas, arbustos, gramíneas',
    threats: 'Doenças, predadores',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Ovelha', 
    confidence: 0.76, 
    description: 'Mamífero doméstico criado principalmente por sua lã e carne.', 
    scientificName: 'Ovis aries', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas, campos',
    diet: 'Herbívoro - gramíneas, feno',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Zebu', 
    confidence: 0.88, 
    description: 'Bovino de origem indiana, adaptado a climas tropicais.', 
    scientificName: 'Bos taurus indicus', 
    category: 'mamífero doméstico',
    habitat: 'Regiões tropicais, fazendas',
    diet: 'Herbívoro - capim, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  }
];
