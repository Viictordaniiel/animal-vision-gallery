
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
export const recognizeAnimal = async (imageUrl: string, fileName: string = '', isReanalysis: boolean = false, isVideo: boolean = false): Promise<Animal[]> => {
  console.log(`Reconhecendo animal em: ${imageUrl}`);
  console.log(`Nome do arquivo: ${fileName}`);
  console.log(`É reanálise: ${isReanalysis}`);
  console.log(`É vídeo: ${isVideo}`);
  
  // Simulate API delay - videos take longer to process
  const delay = isVideo ? 4500 : 1500; // 4.5 segundos para vídeos, 1.5 para imagens
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Get all available animals
  const allAnimals = [
    ...bovineAnimals,
    ...canineAnimals, 
    ...felineAnimals,
    ...rodentAnimals,
    ...swineAnimals
  ];
  
  // For teste1, always return 3 animals but vary on reanalysis
  if (fileName.toLowerCase().includes('teste1')) {
    if (isReanalysis) {
      // Define pool of similar animals for teste1
      const similarAnimals: Animal[] = [
        { name: 'Búfalo', confidence: 0.92, description: 'Grande bovino de origem asiática, adaptado a climas tropicais.' },
        { name: 'Bisão', confidence: 0.88, description: 'Bovino selvagem norte-americano, robusto e resistente.' },
        { name: 'Antílope', confidence: 0.84, description: 'Mamífero ruminante ágil, encontrado principalmente na África.' },
        { name: 'Cabra', confidence: 0.86, description: 'Pequeno ruminante doméstico, muito adaptável.' },
        { name: 'Ovelha', confidence: 0.85, description: 'Ruminante doméstico criado principalmente por lã e carne.' },
        { name: 'Zebu', confidence: 0.90, description: 'Raça bovina tropical com corcova característica.' }
      ];
      
      // Always include the main animal
      const mainAnimal = { name: 'Vaca', confidence: 0.95, description: 'Animal bovino doméstico comum.' };
      
      // Shuffle and select 2 additional animals
      const shuffledSimilar = [...similarAnimals].sort(() => Math.random() - 0.5);
      const selectedSimilar = shuffledSimilar.slice(0, 2);
      
      return [mainAnimal, ...selectedSimilar];
    } else {
      // First analysis - return 3 consistent animals
      return [
        { name: 'Vaca', confidence: 0.95, description: 'Animal bovino doméstico comum.' },
        { name: 'Boi', confidence: 0.89, description: 'Bovino macho adulto, usado para trabalho e carne.' },
        { name: 'Búfalo', confidence: 0.82, description: 'Grande bovino de origem asiática, adaptado a climas tropicais.' }
      ];
    }
  }
  
  // For teste2, always return 3 native animals but vary on reanalysis
  if (fileName.toLowerCase().includes('teste2')) {
    if (isReanalysis) {
      const nativePool = [
        { name: 'Capivara', confidence: 0.95, description: 'Maior roedor do mundo, animal nativo da América do Sul.', scientificName: 'Hydrochoerus hydrochaeris', category: 'fauna nativa' },
        { name: 'Paca', confidence: 0.72, description: 'Roedor de grande porte, similar à capivara mas menor.', scientificName: 'Cuniculus paca', category: 'fauna nativa' },
        { name: 'Cutia', confidence: 0.68, description: 'Roedor nativo brasileiro, importante dispersor de sementes.', scientificName: 'Dasyprocta spp.', category: 'fauna nativa' },
        { name: 'Anta', confidence: 0.75, description: 'Maior mamífero terrestre do Brasil, herbívoro da floresta.', scientificName: 'Tapirus terrestris', category: 'fauna nativa' },
        { name: 'Quati', confidence: 0.70, description: 'Mamífero social da família dos procionídeos.', scientificName: 'Nasua nasua', category: 'fauna nativa' }
      ];
      
      const shuffled = [...nativePool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    } else {
      // First analysis - return 3 consistent native animals
      return [
        { name: 'Capivara', confidence: 0.95, description: 'Maior roedor do mundo, animal nativo da América do Sul.', scientificName: 'Hydrochoerus hydrochaeris', category: 'fauna nativa' },
        { name: 'Paca', confidence: 0.72, description: 'Roedor de grande porte, similar à capivara mas menor.', scientificName: 'Cuniculus paca', category: 'fauna nativa' },
        { name: 'Cutia', confidence: 0.68, description: 'Roedor nativo brasileiro, importante dispersor de sementes.', scientificName: 'Dasyprocta spp.', category: 'fauna nativa' }
      ];
    }
  }
  
  // For teste3, always return 3 mixed animals but vary on reanalysis
  if (fileName.toLowerCase().includes('teste3')) {
    if (isReanalysis) {
      const mixedPool = [
        { name: 'Javali', confidence: 0.92, description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', scientificName: 'Sus scrofa', category: 'espécie invasora' },
        { name: 'Cachorro', confidence: 0.89, description: 'Canídeo doméstico, considerado o melhor amigo do homem.', scientificName: 'Canis familiaris', category: 'mamífero doméstico' },
        { name: 'Porco-do-mato', confidence: 0.73, description: 'Suíno nativo, também conhecido como cateto ou queixada.', scientificName: 'Pecari tajacu', category: 'fauna nativa' },
        { name: 'Lobo-guará', confidence: 0.67, description: 'Maior canídeo da América do Sul, símbolo do cerrado brasileiro.', scientificName: 'Chrysocyon brachyurus', category: 'fauna nativa' },
        { name: 'Raposa', confidence: 0.64, description: 'Pequeno canídeo adaptável, encontrado em diversos ambientes.', scientificName: 'Cerdocyon thous', category: 'fauna nativa' },
        { name: 'Gato-do-mato', confidence: 0.61, description: 'Pequeno felino selvagem brasileiro.', scientificName: 'Leopardus guttulus', category: 'fauna nativa' }
      ];
      
      const shuffled = [...mixedPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    } else {
      // First analysis - return 3 consistent mixed animals
      return [
        { name: 'Javali', confidence: 0.92, description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', scientificName: 'Sus scrofa', category: 'espécie invasora' },
        { name: 'Cachorro', confidence: 0.89, description: 'Canídeo doméstico, considerado o melhor amigo do homem.', scientificName: 'Canis familiaris', category: 'mamífero doméstico' },
        { name: 'Porco-do-mato', confidence: 0.73, description: 'Suíno nativo, também conhecido como cateto ou queixada.', scientificName: 'Pecari tajacu', category: 'fauna nativa' }
      ];
    }
  }
  
  // For other files, always return 3 animals
  if (fileName.toLowerCase().includes('lobo')) {
    if (isReanalysis) {
      const caninePool = allAnimals.filter(animal => 
        animal.name.toLowerCase().includes('lobo') || 
        animal.name.toLowerCase().includes('cachorro') ||
        animal.name.toLowerCase().includes('cão')
      );
      const shuffled = [...caninePool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    } else {
      const loboAnimals = allAnimals.filter(animal => 
        animal.name.toLowerCase().includes('lobo')
      );
      return loboAnimals.slice(0, 3);
    }
  }
  
  if (fileName.toLowerCase().includes('capivara')) {
    if (isReanalysis) {
      const rodentPool = allAnimals.filter(animal => 
        animal.name.toLowerCase().includes('capivara') || 
        animal.name.toLowerCase().includes('paca') ||
        animal.name.toLowerCase().includes('cutia')
      );
      const shuffled = [...rodentPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    } else {
      const capivaraAnimals = allAnimals.filter(animal => 
        animal.name.toLowerCase().includes('capivara')
      );
      return capivaraAnimals.slice(0, 3);
    }
  }
  
  // Default recognition - always return exactly 3 animals
  const shuffled = [...allAnimals].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};
