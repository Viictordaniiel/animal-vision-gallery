
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

// Base de dados para capivaras e roedores (nativos)
const roedoresDatabase: Animal[] = [
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

// Função para gerar atraso
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para detectar múltiplas espécies baseado no nome do arquivo
const detectAnimalsFromFileName = (fileName?: string): Animal[] => {
  if (!fileName) {
    return bovinosDatabase; // Retorna todos os bovinos se não houver nome
  }

  const lowerFileName = fileName.toLowerCase();
  
  // Verificar se é "teste1" - deve ser reconhecido como vaca e espécies relacionadas
  if (lowerFileName.includes('teste1')) {
    console.log('Arquivo teste1 detectado - reconhecendo como bovinos');
    return bovinosDatabase;
  }
  
  // Verificar se é "teste2" - deve ser reconhecido como capivara (nativa)
  if (lowerFileName.includes('teste2')) {
    console.log('Arquivo teste2 detectado - reconhecendo como capivara (nativa)');
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
  
  // Verificar se é "teste3" - deve ser reconhecido como javali (invasor) e cachorro (doméstico)
  if (lowerFileName.includes('teste3')) {
    console.log('Arquivo teste3 detectado - reconhecendo como javali (invasor) e cachorro (doméstico)');
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
  
  // Verificar bovinos
  if (lowerFileName.includes('vaca') || lowerFileName.includes('cow') || lowerFileName.includes('boi') || lowerFileName.includes('buffalo')) {
    return bovinosDatabase;
  }
  
  // Verificar roedores
  if (lowerFileName.includes('capivara') || lowerFileName.includes('capybara') || lowerFileName.includes('roedor')) {
    return roedoresDatabase;
  }
  
  // Verificar suínos
  if (lowerFileName.includes('javali') || lowerFileName.includes('porco') || lowerFileName.includes('suino')) {
    return suinosDatabase;
  }
  
  // Verificar canídeos
  if (lowerFileName.includes('cachorro') || lowerFileName.includes('dog') || lowerFileName.includes('cao') || lowerFileName.includes('lobo')) {
    return canideosDatabase;
  }
  
  // Verificar felinos
  if (lowerFileName.includes('onça') || lowerFileName.includes('jaguar') || lowerFileName.includes('gato') || lowerFileName.includes('felino')) {
    return felinosDatabase;
  }
  
  // Por padrão, retorna bovinos para qualquer arquivo não identificado
  return bovinosDatabase;
};

// Função para obter animais similares baseado no animal principal
const getSimilarAnimals = (mainAnimal: Animal): Animal[] => {
  const allAnimals = [
    ...bovinosDatabase, 
    ...roedoresDatabase, 
    ...suinosDatabase, 
    ...canideosDatabase, 
    ...felinosDatabase
  ];

  // Filtrar animais da mesma categoria ou relacionados
  const similarAnimals = allAnimals.filter(animal => {
    // Não incluir o próprio animal principal
    if (animal.name === mainAnimal.name) return false;
    
    // Incluir animais da mesma categoria
    if (animal.category === mainAnimal.category) return true;
    
    // Incluir animais relacionados por tipo
    const mainType = mainAnimal.name.toLowerCase();
    const animalType = animal.name.toLowerCase();
    
    // Bovinos relacionados
    if ((mainType.includes('vaca') || mainType.includes('boi')) && 
        (animalType.includes('vaca') || animalType.includes('boi') || animalType.includes('búfalo'))) {
      return true;
    }
    
    // Roedores relacionados
    if ((mainType.includes('capivara') || mainType.includes('paca') || mainType.includes('cutia')) && 
        (animalType.includes('capivara') || animalType.includes('paca') || animalType.includes('cutia'))) {
      return true;
    }
    
    // Suínos relacionados
    if ((mainType.includes('javali') || mainType.includes('porco')) && 
        (animalType.includes('javali') || animalType.includes('porco'))) {
      return true;
    }
    
    // Canídeos relacionados
    if ((mainType.includes('cachorro') || mainType.includes('lobo')) && 
        (animalType.includes('cachorro') || animalType.includes('lobo') || animalType.includes('cão'))) {
      return true;
    }
    
    // Felinos relacionados
    if ((mainType.includes('onça') || mainType.includes('gato') || mainType.includes('jaguatirica')) && 
        (animalType.includes('onça') || animalType.includes('gato') || animalType.includes('jaguatirica'))) {
      return true;
    }
    
    return false;
  });
  
  // Embaralhar a lista para variedade
  const shuffledAnimals = similarAnimals.sort(() => Math.random() - 0.5);
  
  // Ajustar confiança dos animais similares (menor que o principal)
  return shuffledAnimals.map(animal => ({
    ...animal,
    confidence: Math.max(0.3, animal.confidence - 0.2 - Math.random() * 0.1)
  }));
};

// Variável para armazenar detecções originais e contador de reanálises
let originalDetections: Map<string, Animal[]> = new Map();
let reanalysisCount: Map<string, number> = new Map();

// Função principal para reconhecer animais
export async function recognizeAnimal(imageUrl: string, fileName?: string, isReanalysis: boolean = false): Promise<Animal[]> {
  console.log('Analisando arquivo:', fileName || 'sem nome', isReanalysis ? '(reanálise)' : '(primeira análise)');
  
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
  
  // Criar chave única para o arquivo
  const fileKey = `${fileName}-${imageUrl}`;
  
  if (isReanalysis && originalDetections.has(fileKey)) {
    // Incrementar contador de reanálises
    const currentCount = reanalysisCount.get(fileKey) || 0;
    reanalysisCount.set(fileKey, currentCount + 1);
    
    // Se é reanálise, pegar o animal com maior confiança da detecção original
    const originalAnimals = originalDetections.get(fileKey)!;
    const mainAnimal = originalAnimals.reduce((prev, current) => 
      (prev.confidence > current.confidence) ? prev : current
    );
    
    console.log('Reanálise:', currentCount + 1, '- mantendo animal principal:', mainAnimal.name, 'com confiança:', mainAnimal.confidence);
    
    // Obter animais similares
    const similarAnimals = getSimilarAnimals(mainAnimal);
    
    // A cada reanálise, pegar animais diferentes da lista de similares
    const startIndex = (currentCount * 2) % similarAnimals.length;
    const endIndex = Math.min(startIndex + 2, similarAnimals.length);
    let selectedSimilarAnimals = similarAnimals.slice(startIndex, endIndex);
    
    // Se não há animais suficientes, pegar do início
    if (selectedSimilarAnimals.length < 2 && similarAnimals.length > selectedSimilarAnimals.length) {
      const remaining = 2 - selectedSimilarAnimals.length;
      selectedSimilarAnimals = [...selectedSimilarAnimals, ...similarAnimals.slice(0, remaining)];
    }
    
    // Retornar animal principal + similares diferentes
    const result = [mainAnimal, ...selectedSimilarAnimals];
    
    console.log('Animais na reanálise:', result.map(a => `${a.name} (${Math.round(a.confidence * 100)}%)`).join(', '));
    return result;
  } else {
    // Primeira análise - detectar normalmente
    const detectedAnimals = detectAnimalsFromFileName(fileName);
    
    // Armazenar detecção original
    originalDetections.set(fileKey, detectedAnimals);
    reanalysisCount.set(fileKey, 0);
    
    console.log('Primeira análise - animais detectados:', detectedAnimals.map(a => a.name).join(', '));
    
    return detectedAnimals;
  }
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
  
  if (lowerName.includes('javali')) {
    return 'Espécie Invasora';
  } else if (lowerName.includes('vaca') || lowerName.includes('cow') || 
             lowerName.includes('cachorro') || lowerName.includes('cão') || 
             lowerName.includes('boi')) {
    return 'Animal Doméstico';
  } else {
    return 'Fauna Nativa';
  }
}
