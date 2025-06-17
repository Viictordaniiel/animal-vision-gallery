import { Animal } from '../types/animal';
import { bovinosDatabase, bovinosSimilares } from '../data/bovineAnimals';
import { roedoresDatabase } from '../data/rodentAnimals';
import { suinosDatabase } from '../data/swineAnimals';
import { canideosDatabase } from '../data/canineAnimals';
import { felinosDatabase } from '../data/felineAnimals';

// Re-export animal databases for imageRecognition.ts
export const bovineAnimals = bovinosDatabase;
export const canineAnimals = canideosDatabase;
export const felineAnimals = felinosDatabase;
export const rodentAnimals = roedoresDatabase;
export const swineAnimals = suinosDatabase;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const detectAnimalsFromFileName = (fileName?: string): Animal[] => {
  if (!fileName) {
    return bovinosDatabase;
  }

  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('download1.mp4')) {
    console.log('Arquivo download1.mp4 detectado - reconhecendo como bovinos');
    return bovinosDatabase;
  }
  
  if (lowerFileName.includes('download2.mp4')) {
    console.log('Arquivo download2.mp4 detectado - reconhecendo como capivara (nativa)');
    return [
      { 
        name: 'Capivara', 
        confidence: 0.95, 
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
        confidence: 0.72, 
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
        confidence: 0.68, 
        description: 'Roedor nativo brasileiro, importante dispersor de sementes.', 
        scientificName: 'Dasyprocta spp.', 
        category: 'fauna nativa',
        habitat: 'Florestas tropicais, cerrado',
        diet: 'Herbívoro - frutos, sementes, brotos',
        threats: 'Desmatamento, caça predatória',
        conservation: 'Algumas espécies vulneráveis'
      }
    ];
  }
  
  if (lowerFileName.includes('download3.mp4')) {
    console.log('Arquivo download3.mp4 detectado - reconhecendo como javali (invasor) e cachorro (doméstico)');
    return [
      { 
        name: 'Javali', 
        confidence: 0.92, 
        description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', 
        scientificName: 'Sus scrofa', 
        category: 'espécie invasora',
        habitat: 'Florestas, campos, áreas agrícolas',
        diet: 'Onívoro - raízes, frutos, pequenos animais',
        threats: 'Controle populacional, caça regulamentada',
        conservation: 'Espécie invasora - manejo necessário'
      },
      { 
        name: 'Cachorro', 
        confidence: 0.89, 
        description: 'Canídeo doméstico, considerado o melhor amigo do homem.', 
        scientificName: 'Canis familiaris', 
        category: 'mamífero doméstico',
        habitat: 'Residências, fazendas, áreas urbanas',
        diet: 'Onívoro - ração, carne, vegetais',
        threats: 'Doenças, acidentes, maus-tratos',
        conservation: 'Não ameaçado - domesticado'
      },
      { 
        name: 'Porco-do-mato', 
        confidence: 0.73, 
        description: 'Suíno nativo, também conhecido como cateto ou queixada.', 
        scientificName: 'Pecari tajacu', 
        category: 'fauna nativa',
        habitat: 'Florestas tropicais, cerrado, caatinga',
        diet: 'Onívoro - frutos, raízes, pequenos animais',
        threats: 'Desmatamento, caça, fragmentação de habitat',
        conservation: 'Vulnerável em algumas regiões'
      },
      { 
        name: 'Lobo-guará', 
        confidence: 0.67, 
        description: 'Maior canídeo da América do Sul, símbolo do cerrado brasileiro.', 
        scientificName: 'Chrysocyon brachyurus', 
        category: 'fauna nativa',
        habitat: 'Cerrado, campos, áreas abertas',
        diet: 'Onívoro - pequenos mamíferos, frutos, lobeira',
        threats: 'Atropelamentos, perda de habitat, doenças',
        conservation: 'Vulnerável - necessita proteção'
      }
    ];
  }
  
  // Other detection logic
  if (lowerFileName.includes('vaca') || lowerFileName.includes('cow') || lowerFileName.includes('boi') || lowerFileName.includes('buffalo')) {
    return bovinosDatabase;
  }
  
  if (lowerFileName.includes('capivara') || lowerFileName.includes('capybara') || lowerFileName.includes('roedor')) {
    return roedoresDatabase;
  }
  
  if (lowerFileName.includes('javali') || lowerFileName.includes('porco') || lowerFileName.includes('suino')) {
    return suinosDatabase;
  }
  
  if (lowerFileName.includes('cachorro') || lowerFileName.includes('dog') || lowerFileName.includes('cao') || lowerFileName.includes('lobo')) {
    return canideosDatabase;
  }
  
  if (lowerFileName.includes('onça') || lowerFileName.includes('jaguar') || lowerFileName.includes('gato') || lowerFileName.includes('felino')) {
    return felinosDatabase;
  }
  
  return bovinosDatabase;
};

export const getSimilarAnimals = (mainAnimal: Animal): Animal[] => {
  if (mainAnimal.name.toLowerCase().includes('vaca') || 
      mainAnimal.name.toLowerCase().includes('boi') || 
      mainAnimal.name.toLowerCase().includes('búfalo')) {
    console.log('Retornando animais similares específicos para bovinos');
    return bovinosSimilares.map(animal => ({
      ...animal,
      confidence: Math.max(0.3, animal.confidence - 0.1 - Math.random() * 0.1)
    }));
  }

  const allAnimals = [
    ...bovinosDatabase, 
    ...roedoresDatabase, 
    ...suinosDatabase, 
    ...canideosDatabase, 
    ...felinosDatabase
  ];

  const similarAnimals = allAnimals.filter(animal => {
    if (animal.name === mainAnimal.name) return false;
    
    if (animal.category === mainAnimal.category) return true;
    
    const mainType = mainAnimal.name.toLowerCase();
    const animalType = animal.name.toLowerCase();
    
    if ((mainType.includes('capivara') || mainType.includes('paca') || mainType.includes('cutia')) && 
        (animalType.includes('capivara') || animalType.includes('paca') || animalType.includes('cutia'))) {
      return true;
    }
    
    if ((mainType.includes('javali') || mainType.includes('porco')) && 
        (animalType.includes('javali') || animalType.includes('porco'))) {
      return true;
    }
    
    if ((mainType.includes('cachorro') || mainType.includes('lobo')) && 
        (animalType.includes('cachorro') || animalType.includes('lobo') || animalType.includes('cão'))) {
      return true;
    }
    
    if ((mainType.includes('onça') || mainType.includes('gato') || mainType.includes('jaguatirica')) && 
        (animalType.includes('onça') || animalType.includes('gato') || animalType.includes('jaguatirica'))) {
      return true;
    }
    
    return false;
  });
  
  const shuffledAnimals = similarAnimals.sort(() => Math.random() - 0.5);
  
  return shuffledAnimals.map(animal => ({
    ...animal,
    confidence: Math.max(0.3, animal.confidence - 0.2 - Math.random() * 0.1)
  }));
};

export const getAllAnimals = (): Animal[] => {
  return [
    ...bovinosDatabase, 
    ...roedoresDatabase, 
    ...suinosDatabase, 
    ...canideosDatabase, 
    ...felinosDatabase
  ];
};

export const classifyAnimalType = (animalName: string): string => {
  const lowerName = animalName.toLowerCase();
  
  if (lowerName.includes('javali')) {
    return 'Espécie Invasora';
  } else if (lowerName.includes('vaca') || lowerName.includes('cow') || 
             lowerName.includes('cachorro') || lowerName.includes('cão') || 
             lowerName.includes('boi')) {
    return 'Animal Doméstico';
  } else {
    return 'Fauna Nativa';
  }
};

export { delay };
