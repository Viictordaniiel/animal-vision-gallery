
import { Animal } from './types/animal';
import { 
  bovineAnimals, 
  canineAnimals, 
  felineAnimals, 
  rodentAnimals, 
  swineAnimals 
} from './utils/animalUtils';

// Animal classification function
export const classifyAnimalType = (animalName: string): string => {
  const name = animalName.toLowerCase();
  
  if (name.includes('vaca') || name.includes('boi') || name.includes('búfalo') || 
      name.includes('bisão') || name.includes('antílope') || name.includes('zebu')) {
    return 'Gado bovino';
  } else if (name.includes('cabra') || name.includes('ovelha')) {
    return 'Pequenos ruminantes';
  } else if (name.includes('cachorro') || name.includes('cão') || name.includes('lobo')) {
    return 'Caninos';
  } else if (name.includes('porco') || name.includes('javali')) {
    return 'Suínos';
  } else if (name.includes('onça') || name.includes('jaguatirica') || name.includes('gato')) {
    return 'Felinos';
  } else if (name.includes('capivara') || name.includes('cutia') || name.includes('paca')) {
    return 'Roedores';
  }
  
  return 'Fauna';
};

// Main recognition function
export const recognizeAnimal = async (imageUrl: string, fileName: string = '', isReanalysis: boolean = false): Promise<Animal[]> => {
  console.log(`Reconhecendo animal em: ${imageUrl}`);
  console.log(`Nome do arquivo: ${fileName}`);
  console.log(`É reanálise: ${isReanalysis}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Get all available animals
  const allAnimals = [
    ...bovineAnimals,
    ...canineAnimals, 
    ...felineAnimals,
    ...rodentAnimals,
    ...swineAnimals
  ];
  
  // For teste1, return specific similar animals on reanalysis
  if (fileName.toLowerCase().includes('teste1')) {
    if (isReanalysis) {
      // Define similar animals for teste1
      const similarAnimals: Animal[] = [
        { name: 'Búfalo', confidence: 0.92, description: 'Grande bovino de origem asiática, adaptado a climas tropicais.' },
        { name: 'Bisão', confidence: 0.88, description: 'Bovino selvagem norte-americano, robusto e resistente.' },
        { name: 'Antílope', confidence: 0.84, description: 'Mamífero ruminante ágil, encontrado principalmente na África.' },
        { name: 'Cabra', confidence: 0.86, description: 'Pequeno ruminante doméstico, muito adaptável.' },
        { name: 'Ovelha', confidence: 0.85, description: 'Ruminante doméstico criado principalmente por lã e carne.' },
        { name: 'Zebu', confidence: 0.90, description: 'Raça bovina tropical com corcova característica.' }
      ];
      
      // Rotate through similar animals based on current time
      const rotationIndex = Math.floor(Date.now() / 5000) % similarAnimals.length;
      const mainAnimal = { name: 'Vaca', confidence: 0.95, description: 'Animal bovino doméstico comum.' };
      
      return [mainAnimal, similarAnimals[rotationIndex]];
    } else {
      // First analysis - return main animal
      return [{ name: 'Vaca', confidence: 0.95, description: 'Animal bovino doméstico comum.' }];
    }
  }
  
  // For other files, use existing logic
  if (fileName.toLowerCase().includes('lobo')) {
    const loboAnimals = allAnimals.filter(animal => 
      animal.name.toLowerCase().includes('lobo')
    );
    return loboAnimals.length > 0 ? loboAnimals : [allAnimals[1]]; // fallback to second animal
  }
  
  if (fileName.toLowerCase().includes('capivara')) {
    const capivaraAnimals = allAnimals.filter(animal => 
      animal.name.toLowerCase().includes('capivara')
    );
    return capivaraAnimals.length > 0 ? capivaraAnimals : [allAnimals[6]]; // fallback
  }
  
  // Default recognition - return random animals
  const shuffled = [...allAnimals].sort(() => 0.5 - Math.random());
  const numAnimals = Math.floor(Math.random() * 3) + 1; // 1-3 animals
  return shuffled.slice(0, numAnimals);
};
