
// Simulação de um serviço de reconhecimento de imagens baseado no nome do arquivo

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

// Base de dados para bovinos (animais não invasores)
const bovinosDatabase: Animal[] = [
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
    confidence: 0.96, 
    description: 'Bovino macho adulto, usado principalmente para trabalho e carne.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas e áreas rurais',
    diet: 'Herbívoro - capim, feno, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  }
];

// Base de dados para capivaras e roedores (invasores/nativos)
const roedoresDatabase: Animal[] = [
  { 
    name: 'Capivara', 
    confidence: 0.98, 
    description: 'Maior roedor do mundo, considerada espécie invasora em áreas urbanas.', 
    scientificName: 'Hydrochoerus hydrochaeris', 
    category: 'espécie invasora',
    habitat: 'Próximo a corpos d\'água, áreas alagadas',
    diet: 'Herbívoro - plantas aquáticas, capim',
    threats: 'Caça, perda de habitat, atropelamentos',
    conservation: 'Preocupação menor, mas invasora em centros urbanos'
  },
  { 
    name: 'Cutia', 
    confidence: 0.92, 
    description: 'Roedor nativo brasileiro, importante dispersor de sementes.', 
    scientificName: 'Dasyprocta spp.', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado',
    diet: 'Herbívoro - frutos, sementes, brotos',
    threats: 'Desmatamento, caça predatória',
    conservation: 'Algumas espécies vulneráveis'
  }
];

// Base de dados para suínos (invasores/domésticos)
const suinosDatabase: Animal[] = [
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
  }
];

// Base de dados para canídeos (domésticos/nativos)
const canideosDatabase: Animal[] = [
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
  }
];

// Base de dados para felinos (nativos)
const felinosDatabase: Animal[] = [
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
  }
];

// Função para gerar atraso
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para detectar animal baseado no nome do arquivo
const detectAnimalFromFileName = (fileName?: string): Animal[] => {
  if (!fileName) {
    return bovinosDatabase.slice(0, 1); // Default para vaca se não houver nome
  }

  const lowerFileName = fileName.toLowerCase();
  
  // Verificar se é "teste1" - deve ser reconhecido como vaca
  if (lowerFileName.includes('teste1')) {
    console.log('Arquivo teste1 detectado - reconhecendo como vaca');
    return bovinosDatabase.slice(0, 1);
  }
  
  // Verificar bovinos
  if (lowerFileName.includes('vaca') || lowerFileName.includes('cow')) {
    return bovinosDatabase.slice(0, 1);
  }
  if (lowerFileName.includes('boi') || lowerFileName.includes('bull')) {
    return bovinosDatabase.slice(1, 2);
  }
  
  // Verificar roedores
  if (lowerFileName.includes('capivara') || lowerFileName.includes('capybara')) {
    return roedoresDatabase.slice(0, 1);
  }
  if (lowerFileName.includes('cutia')) {
    return roedoresDatabase.slice(1, 2);
  }
  
  // Verificar suínos
  if (lowerFileName.includes('javali') || lowerFileName.includes('boar')) {
    return suinosDatabase.slice(0, 1);
  }
  if (lowerFileName.includes('porco-do-mato') || lowerFileName.includes('cateto')) {
    return suinosDatabase.slice(1, 2);
  }
  
  // Verificar canídeos
  if (lowerFileName.includes('cachorro') || lowerFileName.includes('dog') || lowerFileName.includes('cao')) {
    return canideosDatabase.slice(0, 1);
  }
  if (lowerFileName.includes('lobo-guara') || lowerFileName.includes('lobo')) {
    return canideosDatabase.slice(1, 2);
  }
  
  // Verificar felinos
  if (lowerFileName.includes('onca') || lowerFileName.includes('jaguar')) {
    return felinosDatabase.slice(0, 1);
  }
  if (lowerFileName.includes('jaguatirica')) {
    return felinosDatabase.slice(1, 2);
  }
  
  // Por padrão, retorna vaca para qualquer arquivo não identificado
  return bovinosDatabase.slice(0, 1);
};

// Função principal para reconhecer animais
export async function recognizeAnimal(imageUrl: string, fileName?: string): Promise<Animal[]> {
  console.log('Analisando arquivo:', fileName || 'sem nome');
  
  // Determinar se é vídeo baseado na extensão do arquivo
  const isVideo = fileName && (
    fileName.toLowerCase().includes('.mp4') ||
    fileName.toLowerCase().includes('.avi') ||
    fileName.toLowerCase().includes('.mov') ||
    fileName.toLowerCase().includes('.mkv') ||
    fileName.toLowerCase().includes('.webm')
  );
  
  // Simular tempo de processamento mais longo para vídeos
  if (isVideo) {
    console.log('Processando vídeo - análise mais demorada...');
    // Tempo mais longo para vídeos (3-6 segundos)
    await delay(Math.random() * 3000 + 3000);
  } else {
    // Tempo normal para imagens (400-1200ms)
    await delay(Math.random() * 800 + 400);
  }
  
  // Detectar baseado no nome do arquivo
  const detectedAnimals = detectAnimalFromFileName(fileName);
  
  console.log('Animal detectado:', detectedAnimals[0]?.name);
  
  return detectedAnimals;
}

// Função para buscar informações sobre animal específico
export async function getAnimalInfo(animalName: string): Promise<Animal | null> {
  const allAnimals = [
    ...bovinosDatabase, 
    ...roedoresDatabase, 
    ...suinosDatabase, 
    ...canideosDatabase, 
    ...felinosDatabase
  ];
  
  const found = allAnimals.find(
    animal => animal.name.toLowerCase() === animalName.toLowerCase()
  );
  
  return found || null;
}

// Função para obter nome científico
export async function getScientificName(animalName: string): Promise<string> {
  const animal = await getAnimalInfo(animalName);
  return animal?.scientificName || 'Espécie não identificada cientificamente';
}

// Função para classificar tipo de animal
export function classifyAnimalType(animalName: string): string {
  const lowerName = animalName.toLowerCase();
  
  if (lowerName.includes('capivara') || lowerName.includes('javali')) {
    return 'Espécie Invasora';
  } else if (lowerName.includes('vaca') || lowerName.includes('cow') || 
             lowerName.includes('cachorro') || lowerName.includes('cão') || 
             lowerName.includes('boi')) {
    return 'Animal Doméstico';
  } else {
    return 'Fauna Nativa';
  }
}
